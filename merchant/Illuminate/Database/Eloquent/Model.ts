import MassAssignmentException from "./MassAssignmentException";
import Str from "../../Support/Str";
import {
  array_flip,
  array_intersect_key,
  array_merge,
  array_diff_key,
  count,
  array_key_exists,
  in_array,
  array_combine,
  array_unique,
  array_values,
  array_diff,
  array_keys,
  array_filter
} from "locutus/php/array";
import { empty, isset, is_array, is_null, is_string } from "locutus/php/var";
import { json_encode, json_last_error } from "locutus/php/json";
import {
  lcfirst,
  implode,
  explode,
  sprintf,
  ucfirst
} from "locutus/php/strings";
import { class_uses_recursive, collect } from "../../Support/helpers";
import DatabaseManager from "../../Database/DatabaseManager";
import Manager from "../../Database/Capsule/Manager";
import Builder from "./Builder";
import EloquentBuilder from "./Builder";
import Arr from "../../Support/Arr";
import Collection from "../../Support/Collection";
import HasAttributes from "./Concerns/HasAttributes";
import HasEvents from "./Concerns/HasEvents";
import GuardsAttributes from "./Concerns/GuardsAttributes";
import HasGlobalScopes from "./Concerns/HasGlobalScopes";
import HasRelationships from "./Concerns/HasRelationships";
import HasTimestamps from "./Concerns/HasTimestamps";
import HidesAttributes from "./Concerns/HidesAttributes";
import ForwardsCalls from "../../Support/Traits/ForwardsCalls";
import Arrayable from "../../Contracts/Support/Arrayable";
import JsonSerializable from "../../../PHP/Interfaces/JsonSerializable";
import Jsonable from "../../Contracts/Support/Jsonable";
import QueueableEntity from "../../Contracts/Queue/QueueableEntity";
import UrlRoutable from "../../Contracts/Routing/UrlRoutable";
import Dispatcher from "../../Contracts/Events/Dispatcher";
import ConnectionResolverInterface from "../ConnectionResolverInterface";
import { method_exists } from "../../../PHP/helpers";
import EloquentCollection from "./Collection";
import QueryBuilder from "../Query/Builder";
//import Pivot from "./Relations/Pivot"; //FIXME: circular dependency! Model does not need it right away, so something "pretty"/ideal must be done.
import { hasMixin, Mixin } from "ts-mixer";
import Exception from "../../../PHP/Exceptions/Exception";
import { getMixinsForClass } from "ts-mixer/dist/mixin-tracking";

type integer = number;
type float = number;

/**
 * abstract class
 * @see https://laravel.com/api/7.x/Illuminate/Database/Eloquent/Model.html
 */
