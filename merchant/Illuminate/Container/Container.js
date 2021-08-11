import { isset, empty, is_null } from "locutus/php/var";
import { array_pop, end, count, array_merge } from "locutus/php/array";

export default class Container {
  static $instance = null;
  $resolved = [];
  bindings = {};
  methodBindings = [];
  instances = {};
  aliases = {};
  abstractAliases = {};
  extenders = {};
  tags = [];
  buildStack = [];
  with = [];
  contextual = {};
  reboundCallbacks = [];
  globalResolvingCallbacks = [];
  globalAfterResolvingCallbacks = [];
  resolvingCallbacks = [];
  afterResolvingCallbacks = [];

  constructor() {
    return new Proxy(this, {
      get: function(instance, property) {
        if (property in instance || typeof property === "symbol") {
          return instance[property]; //normal behavior
        }

        //instance[property] = {};

        return instance.__get(property);
      },
      set: (instance, property, value) => {
        if (property in instance) {
          //normal case
          instance[property] = value;
          return true;
        }

        instance.__set(property, value);
        return true;
      }
    });
  }

  bound(abstract) {
    return (
      isset(this.bindings[abstract]) ||
      isset(this.instances[abstract]) ||
      this.isAlias(abstract)
    );
  }

  isAlias(name) {
    return isset(this.aliases[name]);
  }

  instance(abstract, instance) {
    this.removeAbstractAlias(abstract);

    let isBound = this.bound(abstract);

    delete this.aliases[abstract];

    // We'll check to determine if this type has been bound before, and if it has
    // we will fire the rebound callbacks registered with the container and it
    // can be updated with consuming classes that have gotten resolved here.
    this.instances[abstract] = instance;

    if (isBound) {
      this.rebound(abstract);
    }

    return instance;
  }

  removeAbstractAlias(searched) {
    if (!isset(this.aliases[searched])) {
      return;
    }

    for (const [abstract, aliases] of Object.entries(this.abstractAliases)) {
      for (const [index, alias] of Object.entries(aliases)) {
        if (alias === searched) {
          delete this.abstractAliases[abstract][index];
        }
      }
    }
  }

  __get(key) {
    //return this[key];
    return this.make(key);
  }

  __set(key, value) {
    //this[key] = value;
    this.bind(key, typeof value === "function" ? value : () => value);
  }

  make(abstract, parameters = []) {
    return this.resolve(abstract, parameters);
  }

  resolve(abstract, parameters = [], raiseEvents = true) {
    abstract = this.getAlias(abstract);

    let concrete = this.getContextualConcrete(abstract);

    let needsContextualBuild = !empty(parameters) || !is_null(concrete);

    // If an instance of the type is currently being managed as a singleton we'll
    // just return an existing instance instead of instantiating new instances
    // so the developer can keep using the same objects instance every time.
    if (isset(this.instances[abstract]) && !needsContextualBuild) {
      return this.instances[abstract];
    }

    this.with.push(parameters);

    if (is_null(concrete)) {
      concrete = this.getConcrete(abstract);
    }

    let object;
    // We're ready to instantiate an instance of the concrete type registered for
    // the binding. This will instantiate the types, as well as resolve any of
    // its "nested" dependencies recursively until all have gotten resolved.
    if (this.isBuildable(concrete, abstract)) {
      object = this.build(concrete);
    } else {
      object = this.make(concrete);
    }

    // If we defined any extenders for this type, we'll need to spin through them
    // and apply them to the object being built. This allows for the extension
    // of services, such as changing configuration or decorating the object.
    for (const [key, extender] of Object.entries(this.getExtenders(abstract))) {
      object = extender(object, this);
    }

    // If the requested type is registered as a singleton we'll want to cache off
    // the instances in "memory" so we can return it later without creating an
    // entirely new instance of an object on each subsequent request for it.
    if (this.isShared(abstract) && !needsContextualBuild) {
      this.instances[abstract] = object;
    }

    if (raiseEvents) {
      this.fireResolvingCallbacks(abstract, object);
    }

    // Before returning, we will also set the resolved flag to "true" and pop off
    // the parameter overrides for this build. After those two things are done
    // we will be ready to return back the fully constructed class instance.
    this.$resolved[abstract] = true;

    array_pop(this.with);

    return object;
  }

  getAlias(abstract) {
    if (!isset(this.aliases[abstract])) {
      return abstract;
    }

    return this.getAlias(this.aliases[abstract]);
  }

  getContextualConcrete(abstract) {
    let binding = this.findInContextualBindings(abstract);
    if (!is_null(binding)) {
      return binding;
    }

    // Next we need to see if a contextual binding might be bound under an alias of the
    // given abstract type. So, we will need to check if any aliases exist with this
    // type and then spin through them and check for contextual bindings on these.
    if (empty(this.abstractAliases[abstract])) {
      return null;
    }

    for (const [key, alias] of Object.entries(this.abstractAliases[abstract])) {
      let binding = this.findInContextualBindings(alias);
      if (!is_null(binding)) {
        return binding;
      }
    }
  }

  findInContextualBindings(abstract) {
    return this.contextual[end(this.buildStack)]?.[abstract] ?? null;
  }

  isBuildable(concrete, abstract) {
    return concrete === abstract || typeof concrete === "function";
  }

