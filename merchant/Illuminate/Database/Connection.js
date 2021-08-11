import { is_null, is_bool, is_string, is_int } from "locutus/php/var";
import QueryGrammar from "./Query/Grammars/Grammar";
import Processor from "./Query/Processors/Processor";
import SchemaBuilder from "./Schema/Builder";
import QueryBuilder from "./Query/Builder";
import { microtime } from "locutus/php/datetime";
import QueryException from "./QueryException";
import Str from "../Support/Str";
import { call_user_func } from "locutus/php/funchand";
import { round } from "locutus/php/math";
import Arr from "../Support/Arr";

export default class Connection {
  pdo = null;
  readPdo = null;
  database = null;
  tablePrefix = "";
  config = {};
  reconnector = null;

  /**
   * @type {QueryGrammar|null}
   */
  queryGrammar = null;

  schemaGrammar = null;
  postProcessor = null;
  events = null;
  fetchMode = "PDO::FETCH_OBJ";
  transactions = 0;
  recordsModified = false;
  queryLog = [];
  loggingQueries = false;
  pretending = false;
  doctrineConnection = null;
  static $resolvers = {};

  constructor(pdo, database = "", tablePrefix = "", config = {}) {
    this.pdo = pdo;

    // First we will setup the default properties. We keep track of the DB
    // name we are connected to since it is needed when some reflective
    // type commands are run such as checking whether a table exists.
    this.database = database;

    this.tablePrefix = tablePrefix;

    this.config = config;

    // We need to initialize a query grammar and the query post processors
    // which are both very important parts of the database abstractions
    // so we initialize these to their default values while starting.
    this.useDefaultQueryGrammar();

    this.useDefaultPostProcessor();
  }

  useDefaultQueryGrammar() {
    this.queryGrammar = this.getDefaultQueryGrammar();
  }

  /**
   * @returns {QueryGrammar}
   */
  getDefaultQueryGrammar() {
    return new QueryGrammar();
  }

  useDefaultSchemaGrammar() {
    this.schemaGrammar = this.getDefaultSchemaGrammar();
  }

  getDefaultSchemaGrammar() {
    //
  }

  useDefaultPostProcessor() {
    this.postProcessor = this.getDefaultPostProcessor();
  }

  getDefaultPostProcessor() {
    return new Processor();
  }

  getSchemaBuilder() {
    if (is_null(this.schemaGrammar)) {
      this.useDefaultSchemaGrammar();
    }

    return new SchemaBuilder(this);
  }

  table(table, as = null) {
    return this.query().from(table, as);
  }

  query() {
    return new QueryBuilder(
      this,
      this.getQueryGrammar(),
      this.getPostProcessor()
    );
  }

  static getResolver(driver) {
    return this.$resolvers[driver] ?? null;
  }

  /**
   * Register a connection resolver.
   * @param {string} driver
   * @param {callable} callback
   */
  static resolverFor(driver, callback) {
    this.$resolvers[driver] = callback;
  }

  /**
   * Set the reconnect instance on the connection.
   * @param {callable} reconnector
   * @returns {this}
   */
  setReconnector(reconnector) {
    this.reconnector = reconnector;

    return this;
  }

  /**
   * Get the query grammar used by the connection.
   * @returns \Illuminate\Database\Query\Grammars\Grammar
   */
  getQueryGrammar() {
    return this.queryGrammar;
  }

  /**
   * Get the query post processor used by the connection.
   * @returns {Processor}
   */
  getPostProcessor() {
    return this.postProcessor;
  }

  async select(query, bindings = [], useReadPdo = true) {
    let $this = this;
    return await this.run(query, bindings, async function (query, bindings) {
      if ($this.pretending) {
        return [];
      }

      // For select statements, we'll simply execute the query and return an array
      // of the database result set. Each element in the array will be a single
      // row from the database table, and will either be an array or objects.
      let statement = $this.prepared(
        $this.getPdoForSelect(useReadPdo).prepare(query)
      );

      $this.bindValues(statement, $this.prepareBindings(bindings));

      await statement.execute();

      return statement.fetchAll();
    });
  }

  async run(query, bindings, callback) {
    this.reconnectIfMissingConnection();

    let start = microtime(true);

    // Here we will run this query. If an exception occurs we'll determine if it was
    // caused by a connection that has been lost. If that is the cause, we'll try
    // to re-establish connection and re-run the query with a fresh connection.
    let result;
    try {
      result = await this.runQueryCallback(query, bindings, callback);
    } catch (e) {
      if (e instanceof QueryException) {
        result = await this.handleQueryException(e, query, bindings, callback);
      } else {
        throw e;
      }
    }

    // Once we have run the query we will calculate the time that it took to run and
    // then log the query, bindings, and execution time so we will report them on
    // the event that the developer needs them. We'll log time in milliseconds.
    this.logQuery(query, bindings, this.getElapsedTime(start));

    return result;
  }

