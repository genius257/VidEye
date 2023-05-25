import {
    Model,
    ProxyIt
} from "../../merchant/Illuminate/Database/Eloquent/Model";

export class Series extends Model {
  fillable = ["title"];

    /**
     * Check if Series has been watched 100%
     */
    isWatched(): boolean {
        return false;
    }

    /**
     * Check if series has been partially watched
     */
    inProgress(): boolean {
        return false;
    }

    /**
     * Check if series has been partially or 100% watched
     */
    isWatchedOrInProgress(): boolean {
        return this.isWatched() || this.inProgress();
    }

    getUnwatched(): any[] {
        return [];
    }

    getUnwatchedCount() {
        return this.getUnwatched().length;
    }

    getProgress() {
        return (
            this.getAttribute("progress") ||
            this.setAttribute(
                "progress",
                (<typeof Series>this.constructor)
                    .resolveConnection("youtube")
                    .table("videos")
                    .where("id", this.getAttribute("YTID"))
                    .where("part", "contentDetails")
                    .first()
            ).getAttribute("progress")
        );
    }
}

export default ProxyIt(Series);

//FIXME: remove when done debugging
require("../../src/bootstrap/app");
//import app from "../../src/bootstrap/app";
//console.log(app.$resolved);

const Z = ProxyIt(Series);

console.log("Model.$resolver", Model.getConnectionResolver());
console.log("Z.$resolver", Z.getConnectionResolver());

const instance = Z.newModelInstance();
const collection = instance.newCollection();
[{}, {}, {}].forEach((document) => {
    collection.push(instance.newFromBuilder(document));
});
