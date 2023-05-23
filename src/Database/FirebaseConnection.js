import Connection from "../../merchant/Illuminate/Database/Connection";
import FirebaseGrammar from "./Query/Grammars/FirebaseGrammar";

export default class FirebaseConnection extends Connection {
  //schemaGrammar = FirebaseGrammar;
  getDefaultQueryGrammar() {
    return new FirebaseGrammar();
  }
}
