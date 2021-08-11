import { isset, is_null } from "locutus/php/var";
import Str from "../Support/Str";
import { explode } from "locutus/php/strings";
import { call_user_func } from "locutus/php/funchand";
import Arr from "../Support/Arr";
import ConfigurationUrlParser from "../Support/ConfigurationUrlParser";
import InvalidArgumentException from "../../PHP/Exceptions/InvalidArgumentException";

/**
 * @mixes \Illuminate\Database\Connection
 * @see https://github.com/laravel/framework/blob/7.x/src/Illuminate/Database/DatabaseManager.php
 */
export default class DatabaseManager {
  /**
   * The application instance.
   * @type {\Illuminate\Contracts\Foundation\Application}
   * @protected
   */
  app = null;

  /**
   * The active connection instances.
   * @type {array}
   * @protected
   */
  connections = [];

  /**
   * The database connection factory instance.
   * @type {\Illuminate\Database\Connectors\ConnectionFactory}
   * @protected
   */
  factory = null;

  /**
   * The callback to be executed to reconnect to a database.
   * @type {callable}
   * @protected
   */
  reconnector = null;

  /**
   * The custom connection resolvers.
   * @type {object}
   * @protected
   */
  extensions = {};

  /**
   * Create a new database manager instance.
   * @param {\Illuminate\Database\Connectors\ConnectionFactory} factory
   */
  constructor(app, factory) {
    this.app = app;
    this.factory = factory;

    this.reconnector = function (connection) {
      this.reconnect(connection.getName());
    };
  }

  /**
   * Get a database connection instance.
   * @param {string|null} name
   * @returns {\Illuminate\Database\Connection}
   * @public
   */
  connection(name = null) {
    let [database, $type] = this.parseConnectionName(name);

    name = name ? name : database;

    // If we haven't created this connection, we'll create it based on the config
    // provided in the application. Once we've created the connections we will
    // set the "fetch mode" for PDO which determines the query return types.
    if (!isset(this.connections[name])) {
      this.connections[name] = this.configure(
        this.makeConnection(database),
        $type
      );
    }

    return this.connections[name];
  }

  /**
   * Parse the connection into an array of the name and read / write type.
   * @param {string} name
   * @returns {array}
   * @protected
   */
  parseConnectionName(name) {
    name = name ? name : this.getDefaultConnection();

    return Str.endsWith(name, ["::read", "::write"])
      ? explode("::", name, 2)
      : [name, null];
  }

  /**
   * Make the database connection instance.
   * @param {string} name
   * @returns \Illuminate\Database\Connection
   * @protected
   */
  makeConnection(name) {
    let config = this.configuration(name);

    // First we will check by the connection name to see if an extension has been
    // registered specifically for that connection. If it has we will call the
    // Closure and pass it the config allowing it to resolve the connection.
    if (isset(this.extensions[name])) {
      return call_user_func(this.extensions[name], config, name);
    }

    // Next we will check to see if an extension has been registered for a driver
    // and will call the Closure if so, which allows us to have a more generic
    // resolver for the drivers themselves which applies to all connections.
    let driver = config["driver"];
    if (isset(this.extensions[driver])) {
      return call_user_func(this.extensions[driver], config, name);
    }

    return this.factory.make(config, name);
  }

  /**
   * Get the configuration for a connection.
   * @param {string} name
   * @returns {array}
   */
  configuration(name) {
    name = name ? name : this.getDefaultConnection();

    // To get the database connection configuration, we will just pull each of the
    // connection configurations and get the configurations for the given name.
    // If the configuration doesn't exist, we'll throw an exception and bail.
    let connections = this.app["config"]["database.connections"];

    let config = Arr.get(connections, name);

    if (is_null(config)) {
      throw new InvalidArgumentException(
        `Database connection [${name}] not configured.`
      );
    }

    return new ConfigurationUrlParser().parseConfiguration(config);
  }

  /**
   * Prepare the database connection instance.
   * @param {\Illuminate\Database\Connection} connection
   * @param {string} type
   * @returns {\Illuminate\Database\Connection}
   */
  configure(connection, type) {
    connection = this.setPdoForType(connection, type);

    // First we'll set the fetch mode and a few other dependencies of the database
    // connection. This method basically just configures and prepares it to get
    // used by the application. Once we're finished we'll return it back out.
    if (this.app.bound("events")) {
      connection.setEventDispatcher(this.app["events"]);
    }

    // Here we'll set a reconnector callback. This reconnector can be any callable
    // so we will set a Closure to reconnect from this manager with the name of
    // the connection, which will allow us to reconnect from the connections.
    connection.setReconnector(this.reconnector);

    return connection;
  }

  /**
   * Prepare the read / write mode for database connection instance.
   * @param {\Illuminate\Database\Connection} connection
   * @param {string|null} type
   * @returns {\Illuminate\Database\Connection}
   */
  setPdoForType(connection, type = null) {
    if (type === "read") {
      connection.setPdo(connection.getReadPdo());
    } else if (type === "write") {
      connection.setReadPdo(connection.getPdo());
    }

    return connection;
  }

  purge() {
    throw new Error("not implemented");
  }

  disconnect() {
    throw new Error("not implemented");
  }

  reconnect() {
    throw new Error("not implemented");
  }

  usingConnection() {
    throw new Error("not implemented");
  }

  refreshPdoConnections() {
    throw new Error("not implemented");
  }

  /**
   * Get the default connection name.
   * @returns {string}
   */
  getDefaultConnection() {
    return this.app["config"]["database.default"];
  }

  setDefaultConnection() {
    throw new Error("not implemented");
  }

  supportedDrivers() {
    throw new Error("not implemented");
  }

  availableDrivers() {
    throw new Error("not implemented");
  }

  extend() {
    throw new Error("not implemented");
  }

  getConnections() {
    throw new Error("not implemented");
  }

  setReconnector() {
    throw new Error("not implemented");
  }

  /**
   * Dynamically pass methods to the default connection.
   * @param {string} method
   * @param {array} parameters
   */
  __call(method, parameters) {
    return this.connection()[method](...parameters);
  }
}
