import React from "react";
import Video from "./video";
import { RouteComponentProps } from "react-router";

// https://developers.google.com/youtube/player_parameters
// https://stackoverflow.com/questions/40353582/modestbranding-not-working-for-youtube-embed#answer-52987295

export default class Watch extends React.Component<
    RouteComponentProps<{ id: string }>
> {
    render() {
        return (
            <Video
                id="ytplayer"
                title="ytplayer"
                autoplay
                enablejsapi
                controls
                disablekb
                fs
                modestbranding
                origin="https://kztbl.codesandbox.io"
                VIDEO_ID={this.props.match.params.id}
            />
        );
    }
}
