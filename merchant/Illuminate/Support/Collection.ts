import {
  array_map,
  array_keys,
  array_combine,
  count,
  in_array,
  array_flip,
  range,
  array_diff,
  array_filter,
  array_udiff,
  array_diff_assoc,
  array_diff_uassoc,
  array_diff_key,
  array_diff_ukey,
  array_shift,
  array_key_exists,
  array_intersect,
  array_pop,
  array_replace,
  array_replace_recursive,
  array_reverse,
  array_search,
  array_intersect_key,
  key,
  reset,
  array_merge,
  array_merge_recursive,
  array_reduce,
  array_values,
  array_pad,
  array_splice,
  krsort,
  ksort,
  arsort,
  asort,
  uasort,
  array_chunk,
  array_slice
} from "locutus/php/array";
import {
  empty,
  isset,
  is_array,
  is_bool,
  is_callable,
  is_null,
  is_object
} from "locutus/php/var";
import { json_decode } from "locutus/php/json";
import { implode } from "locutus/php/strings";
import Arr from "./Arr";
import EnumeratesValues from "./Traits/EnumeratesValues";
import Macroable from "./Traits/Macroable";
import { value } from "./helpers";
import { abs } from "locutus/c/math";
import { floor } from "locutus/php/math";

type integer = number;
type float = number;

//TODO: look into how Illuminate\Support\Collection uses Illuminate\Support\HigherOrderCollectionProxy
class Collection_old {
  /**
   * The items contained in the collection.
   * @type {array|object}
   * @protected
   */
  $items = [];

  constructor(items = []) {
    this.$items = this.getArrayableItems(items);
  }

  /**
   * Results array of items from Collection or Arrayable.
   * @param {mixed} items
   * @returns {array|object}
   * @protected
   */
  getArrayableItems(items) {
    if (is_array(items)) {
      return items;
    } else if (items instanceof Collection) {
      return items.all();
    } /* else if (items instanceof Arrayable) {
      return items.toArray();
    } else if (items instanceof Jsonable) {
      return json_decode(items.toJson(), true);
    } else if (items instanceof JsonSerializable) {
      return items.jsonSerialize();
    } elseif (items instanceof Traversable) {
      return iterator_to_array(items);
    }*/

    return Array.from(items);
  }

  map(callback) {
    let keys = array_keys(this.$items);

    let items = array_map(callback, this.$items, keys);

    return new (<typeof Collection>this.constructor)(
      array_combine(keys, items)
    );
  }

  all() {
    return this.$items;
  }

  implode(value, glue = null) {
    let first = this.first();

    if (is_array(first) || is_object(first)) {
      return implode(glue, this.pluck(value).all());
    }

    return implode(value, this.$items);
  }

  first(callback = null, $default = null) {
    return Arr.first(this.$items, callback, $default);
  }

  count() {
    return count(this.$items);
  }
}

export default class Collection extends EnumeratesValues(Macroable(class {})) {
  /** The items contained in the collection. */
  protected $items: any[] = [];

  /** Create a new collection. */
  public constructor($items: any = []) {
    super();
    this.$items = this.getArrayableItems($items);
  }

  /** Create a new collection by invoking the callback a given amount of times. */
  public static times($number: integer, $callback: Function | null = null) {
    if ($number < 1) {
      return new this();
    }

    if (is_null($callback)) {
      return new this(range(1, $number));
    }

    return new this(range(1, $number)).map($callback);
  }

  /** Get all of the items in the collection. */
  public all(): any[] {
    return this.$items;
  }

  /**
   * Get a lazy collection for the items in this collection.
   *
   * @return \Illuminate\Support\LazyCollection
   */
  public lazy() {
    return new LazyCollection(this.$items);
  }

  /**
   * Get the average value of a given key.
   *
   * @param  callable|string|null  $callback
   * @return mixed
   */
  public avg($callback = null) {
    $callback = this.valueRetriever($callback);

    const $items = this.map(function ($value) {
      return $callback($value);
    }).filter(function ($value) {
      return !is_null($value);
    });

    let $count;
    if (($count = $items.count())) {
      return $items.sum() / $count;
    }
  }

