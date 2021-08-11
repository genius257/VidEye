import Connector from "../../Illuminate/database/connectors/Connector";
import { empty } from "locutus/php/var";
import Firebase from "../../JSDO/Firebase";

export default class FirebaseConnector extends Connector {
  connect(config) {
    const dsn = config; //this.getDsn(config);

    const options = this.getOptions(config);

    // We need to grab the PDO options that should be used while making the brand
    // new connection instance. The PDO options control various aspects of the
    // connection's behavior, and some might be specified by the developers.
    const connection = this.createConnection(dsn, config, options);

    if (!empty(config["database"])) {
      connection.exec("use `{$config['database']}`;");
    }

    //this.configureEncoding(connection, config);

    // Next, we will check to see if a timezone has been specified in this config
    // and if it has we will issue a statement to modify the timezone with the
    // database. Setting this DB timezone is an optional configuration item.
    //this.configureTimezone(connection, config);

    //this.setModes(connection, config);

    return connection;
  }

  createPdoConnection(dsn, username, password, options) {
    return new Firebase(dsn, username, password, options);
  }
}
