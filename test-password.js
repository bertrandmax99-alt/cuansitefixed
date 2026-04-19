const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkPass() {
  const d = await getDoc(doc(db, 'settings', 'admin_password'));
  if (d.exists()) {
    console.log("Current password in DB:", d.data().value);
  } else {
    console.log("No password in DB");
  }
}
checkPass().catch(console.error).then(() => process.exit(0));
