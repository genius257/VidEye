import Connection from "../Illuminate/database/Connection";
import FirebaseGrammar from "./Query/Grammars/FirebaseGrammar";

export default class FirebaseConnection extends Connection {
  //schemaGrammar = FirebaseGrammar;
  getDefaultQueryGrammar() {
    return new FirebaseGrammar();
  }
}
