import { array_values } from "locutus/php/array";
import { explode, sprintf, str_replace } from "locutus/php/strings";
import { isset, is_array } from "locutus/php/var";
import Str from "../../../../Support/Str";
import { Model } from "../../Model";

type integer = Number;
type float = Number;

type Constructor<T = {}> = new (...args: any[]) => T;
export default function AsPivot<TBase extends Constructor>(Class: TBase) {
  return class AsPivot extends Class {
    static __trait__ = true;

    /**
     * The parent model of the relationship.
     *
     * @var \Illuminate\Database\Eloquent\Model
     */
    public $pivotParent;

    /**
     * The name of the foreign key column.
     *
     * @var string
     */
    protected $foreignKey;

    /**
     * The name of the "other key" column.
     *
     * @var string
     */
    protected $relatedKey;

    /**
     * Create a new pivot model instance.
     *
     * @param  \Illuminate\Database\Eloquent\Model  $parent
     * @param  array  $attributes
     * @param  string  $table
     * @param  bool  $exists
     * @return static
     */
    public static fromAttributes(
      $parent: Model,
      $attributes,
      $table,
      $exists = false
    ) {
      const $instance = new (<typeof AsPivot>this.constructor)();

      $instance.timestamps = $instance.hasTimestampAttributes($attributes);

      // The pivot model is a "dynamic" model since we will set the tables dynamically
      // for the instance. This allows it work for any intermediate tables for the
      // many to many relationship that are defined by this developer's classes.
      $instance
        .setConnection($parent.getConnectionName())
        .setTable($table)
        .forceFill($attributes)
        .syncOriginal();

      // We store off the parent instance so we will access the timestamp column names
      // for the model, since the pivot model timestamps aren't easily configurable
      // from the developer's point of view. We can use the parents to get these.
      $instance.pivotParent = $parent;

      $instance.exists = $exists;

      return $instance;
    }

    /**
     * Create a new pivot model from raw values returned from a query.
     *
     * @param  \Illuminate\Database\Eloquent\Model  $parent
     * @param  array  $attributes
     * @param  string  $table
     * @param  bool  $exists
     * @return static
     */
    public static fromRawAttributes(
      $parent: Model,
      $attributes,
      $table,
      $exists = false
    ) {
      const $instance = (<typeof AsPivot>this.constructor).fromAttributes(
        $parent,
        [],
        $table,
        $exists
      );

      $instance.timestamps = $instance.hasTimestampAttributes($attributes);

      $instance.setRawAttributes($attributes, $exists);

      return $instance;
    }

    /**
     * Set the keys for a save update query.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    protected setKeysForSaveQuery($query: EloquentBuilder): EloquentBuilder {
      if (isset(this.attributes[this.getKeyName()])) {
        return super.setKeysForSaveQuery($query);
      }

      $query.where(
        this.foreignKey,
        this.getOriginal(this.foreignKey, this.getAttribute(this.foreignKey))
      );

      return $query.where(
        this.relatedKey,
        this.getOriginal(this.relatedKey, this.getAttribute(this.relatedKey))
      );
    }

    /**
     * Delete the pivot model record from the database.
     *
     * @return int
     */
    public delete(): integer {
      if (isset(this.attributes[this.getKeyName()])) {
        return Number.parseInt(super.delete());
      }

      if (this.fireModelEvent("deleting") === false) {
        return 0;
      }

      this.touchOwners();

      return tap(this.getDeleteQuery().delete(), function () {
        this.exists = false;

        this.fireModelEvent("deleted", false);
      });
    }

    /**
     * Get the query builder for a delete operation on the pivot.
     *
     * @return \Illuminate\Database\Eloquent\Builder
     */
    protected getDeleteQuery(): EloquentBuilder {
      return this.newQueryWithoutRelationships().where({
        [this.foreignKey]: this.getOriginal(
          this.foreignKey,
          this.getAttribute(this.foreignKey)
        ),
        [this.relatedKey]: this.getOriginal(
          this.relatedKey,
          this.getAttribute(this.relatedKey)
        )
      });
    }

    /** Get the table associated with the model. */
    public getTable(): string {
      if (!isset(this.table)) {
        this.setTable(
          str_replace("\\", "", Str.snake(Str.singular(class_basename($this))))
        );
      }

      return this.table;
    }

    /** Get the foreign key column name. */
    public getForeignKey(): string {
      return this.foreignKey;
    }

    /** Get the "related key" column name. */
    public getRelatedKey(): string {
      return this.relatedKey;
    }

    /** Get the "related key" column name. */
    public getOtherKey(): string {
      return this.getRelatedKey();
    }

    /**
     * Set the key names for the pivot model instance.
     *
     * @param  string  $foreignKey
     * @param  string  $relatedKey
     * @return $this
     */
    public setPivotKeys($foreignKey, $relatedKey) {
      this.foreignKey = $foreignKey;

      this.relatedKey = $relatedKey;

      return this;
    }

    /**
     * Determine if the pivot model or given attributes has timestamp attributes.
     *
     * @param  array|null  $attributes
     * @return bool
     */
    public hasTimestampAttributes($attributes = null) {
      return array_key_exists(
        this.getCreatedAtColumn(),
        $attributes ?? this.attributes
      );
    }

    /**
     * Get the name of the "created at" column.
     *
     * @return string
     */
    public getCreatedAtColumn() {
      return this.pivotParent
        ? this.pivotParent.getCreatedAtColumn()
        : super.getCreatedAtColumn();
    }

    /**
     * Get the name of the "updated at" column.
     *
     * @return string
     */
    public getUpdatedAtColumn() {
      return this.pivotParent
        ? this.pivotParent.getUpdatedAtColumn()
        : super.getUpdatedAtColumn();
    }

    /**
     * Get the queueable identity for the entity.
     *
     * @return mixed
     */
    public getQueueableId() {
      if (isset(this.attributes[this.getKeyName()])) {
        return this.getKey();
      }

      return sprintf(
        "%s:%s:%s:%s",
        this.foreignKey,
        this.getAttribute(this.foreignKey),
        this.relatedKey,
        this.getAttribute(this.relatedKey)
      );
    }

    /**
     * Get a new query to restore one or more models by their queueable IDs.
     *
     * @param  int[]|string[]|string  $ids
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public newQueryForRestoration($ids) {
      if (is_array($ids)) {
        return this.newQueryForCollectionRestoration($ids);
      }

      if (!Str.contains($ids, ":")) {
        return super.newQueryForRestoration($ids);
      }

      const $segments = explode(":", $ids);

      return this.newQueryWithoutScopes()
        .where($segments[0], $segments[1])
        .where($segments[2], $segments[3]);
    }

    /**
     * Get a new query to restore multiple models by their queueable IDs.
     *
     * @param  int[]|string[]  $ids
     * @return \Illuminate\Database\Eloquent\Builder
     */
    protected newQueryForCollectionRestoration(
      $ids: integer[] | string[]
    ): EloquentBuilder {
      $ids = array_values($ids);

      if (!Str.contains($ids[0], ":")) {
        return super.newQueryForRestoration($ids);
      }

      const $query = this.newQueryWithoutScopes();

      $ids.forEach(($id) => {
        const $segments = explode(":", $id);

        $query.orWhere(function ($query) {
          return $query
            .where($segments[0], $segments[1])
            .where($segments[2], $segments[3]);
        });
      });

      return $query;
    }

    /**
     * Unset all the loaded relations for the instance.
     *
     * @return $this
     */
    public unsetRelations() {
      this.pivotParent = null;
      this.relations = [];

      return $this;
    }
  };
}