  /**
   * Get the median of a given key.
   *
   * @param  string|array|null  $key
   * @return mixed
   */
  public median($key = null) {
    const $values = (isset($key) ? this.pluck($key) : this)
      .filter(function ($item) {
        return !is_null($item);
      })
      .sort()
      .values();

    const $count = $values.count();

    if ($count === 0) {
      return;
    }

    const $middle = Math.trunc($count / 2);

    if ($count % 2) {
      return $values.get($middle);
    }

    return new (<typeof Collection>this.constructor)([
      $values.get($middle - 1),
      $values.get($middle)
    ]).average();
  }

  /**
   * Get the mode of a given key.
   *
   * @param  string|array|null  $key
   * @return array|null
   */
  public mode($key = null) {
    if (this.count() === 0) {
      return;
    }

    const $collection = isset($key) ? this.pluck($key) : this;

    const $counts = new Collection();

    $collection.each(function ($value) {
      $counts[$value] = isset($counts[$value]) ? $counts[$value] + 1 : 1;
    });

    const $sorted = $counts.sort();

    const $highestValue = $sorted.last();

    return $sorted
      .filter(function ($value) {
        return $value == $highestValue;
      })
      .sort()
      .keys()
      .all();
  }

  /**
   * Collapse the collection of items into a single array.
   *
   * @return static
   */
  public collapse(): this {
    return new (<typeof Collection>this.constructor)(
      Arr.collapse(this.$items)
    ) as this;
  }

  /**
   * Determine if an item exists in the collection.
   *
   * @param  mixed  $key
   * @param  mixed  $operator
   * @param  mixed  $value
   * @return bool
   */
  public contains($key, $operator = null, $value = null) {
    if (arguments.length === 1) {
      if (this.useAsCallable($key)) {
        const $placeholder = {};

        return this.first($key, $placeholder) !== $placeholder;
      }

      return in_array($key, this.$items);
    }

    return this.contains(this.operatorForWhere(...Array.from(arguments)));
  }

  /** Cross join with the given lists, returning all possible permutations. */
  public crossJoin(...$lists: any[]): this {
    return new (<typeof Collection>this.constructor)(
      Arr.crossJoin(
        this.$items,
        ...array_map([this, "getArrayableItems"], $lists)
      )
    ) as this;
  }

  /**
   * Get the items in the collection that are not present in the given items.
   *
   * @param  mixed  $items
   * @return static
   */
  public diff($items: any): this {
    return new (<typeof Collection>this.constructor)(
      array_diff(this.$items, this.getArrayableItems($items))
    ) as this;
  }

  /**
   * Get the items in the collection that are not present in the given items, using the callback.
   *
   * @param  mixed  $items
   * @param  callable  $callback
   * @return static
   */
  public diffUsing($items: any, $callback: Function): this {
    return new (<typeof Collection>this.constructor)(
      array_udiff(this.$items, this.getArrayableItems($items), $callback)
    ) as this;
  }

  /**
   * Get the items in the collection whose keys and values are not present in the given items.
   *
   * @param  mixed  $items
   * @return static
   */
  public diffAssoc($items): this {
    return new (<typeof Collection>this.constructor)(
      array_diff_assoc(this.$items, this.getArrayableItems($items))
    ) as this;
  }

  /**
   * Get the items in the collection whose keys and values are not present in the given items, using the callback.
   *
   * @param  mixed  $items
   * @param  callable  $callback
   * @return static
   */
  public diffAssocUsing($items: any, $callback: Function): this {
    return new (<typeof Collection>this.constructor)(
      array_diff_uassoc(this.$items, this.getArrayableItems($items), $callback)
    ) as this;
  }

