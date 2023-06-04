import React from "react";
import { HashRouter, Switch, Route, Link } from "react-router-dom";

import firebase from "../Firebase";
import Video from "./video";
import History from "../history";
import Card from "../card";
import moment from "moment";
import config from "../Firebase/config";
import Poster from "../components/Poster";
import supabase from "../Supabase";

export default class Series extends React.Component {
    state = {
        seasons: {},
        series: {}
    };

    componentDidMount() {
        supabase
            .from("series")
            .select("*, seasons(*, episodes (*, videos (*)))")
            .eq("id", this.props.match.params.id)
            .then((response) => {
                console.log(response.data);
                this.setState({ series: response.data[0] });
            });
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.match.params.id !== this.props.match.params.id ||
            nextProps.match.params.season !== this.props.match.params.season ||
            nextProps.match.params.episode !==
                this.props.match.params.episode ||
            this.state.series.id !== nextState.series.id
        );
        //FIXME: adding season to url, does not trigger this, view should be cut up into smaller components.
        if (
            nextProps.match.params.id === this.props.match.params.id &&
            nextProps.match.params.season === this.props.match.params.season &&
            nextProps.match.params.episode ===
                this.props.match.params.episode /*&&
            /*Object.keys(this.state.seasons).length ===
                Object.keys(nextState.seasons).length*/ /*&&
            Object.keys(this.state.series).length ===
                Object.keys(nextState.series).length*/
        ) {
            return false;
        }

        return true;
    }

    componentDidUpdate(prevProps) {
        //FIXME
        /*
        let db = firebase.firestore();
        db.collection(`series/`)
            //.where('', '==', this.props.match.params.id)
            .doc(this.props.match.params.id)
            .get()
            .then((querySnapshot) => {
                let series = querySnapshot.data();
                var seasons = {};
                if (series) {
                    Object.keys(series.seasons).forEach(function (season) {
                        seasons[season] = series.seasons[season];
                    });
                }
                /*querySnapshot.forEach(function(doc) {
          // doc.data() is never undefined for query doc snapshots
          console.log(doc.id, " => ", doc.data());
          seasons[doc.id] = doc.data();
          //seasons.push(doc.data());
        });* /
                this.setState({ seasons, series });
            })
            .catch((error) => {
                console.log("Error getting documents: ", error);
            });

        if (this.props.match.params.id && this.props.match.params.season)
            this.loadWatched();
            */
        return true;
    }

    loadWatched() {
        //TODO
    }

    render() {
        console.log(this.state.series);

        return (
            <div>
                <HashRouter>
                    <Route
                        exact
                        strict
                        path="/series/:id/"
                        render={(routeProps) => (
                            <React.Fragment>
                                <h1>{this.state.series.title}</h1>
                                <div className="horizontal-list">
                                    {this.state.series.seasons?.map(
                                        (season) => (
                                            <Link
                                                to={`./${season.id}/`}
                                                key={season.id}
                                            >
                                                <Poster
                                                    marked={History.isUnwatched(
                                                        this.state.series.id,
                                                        season.id,
                                                        undefined,
                                                        this.state.series
                                                            .seasons
                                                    )}
                                                    image={`url('https://image.tmdb.org/t/p/w300/${season.poster}')`}
                                                >
                                                    {season.id}
                                                </Poster>
                                            </Link>
                                        )
                                    )}
                                </div>
                            </React.Fragment>
                        )}
                    />
                    <Route
                        exact
                        strict
                        path="/series/:id/:season/"
                        render={(routeProps) => {
                            console.log(
                                routeProps.match.params.season,
                                typeof routeProps.match.params.season
                            );
                            return (
                                <div className="horizontal-list">
                                    {(
                                        this.state.series.seasons?.find(
                                            (season) =>
                                                season.id ==
                                                routeProps.match.params.season
                                        )?.episodes || []
                                    ).map((episode) => {
                                        console.log(episode);
                                        let watch = {
                                            time: History.getWatchTime(
                                                this.props.match.params.id,
                                                routeProps.match.params.season,
                                                episode,
                                                0
                                            ),
                                            totalTime: 0
                                        };

                                        return (
                                            <Link
                                                to={`./${episode.id}/`}
                                                key={episode.id}
                                            >
                                                <Card
                                                    marked={History.isUnwatched(
                                                        this.props.match.params
                                                            .id,
                                                        routeProps.match.params
                                                            .season,
                                                        episode,
                                                        this.state.seasons
                                                    )}
                                                    image={`url('https://img.youtube.com/vi/${episode.videos.ytid}/mqdefault.jpg')`}
                                                    progress={
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
                        render={(routeProps) =>
                            this.state.series.seasons
                                ?.find(
                                    (season) =>
                                        season.id ==
                                        routeProps.match.params.season
                                )
                                ?.episodes.find(
                                    (episode) =>
                                        episode.id ==
                                        routeProps.match.params.episode
                                ).videos ? (
                                <Video
                                    id="ytplayer"
                                    title="ytplayer"
                                    autoplay
                                    controls
                                    disablekb
                                    fs
                                    modestbranding
                                    origin="https://kztbl.codesandbox.io"
                                    VIDEO_ID={
                                        this.state.series.seasons
                                            ?.find(
                                                (season) =>
                                                    season.id ==
                                                    routeProps.match.params
                                                        .season
                                            )
                                            ?.episodes.find(
                                                (episode) =>
                                                    episode.id ==
                                                    routeProps.match.params
                                                        .episode
                                            ).videos.ytid
                                    }
                                    yt={{
                                        onEnd: (e) => {
                                            this.end = true;
                                            let season =
                                                this.state.seasons[
                                                    routeProps.match.params
                                                        .season
                                                ];
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
                            ) : null
                        }
                    />
                </HashRouter>
            </div>
        );
    }
}
