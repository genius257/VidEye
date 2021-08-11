import { sprintf } from "locutus/php/strings";

type Constructor<T = {}> = new (...args: any[]) => T;
export default function ForwardsCalls<TBase extends Constructor>(Class: TBase) {
  return class ForwardsCalls extends Class {
    /** Forward a method call to the given object. */
    protected forwardCallTo(
      $object: any,
      $method: string,
      $parameters: any[]
    ): any {
      try {
        return $object[$method](...$parameters);
      } catch ($e) {
        if ($e instanceof Error || $e instanceof BadMethodCallException) {
          const $pattern =
            "~^Call to undefined method (?P<class>[^:]+)::(?P<method>[^(]+)()$~";

          if (!preg_match($pattern, $e.getMessage(), $matches)) {
            throw $e;
          }

          if (
            $matches["class"] != get_class($object) ||
            $matches["method"] != $method
          ) {
            throw $e;
          }

          (<typeof ForwardsCalls>this.constructor).throwBadMethodCallException(
            $method
          );
        }
      }
    }

    /** Throw a bad method call exception for the given method. */
    protected static throwBadMethodCallException($method: string): void {
      throw new BadMethodCallException(
        sprintf(
          "Call to undefined method %s::%s()",
          (<typeof ForwardsCalls>this.constructor).name,
          $method
        )
      );
    }
  };
}
