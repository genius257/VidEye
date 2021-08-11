import React from "react";
import { HashRouter, Switch, Route, Link } from "react-router-dom";
import moment from "moment";

import firebase from "../Firebase";
import History from "../history";
import config from "../Firebase/config";
import Card from "../card";
import GoogleSigninButton from "../components/google_signin_button";
import Firebase from "../Firebase/Firebase";
import Poster from "../components/Poster";
import PosterGrid from "../components/PosterGrid";

export default class Me extends React.Component {
  render() {
    //console.log(this.props);

    let loggedIn = Firebase.isSignedIn(); //FIXME: implement login check
    if (!loggedIn) {
      return (
        <>
          <GoogleSigninButton onClick={(event) => Firebase.signInWithPopup()} />
        </>
      );
    }

    return (
      <>
        <div
          style={{
            width: "190px",
            height: "40px",
            backgroundColor: "#c33",
            textAlign: "center",
            verticalAlign: "center",
            lineHeight: "40px",
            cursor: "pointer"
          }}
          onClick={(event) => Firebase.signOut()}
        >
          sign out
        </div>
        <HashRouter>
          <Switch>
            <Route path="/" strict>
              <div className="me">
                <div
                  style={{
                    gridArea: "a",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer"
                  }}
                >
                  <i
                    className="material-icons"
                    style={{
                      color: "#00AA00",
                      fontSize: "5em"
                    }}
                  >
                    add_circle
                  </i>
                </div>
                <div
                  style={{
                    gridArea: "b",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer"
                  }}
                >
                  <i
                    className="material-icons"
                    style={{
                      color: "#AA0000",
                      fontSize: "5em"
                    }}
                  >
                    delete
                  </i>
                </div>
                <h1 style={{ gridArea: "header" }}>Your requests</h1>
                <PosterGrid style={{ gridArea: "my-request-list" }}>
                  <Poster />
                  <Poster />
                  <Poster />
                  <Poster />
                  <Poster />
                  <Poster />
                  <Poster />
                  <Poster />
                  <Poster />
                  <Poster />
                  <Poster />
                </PosterGrid>
                <h1 style={{ gridArea: "header2" }}>Requests</h1>
                {/*<div className="grid-list" style={{ gridArea: "request-list" }}>*/}
                <PosterGrid style={{ gridArea: "request-list" }}>
                  <Poster />
                  <Poster />
                  <Poster />
                  <Poster />
                  <Poster />
                  <Poster />
                  <Poster />
                  <Poster />
                  <Poster />
                  <Poster />
                  <Poster />
                </PosterGrid>
                {/*</div>*/}
              </div>
            </Route>
          </Switch>
        </HashRouter>
      </>
    );
  }
}
