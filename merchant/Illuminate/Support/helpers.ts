/* eslint-disable @typescript-eslint/no-use-before-define */

import Collection from "./Collection";
import {
  array_reverse,
  array_shift,
  array_unique,
  count,
  end,
  in_array,
  reset
} from "locutus/php/array";
import {
  empty,
  isset,
  is_array,
  is_bool,
  is_callable,
  is_null,
  is_numeric,
  is_object,
  is_string
} from "locutus/php/var";
import Arr from "./Arr";
import {
  explode,
  htmlspecialchars,
  str_replace,
  trim
} from "locutus/php/strings";
import { basename } from "locutus/php/filesystem";
import Exception from "../../PHP/Exceptions/Exception";
import HigherOrderTapProxy from "./HigherOrderTapProxy";
import Env from "./Env";
import { class_parents, class_uses, get_class } from "../../PHP/helpers";

interface Json {
  [key: string]: string | number | boolean | Json | Json[];
}

/** Assign high numeric IDs to a config item to force appending. */
export function append_config($array: Json): Json {
  let $start = 9999;

  for (const [$key, $value] of Object.entries($array)) {
    if (is_numeric($key)) {
      $start++;

      $array[$start] = Arr.pull($array, $key);
    }
  }

  return $array;
}

/**
 * Determine if the given value is "blank".
 *
 * @param  mixed  $value
 * @return bool
 */
export function blank($value: any): boolean {
  throw new Error("Not implemented");
  /*
  if (is_null($value)) {
    return true;
  }

  if (is_string($value)) {
    return trim($value) === "";
  }

  if (is_numeric($value) || is_bool($value)) {
    return false;
  }

  if ($value instanceof Countable) {
    return count($value) === 0;
  }

  return empty($value);
  */
}

/**
 * Get the class "basename" of the given object / class.
 *
 * @param  string|object  $class
 * @return string
 */
export function class_basename($class) {
  $class = is_object($class) ? $class.constructor.name : $class.name;

  return basename(str_replace("\\", "/", $class));
}

/**
 * Returns all traits used by a class, its parent classes and trait of their traits.
 *
 * @param  object|string  $class
 * @return array
 */
export function class_uses_recursive($class): any[] {
  // Here we will get the actial class if the provided item is an instance.
  $class = typeof $class === "function" ? $class : $class.constructor;

  let results = [];
  class_parents($class)
    .reverse()
    .concat([$class])
    .forEach(($class) => {
      results.push(...trait_uses_recursive($class));
    });

  return results.filter((value, index, self) => self.indexOf(value) === index);
}

/** Create a collection from the given value. */
export function collect(value: any = null): Collection {
  return new Collection(value);
}

/**
 * Fill in data where it's missing.
 *
 * @param  mixed  $target
 * @param  string|array  $key
 * @param  mixed  $value
 * @return mixed
 */
export function data_fill($target, $key, $value) {
  return data_set($target, $key, $value, false);
}

/**
 * Get an item from an array or object using "dot" notation.
 *
 * @param  mixed  $target
 * @param  string|array|int|null  $key
 * @param  mixed  $default
 * @return mixed
 */
export function data_get($target, $key, $default = null) {
  if (is_null($key)) {
    return $target;
  }

  $key = is_array($key) ? $key : explode(".", $key);

  for (const [$i, $segment] of Object.entries($key)) {
    delete $key[$i];

    if (is_null($segment)) {
      return $target;
    }

    if ($segment === "*") {
      if ($target instanceof Collection) {
        $target = $target.all();
      } else if (!is_array($target)) {
        return value($default);
      }

      const $result = [];

      for (const [_key, $item] of $target) {
        $result.push(data_get($item, $key));
      }

      return in_array("*", $key) ? Arr.collapse($result) : $result;
    }

    if (Arr.accessible($target) && Arr.exists($target, $segment)) {
      $target = $target[<string>$segment];
    } else if (is_object($target) && isset($target[<string>$segment])) {
      $target = $target[<string>$segment];
    } else {
      return value($default);
    }
  }

  return $target;
}

