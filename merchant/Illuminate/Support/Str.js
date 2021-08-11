import { ctype_lower } from "locutus/php/ctype";
import { ucwords, strlen, substr, explode } from "locutus/php/strings";
import Pluralizer from "./Pluralizer";
import { array_shift } from "locutus/php/array";

export default class Str {
  static $studlyCache = {};
  static $snakeCache = {};

  static studly(value) {
    let key = value;

    if (this.$studlyCache.hasOwnProperty(key)) {
      return this.$studlyCache[key];
    }

    value = ucwords(value.replace(/[-_]/g, " "));

    return (this.$studlyCache[key] = value.replace(/ /g, ""));
  }

  /**
   * Determine if a given string contains a given substring.
   * @param {string} haystack
   * @param {string|string[]} needles
   * @returns {bool}
   */
  static contains(haystack, needles) {
    needles = Array.isArray(needles) ? needles : [needles];
    for (const needle of needles) {
      if (~haystack.indexOf(needle)) return true;
    }
    return false;

    /*
    foreach ((array) $needles as $needle) {
      if ($needle !== '' && mb_strpos($haystack, $needle) !== false) {
          return true;
      }
    }

    return false;
    */
  }

  /**
   * Determine if a given string starts with a given substring.
   * @param {string} haystack
   * @param {string|string[]} needles
   */
  static startsWith(haystack, needles) {
    needles = Array.isArray(needles) ? needles : [needles];

    for (const needle of needles) {
      if (haystack.substr(0, needle.length) === needle) return true;
    }
    return false;
  }

  /**
   * Pluralize the last word of an English, studly caps case string.
   * @param {string} value
   * @param {number} count
   * @returns {string}
   */
  static pluralStudly(value, count = 2) {
    let parts = value.split(/(.)(?=[A-Z])/u);

    let lastWord = parts.pop();

    return parts.join("") + this.plural(lastWord, count);
  }

  static plural(value, count = 2) {
    return Pluralizer.plural(value, count);
  }

  /**
   * Convert a string to snake case.
   * @param {string} $value
   * @param {string} $delimiter
   * @returns {string}
   */
  static snake(value, delimiter = "_") {
    let key = value;

    if (this.$snakeCache[key] && this.$snakeCache[key][delimiter]) {
      return this.$snakeCache[key][delimiter];
    }

    if (!ctype_lower(value)) {
      value = ucwords(value).replace(/s+/u, "");

      value = this.lower(value.replace(/(.)(?=[A-Z])/u, "$1" + delimiter));
    }

    this.$snakeCache[key] = this.$snakeCache[key] || [];

    return (this.$snakeCache[key][delimiter] = value);
  }

  /**
   * Convert the given string to lower-case.
   * @param {string} value
   * @returns {string}
   */
  static lower(value) {
    return value.toLowerCase();
  }

  /**
   * Determine if a given string ends with a given substring.
   * @param {string}
   * @param {string|string[]}
   * @returns {boolean}
   */
  static endsWith(haystack, needles) {
    needles = Array.isArray(needles) ? needles : [needles];

    for (const needle of needles) {
      if (substr(haystack, -strlen(needle)) === needle) {
        return true;
      }
    }

    return false;
  }

  static replaceArray(search, replace, subject) {
    let segments = explode(search, subject);

    let result = array_shift(segments);

    for (const [key, segment] of Object.entries(segments)) {
      result += (array_shift(replace) ?? search) + segment;
    }

    return result;
  }
}
