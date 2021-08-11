import { is_null, isset, is_array, empty, is_string } from "locutus/php/var";
import {
  trim,
  ucfirst,
  implode,
  substr,
  ltrim,
  explode,
  stripos,
  str_replace
} from "locutus/php/strings";
import { collect, last, head } from "../../../Support/helpers";
import {
  count,
  reset,
  end,
  array_map,
  array_keys,
  array_values,
  array_merge,
  array_filter
} from "locutus/php/array";
import { json_encode } from "locutus/php/json";
import Arr from "../../../Support/Arr";
import Str from "../../../Support/Str";
import JoinClause from "../JoinClause";
import BaseGrammar from "../../Grammar";
import QueryBuilder from "../Builder";
import RuntimeException from "../../../../PHP/Exceptions/RuntimeException";

/**
 * @see https://github.com/laravel/framework/blob/7.x/src/Illuminate/Database/Query/Grammars/Grammar.php
 */
export default class Grammar extends BaseGrammar {
  operators;

  selectComponents = [
    "aggregate",
    "columns",
    "from",
    "joins",
    "wheres",
    "groups",
    "havings",
    "orders",
    "limit",
    "offset",
    "lock"
  ];

  /**
   * Compile a select query into SQL.
   * @param {QueryBuilder} query
   * @returns {string}
   */
  compileSelect(query) {
    if (query.unions && query.aggregate) {
      return this.compileUnionAggregate(query);
    }

    // If the query does not have any columns set, we'll set the columns to the
    // * character to just get all of the columns from the database. Then we
    // can build the query and concatenate all the pieces together as one.
    let original = Array.isArray(query.columns)
      ? [...query.columns]
      : query.columns;

    if (is_null(query.columns)) {
      query.columns = ["*"];
    }

    // To compile the query, we'll spin through each component of the query and
    // see if that component exists. If it does we'll just call the compiler
    // function for the component which is responsible for making the SQL.
    let sql = trim(this.concatenate(this.compileComponents(query)));

    if (query.unions) {
      sql = this.wrapUnion(sql) + " " + this.compileUnions(query);
    }

    query.columns = original;

    return sql;
  }

  /**
   * Compile the components necessary for a select clause.
   * @param {\Illuminate\Database\Query\Builder} query
   * @returns {object}
   */
  compileComponents(query) {
    let sql = {};

    for (const [key, component] of Object.entries(this.selectComponents)) {
      if (isset(query[component])) {
        let method = "compile" + ucfirst(component);

        sql[component] = this[method](query, query[component]);
      }
    }

    return sql;
  }

  /**
   * Compile an aggregated select clause.
   * @param {\Illuminate\Database\Query\Builder} query
   * @param {object} aggregate
   * @returns {string}
   */
  compileAggregate(query, aggregate) {
    let column = this.columnize(aggregate["columns"]);

    // If the query has a "distinct" constraint and we're not asking for all columns
    // we need to prepend "distinct" onto the column name so that the query takes
    // it into account when it performs the aggregating operations on the data.
    if (is_array(query.distinct)) {
      column = "distinct " + this.columnize(query.distinct);
    } else if (query.distinct && column !== "*") {
      column = "distinct " + column;
    }

    return "select " + aggregate["function"] + "(" + column + ") as aggregate";
  }

  compileColumns(query, columns) {
    // If the query is actually performing an aggregating select, we will let that
    // compiler handle the building of the select clauses, as it will need some
    // more syntax that is best handled by that function to keep things neat.
    if (!is_null(query.aggregate)) {
      return;
    }

    let select;
    if (query.distinct) {
      select = "select distinct ";
    } else {
      select = "select ";
    }

    return select + this.columnize(columns);
  }

  compileFrom(query, table) {
    return "from " + this.wrapTable(table);
  }

  compileJoins(query, joins) {
    return collect(joins)
      .map(function (join) {
        let table = this.wrapTable(join.table);

        let nestedJoins = is_null(join.joins)
          ? ""
          : " " + this.compileJoins(query, join.joins);

        let tableAndNestedJoins = is_null(join.joins)
          ? table
          : "(" + table + nestedJoins + ")";

        return trim(
          `${join.type} join ${tableAndNestedJoins} ${this.compileWheres(join)}`
        );
      })
      .implode(" ");
  }

  compileWheres(query) {
    // Each type of where clauses has its own compiler function which is responsible
    // for actually creating the where clauses SQL. This helps keep the code nice
    // and maintainable since each clause has a very small method that it uses.
    if (is_null(query.wheres)) {
      return "";
    }

    // If we actually have some where clauses, we will strip off the first boolean
    // operator, which is added by the query builders for convenience so we can
    // avoid checking for the first clauses in each of the compilers methods.
    let sql = this.compileWheresToArray(query);
    if (count(sql) > 0) {
      return this.concatenateWhereClauses(query, sql);
    }

    return "";
  }

