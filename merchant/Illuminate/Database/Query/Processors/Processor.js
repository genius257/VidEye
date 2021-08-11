import Builder from "../Builder";

export default class Processor {
  /**
   * Process the results of a "select" query.
   * @param {Builder} query
   * @param {array} results
   * @returns {array}
   */
  processSelect(query, results) {
    return results;
  }
}
