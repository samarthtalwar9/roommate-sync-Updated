// ── FIREBASE CONFIG ──
var FB_CONFIG = {
  apiKey: "AIzaSyA3gNrelv_btgR4LOCMRFWl1T0CHGlJdSg",
  authDomain: "roommate-sync-7406b.firebaseapp.com",
  databaseURL: "https://roommate-sync-7406b-default-rtdb.firebaseio.com",
  projectId: "roommate-sync-7406b",
  storageBucket: "roommate-sync-7406b.firebasestorage.app",
  messagingSenderId: "358803768388",
  appId: "1:358803768388:web:d294c051859291cee12811"
};

var fbAuth, fbDb, fbRtdb;

try {
  firebase.initializeApp(FB_CONFIG);
  fbAuth = firebase.auth();
  fbDb   = firebase.firestore();
  fbRtdb = firebase.database();

  firebase.auth().onAuthStateChanged(function(u) {
    if (u) {
      onUserLogin(u);
    } else {
      if (S.page !== 'landing' && S.page !== 'auth') {
        showPage('landing');
      }
    }
  });

  console.log("✅ Firebase connected!");
} catch(e) {
  console.error("Firebase error:", e.message);
}