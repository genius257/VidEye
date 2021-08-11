import Manager from "../../merchant/Illuminate/Database/Capsule/Manager";
import Connection from "../../merchant/Illuminate/Database/Connection";
import Dispatcher from "../../merchant/Illuminate/Events/Dispatcher";

const capsule = new Manager();

//Make this Capsule instance available globally.
capsule.setAsGlobal();

capsule.setEventDispatcher(new Dispatcher());

// Setup the Eloquent ORM.
capsule.bootEloquent();

capsule
  .getContainer()
  .make("config")
  .set("database", require("../config/database"));

let config = require("../config/database");

// TODO: change fetchmode

capsule.setDefault(config.default || "default");
for (const [key, value] of Object.entries(config.connections || [])) {
  capsule.addConnection(value, key);
}

/*
Connection.resolverFor("firebase", (connection, database, prefix, config) => {
  //console.log({ connection, database, prefix, config });
  //throw new Error("magic");
  return new Connection(connection, database, prefix, config); //new Connection(_firebase.firestore())
});
*/
/*
capsule.getContainer().bind("db.connector.firebase", function() {
  throw new Error("魔法");
});
*/

export { capsule as Manager };

export default capsule.getContainer();
