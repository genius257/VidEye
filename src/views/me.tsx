import React from "react";
import { HashRouter, Switch, Route, Link } from "react-router-dom";
import moment from "moment";

import History from "../history";
import Card from "../card";
import Poster from "../components/Poster";
import PosterGrid from "../components/PosterGrid";
import supabase from "../Supabase";
import Supabase from "../Supabase/Supabase";

export default class Me extends React.Component {
    render() {
        //console.log(this.props);

        let loggedIn = Supabase.isSignedIn();
        if (!loggedIn) {
            return (
                <>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            console.log(event.target.email.value);
                            supabase.auth
                                .signInWithOtp({
                                    email: event.target.email.value,
                                    options: { shouldCreateUser: true }
                                })
                                .then((value) => value.data);
                        }}
                    >
                        <input type="email" name="email" placeholder="E-mail" />
                        <input type="submit" value="Login" />
                    </form>
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
                    onClick={(event) => Supabase.signOut()}
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
                                <h1 style={{ gridArea: "header" }}>
                                    Your requests
                                </h1>
                                <PosterGrid
                                    style={{ gridArea: "my-request-list" }}
                                >
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
                                <h1 style={{ gridArea: "header2" }}>
                                    Requests
                                </h1>
                                {/*<div className="grid-list" style={{ gridArea: "request-list" }}>*/}
                                <PosterGrid
                                    style={{ gridArea: "request-list" }}
                                >
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
