import lockr from "lockr";

lockr.prefix = "VidEye";

function get(obj, key, def) {
    return key
        .split(".")
        .reduce((o, x) => (o instanceof Object && x in o ? o[x] : def), obj);
}

function set(obj, key, val) {
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
    static enum;

    static getWatchTime(series, season, episode, _default = 0) {
        let match = this.getUnwatched(series, season, episode);
        return match?.[series]?.[season]?.[episode]?.["time"] ?? _default;
    }

    static setWatchTime(series, season, episode, time, duration = null) {
        let data = lockr.get(series, {});
        set(data, `${season}.${episode}`, { time, duration });
        lockr.set(series, data);
    }

    static setWatched(series, season, episode) {
        //
    }

    static setUnwatched(series, season, episode) {
        //
    }

    static isUnwatched(series, season, episode, dictionary) {
        return false;
        //console.log(arguments);
        let data = lockr.get(series, undefined);
        let s = season && get(data, season);
        let e = episode && get(s, episode);

        // check if target exists in watched records
        let exists = series !== undefined;
        exists = exists && ((season && s) || !season);
        exists = exists && ((episode && e) || !episode);

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
                    Object.keys(dictionary.seasons).every((s) =>
                        this.isUnwatched(
                            series,
                            s,
                            undefined,
                            dictionary.seasons
                        )
                    ))
            );
        } catch (e) {
            // console.log(e);
        }
    }

    static getNextUnwatched(series, season, episode) {
        //
    }

    static getNextAfter(series, season, episode) {
        //
    }

    static hasUnwatchedInSeason(series, season, episode) {
        //
    }

    static getUnwatched(series, season, episode) {
        let result = {};
        let keys = series === undefined ? lockr.keys() : [series];
        keys.forEach((key) => {
            result[key] = lockr.get(key); //filter if season and episode is set
        });
        return result;
    }
}
