import lockr from "lockr";
import { episode } from "./dataTypes/episodes";
import { season } from "./dataTypes/seasons";
import { series } from "./dataTypes/series";
import { video } from "./dataTypes/videos";
import { databases } from "./appwrite";
import { Query } from "appwrite";

lockr.prefix = "VidEye";

export type HistoryEntry = {
    video_id: video["id"];
    created_at: string;
    updated_at: string;
    time: number | null;
    videos?: video;
};

/** @see https://stackoverflow.com/a/52331580 source */
//type Unpacked<T> = T extends (infer U)[] ? U : T;

/*
function get(obj: {}, key: string, def?: any): unknown {
    return key
        .split(".")
        .reduce((o, x) => (o instanceof Object && x in o ? o[x] : def), obj);
}

function set(obj: {}, key: string, val: any) {
    key.split(".").reduce((o, x, idx, src) => {
        let end = !(src.length > ++idx);
        if (o instanceof Object && (!(x in o) || end)) {
            o[x] = end ? val : {};
        } else if (!(o instanceof Object)) {
            throw new Error(
                '"' +
                    src.slice(0, idx - 1).join(".") +
                    '" contains an non Object value! could not set value of path as a result'
            );
        }
        return end ? obj : o[x];
    }, obj);
    return obj;
}
*/

const databaseId = '671eb9f3000ca1862380';

export default class History {
    public static markSeriesAsWatched(series: series["id"]) {
        return databases.listDocuments(databaseId, import.meta.env.VITE_APP_APPWRITE_DATABASE_HISTORY, [
            Query.equal("episodes.seasons.series.id", series),
        ]).then((response) => {
            this.upsert(
                response.documents?.map((entry) =>
                    this.makeHistoryEntry(entry.video_id)
                ) ?? []
            );
        });
        /*
        return supabase
            .from("videos")
            .select("id, episodes(id, seasons(id, series(id)))")
            .filter("episodes.seasons.series.id", "eq", series)
            .then((result) => {
                this.upsert(
                    result.data?.map((video) =>
                        this.makeHistoryEntry(video.id)
                    ) ?? []
                );
                return result.data;
            });*/
    }

    public static markSeasonAsWatched(season: season["id"]) {
        return databases.listDocuments(databaseId, import.meta.env.VITE_APP_APPWRITE_DATABASE_HISTORY, [
            Query.equal("episodes.seasons.id", season),
        ]).then((response) => {
            this.upsert(
                response.documents?.map((entry) =>
                    this.makeHistoryEntry(entry.video_id)
                ) ?? []
            );
        });
        /*
        return supabase
            .from("videos")
            .select("id, episodes(id, seasons(id))")
            .filter("episodes.seasons.id", "eq", season)
            .then((result) => {
                this.upsert(
                    result.data?.map((video) =>
                        this.makeHistoryEntry(video.id)
                    ) ?? []
                );
                return result.data;
            });*/
    }

    public static markEpisodeAsWatched(
        episode: episode["id"],
        time: HistoryEntry["time"] = null
    ) {
        return databases.listDocuments(databaseId, import.meta.env.VITE_APP_APPWRITE_DATABASE_HISTORY, [
            Query.equal("episodes.id", episode),
        ]).then((response) => {
            this.upsert(
                response.documents?.map((entry) =>
                    this.makeHistoryEntry(entry.video_id, time)
                ) ?? []
            );
        });
    }

    public static markVideoAsWatched(
        video: video["id"],
        time: HistoryEntry["time"] = null
    ) {
        return this.upsert([this.makeHistoryEntry(video, time)]);
    }

    public static makeHistoryEntry(
        video: video["id"],
        time: HistoryEntry["time"] = null
    ): HistoryEntry {
        return {
            video_id: video,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            time: time
        };
    }

    protected static upsert(entries: Array<HistoryEntry>) {
        /*
        if (Supabase.isSignedIn()) {
            return supabase
                .from("history")
                .upsert(
                    entries.map(
                        (
                            entry: HistoryEntry & {
                                id?: number;
                                user_id?: string;
                            }
                        ) => ({
                            time: entry.time,
                            updated_at: new Date().toISOString(),
                            video_id: entry.video_id,
                            ...((entry.id ?? null) === null
                                ? {}
                                : { id: entry.id }),
                            ...((entry.user_id ?? null) === null
                                ? {}
                                : { user_id: entry.user_id })
                        })
                    ),
                    {
                        defaultToNull: false,
                        onConflict: "user_id, video_id",
                        ignoreDuplicates: false
                    }
                )
                .select()
                .then(*//*(result) => console.log(result)*//*);
} /* else {
const history = this.getLocalHistory();
entries = entries.map((entry) => {
const historyEntry =
history.find(
(historyEntry) =>
historyEntry.video_id === entry.video_id
) ?? history[history.push(entry) - 1];
historyEntry.time = entry.time;
historyEntry.updated_at = entry.updated_at;
return historyEntry;
});
this.setLocalHistory(history);
return history;
}*/
        return null;
    }

