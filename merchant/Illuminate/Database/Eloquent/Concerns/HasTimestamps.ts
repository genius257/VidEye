import { is_null } from "locutus/php/var";
import { Model } from "../Model";

type Constructor<T = {}> = new (...args: any[]) => T;

export default function HasTimestamps<TBase extends Constructor>(Class: TBase) {
  return class HasTimestamps extends Class {
    static __trait__ = true;

    /** Indicates if the model should be timestamped. */
    public timestamps: boolean = true;

    /** Update the model's update timestamp. */
    public touch(): boolean {
      if (!this.usesTimestamps()) {
        return false;
      }

      this.updateTimestamps();

      return (<Model>(<unknown>this)).save();
    }

    /**
     * Update the creation and update timestamps.
     *
     * @return void
     */
    protected updateTimestamps(): void {
      const $time = this.freshTimestamp();

      const $updatedAtColumn = this.getUpdatedAtColumn();

      if (
        !is_null($updatedAtColumn) &&
        !(<Model>(<unknown>this)).isDirty($updatedAtColumn)
      ) {
        this.setUpdatedAt($time);
      }

      const $createdAtColumn = this.getCreatedAtColumn();

      if (
        !(<Model>(<unknown>this)).exists &&
        !is_null($createdAtColumn) &&
        !(<Model>(<unknown>this)).isDirty($createdAtColumn)
      ) {
        this.setCreatedAt($time);
      }
    }

    /**
     * Set the value of the "created at" attribute.
     *
     * @param  mixed  $value
     * @return $this
     */
    public setCreatedAt($value): this {
      this[this.getCreatedAtColumn()] = $value;

      return this;
    }

    /**
     * Set the value of the "updated at" attribute.
     *
     * @param  mixed  $value
     * @return $this
     */
    public setUpdatedAt($value): this {
      this[this.getUpdatedAtColumn()] = $value;

      return this;
    }

    /**
     * Get a fresh timestamp for the model.
     *
     * @return \Illuminate\Support\Carbon
     */
    public freshTimestamp() {
      // return Date::now();
      return Date.now();
    }

    /** Get a fresh timestamp for the model. */
    public freshTimestampString(): string {
      return (<Model>(<unknown>this)).fromDateTime(this.freshTimestamp());
    }

    /**
     * Determine if the model uses timestamps.
     *
     * @return bool
     */
    public usesTimestamps() {
      return this.timestamps;
    }

    /** Get the name of the "created at" column. */
    public getCreatedAtColumn(): string | null {
      return (<typeof Model>this.constructor).CREATED_AT;
    }

    /** Get the name of the "updated at" column. */
    public getUpdatedAtColumn(): string | null {
      return (<typeof Model>this.constructor).UPDATED_AT;
    }

    /**
     * Get the fully qualified "created at" column.
     *
     * @return string
     */
    public getQualifiedCreatedAtColumn() {
      return (<Model>(<unknown>this)).qualifyColumn(this.getCreatedAtColumn());
    }

    /**
     * Get the fully qualified "updated at" column.
     *
     * @return string
     */
    public getQualifiedUpdatedAtColumn() {
      return (<Model>(<unknown>this)).qualifyColumn(this.getUpdatedAtColumn());
    }
  };
}
