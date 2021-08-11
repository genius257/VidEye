import { array_key_exists, count } from "locutus/php/array";
import { value } from "./helpers";
import { json_encode } from "locutus/php/json";
import { isset } from "locutus/php/var";

const bind = (v, t) => (typeof v === "function" ? v.bind(t) : v);

export default class Fluent {
  attributes = [];

  constructor(attributes = []) {
    for (const [key, value] of Object.entries(attributes)) {
      this.attributes[key] = value;
    }

    return new Proxy(this, {
      deleteProperty: (target, prop) => target.__unset(prop),
      get: (target, prop, receiver) =>
        prop in target ? bind(target[prop], target) : target.__get(prop),
      set: (target, prop, value) => target.__set(prop, value),
      has: (target, prop) => target.__isset(prop)
    });
  }

  get(key, $default = null) {
    if (array_key_exists(key, this.attributes)) {
      return this.attributes[key];
    }

    return value($default);
  }

  getAttributes() {
    return this.attributes;
  }

  toArray() {
    return this.attributes;
  }

  jsonSerialize() {
    return this.toArray();
  }

  toJSON() {
    return this.jsonSerialize();
  }

  toJson(options = 0) {
    return json_encode(this.jsonSerialize(), options);
  }

  offsetExists(offset) {
    return isset(this.attributes[offset]);
  }

  offsetGet(offset) {
    return this.get(offset);
  }

  offsetSet(offset, value) {
    this.attributes[offset] = value;
  }

  offsetUnset(offset) {
    delete this.attributes[offset];
  }

  __call(method, parameters) {
    this.attributes[method] = count(parameters) > 0 ? parameters[0] : true;

    return this;
  }

  __get(key) {
    console.trace(
      `[\\Illuminate\\Support\\Fluent]: access to non-existent property "${key}"`
    );
    return this.get(key);
  }

  __set(key, value) {
    this.offsetSet(key, value);
    return true;
  }

  __isset(key) {
    return this.offsetExists(key);
  }

  __unset(key) {
    this.offsetUnset(key);
  }

  set() {
    return this.__call("set", arguments);
  }
}