  compileWheresToArray(query) {
    let $this = this;
    return collect(query.wheres)
      .map(function (where) {
        return (
          where["boolean"] + " " + $this[`where${where["type"]}`](query, where)
        );
      })
      .all();
  }

  concatenateWhereClauses(query, sql) {
    let conjunction = query instanceof JoinClause ? "on" : "where";

    return conjunction + " " + this.removeLeadingBoolean(implode(" ", sql));
  }

  whereRaw(query, where) {
    return where["sql"];
  }

  whereBasic(query, where) {
    let value = this.parameter(where["value"]);

    return this.wrap(where["column"]) + " " + where["operator"] + " " + value;
  }

  whereIn(query, where) {
    if (!empty(where["values"])) {
      return (
        this.wrap(where["column"]) +
        " in (" +
        this.parameterize(where["values"]) +
        ")"
      );
    }

    return "0 = 1";
  }

  whereNotIn(query, where) {
    if (!empty(where["values"])) {
      return (
        this.wrap(where["column"]) +
        " not in (" +
        this.parameterize(where["values"]) +
        ")"
      );
    }

    return "1 = 1";
  }

  whereNotInRaw(query, where) {
    if (!empty(where["values"])) {
      return (
        this.wrap(where["column"]) +
        " not in (" +
        implode(", ", where["values"]) +
        ")"
      );
    }

    return "1 = 1";
  }

  whereInRaw(query, where) {
    if (!empty(where["values"])) {
      return (
        this.wrap(where["column"]) +
        " in (" +
        implode(", ", where["values"]) +
        ")"
      );
    }

    return "0 = 1";
  }

  whereNull(query, where) {
    return this.wrap(where["column"]) + " is null";
  }

  whereNotNull(query, where) {
    return this.wrap(where["column"]) + " is not null";
  }

  whereBetween(query, where) {
    let between = where["not"] ? "not between" : "between";

    let min = this.parameter(reset(where["values"]));

    let max = this.parameter(end(where["values"]));

    return (
      this.wrap(where["column"]) + " " + between + " " + min + " and " + max
    );
  }

  whereDate(query, where) {
    return this.dateBasedWhere("date", query, where);
  }

  whereTime(query, where) {
    return this.dateBasedWhere("time", query, where);
  }

  whereDay(query, where) {
    return this.dateBasedWhere("day", query, where);
  }

  whereMonth(query, where) {
    return this.dateBasedWhere("month", query, where);
  }

  whereYear(query, where) {
    return this.dateBasedWhere("year", query, where);
  }

  dateBasedWhere(type, query, where) {
    let value = this.parameter(where["value"]);

    return (
      type +
      "(" +
      this.wrap(where["column"]) +
      ") " +
      where["operator"] +
      " " +
      value
    );
  }

  whereColumn(query, where) {
    return (
      this.wrap(where["first"]) +
      " " +
      where["operator"] +
      " " +
      this.wrap(where["second"])
    );
  }

  whereNested(query, where) {
    // Here we will calculate what portion of the string we need to remove. If this
    // is a join clause query, we need to remove the "on" portion of the SQL and
    // if it is a normal query we need to take the leading "where" of queries.
    let offset = query instanceof JoinClause ? 3 : 6;

    return "(" + substr(this.compileWheres(where["query"]), offset) + ")";
  }

  whereSub(query, where) {
    let select = this.compileSelect(where["query"]);

    return (
      this.wrap(where["column"]) + " " + where["operator"] + ` (${select})`
    );
  }

  whereExists(query, where) {
    return "exists (" + this.compileSelect(where["query"]) + ")";
  }

  whereNotExists(query, where) {
    return "not exists (" + this.compileSelect(where["query"]) + ")";
  }

  whereRowValues(query, where) {
    let columns = this.columnize(where["columns"]);

    let values = this.parameterize(where["values"]);

    return "(" + columns + ") " + where["operator"] + " (" + values + ")";
  }

  whereJsonBoolean(query, where) {
    let column = this.wrapJsonBooleanSelector(where["column"]);

    let value = this.wrapJsonBooleanValue(this.parameter(where["value"]));

    return column + " " + where["operator"] + " " + value;
  }

  whereJsonContains(query, where) {
    let not = where["not"] ? "not " : "";

    return (
      not +
      this.compileJsonContains(where["column"], this.parameter(where["value"]))
    );
  }

