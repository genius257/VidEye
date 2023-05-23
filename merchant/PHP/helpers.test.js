import * as helpers from "./helpers";

test("class_parents", () => {
  class A {}
  class B extends A {}
  class C extends B {}
  class Trait extends C {
    static __trait__ = true;
  }
  class D extends Trait {}

  const expected = [C, B, A];

  let actual = helpers.class_parents(D);
  expect(actual).toEqual(expected);

  const d = new D();
  actual = helpers.class_parents(d);
  expect(actual).toEqual(expected);
});

test("class_uses", () => {
  class A {}
  class B extends A {}
  class C extends B {}
  class Trait extends C {
    static __trait__ = true;
  }
  class D extends Trait {}
  class E extends D {}

  expect(helpers.class_uses(E)).toEqual([]);
  expect(helpers.class_uses(D)).toEqual([Trait]);
  expect(helpers.class_uses(C)).toEqual([]);
  expect(helpers.class_uses(B)).toEqual([]);
  expect(helpers.class_uses(A)).toEqual([]);
});
