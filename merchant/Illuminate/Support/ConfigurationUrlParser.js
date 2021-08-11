import { array_map, array_merge } from "locutus/php/array";
import Arr from "./Arr";
import { is_string } from "locutus/php/var";

export default class ConfigurationUrlParser {
  /**
   * The drivers aliases map.
   * @type {object}
   */
  static $driverAliases = {
    mssql: "sqlsrv",
    mysql2: "mysql", // RDS
    postgres: "pgsql",
    postgresql: "pgsql",
    sqlite3: "sqlite"
  };

  /**
   * Parse the database configuration, hydrating options using a database configuration URL if possible.
   * @param {object|string} config
   * @returns {object}
   */
  parseConfiguration(config) {
    if (is_string(config)) {
      config = { url: config };
    }

    let url = Arr.pull(config, "url");

    if (!url) {
      return config;
    }

    let rawComponents = this.parseUrl(url);

    let decodedComponents = this.parseStringsToNativeTypes(
      array_map("rawurldecode", rawComponents)
    );

    return array_merge(
      config,
      this.getPrimaryOptions(decodedComponents),
      this.getQueryOptions(rawComponents)
    );
  }
}