  compileJsonContains(column, value) {
    throw new RuntimeException(
      "This database engine does not support JSON contains operations."
    );
  }

  prepareBindingForJsonContains(binding) {
    return json_encode(binding);
  }

  whereJsonLength(query, where) {
    return this.compileJsonLength(
      where["column"],
      where["operator"],
      this.parameter(where["value"])
    );
  }

  compileJsonLength(column, operator, value) {
    throw new RuntimeException(
      "This database engine does not support JSON length operations."
    );
  }

  compileGroups(query, groups) {
    return "group by " + this.columnize(groups);
  }

  compileHavings(query, havings) {
    let sql = implode(" ", array_map([this, "compileHaving"], havings));

    return "having " + this.removeLeadingBoolean(sql);
  }

  compileHaving(having) {
    // If the having clause is "raw", we can just return the clause straight away
    // without doing any more processing on it. Otherwise, we will compile the
    // clause into SQL based on the components that make it up from builder.
    if (having["type"] === "Raw") {
      return having["boolean"] + " " + having["sql"];
    } else if (having["type"] === "between") {
      return this.compileHavingBetween(having);
    }

    return this.compileBasicHaving(having);
  }

  compileBasicHaving(having) {
    let column = this.wrap(having["column"]);

    let parameter = this.parameter(having["value"]);

    return (
      having["boolean"] +
      " " +
      column +
      " " +
      having["operator"] +
      " " +
      parameter
    );
  }

  compileHavingBetween(having) {
    let between = having["not"] ? "not between" : "between";

    let column = this.wrap(having["column"]);

    let min = this.parameter(head(having["values"]));

    let max = this.parameter(last(having["values"]));

    return (
      having["boolean"] +
      " " +
      column +
      " " +
      between +
      " " +
      min +
      " and " +
      max
    );
  }

  compileOrders(query, orders) {
    if (!empty(orders)) {
      return (
        "order by " + implode(", ", this.compileOrdersToArray(query, orders))
      );
    }

    return "";
  }

  compileOrdersToArray(query, orders) {
    return array_map(function (order) {
      return (
        order["sql"] ?? this.wrap(order["column"]) + " " + order["direction"]
      );
    }, orders);
  }

  compileRandom(seed) {
    return "RANDOM()";
  }

  compileLimit(query, limit) {
    return "limit ".parseInt(limit, 10);
  }

  compileOffset(query, offset) {
    return "offset ".parseInt(offset);
  }

  compileUnions(query) {
    let sql = "";

    for (let union of query.unions) {
      sql += this.compileUnion(union);
    }

    if (!empty(query.unionOrders)) {
      sql += " " + this.compileOrders(query, query.unionOrders);
    }

    if (isset(query.unionLimit)) {
      sql += " " + this.compileLimit(query, query.unionLimit);
    }

    if (isset(query.unionOffset)) {
      sql += " " + this.compileOffset(query, query.unionOffset);
    }

    return ltrim(sql);
  }

  compileUnion(union) {
    let conjunction = union["all"] ? " union all " : " union ";

    return conjunction + this.wrapUnion(union["query"].toSql());
  }

  wrapUnion(sql) {
    return "(" + sql + ")";
  }

  compileUnionAggregate(query) {
    let sql = this.compileAggregate(query, query.aggregate);

    query.aggregate = null;

    return (
      sql +
      " from (" +
      this.compileSelect(query) +
      ") as " +
      this.wrapTable("temp_table")
    );
  }

  compileExists(query) {
    let select = this.compileSelect(query);

    return `select exists(${select}) as ${this.wrap("exists")}`;
  }

  compileInsert(query, values) {
    // Essentially we will force every insert to be treated as a batch insert which
    // simply makes creating the SQL easier for us since we can utilize the same
    // basic routine regardless of an amount of records given to us to insert.
    let table = this.wrapTable(query.from);

    if (empty(values)) {
      return `insert into ${table} default values`;
    }

    if (!is_array(reset(values))) {
      values = [values];
    }

    let columns = this.columnize(array_keys(reset(values)));

    // We need to build a list of parameter place-holders of values that are bound
    // to the query. Each insert should have the exact same amount of parameter
    // bindings so we will loop through the record and parameterize them all.
    let parameters = collect(values)
      .map(function (record) {
        return "(" + this.parameterize(record) + ")";
      })
      .implode(", ");

    return `insert into ${table} (${columns}) values ${parameters}`;
  }

  compileInsertOrIgnore(query, values) {
    throw new RuntimeException(
      "This database engine does not support inserting while ignoring errors."
    );
  }

