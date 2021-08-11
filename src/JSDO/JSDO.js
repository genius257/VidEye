import JSDOStatement from "./JSDOStatement";

// MIX of PDO and PDOConnection
// https://www.php.net/manual/en/book.pdo.php
// https://github.com/doctrine/dbal/blob/aab745e7b6b2de3b47019da81e7225e14dcfdac8/lib/Doctrine/DBAL/Driver/PDOConnection.php

export default class JSDO {
  /**
   * drivers available to JSDO
   * @private
   */
  static drivers = {};

  // https://www.php.net/manual/en/pdo.constants.php
  static PARAM_BOOL;
  static PARAM_NULL;
  static PARAM_INT;
  static PARAM_STR;
  static PARAM_STR_NATL;
  static PARAM_STR_CHAR;
  static PARAM_LOB;
  static PARAM_STMT;
  static PARAM_INPUT_OUTPUT;
  static FETCH_LAZY;
  static FETCH_ASSOC;
  static FETCH_NAMED;
  static FETCH_NUM;
  static FETCH_BOTH;
  static FETCH_OBJ;
  static FETCH_BOUND;
  static FETCH_COLUMN;
  static FETCH_CLASS;
  static FETCH_INTO;
  static FETCH_FUNC;
  static FETCH_GROUP;
  static FETCH_UNIQUE;
  static FETCH_KEY_PAIR;
  static FETCH_CLASSTYPE;
  static FETCH_SERIALIZE;
  static FETCH_PROPS_LATE;
  static ATTR_AUTOCOMMIT;
  static ATTR_PREFETCH;
  static ATTR_TIMEOUT;
  static ATTR_ERRMODE = 3;
  static ATTR_SERVER_VERSION;
  static ATTR_CLIENT_VERSION;
  static ATTR_SERVER_INFO;
  static ATTR_CONNECTION_STATUS;
  static ATTR_CASE = 8;
  static ATTR_CURSOR_NAME;
  static ATTR_CURSOR;
  static ATTR_DRIVER_NAME;
  static ATTR_ORACLE_NULLS = 11;
  static ATTR_PERSISTENT = 12;
  static ATTR_STATEMENT_CLASS;
  static ATTR_FETCH_CATALOG_NAMES;
  static ATTR_FETCH_TABLE_NAMES;
  static ATTR_STRINGIFY_FETCHES = 17;
  static ATTR_MAX_COLUMN_LEN;
  static ATTR_DEFAULT_FETCH_MODE;
  static ATTR_EMULATE_PREPARES = 20;
  static ATTR_DEFAULT_STR_PARAM;
  static ERRMODE_SILENT;
  static ERRMODE_WARNING;
  static ERRMODE_EXCEPTION = 2;
  static CASE_NATURAL = 0;
  static CASE_LOWER;
  static CASE_UPPER;
  static NULL_NATURAL = 0;
  static NULL_EMPTY_STRING;
  static NULL_TO_STRING;
  static FETCH_ORI_NEXT;
  static FETCH_ORI_PRIOR;
  static FETCH_ORI_FIRST;
  static FETCH_ORI_LAST;
  static FETCH_ORI_ABS;
  static FETCH_ORI_REL;
  static CURSOR_FWDONLY;
  static CURSOR_SCROLL;
  static ERR_NONE;
  static PARAM_EVT_ALLOC;
  static PARAM_EVT_FREE;
  static PARAM_EVT_EXEC_PRE;
  static PARAM_EVT_EXEC_POST;
  static PARAM_EVT_FETCH_PRE;
  static PARAM_EVT_FETCH_POST;
  static PARAM_EVT_NORMALIZE;
  static SQLITE_DETERMINISTIC;

  /**
   * @param {string} dsn
   * @param {string|null} username
   * @param {string|null} passwd
   * @param {object|null} options
   * @throws {PDOException} In case of an error.
   */
  constructor(dsn, username, passwd, options) {
    //console.log("JSDO");
  }

  beginTransaction() {
    //
  }

  commit() {
    //
  }

  errorCode() {
    //
  }

  errorInfo() {
    //
  }

  exec(statement) {
    //
  }

  getAttribute(attribute) {
    //
  }

  static getAvailableDrivers() {
    return [];
  }

  inTransaction() {
    //
  }

  lastInsertId() {
    //
  }

  prepare(statement, driver_options = []) {
    let $statement = this.createStatement(this);
    $statement.queryString = statement;
    return $statement;
  }

  query(statement) {
    let $statement = this.createStatement();
    $statement.queryString = statement;
    return $statement;
  }

  quote() {
    //
  }

  rollBack() {
    return true;
  }

  setAttribute() {
    //
  }

  /**
   * Create a new statement
   * @param {JSDO} jsdo
   * @private
   */
  createStatement(jsdo) {
    return new JSDOStatement(jsdo);
  }
}
