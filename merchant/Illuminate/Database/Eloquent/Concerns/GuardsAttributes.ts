import {
  array_flip,
  array_intersect_key,
  array_merge,
  count,
  in_array
} from "locutus/php/array";
import { preg_quote } from "locutus/php/pcre";
import { strpos } from "locutus/php/strings";
import { empty, isset } from "locutus/php/var";
import { get_class } from "../../../../PHP/helpers";
import Str from "../../../Support/Str";

type Constructor<T = {}> = new (...args: any[]) => T;

export default function GuardsAttributes<TBase extends Constructor>(
  Class: TBase
) {
  return class GuardsAttributes extends Class {
    static __trait__ = true;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [];

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array
     */
    protected $guarded = ["*"];

    /**
     * Indicates if all mass assignment is enabled.
     *
     * @var bool
     */
    protected static $unguarded = false;

    /**
     * The actual columns that exist on the database and can be guarded.
     *
     * @var array
     */
    protected static $guardableColumns = [];

    /**
     * Get the fillable attributes for the model.
     *
     * @return array
     */
    public getFillable() {
      return this.fillable;
    }

    /**
     * Set the fillable attributes for the model.
     *
     * @param  array  $fillable
     * @return $this
     */
    public fillable($fillable: any[]): this {
      this.$fillable = $fillable;

      return this;
    }

    /**
     * Merge new fillable attributes with existing fillable attributes on the model.
     *
     * @param  array  $fillable
     * @return $this
     */
    public mergeFillable($fillable: any[]): this {
      this.$fillable = array_merge(this.$fillable, $fillable);

      return this;
    }

    /** Get the guarded attributes for the model. */
    public getGuarded(): any[] {
      return this.$guarded;
    }

    /**
     * Set the guarded attributes for the model.
     *
     * @param  array  $guarded
     * @return $this
     */
    public guard($guarded: any[]): this {
      this.$guarded = $guarded;

      return this;
    }

    /**
     * Merge new guarded attributes with existing guarded attributes on the model.
     *
     * @param  array  $guarded
     * @return $this
     */
    public mergeGuarded($guarded: any[]): this {
      this.$guarded = array_merge(this.$guarded, $guarded);

      return this;
    }

    /**
     * Disable all mass assignable restrictions.
     *
     * @param  bool  $state
     * @return void
     */
    public static unguard($state = true) {
      (<typeof GuardsAttributes>this.constructor).$unguarded = $state;
    }

    /**
     * Enable the mass assignment restrictions.
     *
     * @return void
     */
    public static reguard() {
      (<typeof GuardsAttributes>this.constructor).$unguarded = false;
    }

    /**
     * Determine if current state is "unguarded".
     *
     * @return bool
     */
    public static isUnguarded() {
      return (<typeof GuardsAttributes>this.constructor).$unguarded;
    }

    /**
     * Run the given callable while being unguarded.
     *
     * @param  callable  $callback
     * @return mixed
     */
    public static unguarded($callback: Function) {
      if ((<typeof GuardsAttributes>this.constructor).$unguarded) {
        return $callback();
      }

      (<typeof GuardsAttributes>this.constructor).unguard();

      try {
        return $callback();
      } finally {
        (<typeof GuardsAttributes>this.constructor).reguard();
      }
    }

    /**
     * Determine if the given attribute may be mass assigned.
     *
     * @param  string  $key
     * @return bool
     */
    public isFillable($key: string): boolean {
      if ((<typeof GuardsAttributes>this.constructor).$unguarded) {
        return true;
      }

      // If the key is in the "fillable" array, we can of course assume that it's
      // a fillable attribute. Otherwise, we will check the guarded array when
      // we need to determine if the attribute is black-listed on the model.
      if (in_array($key, this.getFillable())) {
        return true;
      }

      // If the attribute is explicitly listed in the "guarded" array then we can
      // return false immediately. This means this attribute is definitely not
      // fillable and there is no point in going any further in this method.
      if (this.isGuarded($key)) {
        return false;
      }

      return (
        empty(this.getFillable()) &&
        strpos($key, ".") === false &&
        !Str.startsWith($key, "_")
      );
    }

    /**
     * Determine if the given key is guarded.
     *
     * @param  string  $key
     * @return bool
     */
    public isGuarded($key: string): boolean {
      if (empty(this.getGuarded())) {
        return false;
      }

      return (
        this.getGuarded() == ["*"] ||
        !empty(preg_grep("/^" + preg_quote($key) + "$/i", this.getGuarded())) ||
        !this.isGuardableColumn($key)
      );
    }

    /**
     * Determine if the given column is a valid, guardable column.
     *
     * @param  string  $key
     * @return bool
     */
    protected isGuardableColumn($key) {
      if (
        !isset(
          (<typeof GuardsAttributes>this.constructor).$guardableColumns[
            get_class(this)
          ]
        )
      ) {
        (<typeof GuardsAttributes>this.constructor).$guardableColumns[
          get_class(this)
        ] = this.getConnection()
          .getSchemaBuilder()
          .getColumnListing(this.getTable());
      }

      return in_array(
        $key,
        (<typeof GuardsAttributes>this.constructor).$guardableColumns[
          get_class(this)
        ]
      );
    }

    /**
     * Determine if the model is totally guarded.
     *
     * @return bool
     */
    public totallyGuarded() {
      return count(this.getFillable()) === 0 && this.getGuarded() == ["*"];
    }

    /**
     * Get the fillable attributes of a given array.
     *
     * @param  array  $attributes
     * @return array
     */
    protected fillableFromArray($attributes: any[]) {
      if (
        count(this.getFillable()) > 0 &&
        !(<typeof GuardsAttributes>this.constructor).$unguarded
      ) {
        return array_intersect_key($attributes, array_flip(this.getFillable()));
      }

      return $attributes;
    }
  };
}
