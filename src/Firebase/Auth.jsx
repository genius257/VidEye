import React from "react";
import firebase from ".";

export default class Auth extends React.Component {
  state = {
    isAnonymous: null,
    uid: null,
    user: null
  };

  componentDidMount() {
    firebase.auth().onAuthStateChanged((user) => {
      this.forceUpdate();

      var isAnonymous;
      var uid;

      if (user) {
        // User is signed in.
        isAnonymous = user.isAnonymous;
        uid = user.uid;
        // ...
      } else {
        // User is signed out.
        isAnonymous = null;
        uid = null;
      }

      this.setState({
        isAnonymous: isAnonymous,
        uid: uid,
        user: user
      });
    });
  }

  //{React.cloneElement(this.props.children, { loggedIn: this.state.loggedIn })}

  render() {
    return React.cloneElement(this.props.children, { auth: this.state });
  }
}
