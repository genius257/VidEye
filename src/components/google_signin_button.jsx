import React from "react";
import "./google_signin_button.css";

export default class Google_signin_button extends React.Component {
  render() {
    var classes = ["google_signin_button"];
    if (this.props.disabled) {
      classes.push("disabled");
    }

    return (
      <div
        className={classes.join(" ")}
        onClick={this.props.disabled ? null : this.props.onClick}
      />
    );
  }
}
