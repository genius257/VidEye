export default interface Dispatcher {
  /** Dispatch a command to its appropriate handler. */
  dispatch($command: any): any;

  /** Dispatch a command to its appropriate handler in the current process. */
  dispatchNow($command: any, $handler: any): any;

  /** Determine if the given command has a handler. */
  hasCommandHandler($command: any): boolean;

  /** Retrieve the handler for a command. */
  getCommandHandler($command: any): boolean | any;

  /** Set the pipes commands should be piped through before dispatching. */
  pipeThrough($pipes: any[]): this;

  /** Map a command to a handler. */
  map($map: any[]): this;
}
