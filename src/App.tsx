import React from "react";

import { HashRouter, Switch, Route, Link } from "react-router-dom";

import DashboardView from "./views/dashboard";
import SeriesView from "./views/series";
import MoviesView from "./views/movies";
import WatchView from "./views/watch";

import ContextMenu from "./contextMenu";
import Me from "./views/me";
import Avatar from "./components/Avatar";
import Auth from "./Supabase/Auth";

// https://dribbble.com/shots/7061489-Netflix-Homepage-Redesign-Concept
// https://dribbble.com/shots/4361663-Netflix-Redesign

// https://en.wikipedia.org/wiki/List_of_web_television_series
// https://en.wikipedia.org/wiki/Mondo_Media#List_of_series
// https://thetvdb.com/networks/YouTube

// good mythical morning     Comedy, Talk show, Variety
// the guild:                Comedy
// Gundarr:                  Comedy
// H+: The Digital Series:   Science fiction, Post-apocalyptic, Postcyberpunk
// The Philip DeFranco Show: Pop culture, News
// Potter Puppet Pals:       Comedy, puppetry, variety, parody
// Chainmail Bikini Squad:   Comedy
// Deep Space 69             Comedy
// Dick Figures              Comedy
// Video Game High School:   Comedy
// Gary and His Demons:      Comedy
// The Exes:                 Sitcom
// Great Destiny Man: 	     Comedy
// The Locals: 	             Comedy
// Chad vader: 	             Comedy

// "pilot episode"

// https://www.youtube.com/watch?v=Y51YUD5oEtw&list=PL_AYqxzHii9gY9V3O9yK2Chs84FeimIsm
// https://www.youtube.com/watch?v=Wo3XFK2erXc
// https://www.youtube.com/watch?v=rBqiFI8vhMM
// https://www.youtube.com/watch?v=vU2HM6trciA
// https://www.youtube.com/user/BeyondTheLot
// https://www.youtube.com/watch?v=B5_aRsGiHwo
// https://www.youtube.com/watch?v=GXI0l3yqBrA
// https://www.youtube.com/watch?v=b-XHENUyg18

// https://stackoverflow.com/questions/2068344/how-do-i-get-a-youtube-video-thumbnail-from-the-youtube-api
// https://img.youtube.com/vi/e_LrXE9KCsQ/mqdefault.jpg

// https://stackoverflow.com/questions/49150917/update-fields-in-nested-objects-in-firestore-documents

/**
 * [DB]
 *
 * Series
 *   {name}
 *     Seasons
 *       {season}
 *         Episodes
 *           {episode}
 */

/**
 * [USER/SESSION]
 *
 * Series
 *   {name}
 *     ...
 */

//Object.prototype.map = f => console.log(this)||Object.keys(this).map(key => f.call(null, key, this[key]));

export default class App extends React.Component {
    render() {
        return (
            <div className="App">
                <header>
                    <HashRouter>
                        <Link to="/">
                            <i className="material-icons logo">
                                play_circle_filled
                            </i>
                        </Link>
                        <Link to="/me/">
                            <Auth>
                                <Avatar />
                            </Auth>
                        </Link>
                    </HashRouter>
                </header>
                <Auth>
                    <HashRouter>
                        <Switch>
                            <Route exact path="/" component={DashboardView} />
                            <Route path="/series/:id/" component={SeriesView} />
                            <Route path="/movies/:id/" component={MoviesView} />
                            <Route path="/watch/:id/" component={WatchView} />
                            <Route path="/me/" component={Me} />
                        </Switch>
                    </HashRouter>
                </Auth>
                <footer>footer</footer>
                <ContextMenu />
            </div>
        );
    }
}
