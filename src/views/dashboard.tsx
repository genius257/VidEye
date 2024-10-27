import React from "react";
import { /*HashRouter, Switch, Route,*/ Link } from "react-router-dom";
//import moment from "moment";

import History /*, { HistoryEntry }*/ from "../history";
import Card from "../card";
import Poster from "../components/Poster";
import supabase from "../Supabase";
//import { series } from "../dataTypes/series";

type DashboardState = {
    series: Awaited<ReturnType<Dashboard["getSeries"]>>;
    movies: Awaited<ReturnType<Dashboard["getMovies"]>>;
    //watched: unknown;
    history: Awaited<ReturnType<(typeof History)["getHistory"]>>;
};

export default class Dashboard extends React.Component<{}, DashboardState> {
    state: DashboardState = {
        series: [],
        movies: [],
        history: []
    };

    componentDidMount() {
        this.loadWatched();

        this.getSeries().then((result) => this.setState({ series: result }));

        this.getMovies().then((result) => this.setState({ movies: result }));
    }

    getSeries() {
        return supabase
            .from("series")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10)
            .then((response) => response.data ?? []);
    }

    getMovies() {
        return supabase
            .from("movies")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10)
            .then((result) => result.data ?? []);
    }

    loadWatched() {
        History.getHistory()?.then((history) => {
            console.log(history);
            this.setState({ history });
        });
        /*
        let watched = History.getUnwatched();
        console.log(watched, this.state.series);
        let jobs: Array<Promise<number | Response>> = [];
        let result: Array<{
            series: string;
            season: string;
            episode: string;
            time: number;
            totalTime: number;
        }> = [];
        const seriesIds = [];
        const seasonIds = [];
        const episodeIds = [];
        Object.keys(watched).forEach((series) =>
            Object.keys(watched[series]).forEach((season) =>
                Object.keys(watched[series][season]).forEach((episode) => {
                    let YTID =
                        this.state.series[series].seasons[season][episode].YTID;
                    //TODO: currently the order of the watched state array value is in an undertermanistic order due to async behavior. An index needs to be assigned, upon promise creation, to assign the result to the appropriate index.
                    jobs.push(
                        fetch(
                            `https://www.googleapis.com/youtube/v3/videos?id=${YTID}&part=contentDetails&key=${import.meta.env.VITE_APP_GOOGLE_CLOUD_API_KEY}`
                        )
                            .then((response) => response.json())
                            .then((json) =>
                                result.push({
                                    series,
                                    season,
                                    episode,
                                    time: watched[series][season][episode][
                                        "time"
                                    ],
                                    totalTime: Math.max(
                                        moment
                                            .duration(
                                                json?.items?.[0]?.contentDetails
                                                    ?.duration ?? 0
                                            )
                                            .asSeconds(),
                                        watched[series][season][episode][
                                            "duration"
                                        ]
                                    )
                                })
                            )
                    );
                })
            )
        );
        return Promise.all(jobs).then((values) =>
            this.setState({ watched: result })
        );
        */
    }

    componentDidCatch(error: any, errorInfo: any) {
        // You can also log the error to an error reporting service
        console.log(error, errorInfo);
    }

    render() {
        return (
            <React.Fragment>
                {this.state.history?.length ?? 0 > 0 ? (
                    <React.Fragment>
                        <h2>Continue watching</h2>
                        <div className="horizontal-list">
                            {this.state.history?.map((watch) => {
                                const video = [watch.videos ?? []].flat()[0];
                                const episode = [
                                    video?.episodes ?? []
                                ].flat()[0];
                                const season = [
                                    episode?.seasons ?? []
                                ].flat()[0];
                                const series = [season?.series ?? []].flat()[0];
                                const movie = [video?.movies ?? []].flat()[0];

                                return (
                                    <Link
                                        to={
                                            movie !== undefined
                                                ? `/movies/${movie.id}/`
                                                : `/series/${series?.id}/${season?.id}/${episode?.id}/`
                                        }
                                        key={
                                            movie !== undefined
                                                ? `/movies/${movie.id}/`
                                                : `${series?.id}/${season?.id}/${episode?.id}`
                                        }
                                        title={
                                            movie !== undefined
                                                ? movie.title
                                                : episode?.title
                                        }
                                    >
                                        <Card
                                            image={`url('https://img.youtube.com/vi/${video?.ytid}/mqdefault.jpg')`}
                                            progress={`${Math.round(
                                                ((watch.time ?? 0) /
                                                    /*watch.totalTime*/ 0) *
                                                    100
                                            )}%`}
                                        />
                                    </Link>
                                );
                            })}
                        </div>
                    </React.Fragment>
                ) : null}
                <h2>Recently added shows</h2>
                <div className="horizontal-list">
                    {this.state.series.map((series) => (
                        <Link to={`/series/${series.id}/`} key={series.id}>
                            <Poster
                                marked={
                                    !this.state.history?.some((entry) =>
                                        [
                                            [entry.videos ?? []].flat()?.[0]
                                                ?.episodes ?? []
                                        ]
                                            .flat()
                                            .some(
                                                (episode) =>
                                                    [
                                                        [
                                                            episode?.seasons ??
                                                                []
                                                        ].flat()?.[0]?.series ??
                                                            []
                                                    ].flat()?.[0]?.id ===
                                                    series.id
                                            )
                                    )
                                }
                                image={
                                    "url('https://image.tmdb.org/t/p/w300/" +
                                    series.poster +
                                    "')"
                                }
                                title={series.title}
                            />
                        </Link>
                    ))}
                </div>
                <h2>Recently added movies</h2>
                <div className="horizontal-list">
                    {this.state.movies.map((movie) => (
                        <Link to={`/movies/${movie.id}/`} key={movie.id}>
                            <Poster
                                marked={true}
                                image={
                                    "url('https://image.tmdb.org/t/p/w300/" +
                                    movie.poster +
                                    "')"
                                }
                                title={movie.title}
                            />
                        </Link>
                    ))}
                </div>
                <h2>Dramas</h2>
                <div className="horizontal-list">
                    <Poster marked />
                    <Poster marked />
                    <Poster marked />
                    <Poster marked />
                </div>
                <h2>YouTube Originals</h2>
                <div className="horizontal-list">
                    <Poster marked />
                    <Poster marked />
                    <Poster marked />
                    <Poster marked />
                </div>
                <h2>Grid</h2>
                <div className="grid-list">
                    <Poster
                        marked
                        image={
                            "url(https://www.themoviedb.org/t/p/original/6JOlFNNVXprII3fSX0t330GHkau.jpg)"
                        }
                    />
                    <Poster
                        marked
                        image={
                            "url(https://www.themoviedb.org/t/p/original/nDMtG1NwnpA3rPDld38BvWRsVf.jpg)"
                        }
                    />
                    <Poster
                        marked
                        image={
                            "url(https://www.themoviedb.org/t/p/original/dgMstu4lbtR9hznDYFhU7QR8cZr.jpg)"
                        }
                    />
                    <Poster marked />
                    <Poster marked />
                    <Poster marked />
                    <Poster marked />
                    <Poster marked />
                    <Poster marked />
                </div>
            </React.Fragment>
        );
    }
}
