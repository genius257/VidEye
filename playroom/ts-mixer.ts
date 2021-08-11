import { Mixin } from "ts-mixer";
import { getDecoratorsForClass } from "ts-mixer/dist/decorator";
import { getMixinsForClass } from "ts-mixer/dist/mixin-tracking";

class TraitOne {
  static $pro = "test";
  protected $one = 123;
  one() {
    return this.$one;
  }
  static pro() {
    return this.$pro;
  }
}

class TraitTwo {
  protected two = 321;
}

class TraitThree {
  two = 321;
}

class TraitFour {
  two = 321;
}

class Class extends Mixin(TraitOne, TraitTwo, TraitThree, TraitFour) {
  test() {
    return this.constructor.name;
    return this.one() + this.two;
  }
  public pro() {
    return (<typeof Class>this.constructor).pro();
  }
  static test() {
    return this.pro();
  }
}

const c = new Class();

console.log("Mixins for class: Class:", getMixinsForClass(Class));

console.log(c.test());
console.log(Class.pro());
console.log(c.pro());
