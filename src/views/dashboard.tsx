import React from "react";
import { /*HashRouter, Switch, Route,*/ Link } from "react-router-dom";
import moment from "moment";

import History from "../history";
import config from "../Firebase/config";
import Card from "../card";
import Poster from "../components/Poster";
import supabase from "../Supabase";

export default class Dashboard extends React.Component<
    {},
    { series: {}; watched: Array<unknown> }
> {
    state = {
        series: {},
        watched: [] as Array<{
            series: string;
            season: string;
            episode: string;
            time: number;
            totalTime: number;
        }>
    };

    componentDidMount() {
        supabase
            .from("series")
            .select("*")
            .then((result) => {
                const series = {};
                result.data?.forEach((_series) => {
                    series[_series.id] = _series;
                });
                this.setState({ series } /*, () => this.loadWatched()*/);
            });

        /*
        try {
            let db = firebase.firestore();
            db.collection("series")
                .get()
                .then((querySnapshot) => {
                    var series = {};
                    querySnapshot.forEach(function (doc) {
                        // doc.data() is never undefined for query doc snapshots
                        //console.log(doc.id, " => ", doc.data());
                        series[doc.id] = doc.data();
                        //series.push(doc.data());
                    });
                    this.setState({ series }, () => this.loadWatched());
                })
                .catch((error) => {
                    console.error("Error getting documents: ", error);
                });
        } catch (e) {
            console.error(
                "Firebase is not currently available.\nThis could be due to transpiling.\nPlease try and reload if the problem persists"
            );
        }
        */
    }

    loadWatched() {
        let watched = History.getUnwatched();
        let jobs: Array<Promise<number | Response>> = [];
        let result: Array<{
            series: string;
            season: string;
            episode: string;
            time: number;
            totalTime: number;
        }> = [];
        Object.keys(watched).forEach((series) =>
            Object.keys(watched[series]).forEach((season) =>
                Object.keys(watched[series][season]).forEach((episode) => {
                    let YTID =
                        this.state.series[series].seasons[season][episode].YTID;
                    //TODO: currently the order of the watched state array value is in an undertermanistic order due to async behavior. An index needs to be assigned, upon promise creation, to assign the result to the appropriate index.
                    jobs.push(
                        fetch(
                            `https://www.googleapis.com/youtube/v3/videos?id=${YTID}&part=contentDetails&key=${process.env.REACT_APP_GOOGLE_CLOUD_API_KEY}`
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
    }

    componentDidCatch(error: any, errorInfo: any) {
        // You can also log the error to an error reporting service
        console.log(error, errorInfo);
    }

    render() {
        return (
            <React.Fragment>
                {this.state.watched.length > 0 ? (
                    <React.Fragment>
                        <h2>Continue watching</h2>
                        <div className="horizontal-list">
                            {this.state.watched.map((watch) => (
                                <Link
                                    to={`/series/${watch.series}/${watch.season}/${watch.episode}/`}
                                    key={`${watch.series}/${watch.season}/${watch.episode}`}
                                >
                                    <Card
                                        image={
                                            this.state.series[watch.series] &&
                                            `url('https://img.youtube.com/vi/${
                                                this.state.series[watch.series]
                                                    .seasons[watch.season][
                                                    watch.episode
                                                ].YTID
                                            }/mqdefault.jpg')`
                                        }
                                        progress={`${Math.round(
                                            (watch.time / watch.totalTime) * 100
                                        )}%`}
                                    />
                                </Link>
                            ))}
                        </div>
                    </React.Fragment>
                ) : null}
                <h2>Recommended</h2>
                <div className="horizontal-list">
                    {Object.keys(this.state.series).map((key) => (
                        <Link to={`/series/${key}/`} key={key}>
                            <Poster
                                marked={History.isUnwatched(
                                    key,
                                    undefined,
                                    undefined,
                                    this.state.series[key]
                                )}
                                image={
                                    "url('https://image.tmdb.org/t/p/w300/" +
                                    this.state.series[key].poster +
                                    "')"
                                }
                                title={this.state.series[key].title}
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
                <h2>Recently added</h2>
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
                    <Poster marked />
                </div>
            </React.Fragment>
        );
    }
}
