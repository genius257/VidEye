import QueryBuilder from "./Query/Builder";
import QueryExpression from "./Query/Expression";

type integer = number;

export default interface ConnectionInterface {
  /** Begin a fluent query against a database table. */
  table($table: QueryBuilder | string, $as?: string | null): QueryBuilder;

  /** Get a new raw query expression. */
  raw($value: any): QueryExpression;

  /** Run a select statement and return a single result. */
  selectOne($query: string, $bindings?: any[], $useReadPdo?: boolean): any;

  /** Run a select statement against the database. */
  select($query: string, $bindings?: any[], $useReadPdo?: boolean): any[];

  /**
   * Run a select statement against the database and returns a generator.
   *
   * @return \Generator
   */
  cursor($query: string, $bindings?: any[], $useReadPdo?: boolean);

  /** Run an insert statement against the database. */
  insert($query: string, $bindings?: any[]): boolean;

  /** Run an update statement against the database. */
  update($query: string, $bindings?: any[]): integer;

  /** Run a delete statement against the database. */
  delete($query: string, $bindings?: any[]): integer;

  /** Execute an SQL statement and return the boolean result. */
  statement($query: string, $bindings?: any[]): boolean;

  /** Run an SQL statement and get the number of rows affected. */
  affectingStatement($query: string, $bindings?: any[]): integer;

  /** Run a raw, unprepared query against the PDO connection. */
  unprepared($query: string): boolean;

  /** Prepare the query bindings for execution. */
  prepareBindings($bindings: any[]): any[];

  /** Execute a Closure within a transaction. */
  transaction($callback: Function, $attempts?: integer): any;

  /** Start a new database transaction. */
  beginTransaction(): void;

  /** Commit the active database transaction. */
  commit(): void;

  /** Rollback the active database transaction. */
  rollBack(): void;

  /** Get the number of active transactions. */
  transactionLevel(): integer;

  /** Execute the given callback in "dry run" mode. */
  pretend($callback: Function): any[];
}
