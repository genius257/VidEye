import React from "react";
//import ReactDOM from "react-dom";
//import PropTypes from "prop-types";
import YouTube, { YouTubePlayer, YouTubeProps } from "react-youtube";
//import { HashRouter } from "react-router-dom";
import { RouteComponentProps, withRouter } from "react-router";
import History from "../history";
import { episode_id } from "../dataTypes/episodes";

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

export default withRouter(
    class Video extends React.Component<
        RouteComponentProps<{ id: string; season: string; episode: string }> &
            VideoProps
    > {
        static defaultProps: {} = {
            autoplay: false,

            type: "text/html"
        };

        player: YouTubePlayer | null = null;

        componentDidMount() {
            //Hook into the YT api and detect when video ends, to continue playing ot return to index.
            /*ReactDOM.findDOMNode(this).addEventListener("statechange", e =>
        console.log(e)
      );*/
        }

        componentDidUpdate(
            prevProps: RouteComponentProps<{
                id: string;
                season: string;
                episode: string;
            }> &
                VideoProps
        ) {
            //this.player = null;
            //return super.componentDidUpdate(prevProps);
        }

        componentWillUnmount() {
            if (!this.player) {
                return;
            }

            let time = this.player.getCurrentTime();

            //if less than 30seconds occcured, play time not registered
            if (time < 30) {
                return;
            }

            //let series = this.props.match.params.id;
            //let season = this.props.match.params.season;
            let episode = this.props.match.params.episode;

            //let duration = this.player.getDuration();

            //History.setWatchTime(series, season, episode, time, duration);
            History.markEpisodeAsWatched(
                parseInt(episode) as episode_id,
                time
                //duration*/
            );
        }

        generateURL() {
            let options: Array<string> = [];
            ["controls", "fs", "rel"].forEach((i) => {
                if (!this.props[i]) {
                    options.push(`${i}=0`);
                }
            });
            [
                "autoplay",
                "cc_load_policy",
                "disablekb",
                "enablejsapi",
                "loop",
                "modestbranding",
                "playsinline",
                "showinfo"
            ].forEach((i) => {
                if (this.props[i]) {
                    options.push(`${i}=1`);
                }
            });

            return (
                `https://www.youtube.com/embed/${this.props.VIDEO_ID}` +
                (options.length > 0 ? "?" + options.join("&") : "")
            );
        }

        next() {
            //FIXME: Get next episode from history class
            this.props.history.push("../episode 02/");
            //this.props.history.goBack();
        }

        render() {
            return (
                /*<iframe
        id="ytplayer"
        title="ytplayer"
        type="text/html"
        width="640"
        height="360"
        src={/*this.state.url* / this.generateURL()}
        frameBorder="0"
        allowFullScreen="allowFullScreen"
      />*/
                <YouTube
                    videoId={this.props.VIDEO_ID}
                    onReady={(e) => {
                        this.player = e.target;

                        //let series = this.props.match.params.id;
                        //let season = this.props.match.params.season;
                        //let episode = this.props.match.params.episode;
                        let watchTime = 0; /*History.getWatchTime(
                            series,
                            season,
                            episode,
                            0
                        );*/

                        if (watchTime > 0) {
                            this.player.seekTo(watchTime, true);
                        }
                    }}
                    //onEnd={this.next.bind(this)}
                    {...this.props.yt}
                    opts={{
                        playerVars: {
                            autoplay: 1,
                            controls: 1,
                            disablekb: 1,
                            fs: 1,
                            modestbranding: 1,
                            origin: "https://kztbl.codesandbox.io"
                            //start: 1,
                            //end: 365
                        }
                    }}
                />
            );
        }
    }
);