class _Model
  implements
    Arrayable,
    //Array<any>,
    /*ArrayAccess,*/ Jsonable,
    JsonSerializable,
    QueueableEntity,
    UrlRoutable {
  proxy;

  /** The connection name for the model. */
  protected connection: string | null = null;

  /** The table associated with the model. */
  protected table: string = null;

  /** The primary key for the model. */
  protected primaryKey = "id";

  /** The "type" of the primary key ID. */
  protected keyType: string = "int";

  /** Indicates if the IDs are auto-incrementing. */
  public incrementing: boolean = true;

  /** The relations to eager load on every query. */
  protected with: any[] = [];

  /** The relationship counts that should be eager loaded on every query. */
  protected $withCount: any[] = [];

  /** The number of models to return for pagination. */
  protected perPage: integer = 15;

  /** Indicates if the model exists. */
  public exists: boolean = false;

  /** Indicates if the model was inserted during the current request lifecycle. */
  public wasRecentlyCreated: boolean = false;

  /** The connection resolver instance. */
  protected static $resolver: ConnectionResolverInterface;

  /** The event dispatcher instance. */
  protected static $dispatcher: Dispatcher;

  /** The array of booted models. */
  protected static $booted: any[] = [];

  /** The array of trait initializers that will be called on each new instance. */
  protected static $traitInitializers: any[] = [];

  /** The array of global scopes on the model. */
  protected static $globalScopes: any[] = [];

  /** The list of models classes that should not be affected with touch. */
  protected static $ignoreOnTouch: any[] = [];

  /** The name of the "created at" column. */
  public static readonly CREATED_AT: string | null = "created_at";

  /** The name of the "updated at" column. */
  public static readonly UPDATED_AT: string | null = "updated_at";

  /**
   * Create a new model instance.
   *
   * @param {object} attributes
   */
  constructor(attributes = {}) {
    this.bootIfNotBooted();

    this.initializeTraits();

    this.syncOriginal();

    if (Object.keys(attributes).length > 0) {
      //TODO: add static proxy method to capture the new keyword, make the instance, and add the attributes via a command afterwards? (leave the console.warn, just in case the Proxy gets bypassed)
      console.warn(
        "[\\Illuminate\\Database\\Eloquent\\Model::constructor]: Non static fields defined in child classes will not be available yet.\nThis results in rules file fillable and guarded not acting as one would exspect in the constructor state."
      );
    }
    this.fill(attributes);

    this.proxy = new Proxy(this, {
      /*
      apply: (target, thisArg, argumentsList) => {
        console.log("apply");
      },
      */
      get: (instance, property) => {
        if (property in instance) return instance[property]; //normal case
        if (typeof property === "symbol") {
          return undefined;
        }
        console.trace(
          `[\\Illuminate\\Database\\Eloquent\\Model]: access to non-existent property "${property}"`
        );
        let attribute = instance.getAttribute(property);
        return attribute !== undefined ? attribute : instance.__call(property);
      },
      set: (instance, property, value) => {
        if (property in instance) {
          //normal case
          instance[property] = value;
          return true;
        }
        if (typeof property !== "symbol") {
          console.log(`setting value on non-existent property "${property}"`);
        }
        instance.setAttribute(property, value);
        return true;
      }
    });

    return this.proxy;
  }

  //FIXME: remove
  __call(method, parameters) {
    if (in_array(method, ["increment", "decrement"])) {
      //return this[method](...parameters);
      return this[method];
    }

    let resolver =
      ((<typeof Model>this.constructor).$relationResolvers[
        this.constructor.name
      ] &&
        (<typeof Model>this.constructor).$relationResolvers[
          this.constructor.name
        ][method]) ??
      null;

    if (resolver) {
      return resolver(this);
    }

    return this.forwardCallTo(this.newQuery(), method, parameters);
  }

  forwardCallTo(object, method, parameters) {
    try {
      return object[method].bind(object);
      //return object[method](...parameters);
    } catch (e) {
      throw e;
      //FIXME
      /*
      let pattern = /^Call to undefined method (?P<class>[^:]+)::(?P<method>[^\(]+)\(\)$/;

      if (pattern.test(e.toString())) {
        throw e;
      }
      let matches = pattern.match(e.toString());

      if (matches['class'] !== object.prototype.name || matches['method'] !== method) {
        throw e;
      }

      this.throwBadMethodCallException(method);
      */
    }
  }

  bootIfNotBooted() {
    if (
      !isset((<typeof Model>this.constructor).$booted[this.constructor.name])
    ) {
      (<typeof Model>this.constructor).$booted[this.constructor.name] = true;

      this.fireModelEvent("booting", false);

      (<typeof Model>this.constructor).booting();
      (<typeof Model>this.constructor).boot();
      (<typeof Model>this.constructor).booted();

      this.fireModelEvent("booted", false);
    }
  }

  initializeTraits() {
    //TODO
  }

  // NOTE: this belongs in trait:
  syncOriginal() {
    this.original = this.getAttributes();

    return this;
  }

  /**
   * Fill the model with an array of attributes.
   * @param {array} attributes
   * @returns {this}
   * @throws \Illuminate\Database\Eloquent\MassAssignmentException
   */
  fill(attributes) {
    let totallyGuarded = this.totallyGuarded();

    for (let [key, value] of Object.entries(
      this.fillableFromArray(attributes)
    )) {
      key = this.removeTableFromKey(key);

      // The developers may choose to place some attributes in the "fillable" array
      // which means only those attributes may be set through mass assignment to
      // the model, and all others will just get ignored for security reasons.
      if (this.isFillable(key)) {
        this.setAttribute(key, value);
      } else if (totallyGuarded) {
        throw new MassAssignmentException(
          `Add [${key}] to fillable property to allow mass assignment on [${this.constructor.name}].`
        );
      }
    }

    return this;
  }

  /**
   * Determine if the model is totally guarded.
   *
   * from trait: GuardsAttributes
   *
   * @returns {boolean}
   */
  totallyGuarded() {
    return false;
    //return count(this.getFillable()) === 0 && this.getGuarded() == ["*"];
  }

  /**
   *
   * @param {object} attributes
   */
  fillableFromArray(attributes) {
    if (
      this.getFillable().length > 0 &&
      !(<typeof Model>this.constructor).$unguarded
    ) {
      return array_intersect_key(attributes, array_flip(this.getFillable()));
    }

    return attributes;
  }

  /**
   * Remove the table name from a given key.
   * @param {string} key
   * @returns {string}
   */
  removeTableFromKey(key) {
    return Str.contains(key, ".") ? key.split(/\./g).pop() : key;
  }

  isFillable(key) {
    if ((<typeof Model>this.constructor).$unguarded) {
      return true;
    }

    // If the key is in the "fillable" array, we can of course assume that it's
    // a fillable attribute. Otherwise, we will check the guarded array when
    // we need to determine if the attribute is black-listed on the model.
    if (this.getFillable().includes(key)) {
      return true;
    }

    // If the attribute is explicitly listed in the "guarded" array then we can
    // return false immediately. This means this attribute is definitely not
    // fillable and there is no point in going any further in this method.
    if (this.isGuarded(key)) {
      return false;
    }

    return this.getFillable().length === 0 && !Str.startsWith(key, "_");
  }

  setAttribute(key, value) {
    // First we will check for the presence of a mutator for the set operation
    // which simply lets the developers tweak the attribute as it is set on
    // the model, such as "json_encoding" an listing of data for storage.
    if (this.hasSetMutator(key)) {
      return this.setMutatedAttributeValue(key, value);
    }

    // If an attribute is listed as a "date", we'll convert it from a DateTime
    // instance into a form proper for storage on the database tables using
    // the connection grammar's date format. We will auto set the values.
    else if (value && this.isDateAttribute(key)) {
      value = this.fromDateTime(value);
    }

    if (this.isClassCastable(key)) {
      this.setClassCastableAttribute(key, value);

      return this;
    }

    if (this.isJsonCastable(key) && null !== value) {
      value = this.castAttributeAsJson(key, value);
    }

    // If this attribute contains a JSON ->, we'll set the proper value in the
    // attribute's underlying array. This takes care of properly nesting an
    // attribute in the array's value in the case of deeply nested items.
    if (Str.contains(key, "->")) {
      return this.fillJsonAttribute(key, value);
    }

    this.attributes[key] = value;

    return this;
  }

  getAttributes() {
    this.mergeAttributesFromClassCasts();

    return this.attributes;
  }

  mergeAttributesFromClassCasts() {
    return;
    /*
    for (let [key, value] of Object.entries(this.classCastCache)) {
      let caster = this.resolveCasterClass(key);

      this.attributes = array_merge(
        this.attributes,
        caster instanceof CastsInboundAttributes
          ? { key: value }
          : this.normalizeCastClassResponse(
              key,
              caster.set(this, key, value, this.attributes)
            )
      );
    }
    */
  }

  getFillable() {
    return this.fillable;
  }

  getAttribute(key) {
    if (!key) {
      return;
    }

    // If the attribute exists in the attribute array or has a "get" mutator we will
    // get the attribute's value. Otherwise, we will proceed as if the developers
    // are asking for a relationship's value. This covers both types of values.
    if (
      this.attributes.hasOwnProperty(key) ||
      this.casts.hasOwnProperty(key) ||
      this.hasGetMutator(key) ||
      this.isClassCastable(key)
    ) {
      return this.getAttributeValue(key);
    }

    // Here we will determine if the model base class itself contains this given key
    // since we don't want to treat any of those methods as relationships because
    // they are all intended as helper methods and none of these are relations.
    /*if (method_exists(self::class, key)) {
        return; //FIXME
    }*/

    return this.getRelationValue(key);
  }

  hasGetMutator(value) {
    return this.hasOwnProperty(`get${Str.studly(value)}Attribute`);
  }

  isClassCastable(key) {
    return false;
    /*
    let $class = this.parseCasterClass(this.getCasts()[key]);

    return (
      this.getCasts().hasOwnProperty(key) &&
      !this.constructor.$primitiveCastTypes.includes($class)
    );
    */
  }

  getCasts() {
    /*
    if (this.getIncrementing()) {
      return array_merge([this.getKeyName() => this.getKeyType()], this.casts);
    }
    */

    return this.casts;
  }

  getRelationValue(key) {
    // If the key already exists in the relationships array, it just means the
    // relationship has already been loaded, so we'll just return it out of
    // here because there is no need to query within the relations twice.
    if (this.relationLoaded(key)) {
      return this.relations[key];
    }

    // If the "attribute" exists as a method on the model, we will just assume
    // it is a relationship and will load and return results from the query
    // and hydrate the relationship's value on the "relationships" array.
    if (
      typeof this[key] === "function" ||
      (((<typeof Model>this.constructor).$relationResolvers[
        this.constructor.name
      ] &&
        (<typeof Model>this.constructor).$relationResolvers[
          this.constructor.name
        ][key]) ??
        null)
    ) {
      return this.getRelationshipFromMethod(key);
    }
  }

  relationLoaded(key) {
    return this.relations.hasOwnProperty(key);
  }

  isGuarded(key) {
    return (
      this.getGuarded().includes(key) ||
      (this.getGuarded().length === 1 && this.getGuarded()[0] === "*")
    );
  }

  getGuarded() {
    return this.guarded;
  }

  hasSetMutator(key) {
    return this.hasOwnProperty(`set${Str.studly(key)}Attribute`);
  }

  isDateAttribute(key) {
    return this.getDates().includes(key) || this.isDateCastable(key);
  }

  /**
   * Get the attributes that should be converted to dates.
   * @returns {any[]}
   */
  getDates() {
    let defaults = [this.getCreatedAtColumn(), this.getUpdatedAtColumn()];

    return this.usesTimestamps()
      ? defaults
          .concat(this.dates)
          .filter((value, index, self) => self.indexOf(value) === index)
      : this.dates;
  }

  getCreatedAtColumn() {
    return (<typeof Model>this.constructor).CREATED_AT;
  }

  getUpdatedAtColumn() {
    return (<typeof Model>this.constructor).UPDATED_AT;
  }

  usesTimestamps() {
    return this.timestamps;
  }

  isDateCastable(key) {
    return this.hasCast(key, ["date", "datetime"]);
  }

  /**
   *
   * @param {string} key
   * @param {string[]|null} types
   */
  hasCast(key, types = null) {
    if (this.getCasts().hasOwnProperty(key)) {
      return types ? types.includes(this.getCastType(key)) : true;
    }

    return false;
  }

  /**
   *
   * @param {string} key
   * @returns {string}
   */
  getCastType(key) {
    if (this.isCustomDateTimeCast(this.getCasts()[key])) {
      return "custom_datetime";
    }

    if (this.isDecimalCast(this.getCasts()[key])) {
      return "decimal";
    }

    let cast = this.getCasts()[key];

    return cast.toLowerCase().trim();
  }

  isJsonCastable(key) {
    return this.hasCast(key, ["array", "json", "object", "collection"]);
  }

  /**
   * @param {string} key
   */
  fillJsonAttribute(key, value) {
    throw new Error("not yet implemented");
    /*
    let [$key, path] = key.split("->", 2);

    this.attributes[$key] = this.asJson(
      this.getArrayAttributeWithValue(path, $key, value)
    );

    return this;
    */
  }

  getArrayAttributeWithValue(path, key, value) {
    throw new Error("not yet implemented");
    /*
    return tap(this.getArrayAttributeByKey(key), function (array) use (path, value) {
      Arr.set($array, str_replace('->', '.', $path), $value);
    });
    */
  }

  getAttributeValue(key) {
    return this.transformModelValue(key, this.getAttributeFromArray(key));
  }

  transformModelValue(key, value) {
    // If the attribute has a get mutator, we will call that then return what
    // it returns as the value, which is useful for transforming values on
    // retrieval from the model to a form that is more useful for usage.
    if (this.hasGetMutator(key)) {
      return this.mutateAttribute(key, value);
    }

    // If the attribute exists within the cast array, we will convert it to
    // an appropriate native PHP type dependent upon the associated value
    // given with the key in the pair. Dayle made this comment line up.
    if (this.hasCast(key)) {
      return this.castAttribute(key, value);
    }

    // If the attribute is listed as a date, we will convert it to a DateTime
    // instance on retrieval, which makes it quite convenient to work with
    // date fields without having to create a mutator for each property.
    if (
      value !== null &&
      this.getDates().some((e) => e.toLowerCase() === key)
    ) {
      return this.asDateTime(value);
    }

    return value;
  }

  getAttributeFromArray(key) {
    return this.getAttributes()[key] ?? null;
  }

  /**
   * Create a new model instance that is existing.
   * @param {object} attributes
   * @param {Connection|null} connection
   */
  newFromBuilder(attributes = {}, connection = null) {
    let model = this.newInstance([], true);

    Promise.resolve(attributes).then(function (attributes) {
      //This is within a resolve, to handle async database results.

      model.setRawAttributes(attributes, true);

      model.setConnection(connection ? connection : this.getConnectionName());

      model.fireModelEvent("retrieved", false);
    });

    return model;
  }

  /**
   * Create a new instance of the given model.
   * @param {object} attributes
   * @param {boolean} exists
   * @returns {Model}
   */
  newInstance(attributes = {}, exists = false) {
    // This method just provides a convenient way for us to generate fresh model
    // instances of this current model. It is particularly useful during the
    // hydration of new objects via the Eloquent query builder instances.
    let model = new this.proxy.constructor(attributes);
    //let model = new Model(attributes);
    //let model = new Model(attributes);

    model.exists = exists;

    model.setConnection(this.getConnectionName());

    model.setTable(this.getTable());

    model.mergeCasts(this.casts);

    return model;
  }

  getConnectionName() {
    return this.connection;
  }

  /**
   * Set the connection associated with the model.
   * @param {string|null} name
   * @returns {this}
   */
  setConnection(name) {
    this.connection = name;

    return this;
  }

  /**
   * Set the table associated with the model.
   * @param {string} table
   * @returns {this}
   */
  setTable(table) {
    this.table = table;

    return this;
  }

  /**
   * Get the table associated with the model.
   * @returns {string}
   */
  getTable() {
    return this.table ?? Str.snake(Str.pluralStudly(this.constructor.name));
  }

  mergeCasts(casts) {
    this.casts = array_merge(this.casts, casts);
  }

  /**
   * Set the array of model attributes. No checking is done.
   * @param {object} attributes
   * @param {boolean} sync
   * @returns {this}
   */
  setRawAttributes(attributes, sync = false) {
    this.attributes = attributes;

    if (sync) {
      this.syncOriginal();
    }

    this.classCastCache = [];

    return this;
  }

  /**
   * Fire the given event for the model.
   * @param {string} event
   * @param {boolean} halt
   * @returns {*}
   */
  fireModelEvent(event, halt = true) {
    if (null === (<typeof Model>this.constructor).$dispatcher) {
      console.warn(
        `[\\Illuminate\\Database\\Eloquent\\Model][${this.constructor.name}]: No event dispather is defined.`
      );
      return true;
    }

    // First, we will get the proper method to call on the event dispatcher, and then we
    // will attempt to fire a custom, object based event for the given event. If that
    // returns a result we can return that result, or we'll call the string events.
    let method = halt ? "until" : "dispatch";

    let result = this.filterModelEventResults(
      this.fireCustomModelEvent(event, method)
    );

    if (result === false) {
      return false;
    }

    return !empty(result)
      ? result
      : (<typeof Model>this.constructor).$dispatcher[method](
          `eloquent.${event}: ` + this.constructor.name,
          this
        );
  }

  toJson(options = 0) {
    let json = json_encode(this.jsonSerialize(), options);

    if (0 !== json_last_error()) {
      console.warn(
        "Message passed to JsonEncodingException is not yet supported.\nSee https://github.com/kvz/locutus/blob/master/src/php/json/json_last_error.js"
      );
      throw JsonEncodingException.forModel(this, /*json_last_error_msg()*/ "");
    }

    return json;
  }

  jsonSerialize() {
    return this.toArray();
  }

  toJSON() {
    return this.jsonSerialize();
  }

  toArray() {
    return array_merge(this.attributesToArray(), this.relationsToArray());
  }

  attributesToArray() {
    let attributes;
    let mutatedAttributes;

    // If an attribute is a date, we will cast it to a string after converting it
    // to a DateTime / Carbon instance. This is so we will get some consistent
    // formatting while accessing attributes vs. arraying / JSONing a model.
    attributes = this.addDateAttributesToArray(
      (attributes = this.getArrayableAttributes())
    );

    attributes = this.addMutatedAttributesToArray(
      attributes,
      (mutatedAttributes = this.getMutatedAttributes())
    );

    // Next we will handle any casts that have been setup for this model and cast
    // the values to their appropriate type. If the attribute has a mutator we
    // will not perform the cast on those attributes to avoid any confusion.
    attributes = this.addCastAttributesToArray(attributes, mutatedAttributes);

    // Here we will grab all of the appended, calculated attributes to this model
    // as these attributes are not really in the attributes array, but are run
    // when we need to array or JSON the model for convenience to the coder.
    for (const key in this.getArrayableAppends()) {
      attributes[key] = this.mutateAttributeForArray(key, null);
    }

    return attributes;
  }

  getArrayableAttributes() {
    return this.getArrayableItems(this.getAttributes());
  }

  getArrayableItems(values) {
    if (count(this.getVisible()) > 0) {
      values = array_intersect_key(values, array_flip(this.getVisible()));
    }

    if (count(this.getHidden()) > 0) {
      values = array_diff_key(values, array_flip(this.getHidden()));
    }

    return values;
  }

  getVisible() {
    return this.visible;
  }

  getHidden() {
    return this.hidden;
  }

  addDateAttributesToArray(attributes) {
    for (const key in this.getDates()) {
      if (!isset(attributes[key])) {
        continue;
      }

      attributes[key] = this.serializeDate(this.asDateTime(attributes[key]));
    }

    return attributes;
  }

  getMutatedAttributes() {
    let $class = this.constructor.name;

    if (!isset((<typeof Model>this.constructor).$mutatorCache[$class])) {
      (<typeof Model>this.constructor).cacheMutatedAttributes($class);
    }

    return (<typeof Model>this.constructor).$mutatorCache[$class];
  }

  static cacheMutatedAttributes($class) {
    this.$mutatorCache[$class] = collect(this.getMutatorMethods($class))
      .map(function (match) {
        return lcfirst(this.$snakeAttributes ? Str.snake(match) : match);
      })
      .all();
  }

  addMutatedAttributesToArray(attributes, mutatedAttributes) {
    for (const key in mutatedAttributes) {
      // We want to spin through all the mutated attributes for this model and call
      // the mutator for the attribute. We cache off every mutated attributes so
      // we don't have to constantly check on attributes that actually change.
      if (!array_key_exists(key, attributes)) {
        continue;
      }

      // Next, we will call the mutator for this attribute so that we can get these
      // mutated attribute's actual values. After we finish mutating each of the
      // attributes we will return this final array of the mutated attributes.
      attributes[key] = this.mutateAttributeForArray(key, attributes[key]);
    }

    return attributes;
  }

  static getMutatorMethods() {
    console.warn(
      `[\\Illuminate\\Database\\Eloquent\\Model]: getMutatorMethods is not implemented`
    );
    return {};
    /*
    preg_match_all('/(?<=^|;)get([^;]+?)Attribute(;|$)/', implode(';', get_class_methods($class)), $matches);

    return $matches[1];
    */
  }

  addCastAttributesToArray(attributes, mutatedAttributes) {
    for (let [key, value] of Object.entries(this.getCasts())) {
      if (
        !array_key_exists(key, attributes) ||
        in_array(key, mutatedAttributes)
      ) {
        continue;
      }

      // Here we will cast the attribute. Then, if the cast is a date or datetime cast
      // then we will serialize the date for the array. This will convert the dates
      // to strings based on the date format specified for these Eloquent models.
      attributes[key] = this.castAttribute(key, attributes[key]);

      // If the attribute cast was a date or a datetime, we will serialize the date as
      // a string. This allows the developers to customize how dates are serialized
      // into an array without affecting how they are persisted into the storage.
      if (attributes[key] && (value === "date" || value === "datetime")) {
        attributes[key] = this.serializeDate(attributes[key]);
      }

      if (attributes[key] && this.isCustomDateTimeCast(value)) {
        attributes[key] = attributes[key].format(explode(":", value, 2)[1]);
      }
      /*
      if (attributes[key] && attributes[key] instanceof DateTimeInterface &&
          this.isClassCastable(key)) {
          attributes[key] = this.serializeDate(attributes[key]);
      }

      if (attributes[key] instanceof Arrayable) {
          attributes[key] = attributes[key].toArray();
      }
      */
    }

    return attributes;
  }

  getArrayableAppends() {
    if (!count(this.appends)) {
      return [];
    }

    return this.getArrayableItems(array_combine(this.appends, this.appends));
  }

  relationsToArray() {
    let attributes = [];
    let relation;

    for (let [key, value] of Object.entries(this.getArrayableRelations())) {
      // If the values implements the Arrayable interface we can just call this
      // toArray method on the instances which will convert both models and
      // collections to their proper array form and we'll set the values.
      /*if (value instanceof Arrayable) {
        relation = value.toArray();
      }

      // If the value is null, we'll still go ahead and set it in this list of
      // attributes since null is used to represent empty relationships if
      // if it a has one or belongs to type relationships on the models.
      else*/ if (
        is_null(value)
      ) {
        relation = value;
      }

      // If the relationships snake-casing is enabled, we will snake case this
      // key so that the relation attribute is snake cased in this returned
      // array to the developers, making this consistent with attributes.
      if ((<typeof Model>this.constructor).$snakeAttributes) {
        key = Str.snake(key);
      }

      // If the relation value has been set, we will set it on this attributes
      // list for returning. If it was not arrayable or null, we'll not set
      // the value on the array because it is some type of invalid value.
      if (isset(relation) || is_null(value)) {
        attributes[key] = relation;
      }

      relation = undefined;
    }

    return attributes;
  }

  getArrayableRelations() {
    return this.getArrayableItems(this.relations);
  }

  newQuery() {
    return this.registerGlobalScopes(this.newQueryWithoutScopes());
  }

  newQueryWithoutScopes() {
    return this.registerGlobalScopes(this.newModelQuery());
  }

  newModelQuery() {
    return this.newEloquentBuilder(this.newBaseQueryBuilder()).setModel(
      this.proxy
    );
  }

  newBaseQueryBuilder() {
    return this.getConnection().query();
  }

  getConnection() {
    return (<typeof Model>this.constructor).resolveConnection(
      this.getConnectionName()
    );
  }

  static resolveConnection(connection = null) {
    return this.$resolver.connection(connection);
  }

  /**
   * Perform any actions required before the model boots.
   */
  static booting() {
    //
  }

  /** Bootstrap the model and its traits. */
  static boot() {
    this.bootTraits();
  }

  static bootTraits() {
    let $class = this.name;

    let $booted = [];

    this.$traitInitializers[$class] = [];

    /*
    foreach (class_uses_recursive($class) as $trait) {
        $method = 'boot'.class_basename($trait);

        if (method_exists($class, $method) && ! in_array($method, $booted)) {
            forward_static_call([$class, $method]);

            $booted[] = $method;
        }

        if (method_exists($class, $method = 'initialize'.class_basename($trait))) {
            static::$traitInitializers[$class][] = $method;

            static::$traitInitializers[$class] = array_unique(
                static::$traitInitializers[$class]
            );
        }
    }
    */
  }

  /**
   * Perform any actions required after the model boots.
   */
  static booted() {
    //
  }

  static setConnectionResolver(resolver) {
    console.log("setConnectionResolver", this);
    this.$resolver = resolver;
  }

  newEloquentBuilder(query) {
    return new Builder(query);
  }

  registerGlobalScopes(builder) {
    for (let [identifier, scope] of Object.entries(this.getGlobalScopes())) {
      builder.withGlobalScope(identifier, scope);
    }

    return builder;
  }

  getGlobalScopes() {
    return Arr.get(
      (<typeof Model>this.constructor).$globalScopes,
      this.constructor.name,
      []
    );
  }

  newCollection(models = []) {
    return new Collection(models);
  }

  static setEventDispatcher($dispatcher) {
    this.$dispatcher = $dispatcher;
  }

  /**
   * Get the value indicating whether the IDs are incrementing.
   *
   * @return bool
   */
  public getIncrementing() {
    return this.incrementing;
  }

  /** Get the primary key for the model. */
  public getKeyName(): string {
    return this.primaryKey;
  }
}