  /**
   * Get the items in the collection whose keys are not present in the given items.
   *
   * @param  mixed  $items
   * @return static
   */
  public diffKeys($items): this {
    return new (<typeof Collection>this.constructor)(
      array_diff_key(this.$items, this.getArrayableItems($items))
    ) as this;
  }

  /**
   * Get the items in the collection whose keys are not present in the given items, using the callback.
   *
   * @param  mixed  $items
   * @param  callable  $callback
   * @return static
   */
  public diffKeysUsing($items, $callback: Function): this {
    return new (<typeof Collection>this.constructor)(
      array_diff_ukey(this.$items, this.getArrayableItems($items), $callback)
    ) as this;
  }

  /**
   * Retrieve duplicate items from the collection.
   *
   * @param  callable|null  $callback
   * @param  bool  $strict
   * @return static
   */
  public duplicates($callback = null, $strict = false): this {
    const $items = this.map(this.valueRetriever($callback));

    const $uniqueItems = $items.unique(null, $strict);

    const $compare = this.duplicateComparator($strict);

    const $duplicates = new (<typeof Collection>this.constructor)() as this;

    for (const [$key, $value] of Object.entries($items)) {
      if ($uniqueItems.isNotEmpty() && $compare($value, $uniqueItems.first())) {
        $uniqueItems.shift();
      } else {
        $duplicates[$key] = $value;
      }
    }

    return $duplicates;
  }

  /**
   * Retrieve duplicate items from the collection using strict comparison.
   *
   * @param  callable|null  $callback
   * @return static
   */
  public duplicatesStrict($callback: Function | null = null): this {
    return this.duplicates($callback, true);
  }

  /**
   * Get the comparison function to detect duplicates.
   *
   * @param  bool  $strict
   * @return \Closure
   */
  protected duplicateComparator($strict) {
    if ($strict) {
      return function ($a, $b) {
        return $a === $b;
      };
    }

    return function ($a, $b) {
      return $a == $b;
    };
  }

  /** Get all items except for those with the specified keys. */
  public except($keys: Collection | any): this {
    if ($keys instanceof Enumerable) {
      $keys = $keys.all();
    } else if (!is_array($keys)) {
      $keys = Array.from(arguments);
    }

    return new (<typeof Collection>this.constructor)(
      Arr.except(this.$items, $keys)
    ) as this;
  }

  /** Run a filter over each of the items. */
  public filter($callback: Function | null = null): this {
    if ($callback) {
      return new (<typeof Collection>this.constructor)(
        Arr.where(this.$items, $callback)
      ) as this;
    }

    return new (<typeof Collection>this.constructor)(
      array_filter(this.$items)
    ) as this;
  }

  /** Get the first item from the collection passing the given truth test. */
  public first($callback: Function | null = null, $default: any = null): any {
    return Arr.first(this.$items, $callback, $default);
  }

  /**
   * Get a flattened array of the items in the collection.
   *
   * @param  int  $depth
   * @return static
   */
  public flatten($depth: integer = Infinity): this {
    return new (<typeof Collection>this.constructor)(
      Arr.flatten(this.$items, $depth)
    ) as this;
  }

  /** Flip the items in the collection. */
  public flip(): this {
    return new (<typeof Collection>this.constructor)(
      array_flip(this.$items)
    ) as this;
  }

  /**
   * Remove an item from the collection by key.
   *
   * @param  string|array  $keys
   * @return $this
   */
  public forget($keys): this {
    Arr.wrap($keys).forEach(($key) => {
      this.offsetUnset($key);
    });

    return this;
  }

  /**
   * Get an item from the collection by key.
   *
   * @param  mixed  $key
   * @param  mixed  $default
   * @return mixed
   */
  public get($key: any, $default: any = null): any {
    if (this.offsetExists($key)) {
      return this.$items[$key];
    }

    return value($default);
  }

