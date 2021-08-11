import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import YouTube from "react-youtube";
import { HashRouter } from "react-router-dom";
import { withRouter } from "react-router";
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

export default withRouter(
  class Video extends React.Component {
    static propTypes = {
      autoplay: PropTypes.bool,
      cc_lang_pref: PropTypes.string,
      cc_load_policy: PropTypes.bool,
      color: PropTypes.oneOf(["red", "white"]),
      controls: PropTypes.bool,
      disablekb: PropTypes.bool,
      enablejsapi: PropTypes.bool,
      end: PropTypes.number,
      fs: PropTypes.bool,
      hl: PropTypes.string,
      iv_load_policy: PropTypes.oneOf([1, 3]),
      list: PropTypes.string,
      listType: PropTypes.string,
      loop: PropTypes.bool,
      modestbranding: PropTypes.bool,
      origin: PropTypes.string,
      playlist: PropTypes.string,
      playsinline: PropTypes.bool,
      rel: PropTypes.bool,
      showinfo: PropTypes.bool,
      start: PropTypes.number,
      widget_referrer: PropTypes.string,

      width: PropTypes.number,
      height: PropTypes.number,
      type: PropTypes.string,
      title: PropTypes.string,
      id: PropTypes.string,
      className: PropTypes.string,
      VIDEO_ID: PropTypes.string.isRequired
    };

    static defaultProps = {
      autoplay: false,

      type: "text/html"
    };

    player = null;

    componentDidMount() {
      //Hook into the YT api and detect when video ends, to continue playing ot return to index.
      /*ReactDOM.findDOMNode(this).addEventListener("statechange", e =>
        console.log(e)
      );*/
    }

    componentDidUpdate(prevProps) {
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

      let series = this.props.match.params.id;
      let season = this.props.match.params.season;
      let episode = this.props.match.params.episode;

      let duration = this.player.getDuration();
      console.log(duration);

      History.setWatchTime(series, season, episode, time, duration);
    }

    generateURL() {
      let options = [];
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

            let series = this.props.match.params.id;
            let season = this.props.match.params.season;
            let episode = this.props.match.params.episode;
            let watchTime = History.getWatchTime(series, season, episode, 0);

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
