import { isset, empty } from "locutus/php/var";
import Arr from "../../Support/Arr";
import { array_key_exists } from "locutus/php/array";
import Connection from "../Connection";
import PDOException from "../../../PHP/PDO/PDOException";
import InvalidArgumentException from "../../../PHP/Exceptions/InvalidArgumentException";

export default class ConnectionFactory {
  /**
   * The IoC container instance.
   * @type {\Illuminate\Contracts\Container\Container}
   */
  container = null;

  constructor(container) {
    this.container = container;
  }

  /**
   * Establish a PDO connection based on the configuration.
   * @param {object} config
   * @param {string|null} name
   * @returns {\Illuminate\Database\Connection}
   */
  make(config, name = null) {
    config = this.parseConfig(config, name);

    if (isset(config["read"])) {
      return this.createReadWriteConnection(config);
    }

    return this.createSingleConnection(config);
  }

  /**
   * Parse and prepare the database configuration.
   * @param {object} config
   * @param {string} name
   * @returns {object}
   */
  parseConfig(config, name) {
    return Arr.add(Arr.add(config, "prefix", ""), "name", name);
  }

  /**
   * Create a read / write database connection instance.
   * @param {object} config
   * @returns {\Illuminate\Database\Connection}
   */
  createReadWriteConnection(config) {
    let connection = this.createSingleConnection(this.getWriteConfig(config));

    return connection.setReadPdo(this.createReadPdo(config));
  }

  /**
   * Create a single database connection instance.
   * @param {object} config
   * @returns {\Illuminate\Database\Connection}
   */
  createSingleConnection(config) {
    let pdo = this.createPdoResolver(config);

    return this.createConnection(
      config["driver"],
      pdo,
      config["database"],
      config["prefix"],
      config
    );
  }

  createPdoResolver(config) {
    return array_key_exists("host", config)
      ? this.createPdoResolverWithHosts(config)
      : this.createPdoResolverWithoutHosts(config);
  }

  createPdoResolverWithHosts(config) {
    let $this = this;
    return function () {
      let hosts = $this.parseHosts(config);
      for (const [key, host] of Object.entries(Arr.shuffle(hosts))) {
        config["host"] = host;

        try {
          return this.createConnector(config).connect(config);
        } catch (e) {
          if (e instanceof PDOException) {
            continue;
          } else {
            throw e;
          }
        }
      }

      //throw e;
    }.bind(this);
  }

  parseHosts(config) {
    let hosts = Arr.wrap(config["host"]);

    if (empty(hosts)) {
      throw new InvalidArgumentException("Database hosts array is empty.");
    }

    return hosts;
  }

  createPdoResolverWithoutHosts(config) {
    return function () {
      return this.createConnector(config).connect(config);
    }.bind(this);
  }

  createConnector(config) {
    if (!isset(config["driver"])) {
      throw new InvalidArgumentException("A driver must be specified.");
    }

    let key = `db.connector.${config["driver"]}`;
    if (this.container.bound(key)) {
      return this.container.make(key);
    }

    switch (config["driver"]) {
      case "mysql":
        return new MySqlConnector();
      case "pgsql":
        return new PostgresConnector();
      case "sqlite":
        return new SQLiteConnector();
      case "sqlsrv":
        return new SqlServerConnector();
      default:
    }

    throw new InvalidArgumentException(
      `Unsupported driver [${config["driver"]}].`
    );
  }

  createConnection(driver, connection, database, prefix = "", config = {}) {
    let resolver = Connection.getResolver(driver);
    if (resolver) {
      return resolver(connection, database, prefix, config);
    }

    switch (driver) {
      case "mysql":
        return new MySqlConnection(connection, database, prefix, config);
      case "pgsql":
        return new PostgresConnection(connection, database, prefix, config);
      case "sqlite":
        return new SQLiteConnection(connection, database, prefix, config);
      case "sqlsrv":
        return new SqlServerConnection(connection, database, prefix, config);
      default:
    }

    throw new InvalidArgumentException(`Unsupported driver [${driver}].`);
  }
}