type Class = { new (...args: any[]): any };

export class Model
  extends HasAttributes(
    HasEvents(
      HasGlobalScopes(
        HasRelationships(
          HasTimestamps(
            HidesAttributes(GuardsAttributes(ForwardsCalls(class {})))
          )
        )
      )
    )
  )
  implements
    Arrayable,
    //Array<any>,
    /*ArrayAccess,*/ Jsonable,
    JsonSerializable,
    QueueableEntity,
    UrlRoutable {
  proxy;

  /** The connection name for the model. */
  protected connection: string | null = null;

  /** The table associated with the model. */
  protected table: string = null;

  /** The primary key for the model. */
  protected primaryKey = "id";

  /** The "type" of the primary key ID. */
  protected keyType: string = "int";

  /** Indicates if the IDs are auto-incrementing. */
  public incrementing: boolean = true;

  /** The relations to eager load on every query. */
  protected $with: any[] = [];

  /** The relationship counts that should be eager loaded on every query. */
  protected $withCount: any[] = [];

  /** The number of models to return for pagination. */
  protected perPage: integer = 15;

  /** Indicates if the model exists. */
  public exists: boolean = false;

  /** Indicates if the model was inserted during the current request lifecycle. */
  public wasRecentlyCreated: boolean = false;

  /** The connection resolver instance. */
  protected static $resolver: ConnectionResolverInterface;

  /** The event dispatcher instance. */
  protected static $dispatcher: Dispatcher;

  /** The array of booted models. */
  protected static $booted: any[] = [];

  /** The array of trait initializers that will be called on each new instance. */
  protected static $traitInitializers: any[] = [];

  /** The array of global scopes on the model. */
  protected static $globalScopes: any[] = [];

  /** The list of models classes that should not be affected with touch. */
  protected static $ignoreOnTouch: any[] = [];

  /** The name of the "created at" column. */
  public static readonly CREATED_AT: string | null = "created_at";

  /** The name of the "updated at" column. */
  public static readonly UPDATED_AT: string | null = "updated_at";

  /** Create a new Eloquent model instance. */
  public constructor($attributes: any[] = []) {
    super();

    this.bootIfNotBooted();

    this.initializeTraits();

    this.syncOriginal();

    this.fill($attributes);
  }

  /** Check if the model needs to be booted and if so, do it. */
  protected bootIfNotBooted(): void {
    if (
      !isset((<typeof Model>this.constructor).$booted[this.constructor.name])
    ) {
      (<typeof Model>this.constructor).$booted[this.constructor.name] = true;

      this.fireModelEvent("booting", false);

      (<typeof Model>this.constructor).booting();
      (<typeof Model>this.constructor).boot();
      (<typeof Model>this.constructor).booted();

      this.fireModelEvent("booted", false);
    }
  }

  /** Perform any actions required before the model boots. */
  protected static booting(): void {
    //
  }

  /** Bootstrap the model and its traits. */
  protected static boot(): void {
    this.bootTraits();
  }

  /** Boot all of the bootable traits on the model. */
  protected static bootTraits(): void {
    const $class = this.name;

    const $booted = [];

    this.$traitInitializers[$class] = [];

    class_uses_recursive($class).forEach(($trait) => {
      let $method = "boot" + $trait.name;

      if (method_exists($class, $method) && !in_array($method, $booted)) {
        forward_static_call([$class, $method]);

        $booted.push($method);
      }

      if (method_exists($class, ($method = "initialize" + $trait.name))) {
        this.$traitInitializers[$class].push($method);

        this.$traitInitializers[$class] = array_unique(
          this.$traitInitializers[$class]
        );
      }
    });
  }

  /** Initialize any initializable traits on the model. */
  protected initializeTraits(): void {
    (<typeof Model>this.constructor).$traitInitializers[
      this.constructor.name
    ].forEach(($method) => {
      this[$method]();
    });
  }

  /** Perform any actions required after the model boots. */
  protected static booted(): void {
    //
  }

  /** Clear the list of booted models so they will be re-booted. */
  public static clearBootedModels(): void {
    this.$booted = [];

    this.$globalScopes = [];
  }

  /** Disables relationship model touching for the current class during given callback scope. */
  public static withoutTouching($callback: Function): void {
    this.withoutTouchingOn([this.name], $callback);
  }

  /** Disables relationship model touching for the given model classes during given callback scope. */
  public static withoutTouchingOn($models: any[], $callback: Function): void {
    this.$ignoreOnTouch = array_values(
      array_merge(this.$ignoreOnTouch, $models)
    );

    try {
      $callback();
    } finally {
      this.$ignoreOnTouch = array_values(
        array_diff(this.$ignoreOnTouch, $models)
      );
    }
  }

  /**
   * Determine if the given model is ignoring touches.
   *
   * @param  string|null  $class
   * @return bool
   */
  public static isIgnoringTouch($class: typeof Model | null = null): boolean {
    $class = $class || this;

    if (!get_class_vars($class)["timestamps"] || !$class.UPDATED_AT) {
      return true;
    }

    this.$ignoreOnTouch.forEach(($ignoredClass) => {
      if ($class === $ignoredClass || is_subclass_of($class, $ignoredClass)) {
        return true;
      }
    });

    return false;
  }

  /** Fill the model with an array of attributes. */
  public fill($attributes: any[]): this {
    const $totallyGuarded = this.totallyGuarded();

    for (let [$key, $value] of Object.entries(
      this.fillableFromArray($attributes)
    )) {
      $key = this.removeTableFromKey($key);

      // The developers may choose to place some attributes in the "fillable" array
      // which means only those attributes may be set through mass assignment to
      // the model, and all others will just get ignored for security reasons.
      if (this.isFillable($key)) {
        this.setAttribute($key, $value);
      } else if ($totallyGuarded) {
        throw new MassAssignmentException(
          sprintf(
            "Add [%s] to fillable property to allow mass assignment on [%s].",
            $key,
            this.constructor.name
          )
        );
      }
    }

    return this;
  }

  /** Fill the model with an array of attributes. Force mass assignment. */
  public forceFill($attributes: any[]): this {
    return (<typeof Model>this.constructor).unguarded(function () {
      return this.fill($attributes);
    });
  }

  /** Qualify the given column name by the model's table. */
  public qualifyColumn($column: string): string {
    if (Str.contains($column, ".")) {
      return $column;
    }

    return this.getTable() + "." + $column;
  }

  /**
   * Remove the table name from a given key.
   *
   * @deprecated This method is deprecated and will be removed in a future Laravel version.
   */
  protected removeTableFromKey($key: string): string {
    return $key;
  }

  /**
   * Create a new instance of the given model.
   *
   * @param  array  $attributes
   * @param  bool  $exists
   * @return static
   */
  public newInstance($attributes: any[] = [], $exists: boolean = false): this {
    // This method just provides a convenient way for us to generate fresh model
    // instances of this current model. It is particularly useful during the
    // hydration of new objects via the Eloquent query builder instances.
    const $model = new (<typeof Model>this.constructor)(<any[]>$attributes);

    $model.exists = $exists;

    $model.setConnection(this.getConnectionName());

    $model.setTable(this.getTable());

    $model.mergeCasts(this.casts);

    return $model as this;
  }

  /**
   * Create a new model instance that is existing.
   *
   * @param  array  $attributes
   * @param  string|null  $connection
   * @return static
   */
  public newFromBuilder(
    $attributes: any[] = [],
    $connection: string | null = null
  ): this {
    const $model = this.newInstance([], true);

    $model.setRawAttributes(<any[]>$attributes, true);

    $model.setConnection($connection || this.getConnectionName());

    $model.fireModelEvent("retrieved", false);

    return $model;
  }

  /**
   * Begin querying the model on a given connection.
   *
   * @param  string|null  $connection
   * @return \Illuminate\Database\Eloquent\Builder
   */
  public static on($connection: string | null = null): EloquentBuilder {
    // First we will just create a fresh instance of this model, and then we can set the
    // connection on the model so that it is used for the queries we execute, as well
    // as being set on every relation we retrieve without a custom connection name.
    const $instance = new (<typeof Model>this.constructor)();

    $instance.setConnection($connection);

    return $instance.newQuery();
  }

  /**
   * Begin querying the model on the write connection.
   *
   * @return \Illuminate\Database\Query\Builder
   */
  public static onWriteConnection(): QueryBuilder {
    return this.query().useWritePdo();
  }

  /**
   * Get all of the models from the database.
   *
   * @param  array|mixed  $columns
   * @return \Illuminate\Database\Eloquent\Collection|static[]
   */
  public static all(
    $columns: any[] | any = ["*"]
  ): EloquentCollection | this[] {
    return this.query().get(
      is_array($columns) ? $columns : Array.from(arguments)
    );
  }

  /** Begin querying a model with eager loading. */
  public static with($relations: any[] | string): EloquentBuilder {
    return this.query().with(
      is_string($relations) ? Array.from(arguments) : $relations
    );
  }

  /**
   * Eager load relations on the model.
   *
   * @param  array|string  $relations
   * @return $this
   */
  public load($relations: any[] | string): this {
    const $query = this.newQueryWithoutRelationships().with(
      is_string($relations) ? Array.from(arguments) : $relations
    );

    $query.eagerLoadRelations([this]);

    return this;
  }

  /**
   * Eager load relationships on the polymorphic relation of a model.
   *
   * @param  string  $relation
   * @param  array  $relations
   * @return $this
   */
  public loadMorph($relation: string, $relations: any[]): this {
    const $className = this[$relation].name;

    this[$relation].load($relations[$className] ?? []);

    return this;
  }

  /**
   * Eager load relations on the model if they are not already eager loaded.
   *
   * @param  array|string  $relations
   * @return $this
   */
  public loadMissing($relations: any[] | string): this {
    $relations = is_string($relations) ? Array.from(arguments) : $relations;

    this.newCollection([this]).loadMissing($relations);

    return this;
  }

  /**
   * Eager load relation counts on the model.
   *
   * @param  array|string  $relations
   * @return $this
   */
  public loadCount($relations: any[] | string): this {
    $relations = is_string($relations) ? Array.from(arguments) : $relations;

    this.newCollection([this]).loadCount($relations);

    return this;
  }

  /**
   * Eager load relationship counts on the polymorphic relation of a model.
   *
   * @param  string  $relation
   * @param  array  $relations
   * @return $this
   */
  public loadMorphCount($relation: string, $relations: any[]): this {
    const $className = this[$relation].name;

    this[$relation].loadCount($relations[$className] ?? []);

    return this;
  }

  /**
   * Increment a column's value by a given amount.
   *
   * @param  string  $column
   * @param  float|int  $amount
   * @param  array  $extra
   * @return int
   */
  protected increment(
    $column: string,
    $amount: float | integer = 1,
    $extra: any[] = []
  ): integer {
    return this.incrementOrDecrement($column, $amount, $extra, "increment");
  }

  /**
   * Decrement a column's value by a given amount.
   *
   * @param  string  $column
   * @param  float|int  $amount
   * @param  array  $extra
   * @return int
   */
  protected decrement(
    $column: string,
    $amount: float | integer = 1,
    $extra: any[] = []
  ): integer {
    return this.incrementOrDecrement($column, $amount, $extra, "decrement");
  }

  /**
   * Run the increment or decrement method on the model.
   *
   * @param  string  $column
   * @param  float|int  $amount
   * @param  array  $extra
   * @param  string  $method
   * @return int
   */
  protected incrementOrDecrement(
    $column: string,
    $amount: float | integer,
    $extra: any[],
    $method: string
  ): integer {
    const $query = this.newQueryWithoutRelationships();

    if (!this.exists) {
      return $query[$method]($column, $amount, $extra);
    }

    this.incrementOrDecrementAttributeValue($column, $amount, $extra, $method);

    return $query
      .where(this.getKeyName(), this.getKey())
      [$method]($column, $amount, $extra);
  }

  /** Increment the underlying attribute value and sync with original. */
  protected incrementOrDecrementAttributeValue(
    $column: string,
    $amount: float | integer,
    $extra: any[],
    $method: string
  ): void {
    this[$column] =
      this[$column] + ($method === "increment" ? $amount : $amount * -1);

    this.forceFill($extra);

    this.syncOriginalAttribute($column);
  }

  /** Update the model in the database. */
  public update($attributes: any[] = [], $options: any[] = []): boolean {
    if (!this.exists) {
      return false;
    }

    return this.fill($attributes).save($options);
  }

  /** Save the model and all of its relationships. */
  public push(): boolean {
    if (!this.save()) {
      return false;
    }

    // To sync all of the relationships to the database, we will simply spin through
    // the relationships and save each model via this "push" method, which allows
    // us to recurse into all of these nested relations for the model instance.
    this.relations.forEach(($models) => {
      $models = $models instanceof Collection ? $models.all() : [$models];

      array_filter($models).forEach(($model) => {
        if (!$model.push()) {
          return false;
        }
      });
    });

    return true;
  }

  /** Save the model to the database. */
  public save($options: any[] = []): boolean {
    this.mergeAttributesFromClassCasts();

    const $query = this.newModelQuery();

    // If the "saving" event returns false we'll bail out of the save and return
    // false, indicating that the save failed. This provides a chance for any
    // listeners to cancel save operations if validations fail or whatever.
    if (this.fireModelEvent("saving") === false) {
      return false;
    }

    let $saved;
    let $connection;
    // If the model already exists in the database we can just update our record
    // that is already in this database using the current IDs in this "where"
    // clause to only update this model. Otherwise, we'll just insert them.
    if (this.exists) {
      $saved = this.isDirty() ? this.performUpdate($query) : true;
    }

    // If the model is brand new, we'll insert it into our database and set the
    // ID attribute on the model to the value of the newly inserted row's ID
    // which is typically an auto-increment value managed by the database.
    else {
      $saved = this.performInsert($query);

      if (!this.getConnectionName() && ($connection = $query.getConnection())) {
        this.setConnection($connection.getName());
      }
    }

    // If the model is successfully saved, we need to do a few more things once
    // that is done. We will call the "saved" method here to run any actions
    // we need to happen after a model gets successfully saved right here.
    if ($saved) {
      this.finishSave($options);
    }

    return $saved;
  }

  /** Save the model to the database using transaction. */
  public saveOrFail($options: any[] = []): boolean {
    return this.getConnection().transaction(function () {
      return this.save($options);
    });
  }

  /** Perform any actions that are necessary after the model is saved. */
  protected finishSave($options: any[]): void {
    this.fireModelEvent("saved", false);

    if (this.isDirty() && ($options["touch"] ?? true)) {
      this.touchOwners();
    }

    this.syncOriginal();
  }

  /** Perform a model update operation. */
  protected performUpdate($query: EloquentBuilder): boolean {
    // If the updating event returns false, we will cancel the update operation so
    // developers can hook Validation systems into their models and cancel this
    // operation if the model does not pass validation. Otherwise, we update.
    if (this.fireModelEvent("updating") === false) {
      return false;
    }

    // First we need to create a fresh query instance and touch the creation and
    // update timestamp on the model which are maintained by us for developer
    // convenience. Then we will just continue saving the model instances.
    if (this.usesTimestamps()) {
      this.updateTimestamps();
    }

    // Once we have run the update operation, we will fire the "updated" event for
    // this model instance. This will allow developers to hook into these after
    // models are updated, giving them a chance to do any special processing.
    const $dirty = this.getDirty();

    if (count($dirty) > 0) {
      this.setKeysForSaveQuery($query).update($dirty);

      this.syncChanges();

      this.fireModelEvent("updated", false);
    }

    return true;
  }

  /** Set the keys for a save update query. */
  protected setKeysForSaveQuery($query: EloquentBuilder): EloquentBuilder {
    $query.where(this.getKeyName(), "=", this.getKeyForSaveQuery());

    return $query;
  }

  /** Get the primary key value for a save query. */
  protected getKeyForSaveQuery(): any {
    return this.original[this.getKeyName()] ?? this.getKey();
  }

  /**
   * Perform a model insert operation.
   *
   * @param  \Illuminate\Database\Eloquent\Builder  $query
   * @return bool
   */
  protected performInsert($query: EloquentBuilder) {
    if (this.fireModelEvent("creating") === false) {
      return false;
    }

    // First we'll need to create a fresh query instance and touch the creation and
    // update timestamps on this model, which are maintained by us for developer
    // convenience. After, we will just continue saving these model instances.
    if (this.usesTimestamps()) {
      this.updateTimestamps();
    }

    // If the model has an incrementing key, we can use the "insertGetId" method on
    // the query builder, which will give us back the final inserted ID for this
    // table from the database. Not all tables have to be incrementing though.
    const $attributes = this.getAttributes();

    if (this.getIncrementing()) {
      this.insertAndSetId($query, $attributes);
    }

    // If the table isn't incrementing we'll simply insert these attributes as they
    // are. These attribute arrays must contain an "id" column previously placed
    // there by the developer as the manually determined key for these models.
    else {
      if (empty($attributes)) {
        return true;
      }

      $query.insert($attributes);
    }

    // We will go ahead and set the exists property to true, so that it is set when
    // the created event is fired, just in case the developer tries to update it
    // during the event. This will allow them to do so and run an update here.
    this.exists = true;

    this.wasRecentlyCreated = true;

    this.fireModelEvent("created", false);

    return true;
  }

  /** Insert the given attributes and set the ID on the model. */
  protected insertAndSetId($query: EloquentBuilder, $attributes: any[]): void {
    let $keyName;
    const $id = $query.insertGetId($attributes, ($keyName = this.getKeyName()));

    this.setAttribute($keyName, $id);
  }

  /**
   * Destroy the models for the given IDs.
   *
   * @param  \Illuminate\Support\Collection|array|int|string  $ids
   * @return int
   */
  public static destroy($ids) {
    // We'll initialize a count here so we will return the total number of deletes
    // for the operation. The developers can then check this number as a boolean
    // type value or get this total count of records deleted for logging, etc.
    let $count = 0;

    if ($ids instanceof BaseCollection) {
      $ids = $ids.all();
    }

    $ids = is_array($ids) ? $ids : Array.from(arguments);

    let $instance;
    // We will actually pull the models from the database table and call delete on
    // each of them individually so that their events get fired properly with a
    // correct set of attributes in case the developers wants to check these.
    const $key = ($instance = new this()).getKeyName();

    $instance
      .whereIn($key, $ids)
      .get()
      .forEach(($model) => {
        if ($model.delete()) {
          $count++;
        }
      });

    return $count;
  }

  /** Delete the model from the database. */
  public delete(): boolean | null {
    this.mergeAttributesFromClassCasts();

    if (is_null(this.getKeyName())) {
      throw new Exception("No primary key defined on model.");
    }

    // If the model doesn't exist, there is nothing to delete so we'll just return
    // immediately and not do anything else. Otherwise, we will continue with a
    // deletion process on the model, firing the proper events, and so forth.
    if (!this.exists) {
      return;
    }

    if (this.fireModelEvent("deleting") === false) {
      return false;
    }

    // Here, we'll touch the owning models, verifying these timestamps get updated
    // for the models. This will allow any caching to get broken on the parents
    // by the timestamp. Then we will go ahead and delete the model instance.
    this.touchOwners();

    this.performDeleteOnModel();

    // Once the model has been deleted, we will fire off the deleted event so that
    // the developers may hook into post-delete operations. We will then return
    // a boolean true as the delete is presumably successful on the database.
    this.fireModelEvent("deleted", false);

    return true;
  }

  /**
   * Force a hard delete on a soft deleted model.
   *
   * This method protects developers from running forceDelete when trait is missing.
   */
  public forceDelete(): boolean | null {
    return this.delete();
  }

  /** Perform the actual delete query on this model instance. */
  protected performDeleteOnModel(): void {
    this.setKeysForSaveQuery(this.newModelQuery()).delete();

    this.exists = false;
  }

  /** Begin querying the model. */
  public static query(): EloquentBuilder {
    return new this().newQuery();
  }

  /** Get a new query builder for the model's table. */
  public newQuery(): EloquentBuilder {
    return this.registerGlobalScopes(this.newQueryWithoutScopes());
  }

  /** Get a new query builder that doesn't have any global scopes or eager loading. */
  public newModelQuery(): EloquentBuilder | this {
    return this.newEloquentBuilder(this.newBaseQueryBuilder()).setModel(this);
  }

  /** Get a new query builder with no relationships loaded. */
  public newQueryWithoutRelationships(): EloquentBuilder {
    return this.registerGlobalScopes(this.newModelQuery());
  }

  /** Register the global scopes for this builder instance. */
  public registerGlobalScopes($builder: EloquentBuilder): EloquentBuilder {
    for (const [$identifier, $scope] of Object.entries(
      this.getGlobalScopes()
    )) {
      $builder.withGlobalScope($identifier, $scope);
    }

    return $builder;
  }

  /** Get a new query builder that doesn't have any global scopes. */
  public newQueryWithoutScopes(): EloquentBuilder | this {
    return this.newModelQuery().with(this.$with).withCount(this.$withCount);
  }

  /**
   * Get a new query instance without a given scope.
   *
   * @param  \Illuminate\Database\Eloquent\Scope|string  $scope
   * @return \Illuminate\Database\Eloquent\Builder
   */
  public newQueryWithoutScope($scope) {
    return this.newQuery().withoutGlobalScope($scope);
  }

  /**
   * Get a new query to restore one or more models by their queueable IDs.
   *
   * @param  array|int  $ids
   * @return \Illuminate\Database\Eloquent\Builder
   */
  public newQueryForRestoration($ids) {
    return is_array($ids)
      ? this.newQueryWithoutScopes().whereIn(this.getQualifiedKeyName(), $ids)
      : this.newQueryWithoutScopes().whereKey($ids);
  }

  /**
   * Create a new Eloquent query builder for the model.
   *
   * @param  \Illuminate\Database\Query\Builder  $query
   * @return \Illuminate\Database\Eloquent\Builder|static
   */
  public newEloquentBuilder($query: QueryBuilder): EloquentBuilder | this {
    return new Builder($query);
  }

  /**
   * Get a new query builder instance for the connection.
   *
   * @return \Illuminate\Database\Query\Builder
   */
  protected newBaseQueryBuilder(): QueryBuilder {
    return this.getConnection().query();
  }

  /**
   * Create a new Eloquent Collection instance.
   *
   * @param  array  $models
   * @return \Illuminate\Database\Eloquent\Collection
   */
  public newCollection($models: any[] = []) {
    return new Collection($models);
  }

  /**
   * Create a new pivot model instance.
   *
   * @param  \Illuminate\Database\Eloquent\Model  $parent
   * @param  array  $attributes
   * @param  string  $table
   * @param  bool  $exists
   * @param  string|null  $using
   * @return \Illuminate\Database\Eloquent\Relations\Pivot
   */
  public newPivot(
    $parent: Model,
    $attributes: any[],
    $table: string,
    $exists: boolean,
    $using: typeof Model | null = null
  ): Pivot {
    return $using
      ? $using.fromRawAttributes($parent, $attributes, $table, $exists)
      : Pivot.fromAttributes($parent, $attributes, $table, $exists);
  }

  /**
   * Determine if the model has a given scope.
   *
   * @param  string  $scope
   * @return bool
   */
  public hasNamedScope($scope) {
    return method_exists(this, "scope" + ucfirst($scope));
  }

  /**
   * Apply the given named scope if possible.
   *
   * @param  string  $scope
   * @param  array  $parameters
   * @return mixed
   */
  public callNamedScope($scope: string, $parameters: any[] = []) {
    return this["scope" + ucfirst($scope)](...$parameters);
  }

  /**
   * Convert the model instance to an array.
   *
   * @return array
   */
  public toArray() {
    return array_merge(this.attributesToArray(), this.relationsToArray());
  }

  /**
   * Convert the model instance to JSON.
   *
   * @param  int  $options
   * @return string
   *
   * @throws \Illuminate\Database\Eloquent\JsonEncodingException
   */
  public toJson(): string {
    const $json = json_encode(this.jsonSerialize());

    if (JSON_ERROR_NONE !== json_last_error()) {
      throw JsonEncodingException.forModel(this, json_last_error_msg());
    }

    return $json;
  }

  /**
   * Convert the object into something JSON serializable.
   *
   * @return array
   */
  public jsonSerialize() {
    return this.toArray();
  }

  public toJSON() {
    return this.jsonSerialize();
  }

  /** Reload a fresh model instance from the database. */
  public fresh($with: any[] | string = []): this | null {
    if (!this.exists) {
      return;
    }

    return (<typeof Model>this.constructor)
      .newQueryWithoutScopes()
      .with(is_string($with) ? Array.from(arguments) : $with)
      .where(this.getKeyName(), this.getKey())
      .first();
  }

  /** Reload the current model instance with fresh attributes from the database. */
  public refresh(): this {
    if (!this.exists) {
      return this;
    }

    this.setRawAttributes(
      (<typeof Model>this.constructor)
        .newQueryWithoutScopes()
        .findOrFail(this.getKey()).attributes
    );

    this.load(
      collect(this.relations)
        .reject(function ($relation) {
          return (
            $relation instanceof Pivot ||
            (is_object($relation) &&
              in_array(AsPivot.name, class_uses_recursive($relation), true))
          );
        })
        .keys()
        .all()
    );

    this.syncOriginal();

    return this;
  }

  /** Clone the model into a new, non-existing instance. */
  public replicate($except: any[] | null = null): this {
    const $defaults = [
      this.getKeyName(),
      this.getCreatedAtColumn(),
      this.getUpdatedAtColumn()
    ];

    const $attributes = Arr.except(
      this.getAttributes(),
      $except ? array_unique(array_merge($except, $defaults)) : $defaults
    );

    return tap(new (<typeof Model>this.constructor)(), function ($instance) {
      $instance.setRawAttributes($attributes);

      $instance.setRelations(this.relations);

      $instance.fireModelEvent("replicating", false);
    });
  }

  /** Determine if two models have the same ID and belong to the same table. */
  public is($model: Model | null): boolean {
    return (
      !is_null($model) &&
      this.getKey() === $model.getKey() &&
      this.getTable() === $model.getTable() &&
      this.getConnectionName() === $model.getConnectionName()
    );
  }

  /** Determine if two models are not the same. */
  public isNot($model: Model | null): boolean {
    return !this.is($model);
  }

  /**
   * Get the database connection for the model.
   *
   * @return \Illuminate\Database\Connection
   */
  public getConnection() {
    return (<typeof Model>this.constructor).resolveConnection(
      this.getConnectionName()
    );
  }

  /** Get the current connection name for the model. */
  public getConnectionName(): string | null {
    return this.connection;
  }

  /** Set the connection associated with the model. */
  public setConnection($name: string | null): this {
    this.connection = $name;

    return this;
  }

  /**
   * Resolve a connection instance.
   *
   * @param  string|null  $connection
   * @return \Illuminate\Database\Connection
   */
  public static resolveConnection($connection: string | null = null) {
    return this.$resolver.connection($connection);
  }

  /**
   * Get the connection resolver instance.
   *
   * @return \Illuminate\Database\ConnectionResolverInterface
   */
  public static getConnectionResolver(): ConnectionResolverInterface {
    return this.$resolver;
  }

  /**
   * Set the connection resolver instance.
   *
   * @param  \Illuminate\Database\ConnectionResolverInterface  $resolver
   * @return void
   */
  public static setConnectionResolver($resolver: Resolver): void {
    this.$resolver = $resolver;
  }

  /** Unset the connection resolver for models. */
  public static unsetConnectionResolver(): void {
    this.$resolver = null;
  }

  /** Get the table associated with the model. */
  public getTable(): string {
    return this.table ?? Str.snake(Str.pluralStudly(this.constructor.name));
  }

  /** Set the table associated with the model. */
  public setTable($table: string): this {
    this.table = $table;

    return this;
  }

  /** Get the primary key for the model. */
  public getKeyName(): string {
    return this.primaryKey;
  }

  /** Set the primary key for the model. */
  public setKeyName($key: string): this {
    this.primaryKey = $key;

    return this;
  }

  /** Get the table qualified key name. */
  public getQualifiedKeyName(): string {
    return this.qualifyColumn(this.getKeyName());
  }

  /** Get the auto-incrementing key type. */
  public getKeyType(): string {
    return this.keyType;
  }

  /** Set the data type for the primary key. */
  public setKeyType($type: string): this {
    this.keyType = $type;

    return this;
  }

  /** Get the value indicating whether the IDs are incrementing. */
  public getIncrementing(): boolean {
    return this.incrementing;
  }

  /** Set whether IDs are incrementing. */
  public setIncrementing($value: boolean): this {
    this.incrementing = $value;

    return this;
  }

  /** Get the value of the model's primary key. */
  public getKey(): any {
    return this.getAttribute(this.getKeyName());
  }

  /** Get the queueable identity for the entity. */
  public getQueueableId(): any {
    return this.getKey();
  }

  /** Get the queueable relationships for the entity. */
  public getQueueableRelations(): any[] {
    const $relations = [];

    for (const [$key, $relation] of Object.entries(this.getRelations())) {
      if (!method_exists(this, $key)) {
        continue;
      }

      $relations.push($key);

      if ($relation instanceof QueueableCollection) {
        $relation.getQueueableRelations().forEach(($collectionValue) => {
          $relations.push($key + "." + $collectionValue);
        });
      }

      if ($relation instanceof QueueableEntity) {
        for (const [$entityKey, $entityValue] of Object.entries(
          $relation.getQueueableRelations()
        )) {
          $relations.push($key + "." + $entityValue);
        }
      }
    }

    return array_unique($relations);
  }

  /** Get the queueable connection for the entity. */
  public getQueueableConnection(): string | null {
    return this.getConnectionName();
  }

  /** Get the value of the model's route key. */
  public getRouteKey(): any {
    return this.getAttribute(this.getRouteKeyName());
  }

  /**
   * Get the route key for the model.
   *
   * @return string
   */
  public getRouteKeyName() {
    return this.getKeyName();
  }

  /**
   * Retrieve the model for a bound value.
   *
   * @param  mixed  $value
   * @param  string|null  $field
   * @return \Illuminate\Database\Eloquent\Model|null
   */
  public resolveRouteBinding($value, $field = null) {
    return this.where($field ?? this.getRouteKeyName(), $value).first();
  }

  /**
   * Retrieve the child model for a bound value.
   *
   * @param  string  $childType
   * @param  mixed  $value
   * @param  string|null  $field
   * @return \Illuminate\Database\Eloquent\Model|null
   */
  public resolveChildRouteBinding($childType, $value, $field): Model | null {
    const $relationship = this[Str.plural(Str.camel($childType))]();

    $field = $field || $relationship.getRelated().getRouteKeyName();

    if (
      $relationship instanceof HasManyThrough ||
      $relationship instanceof BelongsToMany
    ) {
      return $relationship
        .where($relationship.getRelated().getTable() + "." + $field, $value)
        .first();
    } else {
      return $relationship.where($field, $value).first();
    }
  }

  /** Get the default foreign key name for the model. */
  public getForeignKey(): string {
    return Str.snake(this.constructor.name) + "_" + this.getKeyName();
  }

  /** Get the number of models to return per page. */
  public getPerPage(): integer {
    return this.perPage;
  }

  /** Set the number of models to return per page. */
  public setPerPage($perPage: integer): this {
    this.perPage = $perPage;

    return this;
  }

  /**
   * Dynamically retrieve attributes on the model.
   *
   * @param  string  $key
   * @return mixed
   */
  public __get($key) {
    return this.getAttribute($key);
  }

  /**
   * Dynamically set attributes on the model.
   *
   * @param  string  $key
   * @param  mixed  $value
   * @return void
   */
  public __set($key, $value) {
    this.setAttribute($key, $value);
  }

  /**
   * Determine if the given attribute exists.
   *
   * @param  mixed  $offset
   * @return bool
   */
  public offsetExists($offset) {
    return !is_null(this.getAttribute($offset));
  }

  /**
   * Get the value for a given offset.
   *
   * @param  mixed  $offset
   * @return mixed
   */
  public offsetGet($offset) {
    return this.getAttribute($offset);
  }

  /**
   * Set the value for a given offset.
   *
   * @param  mixed  $offset
   * @param  mixed  $value
   * @return void
   */
  public offsetSet($offset, $value) {
    this.setAttribute($offset, $value);
  }

  /**
   * Unset the value for a given offset.
   *
   * @param  mixed  $offset
   * @return void
   */
  public offsetUnset($offset) {
    delete this.attributes[$offset];
    delete this.relations[$offset];
  }

  /**
   * Determine if an attribute or relation exists on the model.
   *
   * @param  string  $key
   * @return bool
   */
  public __isset($key) {
    return this.offsetExists($key);
  }

  /**
   * Unset an attribute on the model.
   *
   * @param  string  $key
   * @return void
   */
  public __unset($key) {
    this.offsetUnset($key);
  }

  /**
   * Handle dynamic method calls into the model.
   *
   * @param  string  $method
   * @param  array  $parameters
   * @return mixed
   */
  public __call($method, $parameters) {
    if (in_array($method, ["increment", "decrement"])) {
      return this[$method](...$parameters);
    }

    let $resolver: Function;
    if (
      ($resolver =
        (<typeof Model>this.constructor).$relationResolvers[
          this.constructor.name
        ][$method] ?? null)
    ) {
      return $resolver(this);
    }

    return this.forwardCallTo(this.newQuery(), $method, $parameters);
  }

  /**
   * Handle dynamic static method calls into the model.
   *
   * @param  string  $method
   * @param  array  $parameters
   * @return mixed
   */
  public static __callStatic($method, $parameters) {
    return new this()[$method](...$parameters);
  }

  /** Convert the model to its string representation. */
  public __toString(): string {
    return this.toJson();
  }

  /** Prepare the object for serialization. */
  public __sleep(): any[] {
    throw new Error("not implemented");
    /*
        this.mergeAttributesFromClassCasts();

        this.classCastCache = [];

        return array_keys(get_object_vars(this));
      */
  }

  /**
   * When a model is being unserialized, check if it needs to be booted.
   *
   * @return void
   */
  public __wakeup() {
    this.bootIfNotBooted();
  }
}

// we need this line to use "database"
//Model.$resolver = new DatabaseManager();
//Model.$resolver = new Manager();

type Constructor<T = {}> = new (...args: any[]) => T;
//type Constructor<T> = { new (...args: any[]): T } // https://stackoverflow.com/a/42768627

export function ProxyIt<Type extends Constructor>($class: Type) {
  let proxy = new Proxy($class, {
    get: function (Class, property) {
      if (Class.hasOwnProperty(property) || typeof property === "symbol") {
        return Class[property]; //normal behavior
      } else {
        console.log("Proxy.get:", property, Class[property]);
      }

      // __callStatic
      const instance = new Class();
      property = instance[property];
      return typeof property === "function"
        ? (<Function>property).bind(instance)
        : property;
    }
  });

  proxy.toString = () => $class.toString();

  return proxy;
}
/*
export class Model extends HasAttributes(
  HasEvents(
    HasGlobalScopes(
      HasRelationships(
        HasTimestamps(HidesAttributes(GuardsAttributes(ForwardsCalls(_Model2))))
      )
    )
  )
) {}
*/

export default ProxyIt(Model);

//export default ProxyIt(Model);
