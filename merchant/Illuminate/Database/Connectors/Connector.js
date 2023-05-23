import JSDO from "../../../../src/JSDO/JSDO";
import { isset } from "locutus/php/var";
import Str from "../../Support/Str";
import { array_diff_key } from "locutus/php/array";

export default class Connector {
  options = {
    [JSDO.ATTR_CASE]: JSDO.CASE_NATURAL,
    [JSDO.ATTR_ERRMODE]: JSDO.ERRMODE_EXCEPTION,
    [JSDO.ATTR_ORACLE_NULLS]: JSDO.NULL_NATURAL,
    [JSDO.ATTR_STRINGIFY_FETCHES]: false,
    [JSDO.ATTR_EMULATE_PREPARES]: false
  };

  createConnection(dsn, config, options) {
    const [username, password] = [
      config["username"] ?? null,
      config["password"] ?? null
    ];

    try {
      return this.createPdoConnection(dsn, username, password, options);
    } catch (e) {
      //Exception $e
      return this.tryAgainIfCausedByLostConnection(
        e,
        dsn,
        username,
        password,
        options
      );
    }
  }

  createPdoConnection(dsn, username, password, options) {
    if (!this.isPersistentConnection(options)) {
      return new JSDO(dsn, username, password, options);
    }

    return new JSDO(dsn, username, password, options);
  }

  isPersistentConnection(options) {
    return (
      isset(options[JSDO.ATTR_PERSISTENT]) && options[JSDO.ATTR_PERSISTENT]
    );
  }

  tryAgainIfCausedByLostConnection(e, dsn, username, password, options) {
    if (this.causedByLostConnection(e)) {
      return this.createPdoConnection(dsn, username, password, options);
    }

    throw e;
  }

  getOptions(config) {
    let options = config["options"] ?? {};

    //return array_diff_key(this.options, options) + options;
    return Object.assign({}, options, array_diff_key(this.options, options));
  }

  getDefaultOptions() {
    return this.options;
  }

  setDefaultOptions(options) {
    this.options = options;
  }

  causedByLostConnection(e) {
    let message = e.message;

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

  connect() {
    throw new Error(
      `"${this.constructor.name}" does not implement required method "connect"`
    );
  }
}
