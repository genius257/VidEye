import QueueableCollection from "../../Contracts/Queue/QueueableCollection";
import QueueableEntity from "../../Contracts/Queue/QueueableEntity";
import Arrayable from "../../Contracts/Support/Arrayable";
import Arr from "../../Support/Arr";
import BaseCollection from "../../Support/Collection";
import Str from "../../Support/Str";
import LogicException from "../../../PHP/Exceptions/LogicException";
import { Model } from "./Model";
import {
  empty,
  isset,
  is_array,
  is_callable,
  is_null,
  is_numeric,
  is_string
} from "locutus/php/var";
import {
  array_intersect,
  array_keys,
  array_map,
  array_shift,
  array_values,
  count,
  end,
  key,
  reset
} from "locutus/php/array";
import { explode } from "locutus/php/strings";
import ArrayAccess from "../../../PHP/Interfaces/ArrayAccess";
import EloquentBuilder from "./Builder";

type integer = number;
type float = number;

export default class Collection extends BaseCollection
  implements QueueableCollection {
  /**
   * Find a model in the collection by key.
   *
   * @param  mixed  $key
   * @param  mixed  $default
   * @return \Illuminate\Database\Eloquent\Model|static|null
   */
  public find($key: any, $default: any = null): Model | this | null {
    if ($key instanceof Model) {
      $key = $key.getKey();
    }

    if ($key instanceof Arrayable) {
      $key = $key.toArray();
    }

    if (is_array($key)) {
      if (this.isEmpty()) {
        return new (<typeof Collection>this.constructor)() as this;
      }

      return this.whereIn(this.first().getKeyName(), $key);
    }

    return Arr.first(
      this.$items,
      function ($model) {
        return $model.getKey() == $key;
      },
      $default
    );
  }

  /** Load a set of relationships onto the collection. */
  public load($relations: any[] | string): this {
    if (this.isNotEmpty()) {
      if (is_string($relations)) {
        $relations = Array.from(arguments);
      }

      const $query = this.first()
        .newQueryWithoutRelationships()
        .with($relations);

      this.$items = $query.eagerLoadRelations(this.$items);
    }

    return this;
  }

  /**
   * Load a set of relationship counts onto the collection.
   *
   * @param  array|string  $relations
   * @return $this
   */
  public loadCount($relations): this {
    if (this.isEmpty()) {
      return this;
    }

    const $models = this.first()
      .newModelQuery()
      .whereKey(this.modelKeys())
      .select(this.first().getKeyName())
      .withCount(...arguments)
      .get()
      .keyBy(this.first().getKeyName());

    const $attributes = Arr.except(
      array_keys($models.first().getAttributes()),
      $models.first().getKeyName()
    );

    this.each(function ($model: Model) {
      const $extraAttributes = Arr.only(
        $models.get($model.getKey()).getAttributes(),
        $attributes
      );

      $model.forceFill($extraAttributes).syncOriginalAttributes($attributes);
    });

    return this;
  }

  /**
   * Load a set of relationships onto the collection if they are not already eager loaded.
   *
   * @param  array|string  $relations
   * @return $this
   */
  public loadMissing($relations) {
    if (is_string($relations)) {
      $relations = Array.from(arguments);
    }

    for (let [$key, $value] of Object.entries($relations)) {
      if (is_numeric($key)) {
        $key = <string>$value;
      }

      const $segments = <string[]>explode(".", explode(":", $key)[0]);

      if (Str.contains($key, ":")) {
        $segments[count($segments) - 1] += ":" + explode(":", $key)[1];
      }

      const $path = [];

      $segments.forEach(($segment) => {
        $path.push({ $segment: $segment });
      });

      if (is_callable($value)) {
        $path[count($segments) - 1][end($segments)] = $value;
      }

      this.loadMissingRelation(this, $path);
    }

    return this;
  }

  /**
   * Load a relationship path if it is not already eager loaded.
   *
   * @param  \Illuminate\Database\Eloquent\Collection  $models
   * @param  array  $path
   * @return void
   */
  protected loadMissingRelation($models: Collection, $path: any[]): void {
    let $relation = array_shift($path);

    const $name = explode(":", key($relation))[0];

    if (is_string(reset($relation))) {
      $relation = reset($relation);
    }

    $models
      .filter(function ($model) {
        return !is_null($model) && !$model.relationLoaded($name);
      })
      .load($relation);

    if (empty($path)) {
      return;
    }

    $models = $models.pluck($name);

    if ($models.first() instanceof BaseCollection) {
      $models = $models.collapse();
    }

    this.loadMissingRelation(
      new (<typeof Collection>this.constructor)($models),
      $path
    );
  }

  /**
   * Load a set of relationships onto the mixed relationship collection.
   *
   * @param  string  $relation
   * @param  array  $relations
   * @return $this
   */
  public loadMorph($relation, $relations): this {
    this.pluck($relation)
      .filter()
      .groupBy(function ($model) {
        return get_class($model);
      })
      .each(function ($models, $className) {
        (<typeof Collection>this.constructor)
          .make($models)
          .load($relations[$className] ?? []);
      });

    return this;
  }

  /** Load a set of relationship counts onto the mixed relationship collection. */
  public loadMorphCount($relation: string, $relations: any[]): this {
    this.pluck($relation)
      .filter()
      .groupBy(function ($model) {
        return get_class($model);
      })
      .each(function ($models, $className) {
        (<typeof Collection>this.constructor)
          .make($models)
          .loadCount($relations[$className] ?? []);
      });

    return this;
  }

  /**
   * Determine if a key exists in the collection.
   *
   * @param  mixed  $key
   * @param  mixed  $operator
   * @param  mixed  $value
   * @return bool
   */
  public contains($key, $operator = null, $value = null) {
    if (arguments.length > 1 || this.useAsCallable($key)) {
      return super.contains(...Array.from(arguments));
    }

    if ($key instanceof Model) {
      return super.contains(function ($model) {
        return $model.is($key);
      });
    }

    return super.contains(function ($model) {
      return $model.getKey() == $key;
    });
  }

  /**
   * Get the array of primary keys.
   *
   * @return array
   */
  public modelKeys() {
    return array_map(function ($model) {
      return $model.getKey();
    }, this.$items);
  }

  /**
   * Merge the collection with the given items.
   *
   * @param  \ArrayAccess|array  $items
   * @return static
   */
  public merge($items: ArrayAccess | any[]): this {
    const $dictionary = this.getDictionary();

    $items.forEach(($item) => {
      $dictionary[$item.getKey()] = $item;
    });

    return new (<typeof Collection>this.constructor)(
      array_values($dictionary)
    ) as this;
  }

  /**
   * Run a map over each of the items.
   *
   * @param  callable  $callback
   * @return \Illuminate\Support\Collection|static
   */
  public map($callback: Function): BaseCollection | this {
    const $result = super.map($callback);

    return $result.contains(function ($item) {
      return !($item instanceof Model);
    })
      ? $result.toBase()
      : $result;
  }

  /**
   * Run an associative map over each of the items.
   *
   * The callback should return an associative array with a single key / value pair.
   *
   * @param  callable  $callback
   * @return \Illuminate\Support\Collection|static
   */
  public mapWithKeys($callback: Function): BaseCollection | this {
    const $result = super.mapWithKeys($callback);

    return $result.contains(function ($item) {
      return !($item instanceof Model);
    })
      ? $result.toBase()
      : $result;
  }

  /**
   * Reload a fresh model instance from the database for all the entities.
   *
   * @param  array|string  $with
   * @return static
   */
  public fresh($with = []): this {
    if (this.isEmpty()) {
      return new (<typeof Collection>this.constructor)() as this;
    }

    const $model = this.first();

    const $freshModels = $model
      .newQueryWithoutScopes()
      .with(is_string($with) ? Array.from(arguments) : $with)
      .whereIn($model.getKeyName(), this.modelKeys())
      .get()
      .getDictionary();

    return this.map(function ($model) {
      return $model.exists && isset($freshModels[$model.getKey()])
        ? $freshModels[$model.getKey()]
        : null;
    });
  }

  /**
   * Diff the collection with the given items.
   *
   * @param  \ArrayAccess|array  $items
   * @return static
   */
  public diff($items): this {
    const $diff = new (<typeof Collection>this.constructor)();

    const $dictionary = this.getDictionary($items);

    for (const [$key, $item] of <[string, Model][]>(
      Object.entries(this.$items)
    )) {
      if (!isset($dictionary[$item.getKey()])) {
        $diff.add($item);
      }
    }

    return $diff as this;
  }

  /**
   * Intersect the collection with the given items.
   *
   * @param  \ArrayAccess|array  $items
   * @return static
   */
  public intersect($items) {
    const $intersect = new (<typeof Collection>this.constructor)();

    if (empty($items)) {
      return $intersect;
    }

    const $dictionary = this.getDictionary($items);

    for (const [$key, $item] of <[string, Model][]>Object.entries(this.items)) {
      if (isset($dictionary[$item.getKey()])) {
        $intersect.add($item);
      }
    }

    return $intersect;
  }

  /**
   * Return only unique items from the collection.
   *
   * @param  string|callable|null  $key
   * @param  bool  $strict
   * @return static
   */
  public unique($key = null, $strict = false) {
    if (!is_null($key)) {
      return super.unique($key, $strict);
    }

    return new (<typeof Collection>this.constructor)(
      array_values(this.getDictionary())
    );
  }

  /**
   * Returns only the models from the collection with the specified keys.
   *
   * @param  mixed  $keys
   * @return static
   */
  public only($keys) {
    if (is_null($keys)) {
      return new (<typeof Collection>this.constructor)(this.items);
    }

    const $dictionary = Arr.only(this.getDictionary(), $keys);

    return new (<typeof Collection>this.constructor)(array_values($dictionary));
  }

  /**
   * Returns all models in the collection except the models with specified keys.
   *
   * @param  mixed  $keys
   * @return static
   */
  public except($keys: any): this {
    const $dictionary = Arr.except(this.getDictionary(), $keys);

    return new (<typeof Collection>this.constructor)(
      array_values($dictionary)
    ) as this;
  }

  /**
   * Make the given, typically visible, attributes hidden across the entire collection.
   *
   * @param  array|string  $attributes
   * @return $this
   */
  public makeHidden($attributes): this {
    throw new Error("Not implemented");
    //return this.each.makeHidden($attributes);
  }

  /**
   * Make the given, typically hidden, attributes visible across the entire collection.
   *
   * @param  array|string  $attributes
   * @return $this
   */
  public makeVisible($attributes): this {
    throw new Error("Not implemented");
    //return this.each.makeVisible($attributes);
  }

  /**
   * Append an attribute across the entire collection.
   *
   * @param  array|string  $attributes
   * @return $this
   */
  public append($attributes): this {
    throw new Error("Not implemented");
    //return this.each.append($attributes);
  }

  /**
   * Get a dictionary keyed by primary keys.
   *
   * @param  \ArrayAccess|array|null  $items
   * @return array
   */
  public getDictionary($items = null) {
    $items = is_null($items) ? this.$items : $items;

    const $dictionary = [];

    for (const [$key, $value] of <[string, Model][]>Object.entries($items)) {
      $dictionary[$value.getKey()] = $value;
    }

    return $dictionary;
  }

  /**
   * The following methods are intercepted to always return base collections.
   */

  /**
   * Get an array with the values of a given key.
   *
   * @param  string|array  $value
   * @param  string|null  $key
   * @return \Illuminate\Support\Collection
   */
  public pluck($value, $key = null): BaseCollection {
    return this.toBase().pluck($value, $key);
  }

  /**
   * Get the keys of the collection items.
   *
   * @return \Illuminate\Support\Collection
   */
  public keys(): BaseCollection {
    return this.toBase().keys();
  }

  /**
   * Zip the collection together with one or more arrays.
   *
   * @param  mixed  ...$items
   * @return \Illuminate\Support\Collection
   */
  public zip(...$items: any[]): BaseCollection {
    return this.toBase().zip(...$items);
  }

  /**
   * Collapse the collection of items into a single array.
   *
   * @return \Illuminate\Support\Collection
   */
  public collapse(): BaseCollection {
    return this.toBase().collapse();
  }

  /**
   * Get a flattened array of the items in the collection.
   *
   * @param  int  $depth
   * @return \Illuminate\Support\Collection
   */
  public flatten($depth: integer = Infinity): BaseCollection {
    return this.toBase().flatten($depth);
  }

  /**
   * Flip the items in the collection.
   *
   * @return \Illuminate\Support\Collection
   */
  public flip(): BaseCollection {
    return this.toBase().flip();
  }

  /** Pad collection to the specified length with a value. */
  public pad($size: integer, $value: any): BaseCollection {
    return this.toBase().pad($size, $value);
  }

  /**
   * Get the comparison function to detect duplicates.
   *
   * @param  bool  $strict
   * @return \Closure
   */
  protected duplicateComparator($strict: boolean) {
    return function ($a, $b) {
      return $a.is($b);
    };
  }

  /**
   * Get the type of the entities being queued.
   *
   * @return string|null
   *
   * @throws \LogicException
   */
  public getQueueableClass() {
    if (this.isEmpty()) {
      return;
    }

    const $class = get_class(this.first());

    this.each(function ($model) {
      if (get_class($model) !== $class) {
        throw new LogicException(
          "Queueing collections with multiple model types is not supported."
        );
      }
    });

    return $class;
  }

  /**
   * Get the identifiers for all of the entities.
   *
   * @return array
   */
  public getQueueableIds() {
    if (this.isEmpty()) {
      return [];
    }

    return this.first() instanceof QueueableEntity
      ? this.map.getQueueableId().all()
      : this.modelKeys();
  }

  /**
   * Get the relationships of the entities being queued.
   *
   * @return array
   */
  public getQueueableRelations() {
    if (this.isEmpty()) {
      return [];
    }

    const $relations = this.map.getQueueableRelations().all();

    if (count($relations) === 0 || $relations === [[]]) {
      return [];
    } else if (count($relations) === 1) {
      return reset($relations);
    } else {
      return array_intersect(...$relations);
    }
  }

  /**
   * Get the connection of the entities being queued.
   *
   * @return string|null
   *
   * @throws \LogicException
   */
  public getQueueableConnection(): string | null {
    if (this.isEmpty()) {
      return;
    }

    const $connection = this.first().getConnectionName();

    this.each(function ($model) {
      if ($model.getConnectionName() !== $connection) {
        throw new LogicException(
          "Queueing collections with multiple model connections is not supported."
        );
      }
    });

    return $connection;
  }

  /**
   * Get the Eloquent query builder from the collection.
   *
   * @return \Illuminate\Database\Eloquent\Builder
   *
   * @throws \LogicException
   */
  public toQuery(): EloquentBuilder {
    const $model = this.first();

    if (!$model) {
      throw new LogicException("Unable to create query for empty collection.");
    }

    const $class = get_class($model);

    if (
      this.filter(function ($model) {
        return !($model instanceof $class);
      }).isNotEmpty()
    ) {
      throw new LogicException(
        "Unable to create query for collection with mixed types."
      );
    }

    return $model.newModelQuery().whereKey(this.modelKeys());
  }
}
