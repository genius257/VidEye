import React from "react";
import Poster from "./Poster";

export default class TmdbPoster extends React.Component<{ image: string }> {
    render() {
        return (
            <Poster
                image={`https://image.tmdb.org/t/p/w300/${this.props.image.trim()}`}
            />
        );
    }
}
