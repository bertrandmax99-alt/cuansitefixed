const { Jimp } = require('jimp');
async function run() {
  try {
    const d = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg==', 'base64');
    const image = await Jimp.read(d);
    image.resize({ w: 100 });
    const b64 = await image.getBase64('image/jpeg', { quality: 80 });
    console.log('Success, length:', b64.length);
  } catch(e) {
    console.error('Error:', e);
  }
}
run();
