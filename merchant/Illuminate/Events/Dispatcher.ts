// https://github.com/laravel/framework/blob/7.x/src/Illuminate/Events/Dispatcher.php

import DispatcherContract from "../../Illuminate/Contracts/Events/Dispatcher";

export default class Dispatcher implements DispatcherContract {
  listen(events: string | string[], listener: string | Function): void {
    throw new Error("Method not implemented.");
  }
  hasListeners(eventName: string): boolean {
    throw new Error("Method not implemented.");
  }
  subscribe(subscriber: string | object): void {
    throw new Error("Method not implemented.");
  }
  until(event: string | object, payload?: any[]): any[] {
    throw new Error("Method not implemented.");
  }
  dispatch(event: string | object, payload?: any, halt?: boolean): any[] {
    throw new Error("Method not implemented.");
  }
  push(event: string | object, $payload?: any[]): void {
    throw new Error("Method not implemented.");
  }
  flush(event: string): void {
    throw new Error("Method not implemented.");
  }
  forget(event: string): void {
    throw new Error("Method not implemented.");
  }
  forgetPushed(): void {
    throw new Error("Method not implemented.");
  }
  //
}
