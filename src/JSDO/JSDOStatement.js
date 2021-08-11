import JSDO from "./JSDO";

export default class JSDOStatement {
  /** @type {JSDO} */
  jsdo;

  queryString;

  result;

  constructor(jsdo) {
    this.jsdo = jsdo;
  }

  setFetchMode(mode) {
    return true;
  }

  bindValue(parameter, value, data_type) {
    return true;
  }

  execute(input_parameters = null) {
    return true;
  }

  fetchAll(fetch_style, fetch_argument, ctor_args = []) {
    return [];
  }
}
