import app from "../bootstrap/app";
import Series from "./Series";
import Firestore from "../Firebase/Firestore";

it("works with firestore", function () {
  return Firestore.collection("series")
    .get()
    .then((querySnapshot) => {
      const instance = Series.newModelInstance();
      const collection = instance.newCollection();
      querySnapshot.forEach((document) => {
        collection.push(instance.newFromBuilder(document));
      });
      expect(collection).toBe("test");
    });
  //expect(Series.where("a", "b").toSql()).toBe("");
});