  reconnectIfMissingConnection() {
    if (is_null(this.pdo)) {
      this.reconnect();
    }
  }

  async runQueryCallback(query, bindings, callback) {
    let result;
    // To execute the statement, we'll simply call the callback, which will actually
    // run the SQL against the PDO connection. Then we can calculate the time it
    // took to execute and log the query SQL, bindings and time in our memory.
    try {
      result = await callback(query, bindings);
    } catch (e) {
      // If an exception occurs when attempting to run a query, we'll format the error
      // message to include the bindings with SQL, which will make this exception a
      // lot more helpful to the developer instead of just the database's errors.
      throw new QueryException(query, this.prepareBindings(bindings), e);
    }

    return result;
  }

  prepareBindings(bindings) {
    let grammar = this.getQueryGrammar();

    for (let [key, value] of Object.entries(bindings)) {
      // We need to transform all instances of DateTimeInterface into the actual
      // date string. Each query grammar maintains its own date string format
      // so we'll just ask the grammar for the format to get from the date.
      if (value instanceof Date) {
        bindings[key] = value.format(grammar.getDateFormat());
      } else if (is_bool(value)) {
        bindings[key] = parseInt(value, 10);
      }
    }

    return bindings;
  }

  async handleQueryException(e, query, bindings, callback) {
    if (this.transactions >= 1) {
      throw e;
    }

    return await this.tryAgainIfCausedByLostConnection(
      e,
      query,
      bindings,
      callback
    );
  }

  async tryAgainIfCausedByLostConnection(e, query, bindings, callback) {
    if (this.causedByLostConnection(e.getPrevious())) {
      this.reconnect();

      return await this.runQueryCallback(query, bindings, callback);
    }

    throw e;
  }

  causedByLostConnection(e) {
    let message = e.getMessage ? e.getMessage() : e.message;

    return Str.contains(message, [
      "server has gone away",
      "no connection to the server",
      "Lost connection",
      "is dead or not enabled",
      "Error while sending",
      "decryption failed or bad record mac",
      "server closed the connection unexpectedly",
      "SSL connection has been closed unexpectedly",
      "Error writing data to the connection",
      "Resource deadlock avoided",
      "Transaction() on null",
      "child connection forced to terminate due to client_idle_limit",
      "query_wait_timeout",
      "reset by peer",
      "Physical connection is not usable",
      "TCP Provider: Error code 0x68",
      "ORA-03114",
      "Packets out of order. Expected",
      "Adaptive Server connection failed",
      "Communication link failure",
      "connection is no longer usable",
      "Login timeout expired",
      "Connection refused",
      "running with the --read-only option so it cannot execute this statement",
      "The connection is broken and recovery is not possible. The connection is marked by the client driver as unrecoverable. No attempt was made to restore the connection.",
      "SQLSTATE[HY000] [2002] php_network_getaddresses: getaddrinfo failed: Try again",
      "SQLSTATE[HY000]: General error: 7 SSL SYSCALL error: EOF detected"
    ]);
  }

  getPdoForSelect(useReadPdo = true) {
    return useReadPdo ? this.getReadPdo() : this.getPdo();
  }

  getReadPdo() {
    if (this.transactions > 0) {
      return this.getPdo();
    }

    if (this.recordsModified && this.getConfig("sticky")) {
      return this.getPdo();
    }

    if (typeof this.readPdo === "function") {
      return (this.readPdo = call_user_func(this.readPdo));
    }

    return this.readPdo ? this.readPdo : this.getPdo();
  }

  getPdo() {
    if (typeof this.pdo === "function") {
      return (this.pdo = call_user_func(this.pdo));
    }

    return this.pdo;
  }

  prepared(statement) {
    statement.setFetchMode(this.fetchMode);
    //FIXME
    /*
    this.event(new Events\StatementPrepared(
      this, statement
    ));
    */
    return statement;
  }

  bindValues(statement, bindings) {
    for (let [key, value] of Object.entries(bindings)) {
      statement.bindValue(
        is_string(key) ? key : key + 1,
        value,
        is_int(value) ? /*PDO::PARAM_INT*/ 0 : /*PDO::PARAM_STR*/ 1
      );
    }
  }

  getElapsedTime(start) {
    return round((microtime(true) - start) * 1000, 2);
  }

  logQuery(query, bindings, time = null) {
    //this.event(new QueryExecuted($query, $bindings, $time, $this));

    if (this.loggingQueries) {
      this.queryLog.push({ query, bindings, time });
    }
  }

  getName() {
    return this.getConfig("name");
  }

  getConfig(option = null) {
    return Arr.get(this.config, option);
  }
}
