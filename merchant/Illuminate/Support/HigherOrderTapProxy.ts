export default class HigherOrderTapProxy {
  /**
   * The target being tapped.
   *
   * @var mixed
   */
  public target: any;

  private proxy;

  /**
   * Create a new tap proxy instance.
   *
   * @param  mixed  $target
   * @return void
   */
  public constructor($target) {
    this.target = $target;

    this.proxy = new Proxy(this, {
      get: (instance, property) => {
        if (property in instance) return instance[property]; //normal case
        if (typeof property === "symbol") {
          return undefined;
        }
        console.trace(
          `[\\Illuminate\\Database\\Eloquent\\Model]: access to non-existent property "${property}"`
        );
        return typeof instance.target[property] === "function"
          ? function () {
              return instance.__call(property, Array.from(arguments));
            }
          : undefined;
      }
    });

    return this.proxy;
  }

  /**
   * Dynamically pass method calls to the target.
   *
   * @param  string  $method
   * @param  array  $parameters
   * @return mixed
   */
  public __call($method, $parameters) {
    this.target[$method](...$parameters);

    return this.target;
  }
}
