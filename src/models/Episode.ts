import {
    Model,
    ProxyIt
} from "../../merchant/Illuminate/Database/Eloquent/Model";

export class Episode extends Model {
    protected $fillable = ["title"];

    isWatched(): boolean {
        return false; //FIXME: implement
    }

    inProgress() {
        //
    }

    isWatchedOrInProgress() {
        return this.isWatched() || this.inProgress();
    }

    getProgress() {
        return (
            this.getAttribute("progress") ||
            this.setAttribute(
                "progress",
                this.constructor
                    //@ts-expect-error
                    .resolveConnection("youtube")
                    .table("videos")
                    .where("id", this.getAttribute("YTID"))
                    .where("part", "contentDetails")
                    .first()
            ).getAttribute("progress")
        );
    }
}

export default ProxyIt(Episode);
