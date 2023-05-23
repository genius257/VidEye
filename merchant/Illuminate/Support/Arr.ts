import {
  array_filter,
  array_flip,
  array_intersect_key,
  array_keys,
  array_key_exists,
  array_merge,
  array_rand,
  array_reverse,
  array_shift,
  array_unshift,
  array_values,
  count,
  end,
  ksort,
  shuffle,
  sort
} from "locutus/php/array";
import { explode, strpos } from "locutus/php/strings";
import { http_build_query } from "locutus/php/url";
import {
  empty,
  isset,
  is_array,
  is_null,
  is_object,
  is_string
} from "locutus/php/var";
import InvalidArgumentException from "../../PHP/Exceptions/InvalidArgumentException";
import Collection from "./Collection";
import { data_get, value } from "./helpers";
import Macroable from "./Traits/Macroable";
import ArrayAccess, {
  instanceofArrayAccess
} from "../../PHP/Interfaces/ArrayAccess";

interface Json {
  [key: string]: string | number | boolean | Json | Json[];
}

type integer = Number;
type float = Number;

export default class Arr extends Macroable(class {}) {
  /**
   * Determine whether the given value is array accessible.
   *
   * @param  mixed  $value
   * @return bool
   */
  public static accessible($value) {
    return is_array($value) || instanceofArrayAccess($value);
  }

  /**
   * Add an element to an array using "dot" notation if it doesn't exist.
   *
   * @param  array  $array
   * @param  string  $key
   * @param  mixed  $value
   * @return array
   */
  public static add($array: Json, $key: string, $value: any): Json {
    if (is_null(this.get($array, $key))) {
      this.set($array, $key, $value);
    }

    return $array;
  }

  /** Collapse an array of arrays into a single array. */
  public static collapse($array: Iterable<any>): any[] {
    const $results = [];

    for (let [$key, $values] of Object.entries($array)) {
      if ($values instanceof Collection) {
        $values = $values.all();
      } else if (!is_array($values)) {
        continue;
      }

      $results.push($values);
    }

    return array_merge([], ...$results);
  }

  /**
   * Cross join the given arrays, returning all possible permutations.
   *
   * @param  iterable  ...$arrays
   * @return array
   */
  public static crossJoin(...$arrays) {
    let $results = [[]];

    for (const [$index, $array] of Object.entries($arrays)) {
      const $append = [];

      for (const [_index, $product] of Object.entries($results)) {
        for (const [_index, $item] of Object.entries($array)) {
          $product[$index] = $item;

          $append.push($product);
        }
      }

      $results = $append;
    }

    return $results;
  }

  /**
   * Divide an array into two arrays. One with keys and the other with values.
   *
   * @param  array  $array
   * @return array
   */
  public static divide($array): [Array<string>, Array<any>][] {
    return [array_keys($array), array_values($array)];
  }

  /**
   * Flatten a multi-dimensional associative array with dots.
   *
   * @param  iterable  $array
   * @param  string  $prepend
   * @return array
   */
  public static dot($array, $prepend = "") {
    let $results = [];

    for (const [$key, $value] of Object.entries($array)) {
      if (is_array($value) && !empty($value)) {
        $results = array_merge(
          $results,
          this.dot($value, $prepend + $key + ".")
        );
      } else {
        $results[$prepend + $key] = $value;
      }
    }

    return $results;
  }

  /**
   * Get all of the given array except for a specified array of keys.
   *
   * @param  array  $array
   * @param  array|string  $keys
   * @return array
   */
  public static except($array, $keys) {
    this.forget($array, $keys);

    return $array;
  }

  /**
   * Determine if the given key exists in the provided array.
   *
   * @param  \ArrayAccess|array  $array
   * @param  string|int  $key
   * @return bool
   */
  public static exists($array, $key) {
    if (instanceofArrayAccess($array)) {
      return $array.offsetExists($key);
    }

    return array_key_exists($key, $array);
  }

  /**
   * Return the first element in an array passing a given truth test.
   *
   * @param  iterable  $array
   * @param  callable|null  $callback
   * @param  mixed  $default
   * @return mixed
   */
  public static first(
    $array,
    $callback: Function | null = null,
    $default: any = null
  ): any {
    if (is_null($callback)) {
      if (empty($array)) {
        return value($default);
      }

      for (const [_key, $item] of Object.entries($array)) {
        return $item;
      }
    }

    for (const [$key, $value] of Object.entries($array)) {
      if ($callback($value, $key)) {
        return $value;
      }
    }

    return value($default);
  }

  /**
   * Return the last element in an array passing a given truth test.
   *
   * @param  array  $array
   * @param  callable|null  $callback
   * @param  mixed  $default
   * @return mixed
   */
  public static last(
    $array,
    $callback: Function | null = null,
    $default: any = null
  ): any {
    if (is_null($callback)) {
      return empty($array) ? value($default) : end($array);
    }

    return this.first(array_reverse($array, true), $callback, $default);
  }

