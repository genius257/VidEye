import Video from "./video";
import { useParams } from "react-router";

// https://developers.google.com/youtube/player_parameters
// https://stackoverflow.com/questions/40353582/modestbranding-not-working-for-youtube-embed#answer-52987295

export default function Watch() {
    const { id } = useParams<{ id: string }>();

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
            VIDEO_ID={id}
        />
    );
}
