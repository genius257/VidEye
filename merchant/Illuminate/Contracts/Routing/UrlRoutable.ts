import { Model } from "../../Database/Eloquent/Model";

export default interface UrlRoutable {
  /** Get the value of the model's route key. */
  getRouteKey(): any;

  /** Get the route key for the model. */
  getRouteKeyName(): string;

  /** Retrieve the model for a bound value. */
  resolveRouteBinding($value: any, $field?: string | null): Model | null;

  /** Retrieve the child model for a bound value. */
  resolveChildRouteBinding(
    $childType: string,
    $value: any,
    $field: string | null
  ): Model | null;
}
