export default interface JsonSerializable {
  /**
   * Serializes the object to a value that can be serialized natively by JSON.stringify
   *
   * Originally in PHP was called jsonSerialize, but in JS it is called toJSON
   */
  toJSON(): any;
}
