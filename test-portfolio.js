const { db, collection, getDocs } = require('./firebase');
async function test() {
  const cols = ['hero', 'about', 'services', 'why_items', 'process_steps', 'portfolio', 'testimonials', 'cta', 'socials', 'general'];
  for (const c of cols) {
    const snap = await getDocs(collection(db, c));
    snap.forEach(d => {
      const data = JSON.stringify(d.data());
      if (data.toLowerCase().includes('fetch')) {
         console.log(`FOUND IN ${c} / ${d.id}:`, data);
      }
    });
  }
}
test();