/**
 * Set an item on an array or object using dot notation.
 *
 * @param  mixed  $target
 * @param  string|array  $key
 * @param  mixed  $value
 * @param  bool  $overwrite
 * @return mixed
 */
export function data_set($target, $key, $value, $overwrite = true) {
  let $segment;
  let $segments = is_array($key) ? $key : explode(".", $key);

  if (($segment = array_shift($segments)) === "*") {
    if (!Arr.accessible($target)) {
      $target = [];
    }

    if ($segments) {
      for (const [_key, $inner] of Object.entries($target)) {
        data_set($inner, $segments, $value, $overwrite);
      }
    } else if ($overwrite) {
      for (const [_key, $inner] of Object.entries($target)) {
        $target[_key] = $value;
      }
    }
  } else if (Arr.accessible($target)) {
    if ($segments) {
      if (!Arr.exists($target, $segment)) {
        $target[$segment] = [];
      }

      data_set($target[$segment], $segments, $value, $overwrite);
    } else if ($overwrite || !Arr.exists($target, $segment)) {
      $target[$segment] = $value;
    }
  } else if (is_object($target)) {
    if ($segments) {
      if (!isset($target[$segment])) {
        $target[$segment] = [];
      }

      data_set($target[$segment], $segments, $value, $overwrite);
    } else if ($overwrite || !isset($target[$segment])) {
      $target[$segment] = $value;
    }
  } else {
    $target = [];

    if ($segments) {
      data_set($target[$segment], $segments, $value, $overwrite);
    } else if ($overwrite) {
      $target[$segment] = $value;
    }
  }

  return $target;
}

/**
 * Encode HTML special characters in a string.
 *
 * @param  \Illuminate\Contracts\Support\DeferringDisplayableValue|\Illuminate\Contracts\Support\Htmlable|string  $value
 * @param  bool  $doubleEncode
 * @return string
 */
export function e($value, $doubleEncode = true) {
  throw new Error("Not implemented");
  /*
  if ($value instanceof DeferringDisplayableValue) {
    $value = $value.resolveDisplayableValue();
  }

  if ($value instanceof Htmlable) {
    return $value.toHtml();
  }

  return htmlspecialchars($value, ENT_QUOTES, "UTF-8", $doubleEncode);
  */
}

/**
 * Gets the value of an environment variable.
 *
 * @param  string  $key
 * @param  mixed  $default
 * @return mixed
 */
export function env($key, $default = null) {
  return Env.get($key, $default);
}

/**
 * Determine if a value is "filled".
 *
 * @param  mixed  $value
 * @return bool
 */
export function filled($value) {
  return !blank($value);
}

/**
 * Get the first element of an array. Useful for method chaining.
 *
 * @param  array  $array
 * @return mixed
 */
export function head($array) {
  return reset($array);
}

/**
 * Get the last element from an array.
 *
 * @param  array  $array
 * @return mixed
 */
export function last($array) {
  return end($array);
}

/**
 * Get an item from an object using "dot" notation.
 *
 * @param  object  $object
 * @param  string|null  $key
 * @param  mixed  $default
 * @return mixed
 */
export function object_get($object, $key, $default = null) {
  if (is_null($key) || trim($key) == "") {
    return $object;
  }

  for (const [_key, $segment] of <[string, string][]>(
    Object.entries(explode(".", $key))
  )) {
    if (!is_object($object) || !isset($object[$segment])) {
      return value($default);
    }

    $object = $object[$segment];
  }

  return $object;
}

/**
 * Provide access to optional objects.
 *
 * @param  mixed  $value
 * @param  callable|null  $callback
 * @return mixed
 */
