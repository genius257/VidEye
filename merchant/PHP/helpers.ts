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

export function get_class(obj: Object): string {
  return obj.constructor.name;
}

export function class_exists($class): boolean {
  throw new Error("Not implemented");
}

export function clone($class) {
  return Object.assign(Object.create(Object.getPrototypeOf($class)), $class);
}
