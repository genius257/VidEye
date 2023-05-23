import {
  array_key_exists,
  array_merge,
  array_pop,
  array_replace_recursive,
  array_search,
  in_array,
  sort
} from "locutus/php/array";
import { implode, strtolower } from "locutus/php/strings";
import { empty, is_null } from "locutus/php/var";
import { clone } from "../../../../PHP/helpers";
import Arr from "../../../Support/Arr";
import Str from "../../../Support/Str";
import EloquentBuilder from "../Builder";
import { Model } from "../Model";

type Constructor<T = {}> = new (...args: any[]) => T;

export default function HasRelationships<TBase extends Constructor>(
  Class: TBase
) {
  return class HasRelationships extends Class {
    static __trait__ = true;

    /**
     * The loaded relationships for the model.
     *
     * @var array
     */
    protected $relations = [];

    /**
     * The relationships that should be touched on save.
     *
     * @var array
     */
    protected $touches = [];

    /**
     * The many to many relationship methods.
     *
     * @var array
     */
    public static $manyMethods = [
      "belongsToMany",
      "morphToMany",
      "morphedByMany"
    ];

    /**
     * The relation resolver callbacks.
     *
     * @var array
     */
    protected static $relationResolvers = [];

    /**
     * Define a dynamic relation resolver.
     *
     * @param  string  $name
     * @param  \Closure  $callback
     * @return void
     */
    public static resolveRelationUsing($name: string, $callback: Function) {
      this.$relationResolvers = array_replace_recursive(
        this.$relationResolvers,
        { [this.name]: { [$name]: $callback } }
      );
    }

    /**
     * Define a one-to-one relationship.
     *
     * @param  string  $related
     * @param  string|null  $foreignKey
     * @param  string|null  $localKey
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public hasOne(
      $related: string,
      $foreignKey: string | null = null,
      $localKey: string | null = null
    ) {
      const $instance = this.newRelatedInstance($related);

      $foreignKey = $foreignKey
        ? $foreignKey
        : (<Model>(<unknown>this)).getForeignKey();

      $localKey = $localKey ? $localKey : (<Model>(<unknown>this)).getKeyName();

      return this.newHasOne(
        $instance.newQuery(),
        <Model>(<unknown>this),
        $instance.getTable() + "." + $foreignKey,
        <string>$localKey
      );
    }

    /**
     * Instantiate a new HasOne relationship.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  \Illuminate\Database\Eloquent\Model  $parent
     * @param  string  $foreignKey
     * @param  string  $localKey
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    protected newHasOne(
      $query: EloquentBuilder,
      $parent: Model,
      $foreignKey: string,
      $localKey: string
    ) {
      return new HasOne($query, $parent, $foreignKey, $localKey);
    }

    /**
     * Define a has-one-through relationship.
     *
     * @param  string  $related
     * @param  string  $through
     * @param  string|null  $firstKey
     * @param  string|null  $secondKey
     * @param  string|null  $localKey
     * @param  string|null  $secondLocalKey
     * @return \Illuminate\Database\Eloquent\Relations\HasOneThrough
     */
    public hasOneThrough(
      $related,
      $through,
      $firstKey = null,
      $secondKey = null,
      $localKey = null,
      $secondLocalKey = null
    ) {
      $through = new $through();

      $firstKey = $firstKey
        ? $firstKey
        : (<Model>(<unknown>this)).getForeignKey();

      $secondKey = $secondKey ? $secondKey : $through.getForeignKey();

      return this.newHasOneThrough(
        this.newRelatedInstance($related).newQuery(),
        <Model>(<unknown>this),
        $through,
        $firstKey,
        $secondKey,
        $localKey ? $localKey : (<Model>(<unknown>this)).getKeyName(),
        $secondLocalKey ? $secondLocalKey : $through.getKeyName()
      );
    }

    /**
     * Instantiate a new HasOneThrough relationship.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  \Illuminate\Database\Eloquent\Model  $farParent
     * @param  \Illuminate\Database\Eloquent\Model  $throughParent
     * @param  string  $firstKey
     * @param  string  $secondKey
     * @param  string  $localKey
     * @param  string  $secondLocalKey
     * @return \Illuminate\Database\Eloquent\Relations\HasOneThrough
     */
    protected newHasOneThrough(
      $query: EloquentBuilder,
      $farParent: Model,
      $throughParent: Model,
      $firstKey: string,
      $secondKey: string,
      $localKey: string,
      $secondLocalKey: string
    ) {
      return new HasOneThrough(
        $query,
        $farParent,
        $throughParent,
        $firstKey,
        $secondKey,
        $localKey,
        $secondLocalKey
      );
    }

    /**
     * Define a polymorphic one-to-one relationship.
     *
     * @param  string  $related
     * @param  string  $name
     * @param  string|null  $type
     * @param  string|null  $id
     * @param  string|null  $localKey
     * @return \Illuminate\Database\Eloquent\Relations\MorphOne
     */
    public morphOne(
      $related: string,
      $name: string,
      $type = null,
      $id = null,
      $localKey = null
    ) {
      const $instance = this.newRelatedInstance($related);

      [$type, $id] = this.getMorphs($name, $type, $id);

      const $table = $instance.getTable();

      $localKey = $localKey ? $localKey : (<Model>(<unknown>this)).getKeyName();

      return this.newMorphOne(
        $instance.newQuery(),
        <Model>(<unknown>this),
        $table + "." + $type,
        $table + "." + $id,
        $localKey
      );
    }

    /**
     * Instantiate a new MorphOne relationship.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  \Illuminate\Database\Eloquent\Model  $parent
     * @param  string  $type
     * @param  string  $id
     * @param  string  $localKey
     * @return \Illuminate\Database\Eloquent\Relations\MorphOne
     */
    protected newMorphOne(
      $query: EloquentBuilder,
      $parent: Model,
      $type,
      $id,
      $localKey
    ) {
      return new MorphOne($query, $parent, $type, $id, $localKey);
    }

    /**
     * Define an inverse one-to-one or many relationship.
     *
     * @param  string  $related
     * @param  string|null  $foreignKey
     * @param  string|null  $ownerKey
     * @param  string|null  $relation
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public belongsTo(
      $related,
      $foreignKey = null,
      $ownerKey = null,
      $relation = null
    ) {
      // If no relation name was given, we will use this debug backtrace to extract
      // the calling method's name and use that as the relationship name as most
      // of the time this will be what we desire to use for the relationships.
      if (is_null($relation)) {
        $relation = this.guessBelongsToRelation();
      }

      const $instance = this.newRelatedInstance($related);

      // If no foreign key was supplied, we can use a backtrace to guess the proper
      // foreign key name by using the name of the relationship function, which
      // when combined with an "_id" should conventionally match the columns.
      if (is_null($foreignKey)) {
        $foreignKey = Str.snake($relation) + "_" + $instance.getKeyName();
      }

      // Once we have the foreign key names, we'll just create a new Eloquent query
      // for the related models and returns the relationship instance which will
      // actually be responsible for retrieving and hydrating every relations.
      $ownerKey = $ownerKey ? $ownerKey : $instance.getKeyName();

      return this.newBelongsTo(
        $instance.newQuery(),
        <Model>(<unknown>this),
        $foreignKey,
        $ownerKey,
        $relation
      );
    }

    /**
     * Instantiate a new BelongsTo relationship.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  \Illuminate\Database\Eloquent\Model  $child
     * @param  string  $foreignKey
     * @param  string  $ownerKey
     * @param  string  $relation
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    protected newBelongsTo(
      $query: EloquentBuilder,
      $child: Model,
      $foreignKey: string,
      $ownerKey: string,
      $relation: string
    ) {
      return new BelongsTo($query, $child, $foreignKey, $ownerKey, $relation);
    }

    /**
     * Define a polymorphic, inverse one-to-one or many relationship.
     *
     * @param  string|null  $name
     * @param  string|null  $type
     * @param  string|null  $id
     * @param  string|null  $ownerKey
     * @return \Illuminate\Database\Eloquent\Relations\MorphTo
     */
    public morphTo($name = null, $type = null, $id = null, $ownerKey = null) {
      // If no name is provided, we will use the backtrace to get the function name
      // since that is most likely the name of the polymorphic interface. We can
      // use that to get both the class and foreign key that will be utilized.
      $name = $name || this.guessBelongsToRelation();

      [$type, $id] = this.getMorphs(Str.snake($name), $type, $id);

      // If the type value is null it is probably safe to assume we're eager loading
      // the relationship. In this case we'll just pass in a dummy query where we
      // need to remove any eager loads that may already be defined on a model.
      let $class;
      return is_null(($class = this[$type])) || $class === ""
        ? this.morphEagerTo($name, $type, $id, $ownerKey)
        : this.morphInstanceTo($class, $name, $type, $id, $ownerKey);
    }

    /**
     * Define a polymorphic, inverse one-to-one or many relationship.
     *
     * @param  string  $name
     * @param  string  $type
     * @param  string  $id
     * @param  string  $ownerKey
     * @return \Illuminate\Database\Eloquent\Relations\MorphTo
     */
    protected morphEagerTo($name, $type, $id, $ownerKey) {
      return this.newMorphTo(
        (<Model>(<unknown>this)).newQuery().setEagerLoads([]),
        <Model>(<unknown>this),
        $id,
        $ownerKey,
        $type,
        $name
      );
    }

    /**
     * Define a polymorphic, inverse one-to-one or many relationship.
     *
     * @param  string  $target
     * @param  string  $name
     * @param  string  $type
     * @param  string  $id
     * @param  string  $ownerKey
     * @return \Illuminate\Database\Eloquent\Relations\MorphTo
     */
    protected morphInstanceTo($target, $name, $type, $id, $ownerKey) {
      const $instance = this.newRelatedInstance(
        (<typeof HasRelationships>this.constructor).getActualClassNameForMorph(
          $target
        )
      );

      return this.newMorphTo(
        $instance.newQuery(),
        <Model>(<unknown>this),
        $id,
        $ownerKey ?? $instance.getKeyName(),
        $type,
        $name
      );
    }

    /**
     * Instantiate a new MorphTo relationship.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  \Illuminate\Database\Eloquent\Model  $parent
     * @param  string  $foreignKey
     * @param  string  $ownerKey
     * @param  string  $type
     * @param  string  $relation
     * @return \Illuminate\Database\Eloquent\Relations\MorphTo
     */
    protected newMorphTo(
      $query: EloquentBuilder,
      $parent: Model,
      $foreignKey: string,
      $ownerKey: string,
      $type: string,
      $relation: string
    ) {
      return new MorphTo(
        $query,
        $parent,
        $foreignKey,
        $ownerKey,
        $type,
        $relation
      );
    }

    /**
     * Retrieve the actual class name for a given morph class.
     *
     * @param  string  $class
     * @return string
     */
    public static getActualClassNameForMorph($class) {
      return Arr.get(Relation.morphMap() || [], $class, $class);
    }

    /**
     * Guess the "belongs to" relationship name.
     *
     * @return string
     */
    protected guessBelongsToRelation() {
      const [$one, $two, $caller] = debug_backtrace(
        DEBUG_BACKTRACE_IGNORE_ARGS,
        3
      );

      return $caller["function"];
    }

    /**
     * Define a one-to-many relationship.
     *
     * @param  string  $related
     * @param  string|null  $foreignKey
     * @param  string|null  $localKey
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public hasMany($related, $foreignKey = null, $localKey = null) {
      const $instance = this.newRelatedInstance($related);

      $foreignKey = $foreignKey || (<Model>(<unknown>this)).getForeignKey();

      $localKey = $localKey || (<Model>(<unknown>this)).getKeyName();

      return this.newHasMany(
        $instance.newQuery(),
        <Model>(<unknown>this),
        $instance.getTable() + "." + $foreignKey,
        $localKey
      );
    }

    /**
     * Instantiate a new HasMany relationship.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  \Illuminate\Database\Eloquent\Model  $parent
     * @param  string  $foreignKey
     * @param  string  $localKey
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    protected newHasMany(
      $query: EloquentBuilder,
      $parent: Model,
      $foreignKey: string,
      $localKey: string
    ) {
      return new HasMany($query, $parent, $foreignKey, $localKey);
    }

    /**
     * Define a has-many-through relationship.
     *
     * @param  string  $related
     * @param  string  $through
     * @param  string|null  $firstKey
     * @param  string|null  $secondKey
     * @param  string|null  $localKey
     * @param  string|null  $secondLocalKey
     * @return \Illuminate\Database\Eloquent\Relations\HasManyThrough
     */
    public hasManyThrough(
      $related: string,
      $through: string,
      $firstKey: string | null = null,
      $secondKey: string | null = null,
      $localKey: string | null = null,
      $secondLocalKey: string | null = null
    ) {
      $through = new $through();

      $firstKey = $firstKey || (<Model>(<unknown>this)).getForeignKey();

      $secondKey = $secondKey || $through.getForeignKey();

      return this.newHasManyThrough(
        this.newRelatedInstance($related).newQuery(),
        <Model>(<unknown>this),
        $through,
        $firstKey,
        $secondKey,
        $localKey || (<Model>(<unknown>this)).getKeyName(),
        $secondLocalKey || $through.getKeyName()
      );
    }

    /**
     * Instantiate a new HasManyThrough relationship.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  \Illuminate\Database\Eloquent\Model  $farParent
     * @param  \Illuminate\Database\Eloquent\Model  $throughParent
     * @param  string  $firstKey
     * @param  string  $secondKey
     * @param  string  $localKey
     * @param  string  $secondLocalKey
     * @return \Illuminate\Database\Eloquent\Relations\HasManyThrough
     */
    protected newHasManyThrough(
      $query: EloquentBuilder,
      $farParent: Model,
      $throughParent: Model,
      $firstKey: string,
      $secondKey: string,
      $localKey: string,
      $secondLocalKey: string
    ) {
      return new HasManyThrough(
        $query,
        $farParent,
        $throughParent,
        $firstKey,
        $secondKey,
        $localKey,
        $secondLocalKey
      );
    }

    /**
     * Define a polymorphic one-to-many relationship.
     *
     * @param  string  $related
     * @param  string  $name
     * @param  string|null  $type
     * @param  string|null  $id
     * @param  string|null  $localKey
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany
     */
    public morphMany(
      $related,
      $name,
      $type = null,
      $id = null,
      $localKey = null
    ) {
      const $instance = this.newRelatedInstance($related);

      // Here we will gather up the morph type and ID for the relationship so that we
      // can properly query the intermediate table of a relation. Finally, we will
      // get the table and create the relationship instances for the developers.
      [$type, $id] = this.getMorphs($name, $type, $id);

      const $table = $instance.getTable();

      $localKey = $localKey || (<Model>(<unknown>this)).getKeyName();

      return this.newMorphMany(
        $instance.newQuery(),
        <Model>(<unknown>this),
        $table + "." + $type,
        $table + "." + $id,
        $localKey
      );
    }

    /**
     * Instantiate a new MorphMany relationship.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  \Illuminate\Database\Eloquent\Model  $parent
     * @param  string  $type
     * @param  string  $id
     * @param  string  $localKey
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany
     */
    protected newMorphMany(
      $query: EloquentBuilder,
      $parent: Model,
      $type: string,
      $id: string,
      $localKey: string
    ) {
      return new MorphMany($query, $parent, $type, $id, $localKey);
    }

    /**
     * Define a many-to-many relationship.
     *
     * @param  string  $related
     * @param  string|null  $table
     * @param  string|null  $foreignPivotKey
     * @param  string|null  $relatedPivotKey
     * @param  string|null  $parentKey
     * @param  string|null  $relatedKey
     * @param  string|null  $relation
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public belongsToMany(
      $related,
      $table = null,
      $foreignPivotKey = null,
      $relatedPivotKey = null,
      $parentKey = null,
      $relatedKey = null,
      $relation = null
    ) {
      // If no relationship name was passed, we will pull backtraces to get the
      // name of the calling function. We will use that function name as the
      // title of this relation since that is a great convention to apply.
      if (is_null($relation)) {
        $relation = this.guessBelongsToManyRelation();
      }

      // First, we'll need to determine the foreign key and "other key" for the
      // relationship. Once we have determined the keys we'll make the query
      // instances as well as the relationship instances we need for this.
      const $instance = this.newRelatedInstance($related);

      $foreignPivotKey = $foreignPivotKey || $this.getForeignKey();

      $relatedPivotKey = $relatedPivotKey || $instance.getForeignKey();

      // If no table name was provided, we can guess it by concatenating the two
      // models using underscores in alphabetical order. The two model names
      // are transformed to snake case from their default CamelCase also.
      if (is_null($table)) {
        $table = this.joiningTable($related, $instance);
      }

      return this.newBelongsToMany(
        $instance.newQuery(),
        <Model>(<unknown>this),
        $table,
        $foreignPivotKey,
        $relatedPivotKey,
        $parentKey || (<Model>(<unknown>this)).getKeyName(),
        $relatedKey || $instance.getKeyName(),
        $relation
      );
    }

    /**
     * Instantiate a new BelongsToMany relationship.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  \Illuminate\Database\Eloquent\Model  $parent
     * @param  string  $table
     * @param  string  $foreignPivotKey
     * @param  string  $relatedPivotKey
     * @param  string  $parentKey
     * @param  string  $relatedKey
     * @param  string|null  $relationName
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    protected newBelongsToMany(
      $query: EloquentBuilder,
      $parent: Model,
      $table,
      $foreignPivotKey,
      $relatedPivotKey,
      $parentKey,
      $relatedKey,
      $relationName = null
    ) {
      return new BelongsToMany(
        $query,
        $parent,
        $table,
        $foreignPivotKey,
        $relatedPivotKey,
        $parentKey,
        $relatedKey,
        $relationName
      );
    }

    /**
     * Define a polymorphic many-to-many relationship.
     *
     * @param  string  $related
     * @param  string  $name
     * @param  string|null  $table
     * @param  string|null  $foreignPivotKey
     * @param  string|null  $relatedPivotKey
     * @param  string|null  $parentKey
     * @param  string|null  $relatedKey
     * @param  bool  $inverse
     * @return \Illuminate\Database\Eloquent\Relations\MorphToMany
     */
    public morphToMany(
      $related,
      $name,
      $table = null,
      $foreignPivotKey = null,
      $relatedPivotKey = null,
      $parentKey = null,
      $relatedKey = null,
      $inverse = false
    ) {
      const $caller = this.guessBelongsToManyRelation();

      // First, we will need to determine the foreign key and "other key" for the
      // relationship. Once we have determined the keys we will make the query
      // instances, as well as the relationship instances we need for these.
      const $instance = this.newRelatedInstance($related);

      $foreignPivotKey = $foreignPivotKey || $name + "_id";

      $relatedPivotKey = $relatedPivotKey || $instance.getForeignKey();

      // Now we're ready to create a new query builder for this related model and
      // the relationship instances for this relation. This relations will set
      // appropriate query constraints then entirely manages the hydrations.
      if (!$table) {
        const $words = preg_split(
          "/(_)/u",
          $name,
          -1,
          PREG_SPLIT_DELIM_CAPTURE
        );

        const $lastWord = array_pop($words);

        $table = implode("", $words) + Str.plural($lastWord);
      }

      return this.newMorphToMany(
        $instance.newQuery(),
        <Model>(<unknown>this),
        $name,
        $table,
        $foreignPivotKey,
        $relatedPivotKey,
        $parentKey || (<Model>(<unknown>this)).getKeyName(),
        $relatedKey || $instance.getKeyName(),
        $caller,
        $inverse
      );
    }

    /**
     * Instantiate a new MorphToMany relationship.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  \Illuminate\Database\Eloquent\Model  $parent
     * @param  string  $name
     * @param  string  $table
     * @param  string  $foreignPivotKey
     * @param  string  $relatedPivotKey
     * @param  string  $parentKey
     * @param  string  $relatedKey
     * @param  string|null  $relationName
     * @param  bool  $inverse
     * @return \Illuminate\Database\Eloquent\Relations\MorphToMany
     */
    protected newMorphToMany(
      $query: EloquentBuilder,
      $parent: Model,
      $name: string,
      $table: string,
      $foreignPivotKey: string,
      $relatedPivotKey: string,
      $parentKey: string,
      $relatedKey: string,
      $relationName: string | null = null,
      $inverse: boolean = false
    ) {
      return new MorphToMany(
        $query,
        $parent,
        $name,
        $table,
        $foreignPivotKey,
        $relatedPivotKey,
        $parentKey,
        $relatedKey,
        $relationName,
        $inverse
      );
    }

    /**
     * Define a polymorphic, inverse many-to-many relationship.
     *
     * @param  string  $related
     * @param  string  $name
     * @param  string|null  $table
     * @param  string|null  $foreignPivotKey
     * @param  string|null  $relatedPivotKey
     * @param  string|null  $parentKey
     * @param  string|null  $relatedKey
     * @return \Illuminate\Database\Eloquent\Relations\MorphToMany
     */
    public morphedByMany(
      $related,
      $name,
      $table = null,
      $foreignPivotKey = null,
      $relatedPivotKey = null,
      $parentKey = null,
      $relatedKey = null
    ) {
      $foreignPivotKey =
        $foreignPivotKey || (<Model>(<unknown>this)).getForeignKey();

      // For the inverse of the polymorphic many-to-many relations, we will change
      // the way we determine the foreign and other keys, as it is the opposite
      // of the morph-to-many method since we're figuring out these inverses.
      $relatedPivotKey = $relatedPivotKey || $name + "_id";

      return this.morphToMany(
        $related,
        $name,
        $table,
        $foreignPivotKey,
        $relatedPivotKey,
        $parentKey,
        $relatedKey,
        true
      );
    }

    /**
     * Get the relationship name of the belongsToMany relationship.
     *
     * @return string|null
     */
    protected guessBelongsToManyRelation() {
      const $caller = Arr.first(
        debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS),
        function ($trace) {
          return !in_array(
            $trace["function"],
            array_merge((<HasRelationships>this.constructor).$manyMethods, [
              "guessBelongsToManyRelation"
            ])
          );
        }
      );

      return !is_null($caller) ? $caller["function"] : null;
    }

    /**
     * Get the joining table name for a many-to-many relation.
     *
     * @param  string  $related
     * @param  \Illuminate\Database\Eloquent\Model|null  $instance
     * @return string
     */
    public joiningTable($related, $instance = null) {
      // The joining table name, by convention, is simply the snake cased models
      // sorted alphabetically and concatenated with an underscore, so we can
      // just sort the models and join them together to get the table name.
      const $segments = [
        $instance
          ? $instance.joiningTableSegment()
          : Str.snake(class_basename($related)),
        this.joiningTableSegment()
      ];

      // Now that we have the model names in an array we can just sort them and
      // use the implode function to join them together with an underscores,
      // which is typically used by convention within the database system.
      sort($segments);

      return strtolower(implode("_", $segments));
    }

    /**
     * Get this model's half of the intermediate table name for belongsToMany relationships.
     *
     * @return string
     */
    public joiningTableSegment() {
      return Str.snake(class_basename(this));
    }

    /**
     * Determine if the model touches a given relation.
     *
     * @param  string  $relation
     * @return bool
     */
    public touches($relation) {
      return in_array($relation, this.getTouchedRelations());
    }

    /**
     * Touch the owning relations of the model.
     *
     * @return void
     */
    public touchOwners() {
      this.getTouchedRelations().forEach(($relation) => {
        this[$relation]().touch();

        if (this[$relation] instanceof self) {
          this[$relation].fireModelEvent("saved", false);

          this[$relation].touchOwners();
        } else if (this[$relation] instanceof Collection) {
          this[$relation].each.touchOwners();
        }
      });
    }

    /**
     * Get the polymorphic relationship columns.
     *
     * @param  string  $name
     * @param  string  $type
     * @param  string  $id
     * @return array
     */
    protected getMorphs($name, $type, $id) {
      return [$type ? $type : $name + "_type", $id ? $id : $name + "_id"];
    }

    /** Get the class name for polymorphic relations. */
    public getMorphClass(): string {
      const $morphMap = Relation.morphMap();

      if (!empty($morphMap) && in_array(this.constructor.name, $morphMap)) {
        return array_search(this.constructor.name, $morphMap, true);
      }

      return this.constructor.name;
    }

    /**
     * Create a new model instance for a related model.
     *
     * @param  string  $class
     * @return mixed
     */
    protected newRelatedInstance($class) {
      return tap(new $class(), function ($instance) {
        if (!$instance.getConnectionName()) {
          $instance.setConnection(this.connection);
        }
      });
    }

    /**
     * Get all the loaded relations for the instance.
     *
     * @return array
     */
    public getRelations() {
      return this.relations;
    }

    /**
     * Get a specified relationship.
     *
     * @param  string  $relation
     * @return mixed
     */
    public getRelation($relation) {
      return this.relations[$relation];
    }

    /**
     * Determine if the given relation is loaded.
     *
     * @param  string  $key
     * @return bool
     */
    public relationLoaded($key) {
      return array_key_exists($key, this.relations);
    }

    /**
     * Set the given relationship on the model.
     *
     * @param  string  $relation
     * @param  mixed  $value
     * @return $this
     */
    public setRelation($relation, $value) {
      this.relations[$relation] = $value;

      return this;
    }

    /**
     * Unset a loaded relationship.
     *
     * @param  string  $relation
     * @return $this
     */
    public unsetRelation($relation) {
      delete this.relations[$relation];

      return this;
    }

    /**
     * Set the entire relations array on the model.
     *
     * @param  array  $relations
     * @return $this
     */
    public setRelations($relations: any[]) {
      this.relations = $relations;

      return this;
    }

    /**
     * Duplicate the instance and unset all the loaded relations.
     *
     * @return $this
     */
    public withoutRelations() {
      const $model = clone(this);

      return $model.unsetRelations();
    }

    /**
     * Unset all the loaded relations for the instance.
     *
     * @return $this
     */
    public unsetRelations() {
      this.relations = [];

      return this;
    }

    /**
     * Get the relationships that are touched on save.
     *
     * @return array
     */
    public getTouchedRelations(): any[] {
      return this.touches;
    }

    /**
     * Set the relationships that are touched on save.
     *
     * @param  array  $touches
     * @return $this
     */
    public setTouchedRelations($touches: any[]) {
      this.touches = $touches;

      return this;
    }
  };
}
