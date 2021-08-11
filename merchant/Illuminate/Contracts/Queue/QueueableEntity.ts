export default interface QueueableEntity {
  /** Get the queueable identity for the entity. */
  getQueueableId(): any;

  /** Get the relationships for the entity. */
  getQueueableRelations(): any[];

  /** Get the connection of the entity. */
  getQueueableConnection(): string | null;
}