    public static getSeriesHistory(series: series["id"]) {
        //FIXME: check if user is signed in
        return databases.listDocuments(databaseId, import.meta.env.VITE_APP_APPWRITE_DATABASE_HISTORY, [
            Query.orderDesc("updated_at"),
        ]).then((response) => response.documents ?? []);
        /*
        if (Supabase.isSignedIn()) {
            return supabase
                .from("history")
                .select(
                    "id, videos(id, episodes(id, seasons(id, series(id))), movies(id))"
                )
                .order("updated_at", { ascending: false })
                .then((response) => response.data ?? []);
        } *//* else {
            const history = this.getLocalHistory();
            return supabase
                .from("videos")
                .select("id, episodes(id, seasons(id, series(id)))")
                .in(
                    "id",
                    this.getLocalHistory().map((entry) => entry.video_id)
                )
                .then((response) =>
                    response.data?.reduce((previousValue, currentValue) => {
                        previousValue.push(
                            ...history
                                .filter(
                                    (entry) =>
                                        entry.video_id === currentValue.id
                                )
                                .map((entry) => ({
                                    ...entry,
                                    videos: currentValue
                                }))
                        );
                        return previousValue;
                    }, [])
                );
        }*/
        return null;
    }

    public static getSeasonHistory(season: season["id"]) {
        //
    }

    public static getEpisodeHistory(episode: episode["id"]) {
        //
    }

    public static getVideoHistory(video: video["id"]) {
        //
    }

    public static getHistory() /*: PromiseLike<Array<HistoryEntry>>*/ {
        return this.getRemoteHistory();
        /*
            const history = this.getLocalHistory();
            return supabase
                .from("videos")
                .select("id, episodes(id, seasons(id, series(id)))")
                .in(
                    "id",
                    this.getLocalHistory().map((entry) => entry.video_id)
                )
                .then(
                    (response) =>
                        response.data?.reduce<
                            Omit<
                                Unpacked<
                                    Awaited<
                                        ReturnType<
                                            (typeof History)["getRemoteHistory"]
                                        >
                                    >
                                >,
                                "id" | "user_id"
                            >[]
                        >((previousValue, currentValue) => {
                            previousValue.push({
                                //"id": 1,
                                created_at: "",
                                time: null,
                                updated_at: "",
                                //"user_id": null,
                                video_id: 1,
                                videos: null
                            });
                            previousValue.push(
                                ...history
                                    .filter(
                                        (entry) =>
                                            entry.video_id === currentValue.id
                                    )
                                    .map((entry) => ({
                                        ...entry,
                                        videos: currentValue
                                    }))
                            );
                            return previousValue;
                        }, []) ?? []
                );
        */
        return null;
    }

    protected static getRemoteHistory() {
        return databases.listDocuments(databaseId, import.meta.env.VITE_APP_APPWRITE_DATABASE_HISTORY, [
            Query.orderDesc("updated_at")
        ]).then((response) => response.documents ?? []);
        /*
        return supabase
            .from("history")
            .select(
                "*, videos(id, ytid, episodes(id, title, seasons(id, series(id))), movies(id, title))"
            )
            .order("updated_at", { ascending: false })
            .then((response) => response.data ?? []);*/
    }

    protected static getLocalHistory() {
        return lockr.get<Array<HistoryEntry>>("history");
    }

    protected static setLocalHistory(history: Array<HistoryEntry>) {
        lockr.set("history", history);
    }

    /*
    static getNextUnwatched(
        series: series_id,
        season: season_id,
        episode: episode_id
    ) {
        //
    }

    static getNextAfter(
        series: series_id,
        season: season_id,
        episode: episode_id
    ) {
        //
    }

    static hasUnwatchedInSeason(
        series: series_id,
        season: season_id,
        episode: episode_id
    ) {
        //
    }

    static getUnwatched(): any;
    static getUnwatched(series: series_id): any;
    static getUnwatched(series: series_id, season: season_id): any;
    static getUnwatched(
        series: series_id,
        season: season_id,
        episode: episode_id
    ): any;
    static getUnwatched(
        series?: series_id,
        season?: season_id,
        episode?: episode_id
    ) {
        let result = {};
        let keys = series === undefined ? lockr.keys() : [series];
        keys.forEach((key) => {
            result[key] = lockr.get(key.toString()); //filter if season and episode is set
        });
        return result;
    }
    */
}
