import React from "react";
import "./Avatar.css";

export default class Avatar extends React.Component {
  render() {
    const photoURL = this.props?.auth?.user?.photoURL;
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
