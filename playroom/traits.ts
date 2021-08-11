type Constructor<T = {}> = new (...args: any[]) => T;
function trait<TBase extends Constructor>(Class: TBase) {
  return class Trait extends Class {};
}

function traits<TBase extends Constructor>(...traits: TBase[]) {
  return traits.reduce((previousValue: TBase, currentValue: TBase) => {
    return trait(previousValue || class {});
  });
}

class A {
  public a;
}
class B {
  public b;
}
class C {
  public c;
}

class magic extends traits(A, B, C) {
  test() {
    this.b;
  }
}
