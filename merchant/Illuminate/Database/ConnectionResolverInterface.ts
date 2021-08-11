import ConnectionInterface from "./ConnectionInterface";

export default interface ConnectionResolverInterface {
  /** Get a database connection instance. */
  connection($name?: string | null): ConnectionInterface;

  /** Get the default connection name. */
  getDefaultConnection(): string;

  /** Set the default connection name. */
  setDefaultConnection($name: string): void;
}
