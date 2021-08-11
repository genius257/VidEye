import { array_merge } from "locutus/php/array";
import { strtolower } from "locutus/php/strings";
import { value } from "./helpers";

export default class Env {
  /**
   * Indicates if the putenv adapter is enabled.
   *
   * @var bool
   */
  protected static $putenv = true;

  /**
   * The environment repository instance.
   *
   * @var \Dotenv\Repository\RepositoryInterface|null
   */
  protected static $repository;

  /**
   * Enable the putenv adapter.
   *
   * @return void
   */
  public static enablePutenv() {
    this.$putenv = true;
    this.$repository = null;
  }

  /**
   * Disable the putenv adapter.
   *
   * @return void
   */
  public static disablePutenv() {
    this.$putenv = false;
    this.$repository = null;
  }

  /**
   * Get the environment repository instance.
   *
   * @return \Dotenv\Repository\RepositoryInterface
   */
  public static getRepository() {
    throw new Error("Not implemented");
    /*
    if (this.$repository === null) {
      const $adapters = array_merge(
        [new EnvConstAdapter(), new ServerConstAdapter()],
        this.$putenv ? [new PutenvAdapter()] : []
      );

      this.$repository = RepositoryBuilder.create()
        .withReaders($adapters)
        .withWriters($adapters)
        .immutable()
        .make();
    }

    return this.$repository;
    */
  }

  /**
   * Gets the value of an environment variable.
   *
   * @param  string  $key
   * @param  mixed  $default
   * @return mixed
   */
  public static get($key, $default = null) {
    throw new Error("Not implemented");
    /*
    return Option.fromValue(this.getRepository().get($key))
      .map(function ($value) {
        switch (strtolower($value)) {
          case "true":
          case "(true)":
            return true;
          case "false":
          case "(false)":
            return false;
          case "empty":
          case "(empty)":
            return "";
          case "null":
          case "(null)":
            return;
        }

        if (preg_match("/A(['\"])(.*)\1z/", $value, $matches)) {
          return $matches[2];
        }

        return $value;
      })
      .getOrCall(function () {
        return value($default);
      });
    */
  }
}
