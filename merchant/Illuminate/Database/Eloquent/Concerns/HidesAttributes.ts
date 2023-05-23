import { array_diff, array_merge } from "locutus/php/array";
import { empty, is_array } from "locutus/php/var";
import { value } from "../../../Support/helpers";

type Constructor<T = {}> = new (...args: any[]) => T;

export default function HidesAttributes<TBase extends Constructor>(
  Class: TBase
) {
  return class HidesAttributes extends Class {
    static __trait__ = true;

    /**The attributes that should be hidden for serialization.*/
    protected hidden: any[] = [];

    /** The attributes that should be visible in serialization. */
    protected visible: any[] = [];

    /**
     * Get the hidden attributes for the model.
     *
     * @return array
     */
    public getHidden() {
      return this.hidden;
    }

    /** Set the hidden attributes for the model. */
    public setHidden($hidden: any[]): this {
      this.hidden = $hidden;

      return this;
    }

    /**
     * Get the visible attributes for the model.
     *
     * @return array
     */
    public getVisible() {
      return this.visible;
    }

    /** Set the visible attributes for the model. */
    public setVisible($visible: any[]): this {
      this.visible = $visible;

      return this;
    }

    /** Make the given, typically hidden, attributes visible. */
    public makeVisible($attributes: any[] | string | null): this {
      $attributes = is_array($attributes) ? $attributes : arguments;

      this.hidden = array_diff(this.hidden, $attributes);

      if (!empty(this.visible)) {
        this.visible = array_merge(this.visible, $attributes);
      }

      return this;
    }

    /**
     * Make the given, typically hidden, attributes visible if the given truth test passes.
     *
     * @param  bool|Closure  $condition
     * @param  array|string|null  $attributes
     * @return $this
     */
    public makeVisibleIf($condition, $attributes) {
      $condition =
        typeof $condition === "function" ? $condition(this) : $condition;

      return $condition ? this.makeVisible($attributes) : this;
    }

    /** Make the given, typically visible, attributes hidden. */
    public makeHidden($attributes: any[] | string | null): this {
      this.hidden = array_merge(
        this.hidden,
        is_array($attributes) ? $attributes : arguments
      );

      return this;
    }

    /** Make the given, typically visible, attributes hidden if the given truth test passes. */
    public makeHiddenIf(
      $condition: boolean | Function,
      $attributes: any[] | string | null
    ): this {
      $condition =
        typeof $condition === "function" ? $condition(this) : $condition;

      return value($condition) ? this.makeHidden($attributes) : this;
    }
  };
}
