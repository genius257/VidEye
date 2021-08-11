type Constructor<T = {}> = new (...args: any[]) => T;
export default function trait<TBase extends Constructor>(Class: TBase) {
  return class trait extends Class {
    static _trait = true;
  };
}
