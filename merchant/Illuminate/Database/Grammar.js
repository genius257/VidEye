import { array_map, count } from "locutus/php/array";
import { explode, stripos, str_replace, implode } from "locutus/php/strings";
import { collect } from "../Support/helpers";
import { is_array } from "locutus/php/var";
import Expression from "./Query/Expression";

/* eslint-disable eqeqeq */
/* eslint-disable no-caller */

export default class Grammar {
  tablePrefix = "";

  wrapArray(values) {
    return array_map([this, "wrap"], values);
  }

  wrapTable(table) {
    if (!this.isExpression(table)) {
      return this.wrap(this.tablePrefix + table, true);
    }

    return this.getValue(table);
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

    return this.wrapSegments(explode(".", value));
  }

  wrapAliasedValue(value, prefixAlias = false) {
    //let segments = preg_split('/\s+as\s+/i', value);
    let segments = value.split(/\s+as\s+/i);

    // If we are wrapping a table we need to prefix the alias with the table prefix
    // as well in order to generate proper syntax. If this is a column of course
    // no prefix is necessary. The condition will be true when from wrapTable.
    if (prefixAlias) {
      segments[1] = this.tablePrefix + segments[1];
    }

    return this.wrap(segments[0]) + " as " + this.wrapValue(segments[1]);
  }

  wrapSegments(segments) {
    let $this = this;
    return collect(segments)
      .map(function (segment, key) {
        return key == 0 && count(segments) > 1
          ? $this.wrapTable(segment)
          : $this.wrapValue(segment);
      })
      .implode(".");
  }

  wrapValue(value) {
    if (value !== "*") {
      return '"' + str_replace('"', '""', value) + '"';
    }

    return value;
  }

  columnize(columns) {
    return implode(", ", array_map([this, "wrap"], columns));
  }

  parameterize(values) {
    return implode(", ", array_map([this, "parameter"], values));
  }

  parameter(value) {
    return this.isExpression(value) ? this.getValue(value) : "?";
  }

  quoteString(value) {
    if (is_array(value)) {
      return implode(", ", array_map([this, arguments.callee.name], value));
    }

    return `'${value}'`;
  }

  isExpression(value) {
    return value instanceof Expression;
  }

  getValue(expression) {
    return expression.getValue();
  }

  getDateFormat() {
    return "Y-m-d H:i:s"; //TODO: verify if this need to be changed to work in JS
  }

  getTablePrefix() {
    return this.tablePrefix;
  }

  setTablePrefix(prefix) {
    this.tablePrefix = prefix;

    return this;
  }
}
