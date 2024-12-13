import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

import Video from "./video";
//import History from "../history";
import Card from "../card";
import Poster from "../components/Poster";
import { databases } from "../appwrite";
import { Models, Query } from "appwrite";
import { Season, Series } from "../types/models";

type SeriesState = {
    seasons: Season[] | {};
    series: Series | null;
};

const databaseId = "671eb9f3000ca1862380";

const collectionIds = {
    series: "671ec7fb000b3517b7e6",
    seasons: "671ecb800036fac028e0",
    movies: "671ec5e1002943b28df8",
    history: "671eca420003af618870",
    episodes: "671ec5a900219da44149",
};

export default function () {
    const { id, season, episode } = useParams<{
        id: string;
        season: string;
        episode: string;
    }>();

    const [series, setSeries] = useState<SeriesState["series"]>(null);
    const [seasondata, setSeasonData] = useState<Season | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Anything in here is fired on component mount.
        getSeries()?.then((response) => {
            setSeries(response.documents[0] ?? null);
        });

        // return function to save watch progress to history
    }, []);

    useEffect(() => {
        if (season === undefined) {
            return;
        }

        databases
            .getDocument(databaseId, collectionIds.seasons, season)
            .then((response) => {
                setSeasonData(response as Season);
            });
    }, [season]);

    const getSeries = function ():
        | Promise<Models.DocumentList<Series>>
        | undefined {
        if (id === undefined) {
            return;
        }
        return databases.listDocuments(databaseId, collectionIds.series, [
            Query.equal("$id", id),
            Query.limit(1),
        ]);
        /*
        return supabase
            .from("series")
            .select("*, seasons(*, episodes (*, videos (*)))")
            .eq("id", this.props.match.params.id)
            .single()
            .then();*/
    };

    if (id === undefined) {
        return <>hello</>; //FIXME: shouldn't happen
    }

    if (season === undefined) {
        return (
            <>
                <h1>{series?.title}</h1>
                <div className="horizontal-list">
                    {series?.seasons?.map((season) => (
                        <Link to={`./${season.$id}/`} key={season.$id}>
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
        );
    }

    if (episode === undefined) {
        return (
            <div x-className="horizontal-list" className="flex flex-wrap gap-4">
                <div>
                    <Poster
                        image={`url('https://image.tmdb.org/t/p/w300/${seasondata?.poster}')`}
                    />
                </div>
                {(
                    seasondata?.episodes?.toSorted(
                        (a, b) => a.episode - b.episode,
                    ) ?? []
                ).map((episode) => {
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
                        <Link to={`./${episode.$id}/`} key={episode.$id}>
                            <Card
                                /*marked={History.isUnwatched(
                                this.props.match.params
                                    .id,
                                routeProps.match.params
                                    .season,
                                episode,
                                this.state.seasons
                            )}*/
                                image={`url('https://img.youtube.com/vi/${episode?.video?.ytid}/mqdefault.jpg')`}
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
                            <div>{episode.title}</div>
                            <div>Episode {episode.episode}</div>
                        </Link>
                    );
                })}
            </div>
        );
    }

    /*
    const season = [series?.seasons ?? []]
        .flat()
        .find(
            (season) => season.id.toString() === routeProps.match.params.season
        );
    const episode = [season?.episodes ?? []]
        .flat()
        .find(
            (episode) =>
                episode.id.toString() === routeProps.match.params.episode
        );
    const video = [episode?.videos ?? []].flat()[0];
    */

    const _episode = seasondata?.episodes?.find(
        (_episode) => _episode.$id === episode,
    );

    return (
        <Video
            id="ytplayer"
            title="ytplayer"
            autoplay
            controls
            disablekb
            fs
            modestbranding
            origin="http://localhost"
            VIDEO_ID={_episode?.video.ytid}
            yt={{
                className: "w-full",
                iframeClassName: "w-full h-full aspect-video",
                onEnd: (e: unknown) => {
                    const episodes = seasondata?.episodes?.toSorted(
                        (a, b) => a.episode - b.episode,
                    );
                    const nextId =
                        episodes?.[
                            episodes?.findIndex(
                                (_episode) => _episode.$id === episode,
                            ) + 1
                        ]?.$id;
                    if (nextId !== undefined) {
                        navigate(`../${nextId}/`, {
                            preventScrollReset: true,
                            relative: "path",
                            flushSync: true,
                        });
                    }
                },
            }}
        />
    );
}
