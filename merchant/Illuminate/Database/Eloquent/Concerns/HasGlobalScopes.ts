import { is_null, is_string } from "locutus/php/var";
import InvalidArgumentException from "../../../../PHP/Exceptions/InvalidArgumentException";
import { get_class } from "../../../../PHP/helpers";
import Arr from "../../../Support/Arr";
import { Model } from "../Model";

type Constructor<T = {}> = new (...args: any[]) => T;

export default function HasGlobalScopes<TBase extends Constructor>(
  Class: TBase
) {
  return class HasGlobalScopes extends Class {
    static __trait__ = true;

    /**
     * Register a new global scope on the model.
     *
     * @param  \Illuminate\Database\Eloquent\Scope|\Closure|string  $scope
     * @param  \Closure|null  $implementation
     * @return mixed
     *
     * @throws \InvalidArgumentException
     */
    public static addGlobalScope(
      $scope,
      $implementation: Function | null = null
    ): any {
      if (is_string($scope) && !is_null($implementation)) {
        return ((<typeof Model>this).$globalScopes[this.name][
          $scope
        ] = $implementation);
      } else if ($scope instanceof Closure) {
        return (this.$globalScopes[this.name][
          spl_object_hash($scope)
        ] = $scope);
      } else if ($scope instanceof Scope) {
        return (this.$globalScopes[this.name][get_class($scope)] = $scope);
      }

      throw new InvalidArgumentException(
        "Global scope must be an instance of Closure or Scope."
      );
    }

    /**
     * Determine if a model has a global scope.
     *
     * @param  \Illuminate\Database\Eloquent\Scope|string  $scope
     * @return bool
     */
    public static hasGlobalScope($scope) {
      return !is_null(this.getGlobalScope($scope));
    }

    /**
     * Get a global scope registered with the model.
     *
     * @param  \Illuminate\Database\Eloquent\Scope|string  $scope
     * @return \Illuminate\Database\Eloquent\Scope|\Closure|null
     */
    public static getGlobalScope($scope) {
      if (is_string($scope)) {
        return Arr.get(
          this.$globalScopes,
          this.constructor.name + "." + $scope
        );
      }

      return Arr.get(
        this.$globalScopes,
        this.constructor.name + "." + get_class($scope)
      );
    }

    /**
     * Get the global scopes for this class instance.
     *
     * @return array
     */
    public getGlobalScopes() {
      return Arr.get(
        (<typeof Model>this.constructor).$globalScopes,
        this.constructor.name,
        []
      );
    }
  };
}
