const express = require('express');
const cookieSession = require('cookie-session');
const multer = require('multer');
const pathMod = require('path');
const fs = require('fs');
const { db, doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, storage, ref, uploadBytes, getDownloadURL, deleteObject } = require('./firebase');

const app = express();
const PORT = 3000;


// ─── HELPER: wrap db calls ───────────────────────────────────────
async function getSingleton(col) {
  const d = await getDoc(doc(db, col, '1'));
  return d.exists() ? d.data() : null;
}

async function setSingleton(col, data) {
  await setDoc(doc(db, col, '1'), data, { merge: true });
}

async function getList(col) {
  const snap = await getDocs(collection(db, col));
  const items = [];
  snap.forEach(d => items.push({ id: d.id, ...d.data() }));
  return items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

async function getSetting(key) {
  const d = await getDoc(doc(db, 'settings', key));
  return d.exists() ? d.data().value : null;
}

async function setSetting(key, value) {
  await setDoc(doc(db, 'settings', key), { value });
}

// ─── DATABASE INIT ───────────────────────────────────────────────
async function initDb() {
  // Seed Hero
  if (!(await getSingleton('hero'))) {
    await setSingleton('hero', {
      badge: 'Tersedia untuk Proyek Baru • 2025', title_1: 'Kami Bangun', title_2: 'Website yang', title_3: 'Hasilkan Cuan',
      subtitle: 'CuanSite menghadirkan website premium yang bukan cuma memukau — tapi juga mengubah setiap pengunjung menjadi pelanggan setia. Bisnis kamu layak punya website yang kerja sekeras kamu.',
      btn_primary: 'Mulai Proyek Kamu', btn_secondary: 'Lihat Karya Kami',
      stat_1_num: '3', stat_1_label: 'Klien Puas', stat_2_num: '100', stat_2_label: 'Kepuasan',
      stat_3_num: '3', stat_3_label: 'Website Live', stat_4_num: '24/7', stat_4_label: 'Support'
    });
  }

  // Seed About
  if (!(await getSingleton('about'))) {
    await setSingleton('about', {
      eyebrow: 'Cerita Kami', title_1: 'Dari Bangku Sekolah ke', title_2: 'Dunia Digital',
      description: 'CuanSite didirikan oleh dua sahabat yang masih duduk di bangku SMA — dengan satu keyakinan sederhana: usia bukan batasan untuk berkarya. Kami membuktikan bahwa semangat, skill, dan dedikasi bisa menghasilkan website berkualitas profesional yang bikin klien bangga.',
      philosophy_label: 'Filosofi Kami', philosophy_title: 'Setiap Pixel Punya Tujuan',
      philosophy_desc: 'Kami percaya website terbaik bukan sekadar soal tampilan — tapi soal strategi yang tepat, pengalaman pengguna yang mulus, dan cerita yang bisnis kamu sampaikan ke dunia.',
      badge_top_title: 'Proyek Selesai!', badge_top_desc: 'Website baru sudah live',
      badge_bot_title: '100% Klien Puas', badge_bot_desc: 'Hasil nyata, bukan janji',
      feat_1_title: 'Desain Strategis', feat_1_desc: 'Setiap elemen dirancang dengan tujuan — bukan sekadar indah, tapi fungsional dan mendorong konversi.',
      feat_2_title: 'Kode Bersih', feat_2_desc: 'Loading cepat, SEO-optimized, dan dibangun dengan teknologi modern untuk performa maksimal di semua perangkat.',
      feat_3_title: 'Support 24/7', feat_3_desc: 'Kami nggak hilang setelah launch. Support dan maintenance berkelanjutan supaya kamu tenang.'
    });
  }

  // Seed Services
  const svcs = await getList('services');
  if (svcs.length === 0) {
    const defaultSvcs = [
      { icon: 'fas fa-palette', title: 'Web Design', description: 'Website custom yang memikat audiens dan mencerminkan identitas premium brand kamu. Tanpa template, selamanya.', tag: 'Paling Populer', sort_order: 1 },
      { icon: 'fas fa-shopping-bag', title: 'E-Commerce', description: 'Toko online yang dibangun untuk jualan. Payment gateway, manajemen produk, dan checkout yang dioptimasi untuk konversi maksimal.', tag: 'ROI Tinggi', sort_order: 2 },
      { icon: 'fas fa-rocket', title: 'Landing Page', description: 'Landing page yang dirancang untuk menangkap leads dan mendorong aksi. Cocok untuk kampanye dan peluncuran produk.', tag: 'Cepat Selesai', sort_order: 3 },
      { icon: 'fas fa-building', title: 'Company Profile', description: 'Website perusahaan profesional yang membangun kepercayaan dan kredibilitas. Kesan pertama yang tak terlupakan.', tag: 'Korporat', sort_order: 4 },
      { icon: 'fas fa-search', title: 'SEO Optimization', description: 'Tampil di halaman pertama Google. Technical SEO, strategi konten, dan optimasi performa untuk mendatangkan traffic organik.', tag: 'Jangka Panjang', sort_order: 5 },
      { icon: 'fas fa-mobile-alt', title: 'UI/UX Design', description: 'Antarmuka yang berpusat pada pengguna, dirancang melalui riset dan iterasi. Pengalaman indah yang just works.', tag: 'Berbasis Riset', sort_order: 6 }
    ];
    for (const s of defaultSvcs) await addDoc(collection(db, 'services'), s);
  }

  // Seed Why Items
  const whys = await getList('why_items');
  if (whys.length === 0) {
    const defaultWhys = [
      { title: 'Desain yang Fokus Revenue', description: 'Setiap keputusan desain kami berakar pada psikologi konversi. Kami nggak desain untuk pamer — kami desain untuk omzet kamu.', sort_order: 1 },
      { title: 'Pengerjaan Super Cepat', description: 'Kebanyakan proyek selesai dalam 7-14 hari. Kami bergerak cepat tanpa mengorbankan kualitas karena proses kami sudah teruji.', sort_order: 2 },
      { title: 'Harga Transparan', description: 'Tanpa biaya tersembunyi, tanpa kejutan. Kamu tahu persis apa yang kamu bayar sebelum kami menulis satu baris kode pun.', sort_order: 3 },
      { title: 'Partner Setelah Launch', description: 'Kami nggak menghilang setelah serah terima. Periode maintenance gratis, support prioritas, dan selalu bisa dihubungi via WhatsApp.', sort_order: 4 },
      { title: 'Garansi 100% Puas', description: 'Kami revisi sampai kamu benar-benar puas. Belum sreg? Kami terus iterasi. Visi kamu adalah misi kami — tanpa kompromi.', sort_order: 5 }
    ];
    for (const w of defaultWhys) await addDoc(collection(db, 'why_items'), w);
  }

  // Seed Process Steps
  const procs = await getList('process_steps');
  if (procs.length === 0) {
    const defaultProcs = [
      { title: 'Diskusi', description: 'Kami pelajari bisnis kamu, tujuan, target audiens, dan kompetitor untuk menyusun strategi yang tepat.', sort_order: 1 },
      { title: 'Desain', description: 'Wireframe dan desain visual custom dibuat untuk persetujuan kamu. Kami iterasi sampai sempurna.', sort_order: 2 },
      { title: 'Develop', description: 'Kode bersih, layout responsif, loading cepat. Dibangun dengan teknologi modern untuk performa maksimal.', sort_order: 3 },
      { title: 'Launch', description: 'Review akhir, go live, dan support berkelanjutan. Kami rayakan launch kamu dan tetap di sisi kamu.', sort_order: 4 }
    ];
    for (const p of defaultProcs) await addDoc(collection(db, 'process_steps'), p);
  }

  // Seed Portfolio
  const ports = await getList('portfolio');
  if (ports.length === 0) {
    const defaultPorts = [
      { client_name: 'Luxe Interior', project_title: 'Studio Desain Interior Premium', description: 'Website portfolio elegan yang menampilkan proyek desain interior residensial dan komersial kelas atas.', tags: 'Web Design,Portfolio,SEO', live_url: 'https://luxeinterior.id', browser_url: 'luxeinterior.id', glow_color: 'rgba(212,175,55,.15)', screenshot: '', sort_order: 1 },
      { client_name: 'Warung Digital', project_title: 'E-Commerce Food & Beverage', description: 'Toko online lengkap dengan integrasi pembayaran, manajemen inventaris, dan alur checkout yang dioptimasi untuk konversi.', tags: 'E-Commerce,Payment,Dashboard', live_url: 'https://warungdigital.co.id', browser_url: 'warungdigital.co.id', glow_color: 'rgba(74,222,128,.12)', screenshot: '', sort_order: 2 },
      { client_name: 'Dr. Aesthetic Clinic', project_title: 'Landing Page Klinik Kecantikan', description: 'Landing page high-converting untuk klinik premium. Integrasi booking WhatsApp dan showcase treatment.', tags: 'Landing Page,Healthcare,Booking', live_url: 'https://dr-aesthetic.com', browser_url: 'dr-aesthetic.com', glow_color: 'rgba(99,102,241,.12)', screenshot: '', sort_order: 3 }
    ];
    for (const p of defaultPorts) await addDoc(collection(db, 'portfolio'), p);
  }

  // Seed Testimonials
  const testis = await getList('testimonials');
  if (testis.length === 0) {
    const defaultTestis = [
      { quote: 'CuanSite benar-benar mengubah kehadiran online kami. Dalam 2 minggu setelah launch, inquiry melonjak drastis. Investasi yang langsung balik modal di bulan pertama.', name: 'Rina Hartono', role: 'CEO, Luxe Interior', avatar_letter: 'R', sort_order: 1 },
      { quote: 'Tim CuanSite paham visi kami dari hari pertama. Mereka deliver platform e-commerce yang customer kami suka banget. Penjualan naik signifikan sejak launch.', name: 'Ahmad Fauzi', role: 'Founder, Warung Digital', avatar_letter: 'A', sort_order: 2 },
      { quote: 'Profesional, cepat, dan sangat berbakat. Masih muda tapi kualitas kerjanya luar biasa. Landing page kami sekarang jadi mesin penghasil leads. CuanSite bukan cuma vendor, tapi partner growth.', name: 'Dr. Sarah Wijaya', role: 'Direktur, Dr. Aesthetic', avatar_letter: 'D', sort_order: 3 }
    ];
    for (const t of defaultTestis) await addDoc(collection(db, 'testimonials'), t);
  }

  // Seed CTA
  if (!(await getSingleton('cta'))) {
    await setSingleton('cta', {
      eyebrow: 'Siap?', title_1: 'Yuk Bangun Sesuatu', title_2: 'yang Luar Biasa',
      subtitle: 'Kompetitor kamu sudah punya website keren. Saatnya punya yang lebih baik. Yuk ngobrol soal proyek kamu — tanpa komitmen, cuma diskusi santai.'
    });
  }

  // Seed Socials
  if (!(await getSingleton('socials'))) {
    await setSingleton('socials', {
      whatsapp: '6285136910032', instagram: 'cuansite.id', tiktok: 'cuansite.id', phone_display: '+62 851-3691-0032'
    });
  }

  // Seed General
  if (!(await getSingleton('general'))) {
    await setSingleton('general', {
      logo_text: 'Cuan', logo_span: 'Site',
      meta_title: 'CuanSite — Web Design Agency Premium Indonesia',
      meta_desc: 'CuanSite — Kami membangun website premium yang bukan cuma keren, tapi juga mengubah pengunjung jadi pelanggan. Web Design Agency Indonesia.',
      footer_desc: 'Kami membangun website yang bukan cuma memukau — tapi juga bekerja keras menghasilkan hasil nyata untuk bisnis kamu. Desain premium. Cuan nyata.'
    });
  }

  // Seed Admin Password
  if (!(await getSetting('admin_password'))) {
    await setSetting('admin_password', 'cuansite2025');
  }

  console.log('Firebase Database initialized');
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────
app.set('trust proxy', 1); // Trust first proxy for secure cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['cuansite-secret-2025'],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  sameSite: 'none',
  secure: true
}));

