//type ArrayAccess = Array<any>;
//export default ArrayAccess;

export default interface ArrayAccess {
  offsetExists(offset): boolean;
  offsetGet(offset): any;
  offsetSet(offset): void;
  offsetUnset(pffset): void;
}

export function instanceofArrayAccess(instance) {
  return (
    "offsetExists" in instance &&
    "offsetGet" in instance &&
    "offsetSet" in instance &&
    "offsetUnset" in instance
  );
}