  /**
   * Flatten a multi-dimensional array into a single level.
   *
   * @param  iterable  $array
   * @param  int  $depth
   * @return array
   */
  public static flatten($array, $depth: integer = Infinity): any[] {
    const $result = [];

    for (let [_key, $item] of Object.entries($array)) {
      $item = $item instanceof Collection ? $item.all() : $item;

      if (!is_array($item)) {
        $result.push($item);
      } else {
        const $values =
          $depth === 1
            ? array_values($item)
            : this.flatten($item, <number>$depth - 1);

        for (let [_key, $value] of Object.entries($values)) {
          $result.push($value);
        }
      }
    }

    return $result;
  }

  /**
   * Remove one or many array items from a given array using "dot" notation.
   *
   * @param  array  $array
   * @param  array|string  $keys
   * @return void
   */
  public static forget($array, $keys: string[] | string): void {
    const $original = $array;

    $keys = Arr.wrap($keys);

    if (count($keys) === 0) {
      return;
    }

    $keys.forEach(($key) => {
      //foreach ($keys as $key) {
      // if the exact key exists in the top-level, remove it
      if (this.exists($array, $key)) {
        delete $array[$key];

        return;
        //continue;
      }

      const $parts = explode(".", $key);

      // clean up before each pass
      $array = $original;

      while (count($parts) > 1) {
        const $part = array_shift($parts);

        if (isset($array[$part]) && is_array($array[$part])) {
          $array = $array[$part];
        } else {
          //continue 2;
          return;
        }
      }

      delete $array[array_shift($parts)];
    });
  }

  /**
   * Get an item from an array using "dot" notation.
   *
   * @param  \ArrayAccess|array  $array
   * @param  string|int|null  $key
   * @param  mixed  $default
   * @return mixed
   */
  public static get($array, $key, $default = null) {
    if (!this.accessible($array)) {
      return value($default);
    }

    if (is_null($key)) {
      return $array;
    }

    if (this.exists($array, $key)) {
      return $array[$key];
    }

    if (strpos($key, ".") === false) {
      return $array[$key] ?? value($default);
    }

    for (const [_key, $segment] of <[string, string][]>(
      Object.entries(explode(".", $key))
    )) {
      if (this.accessible($array) && this.exists($array, $segment)) {
        $array = $array[$segment];
      } else {
        return value($default);
      }
    }

    return $array;
  }