  /**
   * Group an associative array by a field or using a callback.
   *
   * @param  array|callable|string  $groupBy
   * @param  bool  $preserveKeys
   * @return static
   */
  public groupBy($groupBy, $preserveKeys = false): this {
    let $nextGroups;
    if (!this.useAsCallable($groupBy) && is_array($groupBy)) {
      $nextGroups = $groupBy;

      $groupBy = array_shift($nextGroups);
    }

    $groupBy = this.valueRetriever($groupBy);

    let $results = [];

    for (const [$key, $value] of Object.entries(this.$items)) {
      let $groupKeys = $groupBy($value, $key);

      if (!is_array($groupKeys)) {
        $groupKeys = [$groupKeys];
      }

      for (let [_key, $groupKey] of Object.entries($groupKeys)) {
        $groupKey = is_bool($groupKey) ? ($groupKey ? 1 : 0) : $groupKey;

        if (!array_key_exists($groupKey, $results)) {
          $results[<number | string>$groupKey] = new (<typeof Collection>(
            this.constructor
          ))();
        }

        $results[<number | string>$groupKey].offsetSet(
          $preserveKeys ? $key : null,
          $value
        );
      }
    }

    const $result = new (<typeof Collection>this.constructor)($results) as this;

    if (!empty($nextGroups)) {
      throw new Error("Not implemented");
      //return $result.map.groupBy($nextGroups, $preserveKeys); // Illuminate\Support\Traits\EnumeratesValues::__get is triggered by ->map-> and returns a new Illuminate\Support\HigherOrderCollectionProxy, but js cannot distinguish between property access and method calls...
    }

    return $result;
  }

  /** Key an associative array by a field or using a callback. */
  public keyBy($keyBy: Function | string): this {
    $keyBy = this.valueRetriever($keyBy);

    const $results = [];

    for (const [$key, $item] of Object.entries(this.$items)) {
      let $resolvedKey = $keyBy($item, $key);

      if (is_object($resolvedKey)) {
        $resolvedKey = $resolvedKey.toString();
      }

      $results[$resolvedKey] = $item;
    }

    return new (<typeof Collection>this.constructor)($results) as this;
  }

  /** Determine if an item exists in the collection by key. */
  public has($key: any): boolean {
    const $keys = is_array($key) ? $key : Array.from(arguments);

    for (const [_key, $value] of Object.entries($keys)) {
      if (!this.offsetExists($value)) {
        return false;
      }
    }

    return true;
  }

  /** Concatenate values of a given key as a string. */
  public implode($value: string, $glue: string | null = null): string {
    const $first = this.first();

    if (is_array($first) || is_object($first)) {
      return implode($glue, this.pluck($value).all());
    }

    return implode($value, this.$items);
  }

  /** Intersect the collection with the given items. */
  public intersect($items: any): this {
    return new (<typeof Collection>this.constructor)(
      array_intersect(this.$items, this.getArrayableItems($items))
    ) as this;
  }

  /**
   * Intersect the collection with the given items by key.
   *
   * @param  mixed  $items
   * @return static
   */
  public intersectByKeys($items): this {
    return new (<typeof Collection>this.constructor)(
      array_intersect_key(this.$items, this.getArrayableItems($items))
    ) as this;
  }

  /** Determine if the collection is empty or not. */
  public isEmpty(): boolean {
    return empty(this.$items);
  }

  /** Join all items from the collection using a string. The final items can use a separate glue string. */
  public join($glue: string, $finalGlue: string = ""): string {
    if ($finalGlue === "") {
      return this.implode($glue);
    }

    const $count = this.count();

    if ($count === 0) {
      return "";
    }

    if ($count === 1) {
      return this.last();
    }

    const $collection = new (<typeof Collection>this.constructor)(this.$items);

    const $finalItem = $collection.pop();

    return $collection.implode($glue) + $finalGlue + $finalItem;
  }

  /**
   * Get the keys of the collection items.
   *
   * @return static
   */
  public keys(): this {
    return new (<typeof Collection>this.constructor)(
      array_keys(this.$items)
    ) as this;
  }

