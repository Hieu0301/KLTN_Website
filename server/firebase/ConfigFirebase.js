const { initializeApp } = require("firebase/app");
const { getDatabase } = require("firebase/database");

const firebaseConfig = {
  apiKey: "AIzaSyAFExzsU-fqeg4uYxh1Z42tvZcF0vE6iQ4",
  authDomain: "websitekltn-24767.firebaseapp.com",
  projectId: "websitekltn-24767",
  storageBucket: "websitekltn-24767.firebasestorage.app",
  messagingSenderId: "124870605581",
  appId: "1:124870605581:web:89e66dd54ec11b01c50e44",
  databaseURL: "https://websitekltn-24767-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

module.exports = { app, database };