  compileInsertGetId(query, values, sequence) {
    return this.compileInsert(query, values);
  }

  compileInsertUsing(query, columns, sql) {
    return `insert into ${this.wrapTable(query.from)} (${this.columnize(
      columns
    )}) ${sql}`;
  }

  compileUpdate(query, values) {
    let table = this.wrapTable(query.from);

    let columns = this.compileUpdateColumns(query, values);

    let where = this.compileWheres(query);

    return trim(
      isset(query.joins)
        ? this.compileUpdateWithJoins(query, table, columns, where)
        : this.compileUpdateWithoutJoins(query, table, columns, where)
    );
  }

  compileUpdateColumns(query, values) {
    return collect(values)
      .map(function (value, key) {
        return this.wrap(key) + " = " + this.parameter(value);
      })
      .implode(", ");
  }

  compileUpdateWithoutJoins(query, table, columns, where) {
    return `update ${table} set ${columns} ${where}`;
  }

  compileUpdateWithJoins(query, table, columns, where) {
    let joins = this.compileJoins(query, query.joins);

    return `update ${table} ${joins} set ${columns} ${where}`;
  }

  prepareBindingsForUpdate(bindings, values) {
    let cleanBindings = Arr.except(bindings, ["select", "join"]);

    return array_values(
      array_merge(bindings["join"], values, Arr.flatten(cleanBindings))
    );
  }

  compileDelete(query) {
    let table = this.wrapTable(query.from);

    let where = this.compileWheres(query);

    return trim(
      isset(query.joins)
        ? this.compileDeleteWithJoins(query, table, where)
        : this.compileDeleteWithoutJoins(query, table, where)
    );
  }

  compileDeleteWithoutJoins(query, table, where) {
    return `delete from ${table} ${where}`;
  }

  compileDeleteWithJoins(query, table, where) {
    let alias = last(explode(" as ", table));

    let joins = this.compileJoins(query, query.joins);

    return `delete ${alias} from ${table} ${joins} ${where}`;
  }

  prepareBindingsForDelete(bindings) {
    return Arr.flatten(Arr.except(bindings, "select"));
  }

  compileTruncate(query) {
    return { ["truncate table " + this.wrapTable(query.from)]: [] };
  }

  compileLock(query, value) {
    return is_string(value) ? value : "";
  }

  supportsSavepoints() {
    return true;
  }

  compileSavepoint(name) {
    return "SAVEPOINT " + name;
  }

  compileSavepointRollBack(name) {
    return "ROLLBACK TO SAVEPOINT " + name;
  }

  wrap(value, prefixAlias = false) {
    if (this.isExpression(value)) {
      return this.getValue(value);
    }

    // If the value being wrapped has a column alias we will need to separate out
    // the pieces so we can wrap each of the segments of the expression on its
    // own, and then join these both back together using the "as" connector.
    if (stripos(value, " as ") !== false) {
      return this.wrapAliasedValue(value, prefixAlias);
    }

    // If the given value is a JSON selector we will wrap it differently than a
    // traditional value. We will need to split this path and wrap each part
    // wrapped, etc. Otherwise, we will simply wrap the value as a string.
    if (this.isJsonSelector(value)) {
      return this.wrapJsonSelector(value);
    }

    return this.wrapSegments(explode(".", value));
  }

  wrapJsonSelector(value) {
    throw new RuntimeException(
      "This database engine does not support JSON operations."
    );
  }

  wrapJsonBooleanSelector(value) {
    return this.wrapJsonSelector(value);
  }

  wrapJsonBooleanValue(value) {
    return value;
  }

  wrapJsonFieldAndPath(column) {
    let parts = explode("->", column, 2);

    let field = this.wrap(parts[0]);

    let path = count(parts) > 1 ? ", " + this.wrapJsonPath(parts[1], "->") : "";

    return [field, path];
  }

  wrapJsonPath(value, delimiter = "->") {
    //value = preg_replace("/([\\\\]+)?\\'/", "\\'", value);
    value = value.replace(/([\\\\]+)?\\'/, "\\'");

    return "'$+\"" + str_replace(delimiter, '"."', value) + "\"'";
  }

  isJsonSelector(value) {
    return Str.contains(value, "->");
  }

  concatenate(segments) {
    return implode(
      " ",
      array_filter(segments, function (value) {
        return (value !== "").toString();
      })
    );
  }

  removeLeadingBoolean(value) {
    //return preg_replace('/and |or /i', '', value, 1);
    return value.replace(/and |or /i, "");
  }

  getOperators() {
    return this.operators;
  }
}
