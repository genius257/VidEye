import firebase from ".";

firebase.auth().onAuthStateChanged((user) => {
  var uid = null;
  var isAnonymous = null;
  if (user) {
    uid = user.uid;
    isAnonymous = user.isAnonymous;
  } else {
    // ...
  }
  Firebase.uid = uid;
  Firebase.isAnonymous = isAnonymous;
});

export default class Firebase {
  static uid = null;
  static isAnonymous = null;

  static isSignedIn() {
    return this.uid !== null;
  }

  static signInWithPopup() {
    // https://firebase.google.com/docs/auth/web/google-signin

    var provider = new firebase.auth.GoogleAuthProvider();
    // provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    // https://developers.google.com/identity/protocols/googlescopes

    firebase
      .auth()
      .signInWithPopup(provider)
      .then((result) => {
        /** @type {firebase.auth.OAuthCredential} */
        var credential = result.credential;

        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        // ...
        console.log("signInWithPopup", result);
      })
      .catch((error) => {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
        console.error(error);
      });
  }

  static signOut() {
    firebase
      .auth()
      .signOut()
      .then(() => {
        // Sign-out successful.
      })
      .catch((error) => {
        // An error happened.
      });
  }
}
