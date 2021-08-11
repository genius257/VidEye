import Grammar from "../../../Illuminate/database/query/grammars/Grammar";
import { is_null, is_array, isset } from "locutus/php/var";
import { trim, ucfirst } from "locutus/php/strings";
import { count } from "locutus/php/array";
import { collect } from "../../../Illuminate/support/helpers";

//FIXME: firebase firestore does not support specific columns! Either we need to just return it all, or slice the data afterwards

export default class FirebaseGrammar extends Grammar {
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
    //let sql = trim(this.concatenate(this.compileComponents(query)));
    let sql = this.compileComponents(query);

    if (query.unions) {
      sql = this.wrapUnion(sql) + " " + this.compileUnions(query);
    }

    query.columns = original;

    return sql;
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

  compileFrom(query, table) {
    return table;
    return "from " + this.wrapTable(table);
  }

  compileWheres(query) {
    // Each type of where clauses has its own compiler function which is responsible
    // for actually creating the where clauses SQL. This helps keep the code nice
    // and maintainable since each clause has a very small method that it uses.
    if (is_null(query.wheres)) {
      return [];
    }

    // If we actually have some where clauses, we will strip off the first boolean
    // operator, which is added by the query builders for convenience so we can
    // avoid checking for the first clauses in each of the compilers methods.
    let sql = this.compileWheresToArray(query);
    if (count(sql) > 0) {
      return sql;
      return this.concatenateWhereClauses(query, sql);
    }

    return [];
  }

  compileWheresToArray(query) {
    let $this = this;
    return collect(query.wheres)
      .map(function(where) {
        return where;
        //console.debug(`where${where["type"]}`);
        return (
          where["boolean"] + " " + $this[`where${where["type"]}`](query, where)
        );
      })
      .all();
  }

  whereBasic(query, where) {
    let value = this.parameter(where["value"]); //TODO: verify that this should not be omitted.

    return where;
    return this.wrap(where["column"]) + " " + where["operator"] + " " + value;
  }
}
