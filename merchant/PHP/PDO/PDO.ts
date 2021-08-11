import PDOStatement from "./PDOStatement";

export default class PDO {
  constructor(dsn, username, passwd, options) {
    console.log("PDO");
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
    return new PDOStatement(statement, driver_options);
  }

  query(statement) {
    return new PDOStatement(statement);
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
}