  /** Get the last item from the collection. */
  public last($callback: Function | null = null, $default: any = null): any {
    return Arr.last(this.$items, $callback, $default);
  }

  /** Get the values of a given key. */
  public pluck($value: string | any[], $key: string | null = null): this {
    return new (<typeof Collection>this.constructor)(
      Arr.pluck(this.$items, $value, $key)
    ) as this;
  }

  /** Run a map over each of the items. */
  public map($callback: Function): this {
    const $keys = array_keys(this.$items);

    const $items = array_map($callback, this.$items, $keys);

    return new (<typeof Collection>this.constructor)(
      array_combine($keys, $items)
    ) as this;
  }

  /**
   * Run a dictionary map over the items.
   *
   * The callback should return an associative array with a single key/value pair.
   *
   * @param  callable  $callback
   * @return static
   */
  public mapToDictionary($callback: Function): this {
    const $dictionary = [];

    for (let [$key, $item] of Object.entries(this.$items)) {
      const $pair = $callback($item, $key);

      $key = key($pair);

      const $value = reset($pair);

      if (!isset($dictionary[$key])) {
        $dictionary[$key] = [];
      }

      $dictionary[$key].push($value);
    }

    return new (<typeof Collection>this.constructor)($dictionary) as this;
  }

  /**
   * Run an associative map over each of the items.
   *
   * The callback should return an associative array with a single key/value pair.
   */
  public mapWithKeys($callback: Function): this {
    const $result = [];

    for (const [$key, $value] of Object.entries(this.$items)) {
      const $assoc = $callback($value, $key);

      for (const [$mapKey, $mapValue] of Object.entries($assoc)) {
        $result[$mapKey] = $mapValue;
      }
    }

    return new (<typeof Collection>this.constructor)($result) as this;
  }

  /** Merge the collection with the given items. */
  public merge($items: any): this {
    return new (<typeof Collection>this.constructor)(
      array_merge(this.$items, this.getArrayableItems($items))
    ) as this;
  }

  /** Recursively merge the collection with the given items. */
  public mergeRecursive($items: any): this {
    return new (<typeof Collection>this.constructor)(
      array_merge_recursive(this.$items, this.getArrayableItems($items))
    ) as this;
  }

  /** Create a collection by using this collection for keys and another for its values. */
  public combine($values: any): this {
    return new (<typeof Collection>this.constructor)(
      array_combine(this.all(), this.getArrayableItems($values))
    ) as this;
  }

  /** Union the collection with the given items. */
  public union($items: any): this {
    return new (<typeof Collection>this.constructor)(
      this.$items.concat(this.getArrayableItems($items))
    ) as this;
  }

  /** Create a new collection consisting of every n-th element. */
  public nth($step: integer, $offset: integer = 0): this {
    const $new = [];

    let $position = 0;

    for (const [_key, $item] of Object.entries(this.$items)) {
      if ($position % $step === $offset) {
        $new.push($item);
      }

      $position++;
    }

    return new (<typeof Collection>this.constructor)($new) as this;
  }

  /** Get the items with the specified keys. */
  public only($keys: any): this {
    if (is_null($keys)) {
      return new (<typeof Collection>this.constructor)(this.$items) as this;
    }

    if ($keys instanceof Enumerable) {
      $keys = $keys.all();
    }

    $keys = is_array($keys) ? $keys : Array.from(arguments);

    return new (<typeof Collection>this.constructor)(
      Arr.only(this.$items, $keys)
    ) as this;
  }

  /** Get and remove the last item from the collection. */
  public pop(): any {
    return array_pop(this.$items);
  }

  /** Push an item onto the beginning of the collection. */
  public prepend($value: any, $key: any = null): this {
    this.$items = Arr.prepend(this.$items, $value, $key);

    return this;
  }

  /** Push one or more items onto the end of the collection. */
  public push(...$values: any[]): this {
    for (const [_key, $value] of Object.entries($values)) {
      this.$items.push($value);
    }

    return this;
  }

