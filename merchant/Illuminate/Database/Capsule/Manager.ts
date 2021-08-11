import Container from "../../Container/Container";
import DatabaseManager from "../DatabaseManager";
import ConnectionFactory from "../Connectors/ConnectionFactory";
import Fluent from "../../Support/Fluent";
import Eloquent from "../Eloquent/Model";

export default class Manager {
  static $instance = null;

  /**
   * @type {Container}
   */
  container = null;
  manager = null;

  constructor(container = null) {
    this.setupContainer(container ? container : new Container());

    // Once we have the container setup, we will setup the default configuration
    // options in the container "config" binding. This will make the database
    // manager work correctly out of the box without extreme configuration.
    this.setupDefaultConfiguration();

    this.setupManager();
  }

  setupDefaultConfiguration() {
    this.container["config"]["database.fetch"] = "PDO::FETCH_OBJ";

    this.container["config"]["database.default"] = "default";
  }

  setupManager() {
    let factory = new ConnectionFactory(this.container);

    this.manager = new DatabaseManager(this.container, factory);
  }

  static connection(connection = null) {
    return this.$instance.getConnection(connection);
  }

  static table(table, as = null, connection = null) {
    return this.$instance.connection(connection).table(table, as);
  }

  static schema(connection = null) {
    return this.$instance.connection(connection).getSchemaBuilder();
  }

  getConnection(name = null) {
    return this.manager.connection(name);
  }

  addConnection(config, name = "default") {
    this.container["config"]["database.connections"] =
      this.container["config"]["database.connections"] || {};
    let connections = this.container["config"]["database.connections"];

    connections[name] = config;

    this.container["config"]["database.connections"] = connections;
  }

  bootEloquent() {
    console.log("bootEloquent", this.manager);
    Eloquent.setConnectionResolver(this.manager);

    // If we have an event dispatcher instance, we will go ahead and register it
    // with the Eloquent ORM, allowing for model callbacks while creating and
    // updating "model" instances; however, it is not necessary to operate.
    let dispatcher = this.getEventDispatcher();
    if (dispatcher) {
      Eloquent.setEventDispatcher(dispatcher);
    }
  }

  setFetchMode(fetchMode) {
    this.container["config"]["database.fetch"] =
      this.container["config"]["database.fetch"] || {};
    this.container["config"]["database.fetch"] = fetchMode;

    return this;
  }

  getDatabaseManager() {
    return this.manager;
  }

  getEventDispatcher() {
    if (this.container.bound("events")) {
      return this.container["events"];
    }
  }

  setEventDispatcher(dispatcher) {
    this.container.instance("events", dispatcher);
  }

  setupContainer(container) {
    this.container = container;

    if (!this.container.bound("config")) {
      this.container.instance("config", new Fluent());
    }
  }

  setAsGlobal() {
    this.constructor.$instance = this;
  }

  /**
   * @returns {Container}
   */
  getContainer() {
    return this.container;
  }

  /**
   *
   * @param {Container} container
   */
  setContainer(container) {
    this.container = container;
  }

  setDefault(name) {
    this.container["config"]["database.default"] = name;
  }
}
