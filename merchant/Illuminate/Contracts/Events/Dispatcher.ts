export default interface Dispatcher {
  // use Macroable;

  //public function listen($events, $listener);

  /**
   * Register an event listener with the dispatcher.
   */
  listen(events: string | string[], listener: Function | string): void;

  /**
   * Determine if a given event has listeners.
   */
  hasListeners(eventName: string): boolean;

  /**
   * Register an event subscriber with the dispatcher.
   */
  subscribe(subscriber: object | string): void;

  /**
   * Dispatch an event until the first non-null response is returned.
   */
  until(event: string | object, payload?: Array<any>): Array<any> | null;

  /**
   * Dispatch an event and call the listeners.
   */
  dispatch(
    event: string | object,
    payload?: any,
    halt?: boolean
  ): Array<any> | void;

  /**
   * Register an event and payload to be fired later.
   */
  push(event: string | object, $payload?: Array<any>): void;

  /**
   * Flush a set of pushed events.
   */
  flush(event: string): void;

  /**
   * Remove a set of listeners from the dispatcher.
   */
  forget(event: string): void;

  /**
   * Forget all of the queued listeners.
   */
  forgetPushed(): void;
}
