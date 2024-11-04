import React from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import OTP from "../components/OTP";
//import moment from "moment";

//import History from "../history";
//import Card from "../card";
import Poster from "../components/Poster";
import PosterGrid from "../components/PosterGrid";
import { account, client } from "../appwrite";
import { ID, Models } from "appwrite";

export default class Me extends React.Component<
    {},
    { email: string | null; token: Models.Token | null }
> {
    state: Readonly<{ email: string | null; token: Models.Token | null }> = {
        email: null,
        token: null
    };

    render() {
        let loggedIn = /*Supabase.isSignedIn()*/ false;
        if (!loggedIn) {
            return (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        paddingTop: "20px"
                    }}
                >
                    <OTP
                        onMail={(email: string) => {
                            this.setState({ email });
                            return account
                                .createEmailToken(ID.unique(), email)
                                .then(
                                    (value) => {
                                        this.setState({ token: value });
                                        return true;
                                    },
                                    (reason) => false
                                );
                        }}
                        onCode={(otp: string) => {
                            return account
                                .createSession(this.state.token!.userId, otp)
                                .then(
                                    (value) => {
                                        return true;
                                    },
                                    (reason) => false
                                );
                        }}
                    />
                </div>
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
                    onClick={(event) => /*Supabase.signOut()*/ false}
                >
                    sign out
                </div>
                <textarea></textarea>
                <HashRouter>
                    <Routes>
                        <Route path="/">
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
                    </Routes>
                </HashRouter>
            </>
        );
    }
}
