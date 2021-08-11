type Constructor<T> = { new (): T };

class A {
  test():this {
    return new (<typeof A>this.constructor)();
  }

  save<T extends A>(this: T): T {
    // save the current instance and return it
    return new <typeof T>this.constructor;
  }

  public static test() {}
}