  /**
   * Push all of the given items onto the collection.
   *
   * @param  iterable  $source
   * @return static
   */
  public concat($source: { [Symbol.iterator] }): this {
    const $result = new (<typeof Collection>this.constructor)(this);

    for (const [_key, $item] of Object.entries($source)) {
      $result.push($item);
    }

    return $result as this;
  }

  /**
   * Get and remove an item from the collection.
   *
   * @param  mixed  $key
   * @param  mixed  $default
   * @return mixed
   */
  public pull($key: any, $default: any = null): any {
    return Arr.pull(this.$items, $key, $default);
  }

  /**
   * Put an item in the collection by key.
   *
   * @param  mixed  $key
   * @param  mixed  $value
   * @return $this
   */
  public put($key: any, $value: any): this {
    this.offsetSet($key, $value);

    return this;
  }

  /** Get one or a specified number of items randomly from the collection. */
  public random($number: integer | null = null): this | any {
    if (is_null($number)) {
      return Arr.random(this.$items);
    }

    return new (<typeof Collection>this.constructor)(
      Arr.random(this.$items, $number)
    ) as this;
  }

  /** Reduce the collection to a single value. */
  public reduce($callback: Function, $initial: any = null): any {
    return array_reduce(this.$items, $callback, $initial);
  }

  /** Replace the collection items with the given items. */
  public replace($items: any): this {
    return new (<typeof Collection>this.constructor)(
      array_replace(this.$items, this.getArrayableItems($items))
    ) as this;
  }

  /**
   * Recursively replace the collection items with the given items.
   *
   * @param  mixed  $items
   * @return static
   */
  public replaceRecursive($items): this {
    return new (<typeof Collection>this.constructor)(
      array_replace_recursive(this.$items, this.getArrayableItems($items))
    ) as this;
  }

  /**
   * Reverse items order.
   *
   * @return static
   */
  public reverse(): this {
    return new (<typeof Collection>this.constructor)(
      array_reverse(this.$items, true)
    ) as this;
  }

  /**
   * Search the collection for a given value and return the corresponding key if successful.
   *
   * @param  mixed  $value
   * @param  bool  $strict
   * @return mixed
   */
  public search($value: any, $strict: boolean = false): any {
    if (!this.useAsCallable($value)) {
      return array_search($value, this.$items, $strict);
    }

    for (const [$key, $item] of Object.entries(this.$items)) {
      if ($value($item, $key)) {
        return $key;
      }
    }

    return false;
  }

  /**
   * Get and remove the first item from the collection.
   *
   * @return mixed
   */
  public shift(): any {
    return array_shift(this.$items);
  }

  /** Shuffle the items in the collection. */
  public shuffle($seed: integer | null = null): this {
    return new (<typeof Collection>this.constructor)(
      Arr.shuffle(this.$items, $seed)
    ) as this;
  }

  /** Skip the first {$count} items. */
  public skip($count: integer): this {
    return this.slice($count);
  }

  /** Skip items in the collection until the given condition is met. */
  public skipUntil($value: any): this {
    return new (<typeof Collection>this.constructor)(
      this.lazy().skipUntil($value).all()
    ) as this;
  }

  /** Skip items in the collection while the given condition is met. */
  public skipWhile($value: any): this {
    return new (<typeof Collection>this.constructor)(
      this.lazy().skipWhile($value).all()
    ) as this;
  }

  /** Slice the underlying collection array. */
  public slice($offset: integer, $length: integer | null = null): this {
    return new (<typeof Collection>this.constructor)(
      array_slice(this.$items, $offset, $length, true)
    ) as this;
  }