const uploadsDir = pathMod.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (e) {
  console.warn('Could not create uploads directory (likely in read-only environment like Netlify)');
}
app.use('/uploads', express.static(uploadsDir));

const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(pathMod.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ─── AUTH ────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { password } = req.body;
  const stored = await getSetting('admin_password');
  if (stored && password === stored) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Password salah' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session = null;
  res.json({ success: true });
});

app.get('/api/auth-check', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

app.post('/api/change-password', requireAuth, async (req, res) => {
  const { current, newPassword } = req.body;
  const stored = await getSetting('admin_password');
  if (stored && current === stored) {
    await setSetting('admin_password', newPassword);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Password lama salah' });
  }
});

// ─── PUBLIC API ──────────────────────────────────────────────────
app.get('/api/content', async (req, res) => {
  try {
    const portfolio = await getList('portfolio');
    res.json({
      hero: await getSingleton('hero'),
      about: await getSingleton('about'),
      services: await getList('services'),
      whyItems: await getList('why_items'),
      processSteps: await getList('process_steps'),
      portfolio: portfolio.map(p => ({ ...p, screenshot: (p.screenshot || '').toString().trim() })),
      testimonials: await getList('testimonials'),
      cta: await getSingleton('cta'),
      socials: await getSingleton('socials'),
      general: await getSingleton('general')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN CRUD ──────────────────────────────────────────────────

// Hero
app.get('/api/hero', requireAuth, async (req, res) => res.json(await getSingleton('hero')));
app.put('/api/hero', requireAuth, async (req, res) => {
  await setSingleton('hero', req.body);
  res.json({ success: true });
});

// About
app.get('/api/about', requireAuth, async (req, res) => res.json(await getSingleton('about')));
app.put('/api/about', requireAuth, async (req, res) => {
  await setSingleton('about', req.body);
  res.json({ success: true });
});

// Services
app.get('/api/services', requireAuth, async (req, res) => res.json(await getList('services')));
app.post('/api/services', requireAuth, async (req, res) => {
  const docRef = await addDoc(collection(db, 'services'), req.body);
  res.json({ success: true, id: docRef.id });
});
app.put('/api/services/:id', requireAuth, async (req, res) => {
  await updateDoc(doc(db, 'services', req.params.id), req.body);
  res.json({ success: true });
});
app.delete('/api/services/:id', requireAuth, async (req, res) => {
  await deleteDoc(doc(db, 'services', req.params.id));
  res.json({ success: true });
});

// Why Items
app.get('/api/why-items', requireAuth, async (req, res) => res.json(await getList('why_items')));
app.post('/api/why-items', requireAuth, async (req, res) => {
  const docRef = await addDoc(collection(db, 'why_items'), req.body);
  res.json({ success: true, id: docRef.id });
});
app.put('/api/why-items/:id', requireAuth, async (req, res) => {
  await updateDoc(doc(db, 'why_items', req.params.id), req.body);
  res.json({ success: true });
});
app.delete('/api/why-items/:id', requireAuth, async (req, res) => {
  await deleteDoc(doc(db, 'why_items', req.params.id));
  res.json({ success: true });
});

// Process Steps
app.get('/api/process-steps', requireAuth, async (req, res) => res.json(await getList('process_steps')));
app.post('/api/process-steps', requireAuth, async (req, res) => {
  const docRef = await addDoc(collection(db, 'process_steps'), req.body);
  res.json({ success: true, id: docRef.id });
});
app.put('/api/process-steps/:id', requireAuth, async (req, res) => {
  await updateDoc(doc(db, 'process_steps', req.params.id), req.body);
  res.json({ success: true });
});
app.delete('/api/process-steps/:id', requireAuth, async (req, res) => {
  await deleteDoc(doc(db, 'process_steps', req.params.id));
  res.json({ success: true });
});

// Portfolio
app.get('/api/portfolio', requireAuth, async (req, res) => res.json(await getList('portfolio')));

function handleUpload(req, res, next) {
  upload.single('screenshot')(req, res, err => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

app.post('/api/portfolio', requireAuth, handleUpload, async (req, res) => {
  try {
    const p = req.body;
    let screenshot = '';
    if (req.file) {
      const ext = pathMod.extname(req.file.originalname);
      const filename = 'portfolio-' + Date.now() + ext;
      const storageRef = ref(storage, 'uploads/' + filename);
      await uploadBytes(storageRef, req.file.buffer, { contentType: req.file.mimetype });
      screenshot = await getDownloadURL(storageRef);
    }
    const docRef = await addDoc(collection(db, 'portfolio'), {
      ...p,
      screenshot,
      sort_order: parseInt(p.sort_order) || 1,
      created_at: new Date().toISOString()
    });
    res.json({ success: true, id: docRef.id });
  } catch (err) {
    console.error('POST /api/portfolio error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/portfolio/:id', requireAuth, handleUpload, async (req, res) => {
  try {
    const p = req.body;
    let screenshot = p.existing_screenshot || '';
    if (req.file) {
      const ext = pathMod.extname(req.file.originalname);
      const filename = 'portfolio-' + Date.now() + ext;
      const storageRef = ref(storage, 'uploads/' + filename);
      await uploadBytes(storageRef, req.file.buffer, { contentType: req.file.mimetype });
      screenshot = await getDownloadURL(storageRef);
      
      if (p.existing_screenshot && p.existing_screenshot.includes('firebasestorage')) {
        try {
          const oldRef = ref(storage, p.existing_screenshot);
          await deleteObject(oldRef);
        } catch (e) { console.warn('Could not delete old file from storage:', e.message); }
      } else if (p.existing_screenshot && p.existing_screenshot.startsWith('/uploads/')) {
        try {
          const oldPath = pathMod.join(__dirname, p.existing_screenshot);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (e) { console.warn('Could not delete old file:', e.message); }
      }
    }
    
    // Remove existing_screenshot from the update object
    const updateData = { ...p, screenshot, sort_order: parseInt(p.sort_order) || 0 };
    delete updateData.existing_screenshot;
    
    await updateDoc(doc(db, 'portfolio', req.params.id), updateData);
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/portfolio error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/portfolio/:id', requireAuth, async (req, res) => {
  try {
    const d = await getDoc(doc(db, 'portfolio', req.params.id));
    if (d.exists()) {
      const item = d.data();
      if (item.screenshot && item.screenshot.includes('firebasestorage')) {
        try {
          const oldRef = ref(storage, item.screenshot);
          await deleteObject(oldRef);
        } catch (e) { console.warn('Could not delete file from storage:', e.message); }
      } else if (item.screenshot && item.screenshot.startsWith('/uploads/')) {
        try {
          const filePath = pathMod.join(__dirname, item.screenshot);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) { console.warn('Could not delete file:', e.message); }
      }
    }
    await deleteDoc(doc(db, 'portfolio', req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/portfolio error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Testimonials
app.get('/api/testimonials', requireAuth, async (req, res) => res.json(await getList('testimonials')));
app.post('/api/testimonials', requireAuth, async (req, res) => {
  const t = req.body;
  if (!t.avatar_letter && t.name) t.avatar_letter = t.name.charAt(0).toUpperCase();
  const docRef = await addDoc(collection(db, 'testimonials'), t);
  res.json({ success: true, id: docRef.id });
});
app.put('/api/testimonials/:id', requireAuth, async (req, res) => {
  await updateDoc(doc(db, 'testimonials', req.params.id), req.body);
  res.json({ success: true });
});
app.delete('/api/testimonials/:id', requireAuth, async (req, res) => {
  await deleteDoc(doc(db, 'testimonials', req.params.id));
  res.json({ success: true });
});

// CTA
app.get('/api/cta', requireAuth, async (req, res) => res.json(await getSingleton('cta')));
app.put('/api/cta', requireAuth, async (req, res) => {
  await setSingleton('cta', req.body);
  res.json({ success: true });
});

// Socials
app.get('/api/socials', requireAuth, async (req, res) => res.json(await getSingleton('socials')));
app.put('/api/socials', requireAuth, async (req, res) => {
  await setSingleton('socials', req.body);
  res.json({ success: true });
});

// General
app.get('/api/general', requireAuth, async (req, res) => res.json(await getSingleton('general')));
app.put('/api/general', requireAuth, async (req, res) => {
  await setSingleton('general', req.body);
  res.json({ success: true });
});

// ─── STATIC ──────────────────────────────────────────────────────
app.use(express.static(__dirname, { index: 'index.html' }));
app.get('/admin', (req, res) => res.sendFile(pathMod.join(__dirname, 'admin.html')));

// ─── START ───────────────────────────────────────────────────────
let dbInitialized = false;
async function ensureDbInit() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

if (require.main === module) {
  ensureDbInit().then(() => {
    app.listen(PORT, () => {
      console.log(`CuanSite server running at http://localhost:${PORT}`);
      console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
    });
  }).catch(err => {
    console.error('Failed to init database:', err);
    process.exit(1);
  });
}

module.exports = app;
module.exports.ensureDbInit = ensureDbInit;
