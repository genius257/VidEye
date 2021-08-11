import {
  array_filter,
  array_map,
  count,
  end,
  in_array,
  reset
} from "locutus/php/array";
import { json_decode, json_encode } from "locutus/php/json";
import { max } from "locutus/php/math";
import {
  is_array,
  is_callable,
  is_null,
  is_object,
  is_string
} from "locutus/php/var";
import Exception from "../../../PHP/Exceptions/Exception";
import Arr from "../Arr";
import Collection from "../Collection";
import { data_get } from "../helpers";

type integer = number;
type float = number;

function clone<T>(instance: T): T {
  const copy = new (instance.constructor as { new (): T })();
  Object.assign(copy, instance);
  return copy;
}

type Constructor<T = {}> = new (...args: any[]) => T;
export default function EnumeratesValues<TBase extends Constructor>(
  Class: TBase
) {
  return class EnumeratesValues extends Class {
    /**
     * The methods that can be proxied.
     *
     * @var array
     */
    protected static $proxies = [
      "average",
      "avg",
      "contains",
      "each",
      "every",
      "filter",
      "first",
      "flatMap",
      "groupBy",
      "keyBy",
      "map",
      "max",
      "min",
      "partition",
      "reject",
      "skipUntil",
      "skipWhile",
      "some",
      "sortBy",
      "sortByDesc",
      "sum",
      "takeUntil",
      "takeWhile",
      "unique",
      "until"
    ];

    /**
     * Create a new collection instance if the value isn't one already.
     *
     * @param  mixed  $items
     * @return static
     */
    public static make($items = []) {
      return new this($items);
    }

    /**
     * Wrap the given value in a collection if applicable.
     *
     * @param  mixed  $value
     * @return static
     */
    public static wrap($value) {
      return $value instanceof Enumerable
        ? new this($value)
        : new this(Arr.wrap($value));
    }

    /**
     * Get the underlying items from the given collection if applicable.
     *
     * @param  array|static  $value
     * @return array
     */
    public static unwrap($value) {
      return $value instanceof Enumerable ? $value.all() : $value;
    }

    /**
     * Alias for the "avg" method.
     *
     * @param  callable|string|null  $callback
     * @return mixed
     */
    public average($callback: Function | null = null): any {
      return this.avg($callback);
    }

    /** Alias for the "contains" method. */
    public some($key: any, $operator: any = null, $value: any = null): boolean {
      return this.contains(...Array.from(arguments));
    }

    /** Determine if an item exists, using strict comparison. */
    public containsStrict($key: any, $value?: any = null): boolean {
      if (arguments.length === 2) {
        return this.contains(function ($item) {
          return data_get($item, $key) === $value;
        });
      }

      if (this.useAsCallable($key)) {
        return !is_null(this.first($key));
      }

      for (const [_key, $item] of Object.entries(this)) {
        if ($item === $key) {
          return true;
        }
      }

      return false;
    }

    /**
     * Dump the items and end the script.
     *
     * @param  mixed  ...$args
     * @return void
     */
    public dd(...$args: any[]): void {
      throw new Error("Not implemented");
      /*
      this.dump(...$args);

      exit(1);
      */
    }

    /** Dump the items. */
    public dump(): this {
      new Collection(Array.from(arguments))
        .push(this.all())
        .each(function ($item) {
          VarDumper.dump($item);
        });

      return this;
    }

    /**
     * Execute a callback over each item.
     *
     * @param  callable  $callback
     * @return $this
     */
    public each($callback: Function): this {
      for (const [$key, $item] of Object.entries(this)) {
        if ($callback($item, $key) === false) {
          break;
        }
      }

      return this;
    }

    /** Execute a callback over each nested chunk of items. */
    public eachSpread($callback: Function): this {
      return this.each(function ($chunk, $key) {
        $chunk.push($key);

        return $callback(...$chunk);
      });
    }

    /**
     * Determine if all items pass the given truth test.
     *
     * @param  string|callable  $key
     * @param  mixed  $operator
     * @param  mixed  $value
     * @return bool
     */
    public every(
      $key: string | Function,
      $operator: any = null,
      $value: any = null
    ): boolean {
      if (arguments.length === 1) {
        const $callback = this.valueRetriever($key);

        for (const [$k, $v] of Object.entries(this)) {
          if (!$callback($v, $k)) {
            return false;
          }
        }

        return true;
      }

      return this.every(this.operatorForWhere(...arguments));
    }

    /** Get the first item by the given key value pair. */
    public firstWhere(
      $key: string,
      $operator: any = null,
      $value: any = null
    ): any {
      return this.first(this.operatorForWhere(...Array.from(arguments)));
    }

    /** Determine if the collection is not empty. */
    public isNotEmpty(): boolean {
      return !this.isEmpty();
    }

    /** Run a map over each nested chunk of items. */
    public mapSpread($callback: Function): this {
      return this.map(function ($chunk, $key) {
        $chunk.push($key);

        return $callback(...$chunk);
      });
    }

    /**
     * Run a grouping map over the items.
     *
     * The callback should return an associative array with a single key/value pair.
     *
     * @param  callable  $callback
     * @return static
     */
    public mapToGroups($callback: Function): this {
      const $groups = this.mapToDictionary($callback);

      return $groups.map([this, "make"]);
    }

    /**
     * Map a collection and flatten the result by a single level.
     *
     * @param  callable  $callback
     * @return static
     */
    public flatMap($callback: Function): this {
      return this.map($callback).collapse();
    }

    /**
     * Map the values into a new class.
     *
     * @param  string  $class
     * @return static
     */
    public mapInto($class): this {
      return this.map(function ($value, $key) {
        return new $class($value, $key);
      });
    }

    /**
     * Get the min value of a given key.
     *
     * @param  callable|string|null  $callback
     * @return mixed
     */
    public min($callback: Function | null = null): any {
      $callback = this.valueRetriever($callback);

      return this.map(function ($value) {
        return $callback($value);
      })
        .filter(function ($value) {
          return !is_null($value);
        })
        .reduce(function ($result, $value) {
          return is_null($result) || $value < $result ? $value : $result;
        });
    }

    /**
     * Get the max value of a given key.
     *
     * @param  callable|string|null  $callback
     * @return mixed
     */
    public max($callback: Function | null = null): any {
      $callback = this.valueRetriever($callback);

      return this.filter(function ($value) {
        return !is_null($value);
      }).reduce(function ($result, $item) {
        const $value = $callback($item);

        return is_null($result) || $value > $result ? $value : $result;
      });
    }

    /** "Paginate" the collection by slicing it into a smaller collection. */
    public forPage($page: integer, $perPage: integer): this {
      const $offset = max(0, ($page - 1) * $perPage);

      return this.slice($offset, $perPage);
    }

    /** Partition the collection into two arrays using the given callback or key. */
    public partition(
      $key: Function | string,
      $operator: any = null,
      $value: any = null
    ): this {
      const $passed = [];
      const $failed = [];

      const $callback =
        arguments.length === 1
          ? this.valueRetriever($key)
          : this.operatorForWhere(...arguments);

      for (const [$key, $item] of Object.entries(this)) {
        if ($callback($item, $key)) {
          $passed[$key] = $item;
        } else {
          $failed[$key] = $item;
        }
      }

      return new (<typeof EnumeratesValues>this.constructor)([
        new (<typeof EnumeratesValues>this.constructor)($passed),
        new (<typeof EnumeratesValues>this.constructor)($failed)
      ]) as this;
    }

    /**
     * Get the sum of the given values.
     *
     * @param  callable|string|null  $callback
     * @return mixed
     */
    public sum($callback: Function | null = null): any {
      $callback = is_null($callback)
        ? this.identity()
        : this.valueRetriever($callback);

      return this.reduce(function ($result, $item) {
        return $result + $callback($item);
      }, 0);
    }

    /**
     * Apply the callback if the value is truthy.
     *
     * @param  bool|mixed  $value
     * @param  callable|null  $callback
     * @param  callable|null  $default
     * @return static|mixed
     */
    public when(
      $value: boolean | any,
      $callback: Function | null = null,
      $default: Function | null = null
    ): this | any {
      if (!$callback) {
        return new HigherOrderWhenProxy(this, $value);
      }

      if ($value) {
        return $callback(this, $value);
      } else if ($default) {
        return $default(this, $value);
      }

      return this;
    }

    /** Apply the callback if the collection is empty. */
    public whenEmpty(
      $callback: Function,
      $default: Function | null = null
    ): this | any {
      return this.when(this.isEmpty(), $callback, $default);
    }

    /** Apply the callback if the collection is not empty. */
    public whenNotEmpty(
      $callback: Function,
      $default: Function | null = null
    ): this | any {
      return this.when(this.isNotEmpty(), $callback, $default);
    }

    /** Apply the callback if the value is falsy. */
    public unless(
      $value: boolean,
      $callback: Function,
      $default: Function | null = null
    ): this | any {
      return this.when(!$value, $callback, $default);
    }

    /** Apply the callback unless the collection is empty. */
    public unlessEmpty(
      $callback: Function,
      $default: Function | null = null
    ): this | any {
      return this.whenNotEmpty($callback, $default);
    }

    /** Apply the callback unless the collection is not empty. */
    public unlessNotEmpty(
      $callback: Function,
      $default: Function | null = null
    ): this | any {
      return this.whenEmpty($callback, $default);
    }

    /** Filter items by the given key value pair. */
    public where(
      $key: string,
      $operator: any = null,
      $value: any = null
    ): this {
      return this.filter(this.operatorForWhere(...arguments));
    }

    /** Filter items where the given key is not null. */
    public whereNull($key: string | null = null): this {
      return this.whereStrict($key, null);
    }

    /** Filter items where the given key is null. */
    public whereNotNull($key: string | null = null): this {
      return this.where($key, "!==", null);
    }

    /** Filter items by the given key value pair using strict comparison. */
    public whereStrict($key: string, $value: any): this {
      return this.where($key, "===", $value);
    }

    /** Filter items by the given key value pair. */
    public whereIn($key: string, $values: any, $strict: boolean = false): this {
      $values = this.getArrayableItems($values);

      return this.filter(function ($item) {
        return in_array(data_get($item, $key), $values, $strict);
      });
    }

    /** Filter items by the given key value pair using strict comparison. */
    public whereInStrict($key: string, $values: any): this {
      return this.whereIn($key, $values, true);
    }

    /**
     * Filter items such that the value of the given key is between the given values.
     *
     * @param  string  $key
     * @param  array  $values
     * @return static
     */
    public whereBetween($key, $values): this {
      return this.where($key, ">=", reset($values)).where(
        $key,
        "<=",
        end($values)
      );
    }

    /**
     * Filter items such that the value of the given key is not between the given values.
     *
     * @param  string  $key
     * @param  array  $values
     * @return static
     */
    public whereNotBetween($key, $values): this {
      return this.filter(function ($item) {
        return (
          data_get($item, $key) < reset($values) ||
          data_get($item, $key) > end($values)
        );
      });
    }

    /** Filter items by the given key value pair. */
    public whereNotIn(
      $key: string,
      $values: any,
      $strict: boolean = false
    ): this {
      $values = this.getArrayableItems($values);

      return this.reject(function ($item) {
        return in_array(data_get($item, $key), $values, $strict);
      });
    }

    /**
     * Filter items by the given key value pair using strict comparison.
     *
     * @param  string  $key
     * @param  mixed  $values
     * @return static
     */
    public whereNotInStrict($key, $values): this {
      return this.whereNotIn($key, $values, true);
    }

    /**
     * Filter the items, removing any items that don't match the given type.
     *
     * @param  string  $type
     * @return static
     */
    public whereInstanceOf($type): this {
      return this.filter(function ($value) {
        return $value instanceof $type;
      });
    }

    /** Pass the collection to the given callback and return the result. */
    public pipe($callback: Function): any {
      return $callback(this);
    }

    /**
     * Pass the collection to the given callback and then return it.
     *
     * @param  callable  $callback
     * @return $this
     */
    public tap($callback: Function) {
      $callback(clone(this));

      return this;
    }

    /** Create a collection of all elements that do not pass a given truth test. */
    public reject($callback: Function | any = true): this {
      const $useAsCallable = this.useAsCallable($callback);

      return this.filter(function ($value, $key) {
        return $useAsCallable
          ? !(<Function>$callback)($value, $key)
          : $value != $callback;
      });
    }

    /** Return only unique items from the collection array. */
    public unique(
      $key: string | Function | null = null,
      $strict: boolean = false
    ): this {
      const $callback = this.valueRetriever($key);

      const $exists = [];

      return this.reject(function ($item, $key) {
        let $id;
        if (in_array(($id = $callback($item, $key)), $exists, $strict)) {
          return true;
        }

        $exists.push($id);
      });
    }

    /**
     * Return only unique items from the collection array using strict comparison.
     *
     * @param  string|callable|null  $key
     * @return static
     */
    public uniqueStrict($key = null): this {
      return this.unique($key, true);
    }

    /**
     * Take items in the collection until the given condition is met.
     *
     * This is an alias to the "takeUntil" method.
     *
     * @param  mixed  $value
     * @return static
     *
     * @deprecated Use the "takeUntil" method directly.
     */
    public until($value: any): this {
      return this.takeUntil($value);
    }

    /**
     * Collect the values into a collection.
     *
     * @return \Illuminate\Support\Collection
     */
    public collect(): Collection {
      return new Collection(this.all());
    }

    /**
     * Get the collection of items as a plain array.
     *
     * @return array
     */
    public toArray() {
      return this.map(function ($value) {
        return $value instanceof Arrayable ? $value.toArray() : $value;
      }).all();
    }

    /**
     * Convert the object into something JSON serializable.
     *
     * @return array
     */
    public jsonSerialize() {
      return array_map(function ($value) {
        if ($value instanceof JsonSerializable) {
          return $value.jsonSerialize();
        } else if ($value instanceof Jsonable) {
          return json_decode($value.toJson());
        } else if ($value instanceof Arrayable) {
          return $value.toArray();
        }

        return $value;
      }, this.all());
    }

    /**
     * Get the collection of items as JSON.
     *
     * @param  int  $options
     * @return string
     */
    public toJson() {
      return json_encode(this.jsonSerialize());
    }

    /**
     * Get a CachingIterator instance.
     *
     * @param  int  $flags
     * @return \CachingIterator
     */
    public getCachingIterator($flags = CachingIterator.CALL_TOSTRING) {
      return new CachingIterator(this.getIterator(), $flags);
    }

    /**
     * Convert the collection to its string representation.
     *
     * @return string
     */
    public __toString() {
      return this.toJson();
    }

    /**
     * Add a method to the list of proxied methods.
     *
     * @param  string  $method
     * @return void
     */
    public static proxy($method) {
      this.$proxies.push($method);
    }

    /**
     * Dynamically access collection proxies.
     *
     * @param  string  $key
     * @return mixed
     *
     * @throws \Exception
     */
    public __get($key) {
      if (
        !in_array($key, (<typeof EnumeratesValues>this.constructor).$proxies)
      ) {
        throw new Exception(
          "Property [{$key}] does not exist on this collection instance."
        );
      }

      return new HigherOrderCollectionProxy(this, $key);
    }

    /**
     * Results array of items from Collection or Arrayable.
     *
     * @param  mixed  $items
     * @return array
     */
    protected getArrayableItems($items: any): any[] {
      if (is_array($items)) {
        return $items;
      } else if ($items instanceof Enumerable) {
        return $items.all();
      } else if ($items instanceof Arrayable) {
        return $items.toArray();
      } else if ($items instanceof Jsonable) {
        return json_decode($items.toJson());
      } else if ($items instanceof JsonSerializable) {
        return /*(array)*/ $items.jsonSerialize();
      } else if ($items instanceof Traversable) {
        return iterator_to_array($items);
      }

      return <any[]>$items;
    }

    /** Get an operator checker callback. */
    protected operatorForWhere(
      $key: string,
      $operator: string | null = null,
      $value: any = null
    ): Function {
      if (arguments.length === 1) {
        $value = true;

        $operator = "=";
      }

      if (arguments.length === 2) {
        $value = $operator;

        $operator = "=";
      }

      return function ($item) {
        const $retrieved = data_get($item, $key);

        const $strings = array_filter([$retrieved, $value], function ($value) {
          return (
            is_string($value) ||
            (is_object($value) && typeof $value.__toString === "function")
          );
        });

        if (
          count($strings) < 2 &&
          count(array_filter([$retrieved, $value], "is_object")) == 1
        ) {
          return in_array($operator, ["!=", "<>", "!=="]);
        }

        switch ($operator) {
          default:
          case "=":
          case "==":
            return $retrieved == $value;
          case "!=":
          case "<>":
            return $retrieved != $value;
          case "<":
            return $retrieved < $value;
          case ">":
            return $retrieved > $value;
          case "<=":
            return $retrieved <= $value;
          case ">=":
            return $retrieved >= $value;
          case "===":
            return $retrieved === $value;
          case "!==":
            return $retrieved !== $value;
        }
      };
    }

    /**
     * Determine if the given value is callable, but not a string.
     *
     * @param  mixed  $value
     * @return bool
     */
    protected useAsCallable($value) {
      return !is_string($value) && is_callable($value);
    }

    /**
     * Get a value retrieving callback.
     *
     * @param  callable|string|null  $value
     * @return callable
     */
    protected valueRetriever($value: Function | string | null): Function {
      if (this.useAsCallable($value)) {
        return <Function>$value;
      }

      return function ($item) {
        return data_get($item, $value);
      };
    }

    /**
     * Make a function to check an item's equality.
     *
     * @param  mixed  $value
     * @return \Closure
     */
    protected equality($value) {
      return function ($item) {
        return $item === $value;
      };
    }

    /**
     * Make a function using another function, by negating its result.
     *
     * @param  \Closure  $callback
     * @return \Closure
     */
    protected negate($callback: Function) {
      return function (...$params) {
        return !$callback(...$params);
      };
    }

    /**
     * Make a function that returns what's passed to it.
     *
     * @return \Closure
     */
    protected identity() {
      return function ($value) {
        return $value;
      };
    }
  };
}
