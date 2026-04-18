const express = require('express');
const session = require('express-session');
const multer = require('multer');
const pathMod = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const PORT = 3000;
const DB_PATH = pathMod.join(__dirname, 'cuansite.db');

let db; // will be set after init

// ─── HELPER: persist db to disk ──────────────────────────────────
function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// ─── HELPER: wrap db calls ───────────────────────────────────────
function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function insert(sql, params = []) {
  db.run(sql, params);
  const id = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
  saveDb();
  return id;
}

// ─── DATABASE INIT ───────────────────────────────────────────────
async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA foreign_keys = ON");

  // Create tables
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS hero (
    id         INTEGER PRIMARY KEY CHECK (id = 1),
    badge      TEXT NOT NULL DEFAULT '',
    title_1    TEXT NOT NULL DEFAULT '',
    title_2    TEXT NOT NULL DEFAULT '',
    title_3    TEXT NOT NULL DEFAULT '',
    subtitle   TEXT NOT NULL DEFAULT '',
    btn_primary TEXT NOT NULL DEFAULT '',
    btn_secondary TEXT NOT NULL DEFAULT '',
    stat_1_num TEXT NOT NULL DEFAULT '',
    stat_1_label TEXT NOT NULL DEFAULT '',
    stat_2_num TEXT NOT NULL DEFAULT '',
    stat_2_label TEXT NOT NULL DEFAULT '',
    stat_3_num TEXT NOT NULL DEFAULT '',
    stat_3_label TEXT NOT NULL DEFAULT '',
    stat_4_num TEXT NOT NULL DEFAULT '',
    stat_4_label TEXT NOT NULL DEFAULT ''
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS about (
    id              INTEGER PRIMARY KEY CHECK (id = 1),
    eyebrow         TEXT NOT NULL DEFAULT '',
    title_1         TEXT NOT NULL DEFAULT '',
    title_2         TEXT NOT NULL DEFAULT '',
    description     TEXT NOT NULL DEFAULT '',
    philosophy_label TEXT NOT NULL DEFAULT '',
    philosophy_title TEXT NOT NULL DEFAULT '',
    philosophy_desc  TEXT NOT NULL DEFAULT '',
    badge_top_title  TEXT NOT NULL DEFAULT '',
    badge_top_desc   TEXT NOT NULL DEFAULT '',
    badge_bot_title  TEXT NOT NULL DEFAULT '',
    badge_bot_desc   TEXT NOT NULL DEFAULT '',
    feat_1_title    TEXT NOT NULL DEFAULT '',
    feat_1_desc     TEXT NOT NULL DEFAULT '',
    feat_2_title    TEXT NOT NULL DEFAULT '',
    feat_2_desc     TEXT NOT NULL DEFAULT '',
    feat_3_title    TEXT NOT NULL DEFAULT '',
    feat_3_desc     TEXT NOT NULL DEFAULT ''
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS services (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    icon     TEXT NOT NULL DEFAULT 'fas fa-star',
    title    TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    tag      TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS why_items (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    title    TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS process_steps (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    title    TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS portfolio (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT NOT NULL DEFAULT '',
    project_title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    tags        TEXT NOT NULL DEFAULT '',
    live_url    TEXT NOT NULL DEFAULT '',
    browser_url TEXT NOT NULL DEFAULT '',
    glow_color  TEXT NOT NULL DEFAULT 'rgba(212,175,55,.15)',
    screenshot  TEXT NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT ''
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS testimonials (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    quote    TEXT NOT NULL DEFAULT '',
    name     TEXT NOT NULL DEFAULT '',
    role     TEXT NOT NULL DEFAULT '',
    avatar_letter TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cta (
    id       INTEGER PRIMARY KEY CHECK (id = 1),
    eyebrow  TEXT NOT NULL DEFAULT '',
    title_1  TEXT NOT NULL DEFAULT '',
    title_2  TEXT NOT NULL DEFAULT '',
    subtitle TEXT NOT NULL DEFAULT ''
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS socials (
    id       INTEGER PRIMARY KEY CHECK (id = 1),
    whatsapp TEXT NOT NULL DEFAULT '',
    instagram TEXT NOT NULL DEFAULT '',
    tiktok   TEXT NOT NULL DEFAULT '',
    phone_display TEXT NOT NULL DEFAULT ''
  )`);

  // ─── SEED ──────────────────────────────────────────────────────
  if (!get('SELECT id FROM hero WHERE id=1')) {
    run(`INSERT INTO hero (id, badge, title_1, title_2, title_3, subtitle, btn_primary, btn_secondary,
      stat_1_num, stat_1_label, stat_2_num, stat_2_label, stat_3_num, stat_3_label, stat_4_num, stat_4_label)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Tersedia untuk Proyek Baru \u2022 2025', 'Kami Bangun', 'Website yang', 'Hasilkan Cuan',
      'CuanSite menghadirkan website premium yang bukan cuma memukau \u2014 tapi juga mengubah setiap pengunjung menjadi pelanggan setia. Bisnis kamu layak punya website yang kerja sekeras kamu.',
      'Mulai Proyek Kamu', 'Lihat Karya Kami',
      '3', 'Klien Puas', '100', 'Kepuasan', '3', 'Website Live', '24/7', 'Support']);
  }

  if (!get('SELECT id FROM about WHERE id=1')) {
    run(`INSERT INTO about (id, eyebrow, title_1, title_2, description,
      philosophy_label, philosophy_title, philosophy_desc,
      badge_top_title, badge_top_desc, badge_bot_title, badge_bot_desc,
      feat_1_title, feat_1_desc, feat_2_title, feat_2_desc, feat_3_title, feat_3_desc)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Cerita Kami', 'Dari Bangku Sekolah ke', 'Dunia Digital',
      'CuanSite didirikan oleh dua sahabat yang masih duduk di bangku SMA \u2014 dengan satu keyakinan sederhana: usia bukan batasan untuk berkarya. Kami membuktikan bahwa semangat, skill, dan dedikasi bisa menghasilkan website berkualitas profesional yang bikin klien bangga.',
      'Filosofi Kami', 'Setiap Pixel Punya Tujuan',
      'Kami percaya website terbaik bukan sekadar soal tampilan \u2014 tapi soal strategi yang tepat, pengalaman pengguna yang mulus, dan cerita yang bisnis kamu sampaikan ke dunia.',
      'Proyek Selesai!', 'Website baru sudah live',
      '100% Klien Puas', 'Hasil nyata, bukan janji',
      'Desain Strategis', 'Setiap elemen dirancang dengan tujuan \u2014 bukan sekadar indah, tapi fungsional dan mendorong konversi.',
      'Kode Bersih', 'Loading cepat, SEO-optimized, dan dibangun dengan teknologi modern untuk performa maksimal di semua perangkat.',
      'Support 24/7', 'Kami nggak hilang setelah launch. Support dan maintenance berkelanjutan supaya kamu tenang.']);
  }

  const svcCount = get('SELECT COUNT(*) as c FROM services');
  if (!svcCount || svcCount.c === 0) {
    run('INSERT INTO services (icon, title, description, tag, sort_order) VALUES (?,?,?,?,?)', ['fas fa-palette', 'Web Design', 'Website custom yang memikat audiens dan mencerminkan identitas premium brand kamu. Tanpa template, selamanya.', 'Paling Populer', 1]);
    run('INSERT INTO services (icon, title, description, tag, sort_order) VALUES (?,?,?,?,?)', ['fas fa-shopping-bag', 'E-Commerce', 'Toko online yang dibangun untuk jualan. Payment gateway, manajemen produk, dan checkout yang dioptimasi untuk konversi maksimal.', 'ROI Tinggi', 2]);
    run('INSERT INTO services (icon, title, description, tag, sort_order) VALUES (?,?,?,?,?)', ['fas fa-rocket', 'Landing Page', 'Landing page yang dirancang untuk menangkap leads dan mendorong aksi. Cocok untuk kampanye dan peluncuran produk.', 'Cepat Selesai', 3]);
    run('INSERT INTO services (icon, title, description, tag, sort_order) VALUES (?,?,?,?,?)', ['fas fa-building', 'Company Profile', 'Website perusahaan profesional yang membangun kepercayaan dan kredibilitas. Kesan pertama yang tak terlupakan.', 'Korporat', 4]);
    run('INSERT INTO services (icon, title, description, tag, sort_order) VALUES (?,?,?,?,?)', ['fas fa-search', 'SEO Optimization', 'Tampil di halaman pertama Google. Technical SEO, strategi konten, dan optimasi performa untuk mendatangkan traffic organik.', 'Jangka Panjang', 5]);
    run('INSERT INTO services (icon, title, description, tag, sort_order) VALUES (?,?,?,?,?)', ['fas fa-mobile-alt', 'UI/UX Design', 'Antarmuka yang berpusat pada pengguna, dirancang melalui riset dan iterasi. Pengalaman indah yang just works.', 'Berbasis Riset', 6]);
  }

  const whyCount = get('SELECT COUNT(*) as c FROM why_items');
  if (!whyCount || whyCount.c === 0) {
    run('INSERT INTO why_items (title, description, sort_order) VALUES (?,?,?)', ['Desain yang Fokus Revenue', 'Setiap keputusan desain kami berakar pada psikologi konversi. Kami nggak desain untuk pamer \u2014 kami desain untuk omzet kamu.', 1]);
    run('INSERT INTO why_items (title, description, sort_order) VALUES (?,?,?)', ['Pengerjaan Super Cepat', 'Kebanyakan proyek selesai dalam 7-14 hari. Kami bergerak cepat tanpa mengorbankan kualitas karena proses kami sudah teruji.', 2]);
    run('INSERT INTO why_items (title, description, sort_order) VALUES (?,?,?)', ['Harga Transparan', 'Tanpa biaya tersembunyi, tanpa kejutan. Kamu tahu persis apa yang kamu bayar sebelum kami menulis satu baris kode pun.', 3]);
    run('INSERT INTO why_items (title, description, sort_order) VALUES (?,?,?)', ['Partner Setelah Launch', 'Kami nggak menghilang setelah serah terima. Periode maintenance gratis, support prioritas, dan selalu bisa dihubungi via WhatsApp.', 4]);
    run('INSERT INTO why_items (title, description, sort_order) VALUES (?,?,?)', ['Garansi 100% Puas', 'Kami revisi sampai kamu benar-benar puas. Belum sreg? Kami terus iterasi. Visi kamu adalah misi kami \u2014 tanpa kompromi.', 5]);
  }

  const procCount = get('SELECT COUNT(*) as c FROM process_steps');
  if (!procCount || procCount.c === 0) {
    run('INSERT INTO process_steps (title, description, sort_order) VALUES (?,?,?)', ['Diskusi', 'Kami pelajari bisnis kamu, tujuan, target audiens, dan kompetitor untuk menyusun strategi yang tepat.', 1]);
    run('INSERT INTO process_steps (title, description, sort_order) VALUES (?,?,?)', ['Desain', 'Wireframe dan desain visual custom dibuat untuk persetujuan kamu. Kami iterasi sampai sempurna.', 2]);
    run('INSERT INTO process_steps (title, description, sort_order) VALUES (?,?,?)', ['Develop', 'Kode bersih, layout responsif, loading cepat. Dibangun dengan teknologi modern untuk performa maksimal.', 3]);
    run('INSERT INTO process_steps (title, description, sort_order) VALUES (?,?,?)', ['Launch', 'Review akhir, go live, dan support berkelanjutan. Kami rayakan launch kamu dan tetap di sisi kamu.', 4]);
  }

  const portCount = get('SELECT COUNT(*) as c FROM portfolio');
  if (!portCount || portCount.c === 0) {
    run(`INSERT INTO portfolio (client_name, project_title, description, tags, live_url, browser_url, glow_color, sort_order, created_at) VALUES (?,?,?,?,?,?,?,?,datetime('now'))`,
      ['Luxe Interior', 'Studio Desain Interior Premium', 'Website portfolio elegan yang menampilkan proyek desain interior residensial dan komersial kelas atas.', 'Web Design,Portfolio,SEO', 'https://luxeinterior.id', 'luxeinterior.id', 'rgba(212,175,55,.15)', 1]);
    run(`INSERT INTO portfolio (client_name, project_title, description, tags, live_url, browser_url, glow_color, sort_order, created_at) VALUES (?,?,?,?,?,?,?,?,datetime('now'))`,
      ['Warung Digital', 'E-Commerce Food & Beverage', 'Toko online lengkap dengan integrasi pembayaran, manajemen inventaris, dan alur checkout yang dioptimasi untuk konversi.', 'E-Commerce,Payment,Dashboard', 'https://warungdigital.co.id', 'warungdigital.co.id', 'rgba(74,222,128,.12)', 2]);
    run(`INSERT INTO portfolio (client_name, project_title, description, tags, live_url, browser_url, glow_color, sort_order, created_at) VALUES (?,?,?,?,?,?,?,?,datetime('now'))`,
      ['Dr. Aesthetic Clinic', 'Landing Page Klinik Kecantikan', 'Landing page high-converting untuk klinik premium. Integrasi booking WhatsApp dan showcase treatment.', 'Landing Page,Healthcare,Booking', 'https://dr-aesthetic.com', 'dr-aesthetic.com', 'rgba(99,102,241,.12)', 3]);
  }

  const testiCount = get('SELECT COUNT(*) as c FROM testimonials');
  if (!testiCount || testiCount.c === 0) {
    run('INSERT INTO testimonials (quote, name, role, avatar_letter, sort_order) VALUES (?,?,?,?,?)', ['CuanSite benar-benar mengubah kehadiran online kami. Dalam 2 minggu setelah launch, inquiry melonjak drastis. Investasi yang langsung balik modal di bulan pertama.', 'Rina Hartono', 'CEO, Luxe Interior', 'R', 1]);
    run('INSERT INTO testimonials (quote, name, role, avatar_letter, sort_order) VALUES (?,?,?,?,?)', ['Tim CuanSite paham visi kami dari hari pertama. Mereka deliver platform e-commerce yang customer kami suka banget. Penjualan naik signifikan sejak launch.', 'Ahmad Fauzi', 'Founder, Warung Digital', 'A', 2]);
    run('INSERT INTO testimonials (quote, name, role, avatar_letter, sort_order) VALUES (?,?,?,?,?)', ['Profesional, cepat, dan sangat berbakat. Masih muda tapi kualitas kerjanya luar biasa. Landing page kami sekarang jadi mesin penghasil leads. CuanSite bukan cuma vendor, tapi partner growth.', 'Dr. Sarah Wijaya', 'Direktur, Dr. Aesthetic', 'D', 3]);
  }

  if (!get('SELECT id FROM cta WHERE id=1')) {
    run('INSERT INTO cta (id, eyebrow, title_1, title_2, subtitle) VALUES (1,?,?,?,?)',
      ['Siap?', 'Yuk Bangun Sesuatu', 'yang Luar Biasa', 'Kompetitor kamu sudah punya website keren. Saatnya punya yang lebih baik. Yuk ngobrol soal proyek kamu \u2014 tanpa komitmen, cuma diskusi santai.']);
  }

  if (!get('SELECT id FROM socials WHERE id=1')) {
    run('INSERT INTO socials (id, whatsapp, instagram, tiktok, phone_display) VALUES (1,?,?,?,?)',
      ['6285136910032', 'cuansite.id', 'cuansite.id', '+62 851-3691-0032']);
  }

  if (!get("SELECT value FROM settings WHERE key='admin_password'")) {
    run("INSERT INTO settings (key, value) VALUES ('admin_password', 'cuansite2025')");
  }

  saveDb();
  console.log('Database initialized');
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'cuansite-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

const uploadsDir = pathMod.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = pathMod.extname(file.originalname);
    cb(null, 'portfolio-' + Date.now() + ext);
  }
});
const upload = multer({
  storage,
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
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const stored = get("SELECT value FROM settings WHERE key='admin_password'");
  if (stored && password === stored.value) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Password salah' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth-check', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

app.post('/api/change-password', requireAuth, (req, res) => {
  const { current, newPassword } = req.body;
  const stored = get("SELECT value FROM settings WHERE key='admin_password'");
  if (stored && current === stored.value) {
    run("UPDATE settings SET value=? WHERE key='admin_password'", [newPassword]);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Password lama salah' });
  }
});

// ─── PUBLIC API ──────────────────────────────────────────────────
app.get('/api/content', (req, res) => {
  const portfolio = all('SELECT * FROM portfolio ORDER BY sort_order ASC').map(p => ({
    ...p,
    screenshot: (p.screenshot || '').toString().trim()
  }));
  res.json({
    hero: get('SELECT * FROM hero WHERE id=1'),
    about: get('SELECT * FROM about WHERE id=1'),
    services: all('SELECT * FROM services ORDER BY sort_order ASC'),
    whyItems: all('SELECT * FROM why_items ORDER BY sort_order ASC'),
    processSteps: all('SELECT * FROM process_steps ORDER BY sort_order ASC'),
    portfolio,
    testimonials: all('SELECT * FROM testimonials ORDER BY sort_order ASC'),
    cta: get('SELECT * FROM cta WHERE id=1'),
    socials: get('SELECT * FROM socials WHERE id=1')
  });
});

// ─── ADMIN CRUD ──────────────────────────────────────────────────

// Hero
app.get('/api/hero', requireAuth, (req, res) => res.json(get('SELECT * FROM hero WHERE id=1')));
app.put('/api/hero', requireAuth, (req, res) => {
  const h = req.body;
  run(`UPDATE hero SET badge=?, title_1=?, title_2=?, title_3=?, subtitle=?, btn_primary=?, btn_secondary=?,
    stat_1_num=?, stat_1_label=?, stat_2_num=?, stat_2_label=?, stat_3_num=?, stat_3_label=?, stat_4_num=?, stat_4_label=? WHERE id=1`,
    [h.badge, h.title_1, h.title_2, h.title_3, h.subtitle, h.btn_primary, h.btn_secondary,
     h.stat_1_num, h.stat_1_label, h.stat_2_num, h.stat_2_label, h.stat_3_num, h.stat_3_label, h.stat_4_num, h.stat_4_label]);
  res.json({ success: true });
});

// About
app.get('/api/about', requireAuth, (req, res) => res.json(get('SELECT * FROM about WHERE id=1')));
app.put('/api/about', requireAuth, (req, res) => {
  const a = req.body;
  run(`UPDATE about SET eyebrow=?, title_1=?, title_2=?, description=?,
    philosophy_label=?, philosophy_title=?, philosophy_desc=?,
    badge_top_title=?, badge_top_desc=?, badge_bot_title=?, badge_bot_desc=?,
    feat_1_title=?, feat_1_desc=?, feat_2_title=?, feat_2_desc=?, feat_3_title=?, feat_3_desc=? WHERE id=1`,
    [a.eyebrow, a.title_1, a.title_2, a.description, a.philosophy_label, a.philosophy_title, a.philosophy_desc,
     a.badge_top_title, a.badge_top_desc, a.badge_bot_title, a.badge_bot_desc,
     a.feat_1_title, a.feat_1_desc, a.feat_2_title, a.feat_2_desc, a.feat_3_title, a.feat_3_desc]);
  res.json({ success: true });
});

// Services
app.get('/api/services', requireAuth, (req, res) => res.json(all('SELECT * FROM services ORDER BY sort_order ASC')));
app.post('/api/services', requireAuth, (req, res) => {
  const s = req.body;
  const m = get('SELECT MAX(sort_order) as m FROM services');
  const id = insert('INSERT INTO services (icon, title, description, tag, sort_order) VALUES (?,?,?,?,?)',
    [s.icon, s.title, s.description, s.tag, (m ? m.m : 0) + 1]);
  res.json({ success: true, id });
});
app.put('/api/services/:id', requireAuth, (req, res) => {
  const s = req.body;
  run('UPDATE services SET icon=?, title=?, description=?, tag=?, sort_order=? WHERE id=?',
    [s.icon, s.title, s.description, s.tag, s.sort_order, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/services/:id', requireAuth, (req, res) => {
  run('DELETE FROM services WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

// Why Items
app.get('/api/why-items', requireAuth, (req, res) => res.json(all('SELECT * FROM why_items ORDER BY sort_order ASC')));
app.post('/api/why-items', requireAuth, (req, res) => {
  const w = req.body;
  const m = get('SELECT MAX(sort_order) as m FROM why_items');
  const id = insert('INSERT INTO why_items (title, description, sort_order) VALUES (?,?,?)',
    [w.title, w.description, (m ? m.m : 0) + 1]);
  res.json({ success: true, id });
});
app.put('/api/why-items/:id', requireAuth, (req, res) => {
  const w = req.body;
  run('UPDATE why_items SET title=?, description=?, sort_order=? WHERE id=?',
    [w.title, w.description, w.sort_order, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/why-items/:id', requireAuth, (req, res) => {
  run('DELETE FROM why_items WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

// Process Steps
app.get('/api/process-steps', requireAuth, (req, res) => res.json(all('SELECT * FROM process_steps ORDER BY sort_order ASC')));
app.post('/api/process-steps', requireAuth, (req, res) => {
  const p = req.body;
  const m = get('SELECT MAX(sort_order) as m FROM process_steps');
  const id = insert('INSERT INTO process_steps (title, description, sort_order) VALUES (?,?,?)',
    [p.title, p.description, (m ? m.m : 0) + 1]);
  res.json({ success: true, id });
});
app.put('/api/process-steps/:id', requireAuth, (req, res) => {
  const p = req.body;
  run('UPDATE process_steps SET title=?, description=?, sort_order=? WHERE id=?',
    [p.title, p.description, p.sort_order, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/process-steps/:id', requireAuth, (req, res) => {
  run('DELETE FROM process_steps WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

// Portfolio
app.get('/api/portfolio', requireAuth, (req, res) => res.json(all('SELECT * FROM portfolio ORDER BY sort_order ASC')));

function handleUpload(req, res, next) {
  upload.single('screenshot')(req, res, err => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

app.post('/api/portfolio', requireAuth, handleUpload, (req, res) => {
  try {
    const p = req.body;
    const m = get('SELECT MAX(sort_order) as m FROM portfolio');
    const screenshot = req.file ? '/uploads/' + req.file.filename : '';
    const nextOrder = (m && m.m != null) ? (parseInt(m.m) + 1) : 1;
    const id = insert(`INSERT INTO portfolio (client_name, project_title, description, tags, live_url, browser_url, glow_color, screenshot, sort_order, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,datetime('now'))`,
      [p.client_name || '', p.project_title || '', p.description || '', p.tags || '',
       p.live_url || '', p.browser_url || '', p.glow_color || 'rgba(212,175,55,.15)',
       screenshot, nextOrder]);
    res.json({ success: true, id });
  } catch (err) {
    console.error('POST /api/portfolio error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/portfolio/:id', requireAuth, handleUpload, (req, res) => {
  try {
    const p = req.body;
    let screenshot = p.existing_screenshot || '';
    if (req.file) {
      screenshot = '/uploads/' + req.file.filename;
      if (p.existing_screenshot && p.existing_screenshot.startsWith('/uploads/')) {
        try {
          const oldPath = pathMod.join(__dirname, p.existing_screenshot);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (e) { console.warn('Could not delete old file:', e.message); }
      }
    }
    run(`UPDATE portfolio SET client_name=?, project_title=?, description=?, tags=?,
      live_url=?, browser_url=?, glow_color=?, screenshot=?, sort_order=? WHERE id=?`,
      [p.client_name || '', p.project_title || '', p.description || '', p.tags || '',
       p.live_url || '', p.browser_url || '', p.glow_color || 'rgba(212,175,55,.15)',
       screenshot, parseInt(p.sort_order) || 0, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/portfolio error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/portfolio/:id', requireAuth, (req, res) => {
  try {
    const item = get('SELECT screenshot FROM portfolio WHERE id=?', [req.params.id]);
    if (item && item.screenshot && item.screenshot.startsWith('/uploads/')) {
      try {
        const filePath = pathMod.join(__dirname, item.screenshot);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) { console.warn('Could not delete file:', e.message); }
    }
    run('DELETE FROM portfolio WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/portfolio error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Testimonials
app.get('/api/testimonials', requireAuth, (req, res) => res.json(all('SELECT * FROM testimonials ORDER BY sort_order ASC')));
app.post('/api/testimonials', requireAuth, (req, res) => {
  const t = req.body;
  const m = get('SELECT MAX(sort_order) as m FROM testimonials');
  const id = insert('INSERT INTO testimonials (quote, name, role, avatar_letter, sort_order) VALUES (?,?,?,?,?)',
    [t.quote, t.name, t.role, t.avatar_letter || (t.name ? t.name.charAt(0).toUpperCase() : '?'), (m ? m.m : 0) + 1]);
  res.json({ success: true, id });
});
app.put('/api/testimonials/:id', requireAuth, (req, res) => {
  const t = req.body;
  run('UPDATE testimonials SET quote=?, name=?, role=?, avatar_letter=?, sort_order=? WHERE id=?',
    [t.quote, t.name, t.role, t.avatar_letter, t.sort_order, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/testimonials/:id', requireAuth, (req, res) => {
  run('DELETE FROM testimonials WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

// CTA
app.get('/api/cta', requireAuth, (req, res) => res.json(get('SELECT * FROM cta WHERE id=1')));
app.put('/api/cta', requireAuth, (req, res) => {
  const c = req.body;
  run('UPDATE cta SET eyebrow=?, title_1=?, title_2=?, subtitle=? WHERE id=1',
    [c.eyebrow, c.title_1, c.title_2, c.subtitle]);
  res.json({ success: true });
});

// Socials
app.get('/api/socials', requireAuth, (req, res) => res.json(get('SELECT * FROM socials WHERE id=1')));
app.put('/api/socials', requireAuth, (req, res) => {
  const s = req.body;
  run('UPDATE socials SET whatsapp=?, instagram=?, tiktok=?, phone_display=? WHERE id=1',
    [s.whatsapp, s.instagram, s.tiktok, s.phone_display]);
  res.json({ success: true });
});

// ─── STATIC ──────────────────────────────────────────────────────
app.use(express.static(__dirname, { index: 'index.html' }));
app.get('/admin', (req, res) => res.sendFile(pathMod.join(__dirname, 'admin.html')));

// ─── START ───────────────────────────────────────────────────────
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`CuanSite server running at http://localhost:${PORT}`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
    console.log(`Default admin password: cuansite2025`);
  });
}).catch(err => {
  console.error('Failed to init database:', err);
  process.exit(1);
});