  build(concrete) {
    // If the concrete type is actually a Closure, we will just execute it and
    // hand back the results of the functions, which allows functions to be
    // used as resolvers for more fine-tuned resolution of these objects.
    if (typeof concrete === "function") {
      return concrete(this, this.getLastParameterOverride());
    }

    /*
      let reflector;
      try {
          reflector = new ReflectionClass(concrete);
      } catch (e) {
          if (e instanceof ReflectionException) {throw new BindingResolutionException("Target class [$concrete] does not exist.", 0, $e);}
          throw e;
      }
      */

    // If the type is not instantiable, the developer is attempting to resolve
    // an abstract type such as an Interface or Abstract Class and there is
    // no binding registered for the abstractions so we need to bail out.
    /*
      if (! reflector.isInstantiable()) {
          return this.notInstantiable(concrete);
      }
      */

    this.buildStack.push(concrete);

    //let constructor = reflector.getConstructor();
    let constructor = concrete.constructor;

    // If there are no constructors, that means there are no dependencies then
    // we can just resolve the instances of the objects right away, without
    // resolving any other types or dependencies out of these containers.
    if (is_null(constructor)) {
      array_pop(this.buildStack);

      return new concrete();
    }

    //let dependencies = constructor.getParameters();
    let dependencies = [];

    /*
      let instances;
      // Once we have all the constructor's parameters we can create each of the
      // dependency instances and then use the reflection instances to make a
      // new instance of this class, injecting the created dependencies in.
      try {
          instances = this.resolveDependencies(dependencies);
      } catch (e) {
          if (e instanceof BindingResolutionException) {array_pop(this.buildStack);}

          throw e;
      }
      */
    let instances = [];

    array_pop(this.buildStack);

    //return reflector.newInstanceArgs(instances);
    return new concrete(...instances);
  }

  getConcrete(abstract) {
    // If we don't have a registered resolver or concrete for the type, we'll just
    // assume each type is a concrete name and will attempt to resolve it as is
    // since the container should be able to resolve concretes automatically.
    if (isset(this.bindings[abstract])) {
      return this.bindings[abstract]["concrete"];
    }

    return abstract;
  }

  bind(abstract, concrete = null, shared = false) {
    this.dropStaleInstances(abstract);

    // If no concrete type was given, we will simply set the concrete type to the
    // abstract type. After that, the concrete type to be registered as shared
    // without being forced to state their classes in both of the parameters.
    if (is_null(concrete)) {
      concrete = abstract;
    }

    // If the factory is not a Closure, it means it is just a class name which is
    // bound into this container to the abstract type and we will just wrap it
    // up inside its own Closure to give us more convenience when extending.
    if (!typeof concrete === "function") {
      concrete = this.getClosure(abstract, concrete);
    }

    this.bindings[abstract] = { concrete, shared };

    // If the abstract type was already resolved in this container we'll fire the
    // rebound listener so that any objects which have already gotten resolved
    // can have their copy of the object updated via the listener callbacks.
    if (this.resolved(abstract)) {
      this.rebound(abstract);
    }
  }

  dropStaleInstances(abstract) {
    delete this.instances[abstract];
    delete this.aliases[abstract];
  }

  resolved(abstract) {
    if (this.isAlias(abstract)) {
      abstract = this.getAlias(abstract);
    }

    return isset(this.$resolved[abstract]) || isset(this.instances[abstract]);
  }

  getLastParameterOverride() {
    return count(this.with) ? end(this.with) : [];
  }

  getExtenders(abstract) {
    abstract = this.getAlias(abstract);

    return this.extenders[abstract] ?? [];
  }

  isShared(abstract) {
    return (
      isset(this.instances[abstract]) ||
      (isset(this.bindings[abstract]["shared"]) &&
        this.bindings[abstract]["shared"] === true)
    );
  }

  fireResolvingCallbacks(abstract, object) {
    this.fireCallbackArray(object, this.globalResolvingCallbacks);

    this.fireCallbackArray(
      object,
      this.getCallbacksForType(abstract, object, this.resolvingCallbacks)
    );

    this.fireAfterResolvingCallbacks(abstract, object);
  }

  /**
   *
   * @param {mixed} object
   * @param {array} callbacks
   */
  fireCallbackArray(object, callbacks) {
    callbacks.forEach(callback => {
      callback(object, this);
    });
  }

  /**
   *
   * @param {string} abstract
   * @param {object} object
   * @param {array} callbacksPerType
   */
  getCallbacksForType(abstract, object, callbacksPerType) {
    let results = [];

    for (const [type, callbacks] of Object.entries(callbacksPerType)) {
      if (type === abstract || object instanceof type) {
        results = array_merge(results, callbacks);
      }
    }

    return results;
  }

  fireAfterResolvingCallbacks(abstract, object) {
    this.fireCallbackArray(object, this.globalAfterResolvingCallbacks);

    this.fireCallbackArray(
      object,
      this.getCallbacksForType(abstract, object, this.afterResolvingCallbacks)
    );
  }

  rebound(abstract) {
    let instance = this.make(abstract);

    for (const [key, callback] of Object.entries(
      this.getReboundCallbacks(abstract)
    )) {
      //call_user_func($callback, $this, $instance);
      callback.call(null, this, instance);
    }
  }
}