  /** Split a collection into a certain number of groups. */
  public split($numberOfGroups: integer): this {
    if (this.isEmpty()) {
      return new (<typeof Collection>this.constructor)() as this;
    }

    const $groups = new (<typeof Collection>this.constructor)();

    const $groupSize = floor(this.count() / $numberOfGroups);

    const $remain = this.count() % $numberOfGroups;

    let $start = 0;

    for (let $i = 0; $i < $numberOfGroups; $i++) {
      let $size = $groupSize;

      if ($i < $remain) {
        $size++;
      }

      if ($size) {
        $groups.push(
          new (<typeof Collection>this.constructor)(
            array_slice(this.$items, $start, $size)
          )
        );

        $start += $size;
      }
    }

    return $groups as this;
  }

  /** Chunk the collection into chunks of the given size. */
  public chunk($size: integer): this {
    if ($size <= 0) {
      return new (<typeof Collection>this.constructor)() as this;
    }

    const $chunks = [];

    for (const [_key, $chunk] of <[string, any][]>(
      Object.entries(array_chunk(this.$items, $size, true))
    )) {
      $chunks.push(new (<typeof Collection>this.constructor)($chunk) as this);
    }

    return new (<typeof Collection>this.constructor)($chunks) as this;
  }

  /** Sort through each item with a callback. */
  public sort($callback: Function | integer | null = null): this {
    const $items = this.$items;

    $callback && is_callable($callback)
      ? uasort($items, $callback)
      : asort($items, $callback);

    return new (<typeof Collection>this.constructor)($items) as this;
  }

  /** Sort items in descending order. */
  public sortDesc($options: string = "SORT_REGULAR"): this {
    const $items = this.$items;

    arsort($items, $options);

    return new (<typeof Collection>this.constructor)($items) as this;
  }

  /**
   * Sort the collection using the given callback.
   *
   * @param  callable|string  $callback
   * @param  int  $options
   * @param  bool  $descending
   * @return static
   */
  public sortBy(
    $callback: Function | string,
    $options: string = "SORT_REGULAR",
    $descending = false
  ): this {
    const $results = [];

    $callback = this.valueRetriever($callback);

    // First we will loop through the items and get the comparator from a callback
    // function which we were given. Then, we will sort the returned values and
    // and grab the corresponding values for the sorted keys from this array.
    for (const [$key, $value] of Object.entries(this.$items)) {
      $results[$key] = $callback($value, $key);
    }

    $descending ? arsort($results, $options) : asort($results, $options);

    // Once we have sorted all of the keys in the array, we will loop through them
    // and grab the corresponding model so we can set the underlying items list
    // to the sorted version. Then we'll just return the collection instance.
    for (const [_key, $key] of <[string, string | integer][]>(
      Object.entries(array_keys($results))
    )) {
      $results[$key] = this.$items[$key];
    }

    return new (<typeof Collection>this.constructor)($results) as this;
  }

  /**
   * Sort the collection in descending order using the given callback.
   *
   * @param  callable|string  $callback
   * @param  int  $options
   * @return static
   */
  public sortByDesc($callback, $options: string = "SORT_REGULAR"): this {
    return this.sortBy($callback, $options, true);
  }

  /**
   * Sort the collection keys.
   *
   * @param  int  $options
   * @param  bool  $descending
   * @return static
   */
  public sortKeys(
    $options: string = "SORT_REGULAR",
    $descending = false
  ): this {
    const $items = this.$items;

    $descending ? krsort($items, $options) : ksort($items, $options);

    return new (<typeof Collection>this.constructor)($items) as this;
  }

  /**
   * Sort the collection keys in descending order.
   *
   * @param  int  $options
   * @return static
   */
  public sortKeysDesc($options: string = "SORT_REGULAR"): this {
    return this.sortKeys($options, true);
  }

  /**
   * Splice a portion of the underlying collection array.
   *
   * @param  int  $offset
   * @param  int|null  $length
   * @param  mixed  $replacement
   * @return static
   */
  public splice($offset, $length = null, $replacement = []) {
    if (arguments.length === 1) {
      return new (<typeof Collection>this.constructor)(
        array_splice(this.$items, $offset)
      );
    }

    return new (<typeof Collection>this.constructor)(
      array_splice(this.$items, $offset, $length, $replacement)
    );
  }

