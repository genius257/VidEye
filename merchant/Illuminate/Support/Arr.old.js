import { explode, strpos } from "locutus/php/strings";
import { value } from "./helpers";
import { is_null, is_array, isset, empty } from "locutus/php/var";
import {
  array_key_exists,
  count,
  array_shift,
  array_values
} from "locutus/php/array";
import Collection from "./Collection";

export default class Arr {
  /**
   *
   * @param {array|object} array
   * @param {string|int|null} key
   * @param {*} $default
   * @public
   */
  static get(array, key, $default = null) {
    if (!this.accessible(array)) {
      return value($default);
    }

    if (is_null(key)) {
      return array;
    }

    if (this.exists(array, key)) {
      return array[key];
    }

    if (strpos(key, ".") === false) {
      return array[key] ?? value($default);
    }

    for (let segment of explode(".", key)) {
      if (this.accessible(array) && this.exists(array, segment)) {
        array = array[segment];
      } else {
        return value($default);
      }
    }

    return array;
  }

  static accessible(value) {
    return is_array(value) || value instanceof Array;
  }

  static exists(array, key) {
    /*
    if ($array instanceof ArrayAccess) {
      return array.offsetExists($key);
    }
    */

    return array_key_exists(key, array);
  }

  static pull(array, key, $default = null) {
    let value = this.get(array, key, $default);

    this.forget(array, key);

    return value;
  }

  /**
   * Remove one or many array items from a given array using "dot" notation.
   */
  static forget(array, keys) {
    let original = array;

    keys = Array.isArray(keys) ? keys : [keys];

    if (count(keys) === 0) {
      return;
    }

    for (const key in keys) {
      // if the exact key exists in the top-level, remove it
      if (this.exists(array, key)) {
        delete array[key];

        continue;
      }

      let parts = explode(".", key);

      // clean up before each pass
      array = original;

      while (count(parts) > 1) {
        let part = array_shift(parts);

        if (isset(array[part]) && is_array(array[part])) {
          array = array[part];
        } else {
          break;
          //console.warn("should contine 2; but this is not supprted in js");
          //continue;
        }
      }

      delete array[array_shift(parts)];
    }
  }

  /**
   * Add an element to an array using "dot" notation if it doesn't exist.
   * @param {object} array
   * @param {string} key
   * @param {*} value
   * @returns {object}
   */
  static add(array, key, value) {
    if (is_null(this.get(array, key))) {
      this.set(array, key, value);
    }

    return array;
  }

  /**
   * Set an array item to a given value using "dot" notation.
   *
   * If no key is given to the method, the entire array will be replaced.
   * @param {object} array
   * @param {string|null} key
   * @param {*} value
   * @returns {object}
   */
  static set(array, key, value) {
    if (is_null(key)) {
      return (array = value);
    }

    let keys = explode(".", key);

    for (const [i, key] of Object.entries(keys)) {
      if (count(keys) === 1) {
        break;
      }

      delete keys[i];

      // If the key doesn't exist at this depth, we will just create an empty array
      // to hold the next value, allowing us to create the arrays to hold final
      // values at the correct depth. Then we'll keep digging into the array.
      if (!isset(array[key]) || !is_array(array[key])) {
        array[key] = [];
      }

      array = array[key];
    }

    array[array_shift(keys)] = value;

    return array;
  }

  static wrap(value) {
    if (is_null(value)) {
      return [];
    }

    return is_array(value) ? value : [value];
  }

  static first(array, callback = null, $default = null) {
    if (is_null(callback)) {
      if (empty(array)) {
        return value($default);
      }

      for (const [key, item] of Object.entries(array)) {
        return item;
      }
    }

    for (const [key, value] of Object.entries(array)) {
      if (callback(value, key)) {
        return value;
      }
    }

    return value($default);
  }

  static flatten(array, depth = Infinity) {
    let result = [];

    for (let [key, item] of Object.entries(array)) {
      item = item instanceof Collection ? item.all() : item;

      if (!is_array(item)) {
        result.push(item);
      } else {
        let values =
          depth === 1 ? array_values(item) : this.flatten(item, depth - 1);

        let value;
        for ([key, value] of Object.entries(values)) {
          result.push(value);
        }
      }
    }

    return result;
  }
}
