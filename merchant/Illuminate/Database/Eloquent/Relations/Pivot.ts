import { Model } from "../Model";
import AsPivot from "./Concerns/AsPivot";

export default class Pivot extends AsPivot(Model) {
  /** Indicates if the IDs are auto-incrementing. */
  public $incrementing: boolean = false;

  /** The attributes that aren't mass assignable. */
  protected $guarded: any[] = [];
}
