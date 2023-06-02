import md5 from "blueimp-md5";
import React from "react";
import "./Avatar.css";

export default class Avatar extends React.Component {
    render() {
        const email = this.props?.auth?.user?.email;
        const hash =
            email == null
                ? "00000000000000000000000000000000"
                : md5(email.trim().toLowerCase());
        const photoURL = `https://www.gravatar.com/avatar/${hash}`;

        //const photoURL = this.props?.auth?.user?.photoURL;
        const displayName = this.props?.auth?.user?.displayName;
        return (
            <div
                className="avatar"
                style={{ backgroundImage: `url(${photoURL})` }}
                title={displayName}
            />
        );
    }
}
