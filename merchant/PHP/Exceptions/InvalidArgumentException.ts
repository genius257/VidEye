import LogicException from "./LogicException";

export default class InvalidArgumentException extends LogicException {
  //
}

/*
export default class InvalidArgumentException extends TypeError {
  _message;
  _code;
  _file;
  _line;

  constructor(message = "") {
    let _this = super(...arguments);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }

    this.__constructor(message, 0, _this);
    return this;
  }

  __constructor(message = "", code = 0, previous = null) {
    this._message = message;
    this._code = code;
    this._previous = previous;
    this._stack = this.stack;

    return this;
  }

  getMessage() {
    return this._message || this.message;
  }

  getPrevious() {
    return this._previous;
  }

  getCode() {
    return this._code;
  }

  getFile() {
    return this._file;
  }

  getLine() {
    return this._line;
  }

  getTrace() {
    return this._stack;
  }

  getTraceAsString() {
    return this._stack.toString();
  }

  toString() {
    return this.__toString();
  }

  __toString() {
    return `${this.constructor.name}: ${this.getMessage()}`;
  }

  __clone() {
    //
  }
}

*/
