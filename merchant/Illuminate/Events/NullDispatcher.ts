import DispatcherContract from "../Contracts/Events/Dispatcher";
import ForwardsCalls from "../Support/Traits/ForwardsCalls";
import DispatcherBusContract from "../Contracts/Bus/Dispatcher";

class NullDispatcher implements DispatcherContract {
  /** The underlying event dispatcher instance. */
  protected dispatcher: DispatcherBusContract;

  /** Create a new event dispatcher instance that does not fire. */
  constructor(dispatcher: DispatcherContract) {
    this.dispatcher = dispatcher;
  }

  /** Don't fire an event. */
  public dispatch(
    $event: string | Object,
    $payload: any = [],
    $halt: boolean = false
  ): void {
    //
  }

  /** Don't register an event and payload to be fired later. */
  public push($event: string, $payload: Array<any> = []): void {
    //
  }

  /** Don't dispatch an event. */
  public until($event: string | Object, $payload: any = []): null {
    return null;
  }

  /** Register an event listener with the dispatcher. */
  public listen(
    $events: string | Array<any>,
    $listener: Function | string
  ): void {
    this.dispatcher.listen($events, $listener);
  }

  /** Determine if a given event has listeners. */
  public hasListeners($eventName: string): boolean {
    return this.dispatcher.hasListeners($eventName);
  }

  /** Register an event subscriber with the dispatcher. */
  public subscribe($subscriber: Object | string): void {
    this.dispatcher.subscribe($subscriber);
  }

  /** Flush a set of pushed events. */
  public flush($event: string): void {
    this.dispatcher.flush($event);
  }

  /** Remove a set of listeners from the dispatcher. */
  public forget($event: string): void {
    this.dispatcher.forget($event);
  }

  /** Forget all of the queued listeners. */
  public forgetPushed(): void {
    this.dispatcher.forgetPushed();
  }

  /** Dynamically pass method calls to the underlying dispatcher. */
  public __call($method: string, $parameters: Array<any>) {
    return this.forwardCallTo(this.dispatcher, $method, $parameters);
  }
}

export default ForwardsCalls(NullDispatcher);
