import Episode from "./Episode";
import Manager from "../../merchant/Illuminate/Database/Capsule/Manager";
import Connection from "../../merchant/Illuminate/Database/Connection";
import PDO from "../../merchant/PHP/PDO/PDO";
import _firebase from "../Firebase";
import JSDO from "../JSDO/JSDO";
import app from "../bootstrap/app";
import FirebaseConnector from "../Database/Connectors/FirebaseConnector";
import FirebaseConnection from "../Database/FirebaseConnection";

it("constructor", () => {
  let episode = new Episode({ title: "anna and the sheep" });
  expect(episode.getAttribute("title")).toBe("anna and the sheep");
});
/*
it("newFromBuilder", () => {
  let episode = new Episode();

  episode = episode.newFromBuilder({ a: 1 });
  expect(episode.toJson()).toBe('{\n    "a": 1\n}');
});
*/
it("query", () => {
  //Connection.resolverFor("mysql", () => new Connection(new PDO()));
  /*
  Connection.resolverFor("firebase", (connection, database, prefix, config) => {
    //console.log({ connection, database, prefix, config });
    //throw new Error("magic");
    return new Connection(connection, database, prefix, config); //new Connection(_firebase.firestore())
  });

  let capsule = new Manager();
  */
  /*
  capsule.addConnection({
    driver: "mysql",
    host: "127.0.0.1",
    database: "acl",
    username: "root",
    password: ""
  });
  */
  /*
  capsule.addConnection({
    driver: "firebase"
  });
  capsule.addConnection(
    {
      driver: "googleapis",
      table: "youtube"
    },
    "youtube"
  );

  //Make this Capsule instance available globally.
  capsule.setAsGlobal();

  // Setup the Eloquent ORM.
  capsule.bootEloquent();

  capsule.getContainer().bind("db.connector.firebase", function() {
    throw new Error("魔法");
  });
  */

  app.bind("db.connector.firebase", function () {
    return new FirebaseConnector();
    throw new Error("魔法");
  });

  Connection.resolverFor("firebase", (connection, database, prefix, config) => {
    return new FirebaseConnection(connection, database, prefix, config);
    //console.log({ connection, database, prefix, config });
    //throw new Error("magic");
    return new Connection(connection, database, prefix, config); //new Connection(_firebase.firestore())
  });

  Episode.where("name", "test")
    .get()
    .then((episodes) => {
      expect(episodes.count()).toBe(0);
    });
});
