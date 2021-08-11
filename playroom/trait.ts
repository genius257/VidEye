type Constructor = new (...a: any[]) => any;
type Merge<TTrait extends Constructor, TTarget extends Constructor> = (new (
  ...a: ConstructorParameters<TTarget>
) => InstanceType<TTrait> & InstanceType<TTarget>) &
  Pick<TTarget, keyof TTarget> &
  Pick<TTrait, keyof TTrait>;

const trait = <TTrait extends Constructor>(Orig: TTrait) => <
  TTarget extends Constructor
>(
  Tgt: TTarget
): Merge<TTrait, TTarget> => {
  // perform patching
  return Tgt as any; // assertion required
};

class Motor {}

class Radio {
  volume = 100;
}

class Car {}

class A {
  propA = 1;
  static propB = 2;
}

const B = trait(A)(
  class {
    PropC = 3;
    static propD = 4;
  }
);

console.log(B.propB);
console.log(B.propD);

console.log(new B().PropC);
console.log(new B().propA);

class C extends B {}
