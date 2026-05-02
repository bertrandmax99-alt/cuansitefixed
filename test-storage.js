const { storage, ref, uploadBytes, getDownloadURL } = require('./firebase');
async function run() {
  try {
    const fileRef = ref(storage, 'test-file.txt');
    const data = new Uint8Array(Buffer.from('hello world'));
    await uploadBytes(fileRef, data, { contentType: 'text/plain' });
    const url = await getDownloadURL(fileRef);
    console.log('Success:', url);
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
