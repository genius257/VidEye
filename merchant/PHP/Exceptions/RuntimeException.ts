import Exception from "./Exception";

export default class RuntimeException extends Exception {
  constructor(message: string) {
    super(...arguments);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}
