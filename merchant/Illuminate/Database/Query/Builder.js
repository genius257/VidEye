import EloquentBuilder from "../Eloquent/Builder";
import Relation from "../Eloquent/Relations/Relation";
import { is_string, is_array, is_null, is_bool } from "locutus/php/var";
import Str from "../../Support/Str";
import Expression from "./Expression";
import { in_array } from "locutus/php/array";
import { strtolower } from "locutus/php/strings";
import { collect } from "../../Support/helpers";
import Arr from "../../Support/Arr";
import QueryBuilder from "./Grammars/Grammar";
import Connection from "../Connection";
import QueryProcessor from "./Processors/Processor";
import InvalidArgumentException from "../../../PHP/Exceptions/InvalidArgumentException";

export default class Builder {
  /**
   * @type {Connection}
   */
  connection;

  /**
   * @type {QueryBuilder}
   */
  grammar;

  /**
   * @type {QueryProcessor}
   */
  processor;

  bindings = {
    select: [],
    from: [],
    join: [],
    where: [],
    groupBy: [],
    having: [],
    order: [],
    union: [],
    unionOrder: []
  };
  aggregate;
  columns;
  distinct = false;
  from;
  joins;
  wheres = [];
  groups;
  havings;
  orders;
  limit;
  offset;
  unions;
  unionLimit;
  unionOffset;
  unionOrders;
  lock;
  operators = [
    "=",
    "<",
    ">",
    "<=",
    ">=",
    "<>",
    "!=",
    "<=>",
    "like",
    "like binary",
    "not like",
    "ilike",
    "&",
    "|",
    "^",
    "<<",
    ">>",
    "rlike",
    "not rlike",
    "regexp",
    "not regexp",
    "~",
    "~*",
    "!~",
    "!~*",
    "similar to",
    "not similar to",
    "not ilike",
    "~~*",
    "!~~*"
  ];
  useWritePdo = false;

  /**
   *
   * @param {Connection} connection
   * @param {QueryBuilder|null} grammar
   * @param {QueryProcessor|null} processor
   */
  constructor(connection, grammar = null, processor = null) {
    this.connection = connection;
    this.grammar = grammar ? grammar : connection.getQueryGrammar();
    this.processor = processor ? processor : connection.getPostProcessor();
  }

  from(table, as = null) {
    if (this.isQueryable(table)) {
      return this.fromSub(table, as);
    }

    this.from = as ? `${table} as ${as}` : table;

    return this;
  }

  isQueryable(value) {
    return (
      value instanceof this.constructor ||
      value instanceof EloquentBuilder ||
      value instanceof Relation ||
      typeof value === "function"
    );
  }

  fromSub(query, as) {
    let [$query, bindings] = this.createSub(query);

    return this.fromRaw(
      "(" + $query + ") as " + this.grammar.wrapTable(as),
      bindings
    );
  }

  createSub(query) {
    // If the given query is a Closure, we will execute it while passing in a new
    // query instance to the Closure. This will give the developer a chance to
    // format and work with the query before we cast it to a raw SQL string.
    if (typeof query === "function") {
      let callback = query;

      callback((query = this.forSubQuery()));
    }

    return this.parseSub(query);
  }

  forSubQuery() {
    return this.newQuery();
  }

  parseSub(query) {
    if (
      query instanceof this.constructor ||
      query instanceof EloquentBuilder ||
      query instanceof Relation
    ) {
      return [query.toSql(), query.getBindings()];
    } else if (is_string(query)) {
      return [query, []];
    } else {
      throw new InvalidArgumentException(
        "A subquery must be a query builder instance, a Closure, or a string."
      );
    }
  }

