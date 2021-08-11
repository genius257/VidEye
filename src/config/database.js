import JSDO from "../JSDO/JSDO";

module.exports = {
  fetch: JSDO.FETCH_CLASS,
  default: "firebase",
  connections: {
    firebase: {
      driver: "firebase",
      apiKey: "AIzaSyB8H19QI3zAOFJjaiCVfG6n3cfmGiT2Jb8",
      authDomain: "videye-da79f.firebaseapp.com",
      databaseURL: "https://videye-da79f.firebaseio.com",
      projectId: "videye-da79f",
      storageBucket: "",
      messagingSenderId: "1076449960924",
      appId: "1:1076449960924:web:693d9885ea36fe609de519"
    },
    youtube: {
      driver: "googleapis",
      apiKey: "AIzaSyB8H19QI3zAOFJjaiCVfG6n3cfmGiT2Jb8",
      database: "youtube",
      version: "V3"
    }
  }
};
