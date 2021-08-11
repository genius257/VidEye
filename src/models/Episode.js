import {
  Model,
  ProxyIt
} from "../../merchant/Illuminate/Database/Eloquent/Model";

export class Episode extends Model {
  fillable = ["title"];

  isWatched() {
    //
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
          .resolveConnection("youtube")
          .table("videos")
          .where("id", this.YTID)
          .where("part", "contentDetails")
          .first()
      ).getAttribute("progress")
    );
  }
}

export default ProxyIt(Episode);