export function optional($value = null, $callback: Function | null = null) {
  throw new Error("Not implemented");
  /*
  if (is_null($callback)) {
    return new Optional($value);
  } else if (!is_null($value)) {
    return $callback($value);
  }
  */
}

/**
 * Replace a given pattern with each value in the array in sequentially.
 *
 * @param  string  $pattern
 * @param  array  $replacements
 * @param  string  $subject
 * @return string
 */
export function preg_replace_array($pattern, $replacements, $subject) {
  throw new Error("Not implemented");
  /*
        return preg_replace_callback($pattern, function () {
          for (const [$key, $value] of Object.entries($replacements)) {
                return array_shift($replacements);
            }
        }, $subject);
        */
}

/**
 * Retry an operation a given number of times.
 *
 * @param  int  $times
 * @param  callable  $callback
 * @param  int  $sleep
 * @param  callable|null  $when
 * @return mixed
 *
 * @throws \Exception
 */
export function retry(
  $times,
  $callback: Function,
  $sleep = 0,
  $when: Function | null = null
) {
  throw new Error("Not implemented");
  /*
        let $attempts = 0;

        beginning:
        $attempts++;
        $times--;

        try {
            return $callback($attempts);
        } catch ($e:Exception) {
            if ($times < 1 || ($when && ! $when($e))) {
                throw $e;
            }

            if ($sleep) {
                usleep($sleep * 1000);
            }

            goto beginning;
        }
        */
}

/**
 * Call the given Closure with the given value then return the value.
 *
 * @param  mixed  $value
 * @param  callable|null  $callback
 * @return mixed
 */
export function tap($value, $callback = null) {
  if (is_null($callback)) {
    return new HigherOrderTapProxy($value);
  }

  $callback($value);

  return $value;
}

/**
 * Throw the given exception if the given condition is true.
 *
 * @param  mixed  $condition
 * @param  \Throwable|string  $exception
 * @param  array  ...$parameters
 * @return mixed
 *
 * @throws \Throwable
 */
export function throw_if($condition, $exception, ...$parameters) {
  if ($condition) {
    throw is_string($exception) ? new $exception(...$parameters) : $exception;
  }

  return $condition;
}

/**
 * Throw the given exception unless the given condition is true.
 *
 * @param  mixed  $condition
 * @param  \Throwable|string  $exception
 * @param  array  ...$parameters
 * @return mixed
 *
 * @throws \Throwable
 */
export function throw_unless($condition, $exception, ...$parameters) {
  if (!$condition) {
    throw is_string($exception) ? new $exception(...$parameters) : $exception;
  }

  return $condition;
}

/**
 * Returns all traits used by a trait and its traits.
 *
 * @param  string  $trait
 * @return array
 */
export function trait_uses_recursive($trait) {
  let $traits = class_uses($trait);

  for (const [_key, $trait] of Object.entries($traits)) {
    $traits.push(...trait_uses_recursive($trait));
  }

  return $traits;
}

/**
 * Transform the given value if it is present.
 *
 * @param  mixed  $value
 * @param  callable  $callback
 * @param  mixed  $default
 * @return mixed|null
 */
export function transform($value, $callback: Function, $default = null) {
  if (filled($value)) {
    return $callback($value);
  }

  if (is_callable($default)) {
    return $default($value);
  }

  return $default;
}

/**
 * Return the default value of the given value.
 *
 * @param  mixed  $value
 * @return mixed
 */
export function value($value) {
  return typeof $value === "function" ? $value() : $value;
}

/**
 * Determine whether the current environment is Windows based.
 *
 * @return bool
 */
export function windows_os() {
  throw new Error("Not implemented");
  //return PHP_OS_FAMILY === "Windows";
}

/**
 * Return the given value, optionally passed through the given callback.
 *
 * @param  mixed  $value
 * @param  callable|null  $callback
 * @return mixed
 */
/*export function with($value, $callback:Function|null = null)
    {
        return is_null($callback) ? $value : $callback($value);
    }
    */
