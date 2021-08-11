export default class Optional {
  /*
  use Traits\Macroable {
    __call as macroCall;
  }
  */

/**
 * The underlying object.
 *
 * @var mixed
 */
protected $value;

/**
 * Create a new optional instance.
 *
 * @param  mixed  $value
 * @return void
 */
public constructor($value)
{
    $this->value = $value;
}

/**
 * Dynamically access a property on the underlying object.
 *
 * @param  string  $key
 * @return mixed
 */
public __get($key)
{
    if (is_object($this->value)) {
        return $this->value->{$key} ?? null;
    }
}

/**
 * Dynamically check a property exists on the underlying object.
 *
 * @param  mixed  $name
 * @return bool
 */
public __isset($name)
{
    if (is_object($this->value)) {
        return isset($this->value->{$name});
    }

    if (is_array($this->value) || $this->value instanceof ArrayObject) {
        return isset($this->value[$name]);
    }

    return false;
}

/**
 * Determine if an item exists at an offset.
 *
 * @param  mixed  $key
 * @return bool
 */
public offsetExists($key)
{
    return Arr::accessible($this->value) && Arr::exists($this->value, $key);
}

/**
 * Get an item at a given offset.
 *
 * @param  mixed  $key
 * @return mixed
 */
public offsetGet($key)
{
    return Arr::get($this->value, $key);
}

/**
 * Set the item at a given offset.
 *
 * @param  mixed  $key
 * @param  mixed  $value
 * @return void
 */
public offsetSet($key, $value)
{
    if (Arr::accessible($this->value)) {
        $this->value[$key] = $value;
    }
}

/**
 * Unset the item at a given offset.
 *
 * @param  string  $key
 * @return void
 */
public offsetUnset($key)
{
    if (Arr::accessible($this->value)) {
        unset($this->value[$key]);
    }
}

/**
 * Dynamically pass a method to the underlying object.
 *
 * @param  string  $method
 * @param  array  $parameters
 * @return mixed
 */
public __call($method, $parameters)
{
    if ((<typeof Optional>this.constructor).hasMacro($method)) {
        return this.macroCall($method, $parameters);
    }

    if (is_object($this->value)) {
        return $this->value->{$method}(...$parameters);
    }
}
}