  /** Check if an item or items exist in an array using "dot" notation. */
  public static has(
    $array: Json | ArrayAccess | any[],
    $keys: string | string[]
  ): boolean {
    $keys = Arr.wrap($keys);

    if (!$array || $keys === []) {
      return false;
    }

    for (const $key of $keys) {
      let $subKeyArray = $array;

      if (this.exists($array, $key)) {
        continue;
      }

      for (const $segment of explode(".", $key)) {
        if (
          this.accessible($subKeyArray) &&
          this.exists($subKeyArray, $segment)
        ) {
          $subKeyArray = $subKeyArray[$segment];
        } else {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Determine if any of the keys exist in an array using "dot" notation.
   *
   * @param  \ArrayAccess|array  $array
   * @param  string|array  $keys
   * @return bool
   */
  public static hasAny($array, $keys) {
    if (is_null($keys)) {
      return false;
    }

    $keys = Arr.wrap($keys);

    if (!$array) {
      return false;
    }

    if ($keys === []) {
      return false;
    }

    for (const $key of $keys) {
      if (this.has($array, $key)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Determines if an array is associative.
   *
   * An array is "associative" if it doesn't have sequential numerical keys beginning with zero.
   *
   * @param  array  $array
   * @return bool
   */
  public static isAssoc($array) {
    const $keys = array_keys($array);

    return array_keys($keys) !== $keys;
  }

  /**
   * Get a subset of the items from the given array.
   *
   * @param  array  $array
   * @param  array|string  $keys
   * @return array
   */
  public static only($array, $keys) {
    return array_intersect_key($array, array_flip(Arr.wrap($keys)));
  }

  /**
   * Pluck an array of values from an array.
   *
   * @param  iterable  $array
   * @param  string|array  $value
   * @param  string|array|null  $key
   * @return array
   */
  public static pluck($array, $value, $key = null) {
    const $results = [];

    [$value, $key] = this.explodePluckParameters($value, $key);

    for (const [_key, $item] of Object.entries($array)) {
      const $itemValue = data_get($item, $value);

      // If the key is "null", we will just append the value to the array and keep
      // looping. Otherwise we will key the array using the value of the key we
      // received from the developer. Then we'll return the final array form.
      if (is_null($key)) {
        $results.push($itemValue);
      } else {
        let $itemKey = data_get($item, $key);

        if (
          is_object($itemKey) &&
          typeof $itemKey["__toString"] === "function"
        ) {
          $itemKey = $itemKey.toString();
        }

        $results[$itemKey] = $itemValue;
      }
    }

    return $results;
  }

  /**
   * Explode the "value" and "key" arguments passed to "pluck".
   *
   * @param  string|array  $value
   * @param  string|array|null  $key
   * @return array
   */
  protected static explodePluckParameters($value, $key) {
    $value = is_string($value) ? explode(".", $value) : $value;

    $key = is_null($key) || is_array($key) ? $key : explode(".", $key);

    return [$value, $key];
  }

  /**
   * Push an item onto the beginning of an array.
   *
   * @param  array  $array
   * @param  mixed  $value
   * @param  mixed  $key
   * @return array
   */
  public static prepend($array, $value, $key = null) {
    if (is_null($key)) {
      array_unshift($array, $value);
    } else {
      $array = [($key) => $value] + $array;
    }

    return $array;
  }

  /**
   * Get a value from the array, and remove it.
   *
   * @param  array  $array
   * @param  string  $key
   * @param  mixed  $default
   * @return mixed
   */
  public static pull($array, $key, $default = null) {
    const $value = this.get($array, $key, $default);

    this.forget($array, $key);

    return $value;
  }

  /**
   * Get one or a specified number of random values from an array.
   *
   * @param  array  $array
   * @param  int|null  $number
   * @return mixed
   *
   * @throws \InvalidArgumentException
   */
  public static random(
    $array: Json | any[],
    $number: integer | null = null
  ): any | any[] {
    const $requested = is_null($number) ? 1 : $number;

    const $count = count($array);

    if ($requested > $count) {
      throw new InvalidArgumentException(
        "You requested {$requested} items, but there are only {$count} items available."
      );
    }

    if (is_null($number)) {
      return $array[array_rand($array)];
    }

    if (Number.parseInt($number.toString()) === 0) {
      return [];
    }

    const $keys = array_rand($array, $number);

    const $results = [];

    for (const $key of Arr.wrap($keys)) {
      $results.push($array[$key]);
    }

    return $results;
  }

  /**
   * Set an array item to a given value using "dot" notation.
   *
   * If no key is given to the method, the entire array will be replaced.
   *
   * @param  array  $array
   * @param  string|null  $key
   * @param  mixed  $value
   * @return array
   */
  public static set($array, $key, $value) {
    if (is_null($key)) {
      return ($array = $value);
    }

    const $keys = explode(".", $key);

    for (const [$i, $key] of <[string, string][]>Object.entries($keys)) {
      if (count($keys) === 1) {
        break;
      }

      delete $keys[$i];

      // If the key doesn't exist at this depth, we will just create an empty array
      // to hold the next value, allowing us to create the arrays to hold final
      // values at the correct depth. Then we'll keep digging into the array.
      if (!isset($array[$key]) || !is_array($array[$key])) {
        $array[$key] = [];
      }

      $array = $array[$key];
    }

    $array[array_shift($keys)] = $value;

    return $array;
  }

  /**
   * Shuffle the given array and return the result.
   *
   * @param  array  $array
   * @param  int|null  $seed
   * @return array
   */
  public static shuffle($array, $seed: integer | null = null) {
    if (is_null($seed)) {
      shuffle($array);
    } else {
      //mt_srand($seed);
      shuffle($array);
      //mt_srand();
    }

    return $array;
  }

  /**
   * Sort the array using the given callback or "dot" notation.
   *
   * @param  array  $array
   * @param  callable|string|null  $callback
   * @return array
   */
  public static sort($array, $callback: Function | null = null) {
    return Collection.make($array).sortBy($callback).all();
  }

  /**
   * Recursively sort an array by keys and values.
   *
   * @param  array  $array
   * @return array
   */
  public static sortRecursive($array) {
    for (const [$key, $value] of Object.entries($array)) {
      if (is_array($value)) {
        $array[$key] = this.sortRecursive($value);
      }
    }

    if (this.isAssoc($array)) {
      ksort($array);
    } else {
      sort($array);
    }

    return $array;
  }

  /**
   * Convert the array into a query string.
   *
   * @param  array  $array
   * @return string
   */
  public static query($array): string {
    return http_build_query($array, "", "&" /*, PHP_QUERY_RFC3986*/);
  }

  /**
   * Filter the array using the given callback.
   *
   * @param  array  $array
   * @param  callable  $callback
   * @return array
   */
  public static where($array, $callback: Function) {
    //FIXME: currently ARRAY_FILTER_USE_BOTH not suppored!
    return array_filter($array, $callback /*, ARRAY_FILTER_USE_BOTH*/);
  }

  /**
   * If the given value is not an array and not null, wrap it in one.
   *
   * @param  mixed  $value
   * @return array
   */
  public static wrap($value: any): any[] {
    if (is_null($value)) {
      return [];
    }

    return is_array($value) ? $value : [$value];
  }
}
