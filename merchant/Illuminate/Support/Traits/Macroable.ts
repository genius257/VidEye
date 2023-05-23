import { sprintf } from "locutus/php/strings";
import { isset } from "locutus/php/var";
import BadMethodCallException from "../../../PHP/Exceptions/BadMethodCallException";

type Constructor<T = {}> = new (...args: any[]) => T;
export default function Macroable<TBase extends Constructor>(Class: TBase) {
  return class Macroable extends Class {
    static __trait__ = true;

    /**
     * The registered string macros.
     *
     * @var array
     */
    protected static $macros = [];

    /**
     * Register a custom macro.
     *
     * @param  string  $name
     * @param  object|callable  $macro
     * @return void
     */
    public static macro($name, $macro) {
      this.$macros[$name] = $macro;
    }

    /**
     * Mix another object into the class.
     *
     * @param  object  $mixin
     * @param  bool  $replace
     * @return void
     *
     * @throws \ReflectionException
     */
    public static mixin($mixin, $replace = true) {
      throw new Error("Not implemented");
      /*
        const $methods = (new ReflectionClass($mixin)).getMethods(
            ReflectionMethod.IS_PUBLIC | ReflectionMethod.IS_PROTECTED
        );

        foreach ($methods as $method) {
            if ($replace || ! static::hasMacro($method->name)) {
                $method->setAccessible(true);
                static::macro($method->name, $method->invoke($mixin));
            }
        }
        */
    }

    /** Checks if macro is registered. */
    public static hasMacro($name: string): boolean {
      return isset(this.$macros[$name]);
    }

    /**
     * Dynamically handle calls to the class.
     *
     * @param  string  $method
     * @param  array  $parameters
     * @return mixed
     *
     * @throws \BadMethodCallException
     */
    public static __callStatic($method, $parameters) {
      if (!this.hasMacro($method)) {
        throw new BadMethodCallException(
          sprintf("Method %s::%s does not exist.", this.name, $method)
        );
      }

      let $macro = this.$macros[$method];

      if (typeof $macro === "function") {
        throw new Error("Not implemented");
        /*
            $macro = (<Function>$macro).bind(null, static::class); // PHP would have no $this and change the scope to the provided class, but JS can't do that.
            */
      }

      return $macro(...$parameters);
    }

    /**
     * Dynamically handle calls to the class.
     *
     * @param  string  $method
     * @param  array  $parameters
     * @return mixed
     *
     * @throws \BadMethodCallException
     */
    public __call($method, $parameters) {
      if (!(<typeof Macroable>this.constructor).hasMacro($method)) {
        throw new BadMethodCallException(
          sprintf(
            "Method %s::%s does not exist.",
            this.constructor.name,
            $method
          )
        );
      }

      let $macro = (<typeof Macroable>this.constructor).$macros[$method];

      if (typeof $macro === "function") {
        throw new Error("Not implemented");
        /*
            $macro = $macro.bindTo(this, static::class); // PHP would have current $this to bind to $macro and change the scope to the provided class, but JS can't do the latter.
            */
      }

      return $macro(...$parameters);
    }
  };
}
