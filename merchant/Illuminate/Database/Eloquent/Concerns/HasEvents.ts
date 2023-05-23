import {
  array_diff,
  array_filter,
  array_merge,
  array_unique,
  array_values
} from "locutus/php/array";
import { empty, isset, is_array, is_null, is_object } from "locutus/php/var";
import InvalidArgumentException from "../../../../PHP/Exceptions/InvalidArgumentException";
import {
  class_exists,
  get_class,
  method_exists
} from "../../../../PHP/helpers";
import Dispatcher from "../../../Contracts/Events/Dispatcher";
import NullDispatcher from "../../../Events/NullDispatcher";
import Arr from "../../../Support/Arr";
import { Model } from "../Model";

type Constructor<T = {}> = new (...args: any[]) => T;
export default function HasEvents<TBase extends Constructor>(Class: TBase) {
  return class HasEvents extends Class {
    static __trait__ = true;

    /**
     * The event map for the model.
     *
     * Allows for object-based events for native Eloquent events.
     */
    protected dispatchesEvents = [];

    /**
     * User exposed observable events.
     *
     * These are extra user-defined events observers may subscribe to.
     */
    protected observables = [];

    /**
     * Register observers with the model.
     *
     * @param  object|array|string  $classes
     * @return void
     *
     * @throws \RuntimeException
     */
    public static observe($classes) {
      const $instance = new (<typeof Object>this.constructor)();

      Arr.wrap($classes).forEach(($class) => {
        (<HasEvents>$instance).registerObserver($class);
      });
    }

    /** Register a single observer with the model. */
    protected registerObserver($class) {
      const $className = this.resolveObserverClassName($class);

      // When registering a model observer, we will spin through the possible events
      // and determine if this observer has that method. If it does, we will hook
      // it into the model's event system, making it convenient to watch these.
      this.getObservableEvents().forEach(($event) => {
        if (method_exists($class, $event)) {
          (<typeof HasEvents>this.constructor).registerModelEvent(
            $event,
            $className + "@" + $event
          );
        }
      });
    }

    /** Resolve the observer's class name from an object or string. */
    private resolveObserverClassName($class): string {
      if (is_object($class)) {
        return get_class($class);
      }

      if (class_exists($class)) {
        return $class;
      }

      throw new InvalidArgumentException("Unable to find observer: " + $class);
    }

    /** Get the observable event names. */
    public getObservableEvents(): any[] {
      return array_merge(
        [
          "retrieved",
          "creating",
          "created",
          "updating",
          "updated",
          "saving",
          "saved",
          "restoring",
          "restored",
          "replicating",
          "deleting",
          "deleted",
          "forceDeleted"
        ],
        this.observables
      );
    }

    /** Set the observable event names. */
    public setObservableEvents($observables: any[]) {
      this.observables = $observables;

      return this;
    }

    /**
     * Add an observable event name.
     *
     * @param  array|mixed  $observables
     * @return void
     */
    public addObservableEvents($observables) {
      this.observables = array_unique(
        array_merge(
          this.observables,
          is_array($observables) ? $observables : arguments
        )
      );
    }

    /**
     * Remove an observable event name.
     *
     * @param  array|mixed  $observables
     * @return void
     */
    public removeObservableEvents($observables) {
      this.observables = array_diff(
        this.observables,
        is_array($observables) ? $observables : arguments
      );
    }

    /**
     * Register a model event with the dispatcher.
     *
     * @param  string  $event
     * @param  \Closure|string  $callback
     * @return void
     */
    protected static registerModelEvent($event, $callback) {
      if (isset((<typeof Model>this.constructor).$dispatcher)) {
        const $name = (<typeof Model>this.constructor).name;

        (<typeof Model>this.constructor).$dispatcher.listen(
          "eloquent.{$event}: {$name}",
          $callback
        );
      }
    }

    /**
     * Fire the given event for the model.
     *
     * @param  string  $event
     * @param  bool  $halt
     * @return mixed
     */
    protected fireModelEvent($event, $halt = true) {
      if (!isset((<typeof Model>this.constructor).$dispatcher)) {
        return true;
      }

      // First, we will get the proper method to call on the event dispatcher, and then we
      // will attempt to fire a custom, object based event for the given event. If that
      // returns a result we can return that result, or we'll call the string events.
      const $method = $halt ? "until" : "dispatch";

      const $result = this.filterModelEventResults(
        this.fireCustomModelEvent($event, $method)
      );

      if ($result === false) {
        return false;
      }

      return !empty($result)
        ? $result
        : (<typeof Model>this.constructor).$dispatcher[$method](
            `eloquent.${$event}: ` + (<typeof HasEvents>this.constructor).name,
            this
          );
    }

    /**
     * Fire a custom model event for the given event.
     *
     * @param  string  $event
     * @param  string  $method
     * @return mixed|null
     */
    protected fireCustomModelEvent($event, $method) {
      console.log(this);
      if (!isset(this.dispatchesEvents[$event])) {
        return;
      }

      const $result = (<typeof Model>this.constructor).$dispatcher.$method(
        new this.dispatchesEvents[$event](this)
      );

      if (!is_null($result)) {
        return $result;
      }
    }

    /**
     * Filter the model event results.
     *
     * @param  mixed  $result
     * @return mixed
     */
    protected filterModelEventResults($result) {
      if (is_array($result)) {
        $result = array_filter($result, function ($response) {
          return !is_null($response);
        });
      }

      return $result;
    }

    /**
     * Register a retrieved model event with the dispatcher.
     *
     * @param  \Closure|string  $callback
     * @return void
     */
    public static retrieved($callback) {
      (<typeof HasEvents>this.constructor).registerModelEvent(
        "retrieved",
        $callback
      );
    }

    /**
     * Register a saving model event with the dispatcher.
     *
     * @param  \Closure|string  $callback
     * @return void
     */
    public static saving($callback) {
      (<typeof HasEvents>this.constructor).registerModelEvent(
        "saving",
        $callback
      );
    }

    /**
     * Register a saved model event with the dispatcher.
     *
     * @param  \Closure|string  $callback
     * @return void
     */
    public static saved($callback) {
      (<typeof HasEvents>this.constructor).registerModelEvent(
        "saved",
        $callback
      );
    }

    /**
     * Register an updating model event with the dispatcher.
     *
     * @param  \Closure|string  $callback
     * @return void
     */
    public static updating($callback) {
      (<typeof HasEvents>this.constructor).registerModelEvent(
        "updating",
        $callback
      );
    }

    /**
     * Register an updated model event with the dispatcher.
     *
     * @param  \Closure|string  $callback
     * @return void
     */
    public static updated($callback) {
      (<typeof HasEvents>this.constructor).registerModelEvent(
        "updated",
        $callback
      );
    }

    /**
     * Register a creating model event with the dispatcher.
     *
     * @param  \Closure|string  $callback
     * @return void
     */
    public static creating($callback) {
      (<typeof HasEvents>this.constructor).registerModelEvent(
        "creating",
        $callback
      );
    }

    /**
     * Register a created model event with the dispatcher.
     *
     * @param  \Closure|string  $callback
     * @return void
     */
    public static created($callback) {
      (<typeof HasEvents>this.constructor).registerModelEvent(
        "created",
        $callback
      );
    }

    /**
     * Register a replicating model event with the dispatcher.
     *
     * @param  \Closure|string  $callback
     * @return void
     */
    public static replicating($callback) {
      (<typeof HasEvents>this.constructor).registerModelEvent(
        "replicating",
        $callback
      );
    }

    /**
     * Register a deleting model event with the dispatcher.
     *
     * @param  \Closure|string  $callback
     * @return void
     */
    public static deleting($callback) {
      (<typeof HasEvents>this.constructor).registerModelEvent(
        "deleting",
        $callback
      );
    }

    /**
     * Register a deleted model event with the dispatcher.
     *
     * @param  \Closure|string  $callback
     * @return void
     */
    public static deleted($callback) {
      (<typeof HasEvents>this.constructor).registerModelEvent(
        "deleted",
        $callback
      );
    }

    /**
     * Remove all of the event listeners for the model.
     *
     * @return void
     */
    public static flushEventListeners() {
      if (!isset((<typeof Model>this.constructor).$dispatcher)) {
        return;
      }

      const $instance = new (<typeof Object>this.constructor)();

      (<HasEvents>$instance)
        .getObservableEvents()
        .forEach(($event) =>
          (<typeof Model>this.constructor).$dispatcher.forget(
            "eloquent.{$event}: " + (<typeof HasEvents>this.constructor).name
          )
        );

      array_values((<HasEvents>$instance).dispatchesEvents).forEach(
        ($event) => {
          (<typeof Model>this.constructor).$dispatcher.forget($event);
        }
      );
    }

    /**
     * Get the event dispatcher instance.
     *
     * @return \Illuminate\Contracts\Events\Dispatcher
     */
    public static getEventDispatcher() {
      return (<typeof Model>this.constructor).$dispatcher;
    }

    /**
     * Set the event dispatcher instance.
     *
     * @param  \Illuminate\Contracts\Events\Dispatcher  $dispatcher
     * @return void
     */
    public static setEventDispatcher($dispatcher: Dispatcher) {
      (<typeof Model>this.constructor).$dispatcher = $dispatcher;
    }

    /**
     * Unset the event dispatcher for models.
     *
     * @return void
     */
    public static unsetEventDispatcher() {
      (<typeof Model>this.constructor).$dispatcher = null;
    }

    /**
     * Execute a callback without firing any model events for any model type.
     *
     * @param  callable  $callback
     * @return mixed
     */
    public static withoutEvents($callback: Function) {
      const $dispatcher = (<typeof HasEvents>(
        this.constructor
      )).getEventDispatcher();

      if ($dispatcher) {
        (<typeof HasEvents>this.constructor).setEventDispatcher(
          new NullDispatcher($dispatcher)
        );
      }

      try {
        return $callback();
      } finally {
        if ($dispatcher) {
          (<typeof HasEvents>this.constructor).setEventDispatcher($dispatcher);
        }
      }
    }
  };
}
