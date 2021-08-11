import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/firestore";
import config from "./config";

firebase.initializeApp(config);
//firebase.analytics();

const _firebase = firebase;

export default _firebase;
