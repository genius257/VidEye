import React, { useEffect } from "react";
import {
    HashRouter,
    //Switch,
    Route,
    Link,
    Routes,
    useParams
} from "react-router-dom";

import Video from "./video";
//import History from "../history";
import Card from "../card";
//import moment from "moment";
import Poster from "../components/Poster";
import { databases } from "../appwrite";
import { Query } from "appwrite";

type SeriesState = {
    seasons: {};
    series: Awaited<ReturnType<Series["getSeries"]>>["data"];
};

const databaseId = "671eb9f3000ca1862380";

const collectionIds = {
    series: "671ec7fb000b3517b7e6",
    movies: "671ec5e1002943b28df8",
    history: "671eca420003af618870"
};

export default function Series() {
    const { id, season, episode } = useParams<{
        id: string;
        season: string;
        episode: string;
    }>();
    const [seasons, setSeasons] = React.useState<SeriesState["seasons"]>({});
    const [series, setSeries] = React.useState<SeriesState["series"]>(null);
    const [end, setEnd] = React.useState<boolean>(false);

    useEffect(() => {
        // Anything in here is fired on component mount.
        getSeries().then((response) => {
            setSeries(response.data);
        });
    }, []);

    const getSeries = function () {
        if (id === undefined) {
            return;
        }
        return databases.listDocuments(databaseId, collectionIds.series, [
            Query.equal("id", id),
            Query.limit(1)
        ]);
        return supabase
            .from("series")
            .select("*, seasons(*, episodes (*, videos (*)))")
            .eq("id", this.props.match.params.id)
            .single()
            .then();
    };

    const _seasons = [series?.seasons ?? []].flat();

    return (
        <div>
            <HashRouter>
                <Routes>
                    <Route
                        path="/series/:id/"
                        element={(routeProps) => (
                            <>
                                <h1>{this.state.series?.title}</h1>
                                <div className="horizontal-list">
                                    {seasons.map((season) => (
                                        <Link
                                            to={`./${season.id}/`}
                                            key={season.id}
                                        >
                                            <Poster
                                                /*marked={History.isUnwatched(
                                                        this.state.series?.id,
                                                        season.id,
                                                        undefined,
                                                        this.state.series
                                                            ?.seasons
                                                    )}*/
                                                image={`url('https://image.tmdb.org/t/p/w300/${season.poster}')`}
                                            />
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}
                    />
                    <Route
                        path="/series/:id/:season/"
                        render={(routeProps) => {
                            return (
                                <div className="horizontal-list">
                                    {[
                                        _seasons.find(
                                            (season) =>
                                                season.id.toString() ===
                                                routeProps.match.params.season
                                        )?.episodes ?? []
                                    ]
                                        .flat()
                                        .map((episode) => {
                                            /*let watch = {
                                            time: History.getWatchTime(
                                                this.props.match.params.id,
                                                routeProps.match.params.season,
                                                episode,
                                                0
                                            ),
                                            totalTime: 0
                                        };*/

                                            return (
                                                <Link
                                                    to={`./${episode.id}/`}
                                                    key={episode.id}
                                                >
                                                    <Card
                                                        /*marked={History.isUnwatched(
                                                        this.props.match.params
                                                            .id,
                                                        routeProps.match.params
                                                            .season,
                                                        episode,
                                                        this.state.seasons
                                                    )}*/
                                                        image={`url('https://img.youtube.com/vi/${
                                                            [
                                                                episode.videos ??
                                                                    []
                                                            ].flat()?.[0]?.ytid
                                                        }/mqdefault.jpg')`}
                                                        /*progress={
                                                        History.isUnwatched(
                                                            this.props.match
                                                                .params.id,
                                                            routeProps.match
                                                                .params.season,
                                                            episode,
                                                            this.state.seasons
                                                        )
                                                            ? undefined
                                                            : `${Math.round(
                                                                  (watch.time /
                                                                      watch.totalTime) *
                                                                      100
                                                              )}%`
                                                    }
                                                    */
                                                    />
                                                </Link>
                                            );
                                        })}
                                </div>
                            );
                        }}
                    />
                    <Route
                        path="/series/:id/:season/:episode/"
                        render={(routeProps) => {
                            const season = [series?.seasons ?? []]
                                .flat()
                                .find(
                                    (season) =>
                                        season.id.toString() ===
                                        routeProps.match.params.season
                                );
                            const episode = [season?.episodes ?? []]
                                .flat()
                                .find(
                                    (episode) =>
                                        episode.id.toString() ===
                                        routeProps.match.params.episode
                                );
                            const video = [episode?.videos ?? []].flat()[0];

                            return video !== undefined ? (
                                <Video
                                    id="ytplayer"
                                    title="ytplayer"
                                    autoplay
                                    controls
                                    disablekb
                                    fs
                                    modestbranding
                                    origin="https://kztbl.codesandbox.io"
                                    VIDEO_ID={video.ytid}
                                    yt={{
                                        onEnd: (e: unknown) => {
                                            setEnd(true);
                                            let season = seasons[season];
                                            let episode =
                                                routeProps.match.params.episode;
                                            let episodes =
                                                Object.keys(season).sort();
                                            let episodeIndex =
                                                episodes.indexOf(episode);
                                            this.props.history.push(
                                                episodes[episodeIndex + 1] ===
                                                    undefined
                                                    ? ".."
                                                    : `../${
                                                          episodes[
                                                              episodeIndex + 1
                                                          ]
                                                      }/`
                                            );
                                        }
                                    }}
                                />
                            ) : null;
                        }}
                    />
                </Routes>
            </HashRouter>
        </div>
    );
}
