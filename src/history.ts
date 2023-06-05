import lockr from "lockr";
import { episode_id } from "./dataTypes/episodes";
import { season_id } from "./dataTypes/seasons";
import { series_id } from "./dataTypes/series";

lockr.prefix = "VidEye";

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

export default class History {
    static enum: unknown;

    static getWatchTime(
        series: series_id,
        season: season_id,
        episode: episode_id,
        _default: number = 0
    ) {
        let match = this.getUnwatched(series, season, episode);
        return match?.[series]?.[season]?.[episode]?.["time"] ?? _default;
    }

    static setWatchTime(
        series: series_id,
        season: season_id,
        episode: episode_id,
        time: number,
        duration: number | null = null
    ) {
        let data = lockr.get(series.toString(), {});
        set(data, `${season}.${episode}`, { time, duration });
        lockr.set(series.toString(), data);
    }

    static setWatched(
        series: series_id,
        season: season_id,
        episode: episode_id
    ) {
        //
    }

    static setUnwatched(
        series: series_id,
        season: season_id,
        episode: episode_id
    ) {
        //
    }

    static isUnwatched(
        series: series_id | string,
        season: season_id | string | undefined,
        episode: episode_id | string | undefined,
        dictionary: any //{ seasons: { episodes: {} } } | { episodes: {} }
    ): boolean {
        //console.log(arguments);
        let data = lockr.get<{}>(series.toString(), undefined);
        let s: any = season && get(data, season.toString());
        let e = episode && get(s, episode.toString());

        // check if target exists in watched records
        let exists = series !== undefined;
        exists = Boolean(exists && ((season && s) || !season));
        exists = Boolean(exists && ((episode && e) || !episode));

        try {
            return (
                !exists ||
                (exists &&
                    season &&
                    Object.keys(dictionary[season]).filter((e) => !(e in s))
                        .length > 0 &&
                    !e) ||
                (exists &&
                    !season &&
                    Object.keys(dictionary?.seasons).every((s) =>
                        this.isUnwatched(
                            series,
                            s,
                            undefined,
                            dictionary?.seasons
                        )
                    ))
            );
        } catch (e) {
            // console.log(e);
            return false;
        }
    }

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
}
