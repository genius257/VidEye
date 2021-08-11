type Constructor<T = {}> = new (...args: any[]) => T;
export default function class_apply_traits<Type extends Constructor>(
  $class: Type,
  traits: Function[]
): Type {
  let Class = $class;
  traits.forEach((trait) => {
    Class = trait(Class);
    /*
    Object.getOwnPropertyNames(trait.prototype).forEach((name) => {
      console.log(name);
      Object.defineProperty(
        $class.prototype,
        name,
        Object.getOwnPropertyDescriptor(trait.prototype, name) ||
          Object.create(null)
      );
    });
    */
  });
  return Class;
}
