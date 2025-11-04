import React, { useEffect } from "react";
//import ReactDOM from "react-dom";
//import PropTypes from "prop-types";
import YouTube, { YouTubePlayer, YouTubeProps } from "react-youtube";
//import { HashRouter } from "react-router-dom";
import { useParams } from "react-router";
import History from "../history";

// https://developers.google.com/youtube/player_parameters
// https://www.maxlaumeister.com/blog/hide-related-videos-in-youtube-embeds/
/**
 * style within iframe to set:
 *  .ytp-pause-overlay, .ytp-share-button, .ytp-watch-later-button {display:none !important;}
 *
 * also: html5-endscreen ytp-player-content videowall-endscreen ytp-endscreen-paginate ytp-show-tiles
 */
// https://codepen.io/dhandel/pen/xmvXdr

type VideoProps = {
    autoplay?: boolean;
    cc_lang_pref?: string;
    cc_load_policy?: boolean;
    color?: "red" | "white";
    controls?: boolean;
    disablekb?: boolean;
    enablejsapi?: boolean;
    end?: number;
    fs?: boolean;
    hl?: string;
    iv_load_policy?: 1 | 3;
    list?: string;
    listType?: string;
    loop?: boolean;
    modestbranding?: boolean;
    origin?: string;
    playlist?: string;
    playsinline?: boolean;
    rel?: boolean;
    showinfo?: boolean;
    start?: number;
    widget_referrer?: string;

    width?: number;
    height?: number;
    type?: string;
    title?: string;
    id?: string;
    className?: string;
    VIDEO_ID?: string;

    yt?: YouTubeProps;
};

export default function Video({
    autoplay = false,
    type = "text/html",
    VIDEO_ID,
    yt,
    ...props
}: VideoProps) {
    const [player, setPlayer] = React.useState<YouTubePlayer | null>(null);
    const {
        // id: series,
        // season,
        episode,
    } = useParams<{ id: string; season: string; episode: string }>();

    useEffect(() => {
        // Anything in here is fired on component mount.

        return () => {
            // Anything in here is fired on component unmount.

            if (player === null) {
                return;
            }

            let time = player.getCurrentTime();

            //if less than 30seconds occcured, play time not registered
            if (time < 30) {
                return;
            }

            //let duration = this.player.getDuration();

            if (episode === undefined) {
                return;
            }

            History.markEpisodeAsWatched(
                parseInt(episode),
                time,
                //duration*/
            );
        };
    }, []);

    return (
        <YouTube
            videoId={VIDEO_ID}
            onReady={(e: any) => {
                setPlayer(e.target);

                let watchTime = 0; /*History.getWatchTime(
                            series,
                            season,
                            episode,
                            0
                        );*/

                if (watchTime > 0) {
                    e.target.seekTo(watchTime, true);
                }
            }}
            className={props.className}
            {...yt}
            opts={{
                playerVars: {
                    autoplay: autoplay ? 1 : 0,
                    controls: props.controls ? 1 : 0,
                    disablekb: props.disablekb ? 1 : 0,
                    fs: props.fs ? 1 : 0,
                    modestbranding: props.modestbranding ? 1 : undefined,
                    origin: props.origin ?? "https://kztbl.codesandbox.io",
                    //start: 1,
                    //end: 365
                },
            }}
        />
    );
}
