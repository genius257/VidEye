export default class Expression {
  /**
   * The value of the expression.
   */
  value = null;

  /**
   * Create a new raw query expression.
   * @param {*} value
   */
  constructor(value) {
    this.value = value;
  }

  /**
   * Get the value of the expression.
   */
  getValue() {
    return this.value;
  }

  /**
   * Get the value of the expression.
   * @returns {string}
   */
  toString() {
    this.getValue().toString();
  }
}