  where(column, operator = null, value = null, boolean = "and") {
    // If the column is an array, we will assume it is an array of key-value pairs
    // and can add them each as a where clause. We will maintain the boolean we
    // received when the method was called and pass it into the nested where.
    if (is_array(column)) {
      return this.addArrayOfWheres(column, boolean);
    }

    // Here we will make some assumptions about the operator. If only 2 values are
    // passed to the method, we will assume that the operator is an equals sign
    // and keep going. Otherwise, we'll require the operator to be passed in.
    [value, operator] = this.prepareValueAndOperator(
      value,
      operator,
      arguments.length === 2
    );

    // If the columns is actually a Closure instance, we will assume the developer
    // wants to begin a nested where statement which is wrapped in parenthesis.
    // We'll add that Closure to the query then return back out immediately.
    if (typeof column === "function" && is_null(operator)) {
      return this.whereNested(column, boolean);
    }

    // If the column is a Closure instance and there is an operator value, we will
    // assume the developer wants to run a subquery and then compare the result
    // of that subquery with the given value that was provided to the method.
    if (this.isQueryable(column) && !is_null(operator)) {
      let [sub, bindings] = this.createSub(column);

      return this.addBinding(bindings, "where").where(
        new Expression("(" + sub + ")"),
        operator,
        value,
        boolean
      );
    }

    // If the given operator is not found in the list of valid operators we will
    // assume that the developer is just short-cutting the '=' operators and
    // we will set the operators to '=' and set the values appropriately.
    if (this.invalidOperator(operator)) {
      [value, operator] = [operator, "="];
    }

    // If the value is a Closure, it means the developer is performing an entire
    // sub-select within the query and we will need to compile the sub-select
    // within the where clause to get the appropriate query record results.
    if (typeof value === "function") {
      return this.whereSub(column, operator, value, boolean);
    }

    // If the value is "null", we will just assume the developer wants to add a
    // where null clause to the query. So, we will allow a short-cut here to
    // that method for convenience so the developer doesn't have to check.
    if (is_null(value)) {
      return this.whereNull(column, boolean, operator !== "=");
    }

    let type = "Basic";

    // If the column is making a JSON reference we'll check to see if the value
    // is a boolean. If it is, we'll add the raw boolean string as an actual
    // value to the query to ensure this is properly handled by the query.
    if (Str.contains(column, "->") && is_bool(value)) {
      value = new Expression(value ? "true" : "false");

      if (is_string(column)) {
        type = "JsonBoolean";
      }
    }

    // Now that we are working with just a simple query we can put the elements
    // in our array and add the query binding to our array of bindings that
    // will be bound to each SQL statements when it is finally executed.
    this.wheres.push({ type, column, operator, value, boolean });

    if (!value instanceof Expression) {
      this.addBinding(value, "where");
    }

    return this;
  }

  prepareValueAndOperator(value, operator, useDefault = false) {
    if (useDefault) {
      return [operator, "="];
    } else if (this.invalidOperatorAndValue(operator, value)) {
      throw new InvalidArgumentException(
        "Illegal operator and value combination."
      );
    }

    return [value, operator];
  }

  invalidOperatorAndValue(operator, value) {
    return (
      is_null(value) &&
      in_array(operator, this.operators) &&
      !in_array(operator, ["=", "<>", "!="])
    );
  }

  invalidOperator(operator) {
    return (
      !in_array(strtolower(operator), this.operators, true) &&
      !in_array(strtolower(operator), this.grammar.getOperators(), true)
    );
  }

  async get(columns = ["*"]) {
    let $this = this;
    return collect(
      this.onceWithColumns(Arr.wrap(columns), async function () {
        return $this.processor.processSelect($this, await $this.runSelect());
      })
    );
  }

  async onceWithColumns(columns, callback) {
    let original = Array.isArray(this.columns)
      ? [...this.columns]
      : this.columns;

    if (is_null(original)) {
      this.columns = columns;
    }

    let result = await callback();

    this.columns = original;

    return result;
  }

  async runSelect() {
    return await this.connection.select(
      this.toSql(),
      this.getBindings(),
      !this.useWritePdo
    );
  }

  toSql() {
    return this.grammar.compileSelect(this);
  }

  getBindings() {
    return Arr.flatten(this.bindings);
  }

  getConnection() {
    return this.connection;
  }
}
