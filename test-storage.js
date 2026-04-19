const { db, collection, addDoc, storage, ref, uploadBytes, getDownloadURL } = require('./firebase');

async function test() {
  try {
    const Buffer = require('buffer').Buffer;
    const storageRef = ref(storage, 'test-' + Date.now() + '.txt');
    const buffer = Buffer.from('test string content');
    // Ensure we can stringify and parse Firebase buffer cleanly
    await uploadBytes(storageRef, buffer, { contentType: 'text/plain' });
    const url = await getDownloadURL(storageRef);
    console.log("SUCCESS URL:", url);
    process.exit(0);
  } catch (err) {
    console.error("FAIL:", err);
    process.exit(1);
  }
}
test();