  /**
   * Take the first or last {$limit} items.
   *
   * @param  int  $limit
   * @return static
   */
  public take($limit) {
    if ($limit < 0) {
      return this.slice($limit, abs($limit));
    }

    return this.slice(0, $limit);
  }

  /**
   * Take items in the collection until the given condition is met.
   *
   * @param  mixed  $value
   * @return static
   */
  public takeUntil($value): this {
    return new (<typeof Collection>this.constructor)(
      this.lazy().takeUntil($value).all()
    ) as this;
  }

  /**
   * Take items in the collection while the given condition is met.
   *
   * @param  mixed  $value
   * @return static
   */
  public takeWhile($value): this {
    return new (<typeof Collection>this.constructor)(
      this.lazy().takeWhile($value).all()
    ) as this;
  }

  /**
   * Transform each item in the collection using a callback.
   *
   * @param  callable  $callback
   * @return $this
   */
  public transform($callback: Function): this {
    this.$items = this.map($callback).all();

    return this;
  }

  /**
   * Reset the keys on the underlying array.
   *
   * @return static
   */
  public values(): this {
    return new (<typeof Collection>this.constructor)(
      array_values(this.$items)
    ) as this;
  }

  /**
   * Zip the collection together with one or more arrays.
   *
   * e.g. new Collection([1, 2, 3])->zip([4, 5, 6]);
   *      => [[1, 4], [2, 5], [3, 6]]
   *
   * @param  mixed  ...$items
   * @return static
   */
  public zip($items: any): this {
    const $arrayableItems = array_map(function ($items) {
      return this.getArrayableItems($items);
    }, Array.from(arguments));

    const $params = array_merge(
      [
        function () {
          return new (<typeof Collection>this.constructor)(
            Array.from(arguments)
          );
        },
        this.$items
      ],
      $arrayableItems
    );

    return new (<typeof Collection>this.constructor)(
      array_map(...$params)
    ) as this;
  }

  /** Pad collection to the specified length with a value. */
  public pad($size: integer, $value: any): this {
    return new (<typeof Collection>this.constructor)(
      array_pad(this.$items, $size, $value)
    ) as this;
  }

  /**
   * Get an iterator for the items.
   *
   * @return \ArrayIterator
   */
  public getIterator() {
    return new ArrayIterator(this.$items);
  }

  /**
   * Count the number of items in the collection.
   *
   * @return int
   */
  public count(): integer {
    return count(this.$items);
  }

  /**
   * Count the number of items in the collection by a field or using a callback.
   *
   * @param  callable|string  $countBy
   * @return static
   */
  public countBy($countBy = null) {
    return new (<typeof Collection>this.constructor)(
      this.lazy().countBy($countBy).all()
    );
  }

  /**
   * Add an item to the collection.
   *
   * @param  mixed  $item
   * @return $this
   */
  public add($item): this {
    this.$items.push($item);

    return this;
  }

  /**
   * Get a base Support collection instance from this collection.
   *
   * @return \Illuminate\Support\Collection
   */
  public toBase(): Collection {
    return new Collection(this);
  }

  /**
   * Determine if an item exists at an offset.
   *
   * @param  mixed  $key
   * @return bool
   */
  public offsetExists($key) {
    return array_key_exists($key, this.$items);
  }

  /**
   * Get an item at a given offset.
   *
   * @param  mixed  $key
   * @return mixed
   */
  public offsetGet($key) {
    return this.$items[$key];
  }

  /**
   * Set the item at a given offset.
   *
   * @param  mixed  $key
   * @param  mixed  $value
   * @return void
   */
  public offsetSet($key, $value): void {
    if (is_null($key)) {
      this.$items.push($value);
    } else {
      this.$items[$key] = $value;
    }
  }

  /**
   * Unset the item at a given offset.
   *
   * @param  string  $key
   * @return void
   */
  public offsetUnset($key) {
    delete this.$items[$key];
  }
}
