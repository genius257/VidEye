import JSDOStatement from "./JSDOStatement";
import Firebase from "./Firebase";

export class FirebaseStatement extends JSDOStatement {
  /**
   * @type {Firebase}
   */
  jsdo;

  execute(input_parameters = null) {
    let firestore = this.jsdo.firebase.firestore();
    let table = firestore.collection(this.queryString.from);
    this.result = table.get().then(querySnapshot => {
      this.result = querySnapshot;
      return querySnapshot;
    });
    return true;
  }

  fetchAll(fetch_style, fetch_argument, ctor_args = []) {
    return this.result;
  }
}
