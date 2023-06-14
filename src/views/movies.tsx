import React from "react";
import Video from "./video";
import { RouteComponentProps } from "react-router-dom";
import supabase from "../Supabase";

type MoviesProps = {} & RouteComponentProps<{ id: string }>;
type MoviesState = {
    play: boolean;
    movie: Awaited<ReturnType<Series["getMovie"]>>;
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
        return supabase
            .from("movies")
            .select("*, videos(*)")
            .eq("id", this.props.match.params.id)
            .single()
            .then((result) => result.data);
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
