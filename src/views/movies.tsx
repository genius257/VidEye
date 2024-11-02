import React from "react";
import Video from "./video";
import { RouteComponentProps } from "react-router-dom";
import { databases } from "../appwrite";
import { Query } from "appwrite";

type MoviesProps = {} & RouteComponentProps<{ id: string }>;
type MoviesState = {
    play: boolean;
    movie: Awaited<ReturnType<Series["getMovie"]>>;
};

const databaseId = "671eb9f3000ca1862380";

const collectionIds = {
    series: "671ec7fb000b3517b7e6",
    movies: "671ec5e1002943b28df8",
    history: "671eca420003af618870"
};

export default class Series extends React.Component<MoviesProps, MoviesState> {
    state: Readonly<MoviesState> = {
        play: false,
        movie: null
    };

    componentDidMount() {
        //FIXME: load tmdb information
        this.getMovie().then((result) => this.setState({ movie: result }));
    }

    getMovie() {
        return databases
            .listDocuments(databaseId, collectionIds.movies, [
                Query.equal("id", this.props.match.params.id),
                Query.limit(1)
            ])
            .then((response) => response.documents?.[0]);
    }

    render() {
        const video = [this.state.movie?.videos ?? []].flat()[0];

        return this.state.play ? (
            <Video VIDEO_ID={video?.ytid} />
        ) : (
            <button onClick={() => this.setState({ play: true })}>Play</button>
        );
    }
}
