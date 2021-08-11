import RuntimeException from "../Exceptions/RuntimeException";

export default class PDOException extends RuntimeException {
  constructor(message) {
    super(...arguments);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}
