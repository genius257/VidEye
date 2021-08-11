import PDOException from "../../PHP/PDO/PDOException";
import Str from "../Support/Str";

export default class QueryException extends PDOException {
  sql;
  bindings;

  constructor(sql, bindings, previous) {
    super(...arguments);
    this.name = this.constructor.name;

    this.__constructor("", 0, previous);

    this.sql = sql;
    this.bindings = bindings;
    this.code = previous.getCode ? previous.getCode() : previous.code;
    this.message = this.formatMessage(sql, bindings, previous);

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(this.message).stack;
    }

    if (previous instanceof PDOException) {
      this.errorInfo = previous.errorInfo;
    }
  }

  formatMessage($sql, $bindings, previous) {
    return (
      (previous.getMessage ? previous.getMessage() : previous.message) +
      " (SQL: " +
      Str.replaceArray("?", $bindings, $sql) +
      ")"
    );
  }

  getSql() {
    return this.sql;
  }

  getBindings() {
    return this.bindings;
  }
}
