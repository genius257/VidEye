import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/firestore";
import JSDO from "./JSDO";
import { FirebaseStatement } from "./FirebaseStatement";

export default class Firebase extends JSDO {
  firebase;

  transaction;

  constructor(dsn, username, passwd, options) {
    super(...arguments);
    this.firebase = firebase.initializeApp(dsn, dsn.name);
  }

  /**
   * @inheritdoc
   */
  createStatement(pdo) {
    return new FirebaseStatement(pdo);
  }

  beginTransaction() {
    //https://firebase.google.com/docs/firestore/manage-data/transactions
    throw new Error("transactions with firebase not yet supported");
  }

  prepare() {
    console.log("prepare: ", arguments);
    return super.prepare(...arguments);
  }
}
