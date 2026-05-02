const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc } = require('firebase/firestore');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebaseConfig = require('./firebase-applet-config.json');

firebaseConfig.storageBucket = "gen-lang-client-0035306945.appspot.com";
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const storage = getStorage(app);

module.exports = { db, doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, storage, ref, uploadBytes, getDownloadURL, deleteObject };
