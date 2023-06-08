import lockr from "lockr";
import { episode_id } from "./dataTypes/episodes";
import { season_id } from "./dataTypes/seasons";
import { series_id } from "./dataTypes/series";
import { video, video_id } from "./dataTypes/videos";
import supabase from "./Supabase";
import Supabase from "./Supabase/Supabase";

lockr.prefix = "VidEye";

export type HistoryEntry = {
    video_id: video_id;
    created_at: number;
    updated_at: number;
    time: number | null;
    video?: video;
};

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

export default class History {
    public static markSeriesAsWatched(series: series_id) {
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
            });
    }

    public static markSeasonAsWatched(season: season_id) {
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
            });
    }

    public static markEpisodeAsWatched(episode: episode_id) {
        return supabase
            .from("videos")
            .select("id, episodes(id)")
            .filter("episodes.id", "eq", episode)
            .then((result) => {
                this.upsert(
                    result.data?.map((video) =>
                        this.makeHistoryEntry(video.id as video_id)
                    ) ?? []
                );
                return result.data;
            });
    }

    public static markVideoAsWatched(video: video_id) {
        return this.upsert([this.makeHistoryEntry(video)]);
    }

    public static makeHistoryEntry(
        video: video_id,
        time: HistoryEntry["time"] = null
    ): HistoryEntry {
        return {
            video_id: video,
            created_at: Date.now(),
            updated_at: Date.now(),
            time: time
        };
    }

    protected static upsert(entries: Array<HistoryEntry>) {
        if (Supabase.isSignedIn()) {
            return supabase
                .from("history")
                .upsert(
                    entries.map<Partial<HistoryEntry> & { id: number | null }>(
                        (entry: HistoryEntry & { id?: number }) => ({
                            time: entry.time,
                            updated_at: Date.now(),
                            video_id: entry.video_id,
                            id: entry.id ?? null
                        })
                    )
                )
                .select();
        } else {
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
        }
    }

    public static getSeriesHistory(series: series_id) {
        if (Supabase.isSignedIn()) {
            return supabase
                .from("history")
                .select(
                    "id, videos(id, episodes(id, seasons(id, series(id))))"
                );
        } else {
            const history = this.getLocalHistory();
            return supabase
                .from("videos")
                .select("id, episodes(id, seasons(id, series(id)))")
                .in(
                    "id",
                    this.getLocalHistory().map((entry) => entry.video_id)
                )
                .then((response) =>
                    response.data?.reduce<
                        Array<
                            HistoryEntry & {
                                videos: {
                                    id: video_id;
                                    seasons: {
                                        id: season_id;
                                        series: { id: series_id };
                                    };
                                };
                            }
                        >
                    >((previousValue, currentValue) => {
                        previousValue.push(
                            ...history
                                .filter(
                                    (entry) =>
                                        entry.video_id === currentValue.id
                                )
                                .map((entry) => ({
                                    ...entry,
                                    videos: currentValue as unknown as {
                                        id: video_id;
                                        seasons: {
                                            id: season_id;
                                            series: { id: series_id };
                                        };
                                    }
                                }))
                        );
                        return previousValue;
                    }, [])
                );
        }
    }

    public static getSeasonHistory(season: season_id) {
        //
    }

    public static getEpisodeHistory(episode: episode_id) {
        //
    }

    public static getVideoHistory(video: video_id) {
        //
    }

    public static getHistory(): PromiseLike<Array<HistoryEntry>> {
        if (Supabase.isSignedIn()) {
            return supabase
                .from("history")
                .select("*, videos(id, episodes(id, seasons(id, series(id))))")
                .then(
                    (response) => (response.data as HistoryEntry[] | null) ?? []
                );
        } else {
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
                            Array<
                                HistoryEntry & {
                                    videos: {
                                        id: video_id;
                                        seasons: {
                                            id: season_id;
                                            series: { id: series_id };
                                        };
                                    };
                                }
                            >
                        >((previousValue, currentValue) => {
                            previousValue.push(
                                ...history
                                    .filter(
                                        (entry) =>
                                            entry.video_id === currentValue.id
                                    )
                                    .map((entry) => ({
                                        ...entry,
                                        videos: currentValue as unknown as {
                                            id: video_id;
                                            seasons: {
                                                id: season_id;
                                                series: { id: series_id };
                                            };
                                        }
                                    }))
                            );
                            return previousValue;
                        }, []) ?? []
                );
        }
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
