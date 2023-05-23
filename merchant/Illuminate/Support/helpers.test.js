import * as helpers from "./helpers";

test("class_uses_recursive", () => {
  class A {}
  class B extends A {}
  class Trait1 extends B {
    static __trait__ = true;
  }
  class Trait2 extends Trait1 {
    static __trait__ = true;
  }
  class C extends Trait2 {}
  class Trait3 extends C {
    static __trait__ = true;
  }
  class D extends Trait3 {}

  expect(helpers.class_uses_recursive(D).sort()).toEqual(
    [Trait1, Trait2, Trait3].sort()
  );

  const d = new D();
  expect(helpers.class_uses_recursive(d).sort()).toEqual(
    [Trait1, Trait2, Trait3].sort()
  );
});
