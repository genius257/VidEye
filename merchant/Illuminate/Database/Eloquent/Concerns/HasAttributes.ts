import {
  array_combine,
  array_diff_key,
  array_flip,
  array_intersect_key,
  array_key_exists,
  array_map,
  array_merge,
  array_unique,
  count,
  in_array
} from "locutus/php/array";
import { json_decode, json_encode } from "locutus/php/json";
import {
  explode,
  implode,
  lcfirst,
  number_format,
  sprintf,
  strcmp,
  strncmp,
  strpos,
  str_replace
} from "locutus/php/strings";
import {
  empty,
  isset,
  is_array,
  is_null,
  is_numeric,
  is_object,
  is_string
} from "locutus/php/var";
import Arr from "../../../Support/Arr";
import { collect } from "../../../Support/helpers";
import Str from "../../../Support/Str";
import DateTimeInterface from "../../../../PHP/DateTimeInterface";
import Arrayable, {
  isInstanceofArrayable
} from "../../../Contracts/Support/Arrayable";
import { abs } from "locutus/php/math";
import LogicException from "../../../../PHP/Exceptions/LogicException";
import { method_exists } from "../../../../PHP/helpers";
import { Model } from "../Model";

type Constructor<T = {}> = new (...args: any[]) => T;

export default function HasAttributes<TBase extends Constructor>(Class: TBase) {
  return class HasAttributes extends Class {
    /** The model's attributes. */
    protected attributes = {};
    /** The model attribute's original state. */
    protected original = {};
    /** The changed model attributes. */
    protected changes = {};
    /** The attributes that should be cast. */
    protected casts = {};
    /** The attributes that have been cast using custom classes. */
    protected classCastCache = {};
    /** The built-in, primitive cast types supported by Eloquent. */
    protected static $primitiveCastTypes = [
      "array",
      "bool",
      "boolean",
      "collection",
      "custom_datetime",
      "date",
      "datetime",
      "decimal",
      "double",
      "float",
      "int",
      "integer",
      "json",
      "object",
      "real",
      "string",
      "timestamp"
    ];
    /** The attributes that should be mutated to dates. */
    protected dates = [];
    /** The storage format of the model's date columns. */
    protected dateFormat: string;
    /** The accessors to append to the model's array form. */
    protected appends = [];
    /** Indicates whether attributes are snake cased on arrays. */
    public static $snakeAttributes = true;
    /** The cache of the mutated attributes for each class. */
    protected static $mutatorCache = [];

    /** Convert the model's attributes to an array. */
    public attributesToArray() {
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

    /** Add the date attributes to the attributes array. */
    protected addDateAttributesToArray(attributes) {
      for (const key in this.getDates()) {
        if (!isset(attributes[key])) {
          continue;
        }

        attributes[key] = this.serializeDate(this.asDateTime(attributes[key]));
      }

      return attributes;
    }

    /** Add the mutated attributes to the attributes array. */
    protected addMutatedAttributesToArray(attributes, mutatedAttributes) {
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

    /** Add the casted attributes to the attributes array. */
    protected addCastAttributesToArray(attributes, mutatedAttributes) {
      for (const [key, value] of Object.entries(this.getCasts())) {
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

        if (
          attributes[key] &&
          attributes[key] instanceof DateTimeInterface &&
          this.isClassCastable(key)
        ) {
          attributes[key] = this.serializeDate(attributes[key]);
        }

        if (isInstanceofArrayable(attributes[key])) {
          attributes[key] = (attributes[key] as Arrayable).toArray();
        }
      }

      return attributes;
    }

    /** Get an attribute array of all arrayable attributes. */
    protected getArrayableAttributes() {
      return this.getArrayableItems(this.getAttributes());
    }

    /** Get all of the appendable values that are arrayable. */
    protected getArrayableAppends() {
      if (!count(this.appends)) {
        return [];
      }

      return this.getArrayableItems(array_combine(this.appends, this.appends));
    }

    /** Get the model's relationships in array form. */
    public relationsToArray() {
      const $attributes = [];
      let $relation;

      for (let [key, value] of Object.entries(this.getArrayableRelations())) {
        // If the values implements the Arrayable interface we can just call this
        // toArray method on the instances which will convert both models and
        // collections to their proper array form and we'll set the values.
        if (isInstanceofArrayable(value)) {
          $relation = (value as Arrayable).toArray();
        }

        // If the value is null, we'll still go ahead and set it in this list of
        // attributes since null is used to represent empty relationships if
        // if it a has one or belongs to type relationships on the models.
        else if (is_null(value)) {
          $relation = value;
        }

        // If the relationships snake-casing is enabled, we will snake case this
        // key so that the relation attribute is snake cased in this returned
        // array to the developers, making this consistent with attributes.
        if ((<typeof HasAttributes>this.constructor).$snakeAttributes) {
          key = Str.snake(key);
        }

        // If the relation value has been set, we will set it on this attributes
        // list for returning. If it was not arrayable or null, we'll not set
        // the value on the array because it is some type of invalid value.
        if (isset($relation) || is_null(value)) {
          $attributes[key] = $relation;
        }

        // delete $relation;
      }

      return $attributes;
    }

    /** Get an attribute array of all arrayable relations. */
    protected getArrayableRelations() {
      return this.getArrayableItems((<HasRelations>this).relations);
    }

    /** Get an attribute array of all arrayable values. */
    protected getArrayableItems($values) {
      if (count(this.getVisible()) > 0) {
        $values = array_intersect_key($values, array_flip(this.getVisible()));
      }

      if (count(this.getHidden()) > 0) {
        $values = array_diff_key($values, array_flip(this.getHidden()));
      }

      return $values;
    }

    /** Get an attribute from the model. */
    public getAttribute($key) {
      if (!$key) {
        return;
      }

      // If the attribute exists in the attribute array or has a "get" mutator we will
      // get the attribute's value. Otherwise, we will proceed as if the developers
      // are asking for a relationship's value. This covers both types of values.
      if (
        array_key_exists($key, this.attributes) ||
        array_key_exists($key, this.casts) ||
        this.hasGetMutator($key) ||
        this.isClassCastable($key)
      ) {
        return this.getAttributeValue($key);
      }

      // Here we will determine if the model base class itself contains this given key
      // since we don't want to treat any of those methods as relationships because
      // they are all intended as helper methods and none of these are relations.
      if (method_exists(<typeof HasAttributes>this.constructor, $key)) {
        return;
      }

      return this.getRelationValue($key);
    }

    /** Get a plain attribute (not a relationship). */
    public getAttributeValue($key) {
      return this.transformModelValue($key, this.getAttributeFromArray($key));
    }

    /** Get an attribute from the $attributes array. */
    protected getAttributeFromArray($key) {
      return this.getAttributes()[$key] ?? null;
    }

    /** Get a relationship. */
    public getRelationValue($key) {
      // If the key already exists in the relationships array, it just means the
      // relationship has already been loaded, so we'll just return it out of
      // here because there is no need to query within the relations twice.
      if (this.relationLoaded($key)) {
        return (<HasRelations>this).relations[$key];
      }

      // If the "attribute" exists as a method on the model, we will just assume
      // it is a relationship and will load and return results from the query
      // and hydrate the relationship's value on the "relationships" array.
      if (
        method_exists(this, $key) ||
        ((<typeof HasAttributes>this.constructor).$relationResolvers[
          get_class(this)
        ][$key] ??
          null)
      ) {
        return this.getRelationshipFromMethod($key);
      }
    }

    /** Get a relationship value from a method. */
    protected getRelationshipFromMethod($method) {
      const $relation = this[$method]();

      if (!($relation instanceof Relation)) {
        if (is_null($relation)) {
          throw new LogicException(
            sprintf(
              '%s::%s must return a relationship instance, but "null" was returned. Was the "return" keyword used?',
              (<typeof HasAttributes>this.constructor).name,
              $method
            )
          );
        }

        throw new LogicException(
          sprintf(
            "%s::%s must return a relationship instance.",
            (<typeof HasAttributes>this.constructor).name,
            $method
          )
        );
      }

      return tap($relation.getResults(), function ($results) {
        this.setRelation($method, $results);
      });
    }

    /** Determine if a get mutator exists for an attribute. */
    public hasGetMutator($key) {
      return method_exists(this, "get" + Str.studly($key) + "Attribute");
    }

    /** Get the value of an attribute using its mutator. */
    protected mutateAttribute($key, $value) {
      return this["get" + Str.studly($key) + "Attribute"]($value);
    }

    /** Get the value of an attribute using its mutator for array conversion. */
    protected mutateAttributeForArray($key, $value) {
      $value = this.isClassCastable($key)
        ? this.getClassCastableAttributeValue($key, $value)
        : this.mutateAttribute($key, $value);

      return isInstanceofArrayable($value)
        ? ($value as Arrayable).toArray()
        : $value;
    }

    /** Merge new casts with existing casts on the model. */
    public mergeCasts($casts) {
      this.casts = array_merge(this.casts, $casts);
    }

    /** Cast an attribute to a native PHP type. */
    protected castAttribute($key, $value) {
      const $castType = this.getCastType($key);

      if (
        is_null($value) &&
        in_array(
          $castType,
          (<typeof HasAttributes>this.constructor).$primitiveCastTypes
        )
      ) {
        return $value;
      }

      switch ($castType) {
        case "int":
        case "integer":
          return <number>$value;
        case "real":
        case "float":
        case "double":
          return this.fromFloat($value);
        case "decimal":
          return this.asDecimal(
            $value,
            explode(":", this.getCasts()[$key], 2)[1]
          );
        case "string":
          return <string>$value;
        case "bool":
        case "boolean":
          return <boolean>$value;
        case "object":
          return this.fromJson($value, true);
        case "array":
        case "json":
          return this.fromJson($value);
        case "collection":
          return new BaseCollection(this.fromJson($value));
        case "date":
          return this.asDate($value);
        case "datetime":
        case "custom_datetime":
          return this.asDateTime($value);
        case "timestamp":
          return this.asTimestamp($value);
      }

      if (this.isClassCastable($key)) {
        return this.getClassCastableAttributeValue($key, $value);
      }

      return $value;
    }

    /** Cast the given attribute using a custom cast class. */
    protected getClassCastableAttributeValue($key, $value) {
      if (isset(this.classCastCache[$key])) {
        return this.classCastCache[$key];
      } else {
        const $caster = this.resolveCasterClass($key);

        $value =
          $caster instanceof CastsInboundAttributes
            ? $value
            : $caster.get(this, $key, $value, this.attributes);

        if ($caster instanceof CastsInboundAttributes || !is_object($value)) {
          delete this.classCastCache[$key];
        } else {
          this.classCastCache[$key] = $value;
        }

        return $value;
      }
    }

    /** Get the type of cast for a model attribute. */
    protected getCastType($key) {
      if (this.isCustomDateTimeCast(this.getCasts()[$key])) {
        return "custom_datetime";
      }

      if (this.isDecimalCast(this.getCasts()[$key])) {
        return "decimal";
      }

      return trim(strtolower(this.getCasts()[$key]));
    }

    /** Determine if the cast type is a custom date time cast. */
    protected isCustomDateTimeCast($cast) {
      return (
        strncmp($cast, "date:", 5) === 0 || strncmp($cast, "datetime:", 9) === 0
      );
    }

    /** Determine if the cast type is a decimal cast. */
    protected isDecimalCast($cast) {
      return strncmp($cast, "decimal:", 8) === 0;
    }

    /** Set a given attribute on the model. */
    public setAttribute($key, $value) {
      // First we will check for the presence of a mutator for the set operation
      // which simply lets the developers tweak the attribute as it is set on
      // the model, such as "json_encoding" an listing of data for storage.
      if (this.hasSetMutator($key)) {
        return this.setMutatedAttributeValue($key, $value);
      }

      // If an attribute is listed as a "date", we'll convert it from a DateTime
      // instance into a form proper for storage on the database tables using
      // the connection grammar's date format. We will auto set the values.
      else if ($value && this.isDateAttribute($key)) {
        $value = this.fromDateTime($value);
      }

      if (this.isClassCastable($key)) {
        this.setClassCastableAttribute($key, $value);

        return this;
      }

      if (this.isJsonCastable($key) && !is_null($value)) {
        $value = this.castAttributeAsJson($key, $value);
      }

      // If this attribute contains a JSON ., we'll set the proper value in the
      // attribute's underlying array. This takes care of properly nesting an
      // attribute in the array's value in the case of deeply nested items.
      if (Str.contains($key, ".")) {
        return this.fillJsonAttribute($key, $value);
      }

      this.attributes[$key] = $value;

      return this;
    }

    /** Determine if a set mutator exists for an attribute. */
    public hasSetMutator($key) {
      return typeof this["set" + Str.studly($key) + "Attribute"] === "function";
    }

    /** Set the value of an attribute using its mutator. */
    protected setMutatedAttributeValue($key, $value) {
      return this["set" + Str.studly($key) + "Attribute"]($value);
    }

    /** Determine if the given attribute is a date or date castable. */
    protected isDateAttribute($key) {
      return in_array($key, this.getDates(), true) || this.isDateCastable($key);
    }

    /** Set a given JSON attribute on the model. */
    public fillJsonAttribute(key, value) {
      var [key, path] = explode(".", key, 2);

      this.attributes[key] = this.asJson(
        this.getArrayAttributeWithValue(path, key, value)
      );

      return this;
    }

    /** Set the value of a class castable attribute. */
    protected setClassCastableAttribute($key, $value) {
      const $caster = this.resolveCasterClass($key);

      if (is_null($value)) {
        this.attributes = array_merge(
          this.attributes,
          array_map(function () {},
          this.normalizeCastClassResponse($key, $caster.set(this, $key, this[$key], this.attributes)))
        );
      } else {
        this.attributes = array_merge(
          this.attributes,
          this.normalizeCastClassResponse(
            $key,
            $caster.set(this, $key, $value, this.attributes)
          )
        );
      }

      if ($caster instanceof CastsInboundAttributes || !is_object($value)) {
        delete this.classCastCache[$key];
      } else {
        this.classCastCache[$key] = $value;
      }
    }

    /** Get an array attribute with the given key and value set. */
    protected getArrayAttributeWithValue($path, $key, $value) {
      return tap(this.getArrayAttributeByKey($key), function ($array) {
        Arr.set($array, str_replace(".", ".", $path), $value);
      });
    }

    /** Get an array attribute or return an empty array if it is not set. */
    protected getArrayAttributeByKey($key) {
      return isset(this.attributes[$key])
        ? this.fromJson(this.attributes[$key])
        : [];
    }

    /** Cast the given attribute to JSON. */
    protected castAttributeAsJson($key, $value) {
      $value = this.asJson($value);

      if ($value === false) {
        throw JsonEncodingException.forAttribute(
          this,
          $key,
          json_last_error_msg()
        );
      }

      return $value;
    }

    /** Encode the given value as JSON. */
    protected asJson($value) {
      return json_encode($value);
    }

    /** Decode the given JSON back into an array or object. */
    public fromJson($value, $asObject = false) {
      return json_decode($value, !$asObject);
    }

    /** Decode the given float. */
    public fromFloat($value) {
      switch (<string>$value) {
        case "Infinity":
          return Infinity;
        case "-Infinity":
          return -Infinity;
        case "NaN":
          return NaN;
        default:
          return <number>$value;
      }
    }

    /** Return a decimal as string. */
    protected asDecimal($value, $decimals) {
      return number_format($value, $decimals, ".", "");
    }

    /** Return a timestamp as DateTime object with time set to 00:00:00. */
    protected asDate($value) {
      return this.asDateTime($value).startOfDay();
    }

    /** Return a timestamp as DateTime object. */
    protected asDateTime($value) {
      // If this value is already a Carbon instance, we shall just return it as is.
      // This prevents us having to re-instantiate a Carbon instance when we know
      // it already is one, which wouldn't be fulfilled by the DateTime check.
      if ($value instanceof CarbonInterface) {
        return Date.instance($value);
      }

      // If the value is already a DateTime instance, we will just skip the rest of
      // these checks since they will be a waste of time, and hinder performance
      // when checking the field. We will just return the DateTime right away.
      if ($value instanceof DateTimeInterface) {
        return Date.parse($value.format("Y-m-d H:i:s.u"), $value.getTimezone());
      }

      // If this value is an integer, we will assume it is a UNIX timestamp's value
      // and format a Carbon object from this timestamp. This allows flexibility
      // when defining your date fields as they might be UNIX timestamps here.
      if (is_numeric($value)) {
        return Date.createFromTimestamp($value);
      }

      // If the value is in simply year, month, day format, we will instantiate the
      // Carbon instances from that format. Again, this provides for simple date
      // fields on the database, while still supporting Carbonized conversion.
      if (this.isStandardDateFormat($value)) {
        return Date.instance(
          Carbon.createFromFormat("Y-m-d", $value).startOfDay()
        );
      }

      const $format = this.getDateFormat();

      // Finally, we will just assume this date is in the format used by default on
      // the database connection and use that format to create the Carbon object
      // that is returned back out to the developers after we convert it here.
      if (Date.hasFormat($value, $format)) {
        return Date.createFromFormat($format, $value);
      }

      return Date.parse($value);
    }

    /**
     * Determine if the given value is a standard date format.
     *
     * @param  string  $value
     * @return bool
     */
    protected isStandardDateFormat($value) {
      return preg_match("/^(d{4})-(d{1,2})-(d{1,2})$/", $value);
    }

    /**
     * Convert a DateTime to a storable string.
     *
     * @param  mixed  $value
     * @return string|null
     */
    public fromDateTime($value) {
      return empty($value)
        ? $value
        : this.asDateTime($value).format(this.getDateFormat());
    }

    /**
     * Return a timestamp as unix timestamp.
     *
     * @param  mixed  $value
     * @return int
     */
    protected asTimestamp($value) {
      return this.asDateTime($value).getTimestamp();
    }

    /**
     * Prepare a date for array / JSON serialization.
     *
     * @param  \DateTimeInterface  $date
     * @return string
     */
    protected serializeDate($date: DateTimeInterface) {
      return Carbon.instance($date).toJSON();
    }

    /**
     * Get the attributes that should be converted to dates.
     *
     * @return array
     */
    public getDates() {
      if (!this.usesTimestamps()) {
        return this.dates;
      }

      const $defaults = [this.getCreatedAtColumn(), this.getUpdatedAtColumn()];

      return array_unique(array_merge(this.dates, $defaults));
    }

    /**
     * Get the format for database stored dates.
     *
     * @return string
     */
    public getDateFormat() {
      return this.dateFormat
        ? this.dateFormat
        : this.getConnection().getQueryGrammar().getDateFormat();
    }

    /**
     * Set the date format used by the model.
     *
     * @param  string  $format
     * @return this
     */
    public setDateFormat($format) {
      this.dateFormat = $format;

      return this;
    }

    /**
     * Determine whether an attribute should be cast to a native type.
     *
     * @param  string  $key
     * @param  array|string|null  $types
     * @return bool
     */
    public hasCast($key, $types = null) {
      if (array_key_exists($key, this.getCasts())) {
        return $types ? in_array(this.getCastType($key), $types, true) : true;
      }

      return false;
    }

    /**
     * Get the casts array.
     *
     * @return array
     */
    public getCasts() {
      if ((<Model>(<unknown>this)).getIncrementing()) {
        return array_merge(
          { [this.getKeyName()]: this.getKeyType() },
          this.casts
        );
      }

      return this.casts;
    }

    /**
     * Determine whether a value is Date / DateTime castable for inbound manipulation.
     *
     * @param  string  $key
     * @return bool
     */
    protected isDateCastable($key) {
      return this.hasCast($key, ["date", "datetime"]);
    }

    /**
     * Determine whether a value is JSON castable for inbound manipulation.
     *
     * @param  string  $key
     * @return bool
     */
    protected isJsonCastable($key) {
      return this.hasCast($key, ["array", "json", "object", "collection"]);
    }

    /**
     * Determine if the given key is cast using a custom class.
     *
     * @param  string  $key
     * @return bool
     */
    protected isClassCastable($key) {
      let $class;
      return (
        array_key_exists($key, this.getCasts()) &&
        class_exists(($class = this.parseCasterClass(this.getCasts()[$key]))) &&
        !in_array(
          $class,
          (<typeof HasAttributes>this.constructor).$primitiveCastTypes
        )
      );
    }

    /**
     * Resolve the custom caster class for a given key.
     *
     * @param  string  $key
     * @return mixed
     */
    protected resolveCasterClass($key) {
      let $castType = this.getCasts()[$key];

      let $arguments = [];

      if (is_string($castType) && strpos($castType, ":") !== false) {
        const $segments = explode(":", $castType, 2);

        $castType = $segments[0];
        $arguments = explode(",", $segments[1]);
      }

      if (is_subclass_of($castType, Castable.name)) {
        $castType = $castType.castUsing();
      }

      if (is_object($castType)) {
        return $castType;
      }

      return new $castType(...$arguments);
    }

    /**
     * Parse the given caster class, removing any arguments.
     *
     * @param  string  $class
     * @return string
     */
    protected parseCasterClass($class) {
      return strpos($class, ":") === false
        ? $class
        : explode(":", $class, 2)[0];
    }

    /**
     * Merge the cast class attributes back into the model.
     *
     * @return void
     */
    protected mergeAttributesFromClassCasts() {
      for (const [key, value] of Object.entries(this.classCastCache)) {
        const $caster = this.resolveCasterClass(key);

        this.attributes = array_merge(
          this.attributes,
          $caster instanceof CastsInboundAttributes
            ? { [key]: value }
            : this.normalizeCastClassResponse(
                key,
                $caster.set(this, key, value, this.attributes)
              )
        );
      }
    }

    /** Normalize the response from a custom class caster. */
    protected normalizeCastClassResponse($key, $value) {
      return is_array($value) ? $value : [($key) => $value];
    }

    /** Get all of the current attributes on the model. */
    public getAttributes() {
      this.mergeAttributesFromClassCasts();

      return this.attributes;
    }

    /** Set the array of model attributes. No checking is done. */
    public setRawAttributes($attributes, $sync = false) {
      this.attributes = $attributes;

      if ($sync) {
        this.syncOriginal();
      }

      this.classCastCache = [];

      return this;
    }

    /** Get the model's original attribute values. */
    public getOriginal($key = null, $default = null) {
      let $sync;
      return new (<typeof HasAttributes>this.constructor)()
        .setRawAttributes(this.original, ($sync = true))
        .getOriginalWithoutRewindingModel($key, $default);
    }

    /** Get the model's original attribute values. */
    protected getOriginalWithoutRewindingModel($key = null, $default = null) {
      if ($key) {
        return this.transformModelValue(
          $key,
          Arr.get(this.original, $key, $default)
        );
      }

      return collect(this.original)
        .mapWithKeys(function ($value, $key) {
          return [($key) => this.transformModelValue($key, $value)];
        })
        .all();
    }

    /** Get the model's raw original attribute values. */
    public getRawOriginal($key = null, $default = null) {
      return Arr.get(this.original, $key, $default);
    }

    /** Get a subset of the model's attributes. */
    public only($attributes) {
      const $results = [];

      for (const $attribute in is_array($attributes)
        ? $attributes
        : arguments) {
        $results[$attribute] = this.getAttribute($attribute);
      }

      return $results;
    }

    /** Sync the original attributes with the current. */
    public syncOriginal() {
      this.original = this.getAttributes();

      return this;
    }

    /** Sync a single original attribute with its current value. */
    public syncOriginalAttribute($attribute) {
      return this.syncOriginalAttributes($attribute);
    }

    /** Sync multiple original attribute with their current values. */
    public syncOriginalAttributes($attributes) {
      $attributes = is_array($attributes) ? $attributes : arguments;

      const $modelAttributes = this.getAttributes();

      for (const $attribute in $attributes) {
        this.original[$attribute] = $modelAttributes[$attribute];
      }

      return this;
    }

    /** Sync the changed attributes. */
    public syncChanges() {
      this.changes = this.getDirty();

      return this;
    }

    /** Determine if the model or any of the given attribute(s) have been modified. */
    public isDirty($attributes = null) {
      return this.hasChanges(
        this.getDirty(),
        is_array($attributes) ? $attributes : arguments
      );
    }

    /** Determine if the model and all the given attribute(s) have remained the same. */
    public isClean($attributes = null) {
      return !this.isDirty(...arguments);
    }

    /** Determine if the model or any of the given attribute(s) have been modified. */
    public wasChanged($attributes = null) {
      return this.hasChanges(
        this.getChanges(),
        is_array($attributes) ? $attributes : arguments
      );
    }

    /** Determine if any of the given attributes were changed. */
    protected hasChanges($changes, $attributes = null) {
      // If no specific attributes were provided, we will just see if the dirty array
      // already contains any attributes. If it does we will just return that this
      // count is greater than zero. Else, we need to check specific attributes.
      if (empty($attributes)) {
        return count($changes) > 0;
      }

      // Here we will spin through every attribute and see if this is in the array of
      // dirty attributes. If it is, we will return true and if we make it through
      // all of the attributes for the entire array we will return false at end.
      for (const $attribute in Arr.wrap($attributes)) {
        if (array_key_exists($attribute, $changes)) {
          return true;
        }
      }

      return false;
    }

    /** Get the attributes that have been changed since last sync. */
    public getDirty() {
      const $dirty = [];

      for (const [$key, $value] of Object.entries(this.getAttributes())) {
        if (!this.originalIsEquivalent($key)) {
          $dirty[$key] = $value;
        }
      }

      return $dirty;
    }

    /** Get the attributes that were changed. */
    public getChanges() {
      return this.changes;
    }

    /** Determine if the new and old values for a given key are equivalent. */
    public originalIsEquivalent($key) {
      if (!array_key_exists($key, this.original)) {
        return false;
      }

      const $attribute = Arr.get(this.attributes, $key);
      const $original = Arr.get(this.original, $key);

      if ($attribute === $original) {
        return true;
      } else if (is_null($attribute)) {
        return false;
      } else if (this.isDateAttribute($key)) {
        return this.fromDateTime($attribute) === this.fromDateTime($original);
      } else if (this.hasCast($key, ["object", "collection"])) {
        return (
          this.castAttribute($key, $attribute) ==
          this.castAttribute($key, $original)
        );
      } else if (this.hasCast($key, ["real", "float", "double"])) {
        if (
          ($attribute === null && $original !== null) ||
          ($attribute !== null && $original === null)
        ) {
          return false;
        }

        return (
          abs(
            this.castAttribute($key, $attribute) -
              this.castAttribute($key, $original)
          ) <
          Number.EPSILON * 4
        );
      } else if (
        this.hasCast(
          $key,
          (<typeof HasAttributes>this.constructor).$primitiveCastTypes
        )
      ) {
        return (
          this.castAttribute($key, $attribute) ===
          this.castAttribute($key, $original)
        );
      }

      return (
        is_numeric($attribute) &&
        is_numeric($original) &&
        strcmp(<string>$attribute, <string>$original) === 0
      );
    }

    /** Transform a raw model value using mutators, casts, etc. */
    protected transformModelValue($key, $value) {
      // If the attribute has a get mutator, we will call that then return what
      // it returns as the value, which is useful for transforming values on
      // retrieval from the model to a form that is more useful for usage.
      if (this.hasGetMutator($key)) {
        return this.mutateAttribute($key, $value);
      }

      // If the attribute exists within the cast array, we will convert it to
      // an appropriate native PHP type dependent upon the associated value
      // given with the key in the pair. Dayle made this comment line up.
      if (this.hasCast($key)) {
        return this.castAttribute($key, $value);
      }

      // If the attribute is listed as a date, we will convert it to a DateTime
      // instance on retrieval, which makes it quite convenient to work with
      // date fields without having to create a mutator for each property.
      if ($value !== null && in_array($key, this.getDates(), false)) {
        return this.asDateTime($value);
      }

      return $value;
    }

    /** Append attributes to query when building a query. */
    public append($attributes) {
      this.appends = array_unique(
        array_merge(
          this.appends,
          is_string($attributes) ? arguments : $attributes
        )
      );

      return this;
    }

    /** Set the accessors to append to model arrays. */
    public setAppends($appends) {
      this.appends = $appends;

      return this;
    }

    /** Return whether the accessor attribute has been appended. */
    public hasAppended($attribute) {
      return in_array($attribute, this.appends);
    }

    /** Get the mutated attributes for a given instance. */
    public getMutatedAttributes() {
      const $class = (<typeof HasAttributes>this.constructor).name;

      if (
        !isset((<typeof HasAttributes>this.constructor).$mutatorCache[$class])
      ) {
        (<typeof HasAttributes>this.constructor).cacheMutatedAttributes($class);
      }

      return (<typeof HasAttributes>this.constructor).$mutatorCache[$class];
    }

    /** Extract and cache all the mutated attributes of a class. */
    public static cacheMutatedAttributes($class) {
      (<typeof HasAttributes>this.constructor).$mutatorCache[$class] = collect(
        (<typeof HasAttributes>this.constructor).getMutatorMethods($class)
      )
        .map(function ($match) {
          return lcfirst(
            (<typeof HasAttributes>this.constructor).$snakeAttributes
              ? Str.snake($match)
              : $match
          );
        })
        .all();
    }

    /** Get all of the attribute mutator methods. */
    protected static getMutatorMethods($class) {
      preg_match_all(
        "/(?<=^|;)get([^;]+?)Attribute(;|$)/",
        implode(";", get_class_methods($class)),
        $matches
      );

      return $matches[1];
    }
  };
}
