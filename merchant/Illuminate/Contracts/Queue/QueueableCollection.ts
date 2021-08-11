export default interface QueueableCollection {
  /** Get the type of the entities being queued. */
  getQueueableClass(): string | null;

  /** Get the identifiers for all of the entities. */
  getQueueableIds(): any[];

  /** Get the relationships of the entities being queued. */
  getQueueableRelations(): any[];

  /** Get the connection of the entities being queued. */
  getQueueableConnection(): string | null;
}
