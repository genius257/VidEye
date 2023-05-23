export function method_exists(obj, method: string): boolean {
  // Checks if the class method exists
  //
  // version: 812.3015
  // discuss at: http://phpjs.org/functions/method_exists
  // +   original by: Brett Zamir
  // *     example 1: function class_a() {this.meth1 = function() {return true;}};
  // *     example 1: var instance_a = new class_a();
  // *     example 1: method_exists(instance_a, 'meth1');
  // *     returns 1: true
  // *     example 2: function class_a() {this.meth1 = function() {return true;}};
  // *     example 2: var instance_a = new class_a();
  // *     example 2: method_exists(instance_a, 'meth2');
  // *     returns 2: false
  if (typeof obj === "string") {
    return window[obj] && typeof window[obj][method] === "function";
  }

  return typeof obj[method] === "function";
}

export function get_class($class): string {
  $class = typeof $class === "function" ? $class : $class.constructor;
  return $class.name;
}

export function class_exists($class): boolean {
  throw new Error("Not implemented");
}

export function clone($class) {
  return Object.assign(Object.create(Object.getPrototypeOf($class)), $class);
}

export function is_trait($class) {
  // Here we will get the actial class if the provided item is an instance.
  $class = typeof $class === "function" ? $class : $class.constructor;

  return $class.hasOwnProperty("__trait__");
}

export function class_parents($class) {
  // Here we will get the actial class if the provided item is an instance.
  $class = typeof $class === "function" ? $class : $class.constructor;

  let parents = [];
  let i = 0;
  const maxDepth = 255; //A safty thing, to prevent the code from running amok if something unexpected happens with the loop condition.
  const classPrototype = Object.getPrototypeOf(class {});

  while (Object.getPrototypeOf($class) !== classPrototype) {
    $class = Object.getPrototypeOf($class);
    if (!is_trait($class)) {
      parents.push($class);
    }
    if (i++ >= maxDepth) {
      console.warn("class_parents: maximum depth reached");
      break;
    }
  }

  return parents;
}

export function class_uses($class) {
  // Here we will get the actial class if the provided item is an instance.
  $class = typeof $class === "function" ? $class : $class.constructor;

  let traits = [];
  let i = 0;
  const maxDepth = 255; //A safty thing, to prevent the code from running amok if something unexpected happens with the loop condition.
  const classPrototype = Object.getPrototypeOf(class {});

  while (Object.getPrototypeOf($class) !== classPrototype) {
    $class = Object.getPrototypeOf($class);
    if (!is_trait($class)) {
      break;
    }
    traits.push($class);
    i++;
    if (i >= maxDepth) {
      break;
    }
  }

  return traits;
}
