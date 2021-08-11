export default interface Arrayable {
  /** Get the instance as an array. */
  toArray(): any[];
}

export function isInstanceofArrayable(o) {
  return (o as Arrayable).toArray !== undefined;
}
