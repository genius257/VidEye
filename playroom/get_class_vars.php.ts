import { Model } from "../merchant/Illuminate/Database/Eloquent/Model";

function get_class_vars(name) {
  // http://jsphp.co/jsphp/fn/view/get_class_vars
  // +   original by: Brett Zamir (http://brett-zamir.me)
  // *     example 1: function Myclass(){privMethod = function (){};}
  // *     example 1: Myclass.classMethod = function () {}
  // *     example 1: Myclass.prototype.myfunc1 = function () {return(true);};
  // *     example 1: Myclass.prototype.myfunc2 = function () {return(true);}
  // *     example 1: get_class_vars('MyClass')
  // *     returns 1: {}

  var constructor,
    retArr = {},
    prop = "";

  if (typeof name === "function") {
    constructor = name;
  } else if (typeof name === "string") {
    constructor = this.window[name];
  }

  for (prop in constructor) {
    if (typeof constructor[prop] !== "function" && prop !== "prototype") {
      retArr[prop] = constructor[prop];
    }
  }
  // Comment out this block to behave as "class" is usually defined in JavaScript convention
  if (constructor.prototype) {
    for (prop in constructor.prototype) {
      if (typeof constructor.prototype[prop] !== "function") {
        retArr[prop] = constructor.prototype[prop];
      }
    }
  }

  return retArr;
}

class Describer {
  public static describeClass(typeOfClass: any) {
    let a = new typeOfClass();
    let array = Object.getOwnPropertyNames(a);
    return array; //you can apply any filter here
  }
}

class A {
  public static A = 123;
  protected static B;
  private static C;
  public a;
  protected b;
  private c;
}

class B extends A {}
class C extends B {}
class D extends C {}

class Z extends class {} {}

let Class = Model;
do {
  console.log(Class.name);
  Class = Object.getPrototypeOf(Class);
} while (Function.prototype !== Class);
/*
console.log(
  Object.getPrototypeOf(A),
  Object.getPrototypeOf(Object.getPrototypeOf(A))
);
*/
