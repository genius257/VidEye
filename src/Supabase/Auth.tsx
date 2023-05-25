import { User } from "@supabase/supabase-js";
import React from "react";
import superbase from ".";

export default class Auth extends React.Component<
    React.PropsWithChildren,
    { uid: string | null; user: User | undefined | null }
> {
    state = {
        uid: null,
        user: null
    };

    componentDidMount() {
        superbase.auth.onAuthStateChange((event, session) => {
            this.forceUpdate();

            var uid;

            if (session) {
                // User is signed in.
                uid = session.user.id;
                // ...
            } else {
                // User is signed out.
                uid = null;
            }

            this.setState({
                uid: uid,
                user: session?.user
            });
        });
    }

    //{React.cloneElement(this.props.children, { loggedIn: this.state.loggedIn })}

    render() {
        if (this.props.children == null) {
            return;
        }

        if (typeof this.props.children !== "object") {
            return;
        }

        if (!("type" in this.props.children)) {
            return;
        }

        return React.cloneElement(this.props.children, {
            auth: this.state
        });
    }
}
