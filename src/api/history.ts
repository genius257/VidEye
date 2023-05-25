import lockr from "lockr";
import { Model } from "../../merchant/Illuminate/Database/Eloquent/Model";
import Arr from "../../merchant/Illuminate/Support/Arr";
import Firebase from "../Firebase/Firebase";

lockr.prefix = "VidEye_";

export default class History {
    public static async isWatched(id: string): Promise<boolean> {
        return this.get(id).then();
    }

    public static async isUnWatched(id: string): Promise<boolean> {
        return !(await this.isWatched(id));
    }

    public static async setWatched(id: string): Promise<boolean> {
        return this.getWatched(id).then((history) => {
            history.watched = true;
            history.time = history.duration;

            return this.set(id, history);
        });
    }

    /**
     * Generates a new history entry.
     */
    public static generateEntry() {
        return {
            watched: false,
            time: 0
        };
    }

    /**
     * Retrives history entry with specified id from storage or returns a new instance if none exists.
     * @param id History entry id
     */
    protected static async getWatched(id: string) {
        return this.get(id).then((history) => history ?? this.generateEntry());
    }

    protected static async get(key: string): Promise<any> {
        if (Firebase.isSignedIn()) {
            //NOTE: When getting from firbase history, should cache it instead of calling firebase constantly?
            throw new Error("Not implemented"); //FIXME
        } else {
            const history = lockr.get("history", {});
            return Arr.get(history, key, null);
        }
    }

    protected static async set(key: string, value: any): Promise<boolean> {
        if (Firebase.isSignedIn()) {
            throw new Error("Not implemented"); //FIXME
        } else {
            const history = lockr.get("history", {});
            Arr.set(history, key, value);
            lockr.set("history", history);

            return true;
        }
    }
}
