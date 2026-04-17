require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const multer = require('multer');
const { neon } = require('@neondatabase/serverless');
const cloudinary = require('cloudinary').v2;

// ─── CLOUDINARY ───────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── DATABASE ─────────────────────────────────────────────────────
const sql = neon(process.env.DATABASE_URL);

// ─── EXPRESS APP ─────────────────────────────────────────────────
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name:     'session',
  secret:   process.env.SESSION_SECRET || 'cuansite-secret-2025',
  maxAge:   24 * 60 * 60 * 1000,
  secure:   process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax',
}));

// ─── MULTER (memory → Cloudinary) ────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.originalname)) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'cuansite', public_id: filename, overwrite: true },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// ─── AUTH HELPER ─────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ─── DB INIT (idempotent, runs once per cold start) ───────────────
const dbInitPromise = (async () => {
  // ── Tables ──
  await sql`CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS hero (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    badge         TEXT NOT NULL DEFAULT '',
    title_1       TEXT NOT NULL DEFAULT '',
    title_2       TEXT NOT NULL DEFAULT '',
    title_3       TEXT NOT NULL DEFAULT '',
    subtitle      TEXT NOT NULL DEFAULT '',
    btn_primary   TEXT NOT NULL DEFAULT '',
    btn_secondary TEXT NOT NULL DEFAULT '',
    stat_1_num    TEXT NOT NULL DEFAULT '',
    stat_1_label  TEXT NOT NULL DEFAULT '',
    stat_2_num    TEXT NOT NULL DEFAULT '',
    stat_2_label  TEXT NOT NULL DEFAULT '',
    stat_3_num    TEXT NOT NULL DEFAULT '',
    stat_3_label  TEXT NOT NULL DEFAULT '',
    stat_4_num    TEXT NOT NULL DEFAULT '',
    stat_4_label  TEXT NOT NULL DEFAULT ''
  )`;

  await sql`CREATE TABLE IF NOT EXISTS about (
    id               INTEGER PRIMARY KEY CHECK (id = 1),
    eyebrow          TEXT NOT NULL DEFAULT '',
    title_1          TEXT NOT NULL DEFAULT '',
    title_2          TEXT NOT NULL DEFAULT '',
    description      TEXT NOT NULL DEFAULT '',
    philosophy_label TEXT NOT NULL DEFAULT '',
    philosophy_title TEXT NOT NULL DEFAULT '',
    philosophy_desc  TEXT NOT NULL DEFAULT '',
    badge_top_title  TEXT NOT NULL DEFAULT '',
    badge_top_desc   TEXT NOT NULL DEFAULT '',
    badge_bot_title  TEXT NOT NULL DEFAULT '',
    badge_bot_desc   TEXT NOT NULL DEFAULT '',
    feat_1_title     TEXT NOT NULL DEFAULT '',
    feat_1_desc      TEXT NOT NULL DEFAULT '',
    feat_2_title     TEXT NOT NULL DEFAULT '',
    feat_2_desc      TEXT NOT NULL DEFAULT '',
    feat_3_title     TEXT NOT NULL DEFAULT '',
    feat_3_desc      TEXT NOT NULL DEFAULT ''
  )`;

  await sql`CREATE TABLE IF NOT EXISTS services (
    id          SERIAL PRIMARY KEY,
    icon        TEXT NOT NULL DEFAULT 'fas fa-star',
    title       TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    tag         TEXT NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0
  )`;

  await sql`CREATE TABLE IF NOT EXISTS why_items (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0
  )`;

  await sql`CREATE TABLE IF NOT EXISTS process_steps (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0
  )`;

  await sql`CREATE TABLE IF NOT EXISTS portfolio (
    id            SERIAL PRIMARY KEY,
    client_name   TEXT NOT NULL DEFAULT '',
    project_title TEXT NOT NULL DEFAULT '',
    description   TEXT NOT NULL DEFAULT '',
    tags          TEXT NOT NULL DEFAULT '',
    live_url      TEXT NOT NULL DEFAULT '',
    browser_url   TEXT NOT NULL DEFAULT '',
    glow_color    TEXT NOT NULL DEFAULT 'rgba(212,175,55,.15)',
    screenshot    TEXT NOT NULL DEFAULT '',
    sort_order    INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT ''
  )`;

  await sql`CREATE TABLE IF NOT EXISTS testimonials (
    id            SERIAL PRIMARY KEY,
    quote         TEXT NOT NULL DEFAULT '',
    name          TEXT NOT NULL DEFAULT '',
    role          TEXT NOT NULL DEFAULT '',
    avatar_letter TEXT NOT NULL DEFAULT '',
    sort_order    INTEGER NOT NULL DEFAULT 0
  )`;

  await sql`CREATE TABLE IF NOT EXISTS cta (
    id       INTEGER PRIMARY KEY CHECK (id = 1),
    eyebrow  TEXT NOT NULL DEFAULT '',
    title_1  TEXT NOT NULL DEFAULT '',
    title_2  TEXT NOT NULL DEFAULT '',
    subtitle TEXT NOT NULL DEFAULT ''
  )`;

  await sql`CREATE TABLE IF NOT EXISTS socials (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    whatsapp      TEXT NOT NULL DEFAULT '',
    instagram     TEXT NOT NULL DEFAULT '',
    tiktok        TEXT NOT NULL DEFAULT '',
    phone_display TEXT NOT NULL DEFAULT ''
  )`;

  // ── Seed data ──
  const heroRows = await sql`SELECT id FROM hero WHERE id = 1`;
  if (!heroRows.length) {
    await sql`INSERT INTO hero
      (id, badge, title_1, title_2, title_3, subtitle, btn_primary, btn_secondary,
       stat_1_num, stat_1_label, stat_2_num, stat_2_label,
       stat_3_num, stat_3_label, stat_4_num, stat_4_label)
      VALUES (
        1,
        ${'Dipercaya UMKM & Brand Lokal • Website Siap Pakai'},
        ${'Kami Bangun'}, ${'Website yang'}, ${'Hasilkan Cuan'},
        ${'CuanSite menghadirkan website premium yang bukan cuma memukau — tapi juga mengubah setiap pengunjung menjadi pelanggan setia. Bisnis kamu layak punya website yang kerja sekeras kamu.'},
        ${'Mulai Proyek Kamu'}, ${'Lihat Karya Kami'},
        ${'3'}, ${'Klien Puas'}, ${'100'}, ${'Kepuasan'},
        ${'3'}, ${'Website Live'}, ${'24/7'}, ${'Support'}
      )`;
  }

  const aboutRows = await sql`SELECT id FROM about WHERE id = 1`;
  if (!aboutRows.length) {
    await sql`INSERT INTO about
      (id, eyebrow, title_1, title_2, description,
       philosophy_label, philosophy_title, philosophy_desc,
       badge_top_title, badge_top_desc, badge_bot_title, badge_bot_desc,
       feat_1_title, feat_1_desc, feat_2_title, feat_2_desc, feat_3_title, feat_3_desc)
      VALUES (
        1,
        ${'Cerita Kami'}, ${'Dari Bangku Sekolah ke'}, ${'Dunia Digital'},
        ${'CuanSite didirikan oleh dua sahabat yang masih duduk di bangku SMA — dengan satu keyakinan sederhana: usia bukan batasan untuk berkarya. Kami membuktikan bahwa semangat, skill, dan dedikasi bisa menghasilkan website berkualitas profesional yang bikin klien bangga.'},
        ${'Filosofi Kami'}, ${'Setiap Pixel Punya Tujuan'},
        ${'Kami percaya website terbaik bukan sekadar soal tampilan — tapi soal strategi yang tepat, pengalaman pengguna yang mulus, dan cerita yang bisnis kamu sampaikan ke dunia.'},
        ${'Proyek Selesai!'}, ${'Website baru sudah live'},
        ${'100% Klien Puas'}, ${'Hasil nyata, bukan janji'},
        ${'Desain Strategis'}, ${'Setiap elemen dirancang dengan tujuan — bukan sekadar indah, tapi fungsional dan mendorong konversi.'},
        ${'Kode Bersih'}, ${'Loading cepat, SEO-optimized, dan dibangun dengan teknologi modern untuk performa maksimal di semua perangkat.'},
        ${'Support 24/7'}, ${'Kami nggak hilang setelah launch. Support dan maintenance berkelanjutan supaya kamu tenang.'}
      )`;
  }

  const svcCount = await sql`SELECT COUNT(*) AS c FROM services`;
  if (parseInt(svcCount[0].c) === 0) {
    await sql`INSERT INTO services (icon, title, description, tag, sort_order) VALUES
      (${'fas fa-palette'},      ${'Web Design'},        ${'Website custom yang memikat audiens dan mencerminkan identitas premium brand kamu. Tanpa template, selamanya.'}, ${'Paling Populer'}, ${1}),
      (${'fas fa-shopping-bag'}, ${'E-Commerce'},         ${'Toko online yang dibangun untuk jualan. Payment gateway, manajemen produk, dan checkout yang dioptimasi untuk konversi maksimal.'}, ${'ROI Tinggi'},    ${2}),
      (${'fas fa-rocket'},       ${'Landing Page'},       ${'Landing page yang dirancang untuk menangkap leads dan mendorong aksi. Cocok untuk kampanye dan peluncuran produk.'}, ${'Cepat Selesai'}, ${3}),
      (${'fas fa-building'},     ${'Company Profile'},    ${'Website perusahaan profesional yang membangun kepercayaan dan kredibilitas. Kesan pertama yang tak terlupakan.'}, ${'Korporat'},      ${4}),
      (${'fas fa-search'},       ${'SEO Optimization'},   ${'Tampil di halaman pertama Google. Technical SEO, strategi konten, dan optimasi performa untuk mendatangkan traffic organik.'}, ${'Jangka Panjang'}, ${5}),
      (${'fas fa-mobile-alt'},   ${'UI/UX Design'},       ${'Antarmuka yang berpusat pada pengguna, dirancang melalui riset dan iterasi. Pengalaman indah yang just works.'}, ${'Berbasis Riset'}, ${6})`;
  }

  const whyCount = await sql`SELECT COUNT(*) AS c FROM why_items`;
  if (parseInt(whyCount[0].c) === 0) {
    await sql`INSERT INTO why_items (title, description, sort_order) VALUES
      (${'Desain yang Fokus Revenue'},  ${'Setiap keputusan desain kami berakar pada psikologi konversi. Kami nggak desain untuk pamer — kami desain untuk omzet kamu.'}, ${1}),
      (${'Pengerjaan Super Cepat'},     ${'Kebanyakan proyek selesai dalam 7-14 hari. Kami bergerak cepat tanpa mengorbankan kualitas karena proses kami sudah teruji.'}, ${2}),
      (${'Harga Transparan'},           ${'Tanpa biaya tersembunyi, tanpa kejutan. Kamu tahu persis apa yang kamu bayar sebelum kami menulis satu baris kode pun.'}, ${3}),
      (${'Partner Setelah Launch'},     ${'Kami nggak menghilang setelah serah terima. Periode maintenance gratis, support prioritas, dan selalu bisa dihubungi via WhatsApp.'}, ${4}),
      (${'Garansi 100% Puas'},          ${'Kami revisi sampai kamu benar-benar puas. Belum sreg? Kami terus iterasi. Visi kamu adalah misi kami — tanpa kompromi.'}, ${5})`;
  }

  const procCount = await sql`SELECT COUNT(*) AS c FROM process_steps`;
  if (parseInt(procCount[0].c) === 0) {
    await sql`INSERT INTO process_steps (title, description, sort_order) VALUES
      (${'Diskusi'}, ${'Kami pelajari bisnis kamu, tujuan, target audiens, dan kompetitor untuk menyusun strategi yang tepat.'}, ${1}),
      (${'Desain'},  ${'Wireframe dan desain visual custom dibuat untuk persetujuan kamu. Kami iterasi sampai sempurna.'}, ${2}),
      (${'Develop'}, ${'Kode bersih, layout responsif, loading cepat. Dibangun dengan teknologi modern untuk performa maksimal.'}, ${3}),
      (${'Launch'},  ${'Review akhir, go live, dan support berkelanjutan. Kami rayakan launch kamu dan tetap di sisi kamu.'}, ${4})`;
  }

  const portCount = await sql`SELECT COUNT(*) AS c FROM portfolio`;
  if (parseInt(portCount[0].c) === 0) {
    const now = new Date().toISOString();
    await sql`INSERT INTO portfolio
      (client_name, project_title, description, tags, live_url, browser_url, glow_color, sort_order, created_at) VALUES
      (${'Luxe Interior'},       ${'Studio Desain Interior Premium'},    ${'Website portfolio elegan yang menampilkan proyek desain interior residensial dan komersial kelas atas.'},   ${'Web Design,Portfolio,SEO'},           ${'https://luxeinterior.id'},     ${'luxeinterior.id'},     ${'rgba(212,175,55,.15)'}, ${1}, ${now}),
      (${'Warung Digital'},      ${'E-Commerce Food & Beverage'},        ${'Toko online lengkap dengan integrasi pembayaran, manajemen inventaris, dan alur checkout yang dioptimasi untuk konversi.'}, ${'E-Commerce,Payment,Dashboard'}, ${'https://warungdigital.co.id'}, ${'warungdigital.co.id'}, ${'rgba(74,222,128,.12)'},  ${2}, ${now}),
      (${'Dr. Aesthetic Clinic'},${'Landing Page Klinik Kecantikan'},    ${'Landing page high-converting untuk klinik premium. Integrasi booking WhatsApp dan showcase treatment.'},      ${'Landing Page,Healthcare,Booking'},    ${'https://dr-aesthetic.com'},    ${'dr-aesthetic.com'},    ${'rgba(99,102,241,.12)'},  ${3}, ${now})`;
  }

  const testiCount = await sql`SELECT COUNT(*) AS c FROM testimonials`;
  if (parseInt(testiCount[0].c) === 0) {
    await sql`INSERT INTO testimonials (quote, name, role, avatar_letter, sort_order) VALUES
      (${'CuanSite benar-benar mengubah kehadiran online kami. Dalam 2 minggu setelah launch, inquiry melonjak drastis. Investasi yang langsung balik modal di bulan pertama.'}, ${'Rina Hartono'},   ${'CEO, Luxe Interior'},      ${'R'}, ${1}),
      (${'Tim CuanSite paham visi kami dari hari pertama. Mereka deliver platform e-commerce yang customer kami suka banget. Penjualan naik signifikan sejak launch.'},           ${'Ahmad Fauzi'},   ${'Founder, Warung Digital'},  ${'A'}, ${2}),
      (${'Profesional, cepat, dan sangat berbakat. Masih muda tapi kualitas kerjanya luar biasa. Landing page kami sekarang jadi mesin penghasil leads. CuanSite bukan cuma vendor, tapi partner growth.'}, ${'Dr. Sarah Wijaya'}, ${'Direktur, Dr. Aesthetic'}, ${'D'}, ${3})`;
  }

  const ctaRows = await sql`SELECT id FROM cta WHERE id = 1`;
  if (!ctaRows.length) {
    await sql`INSERT INTO cta (id, eyebrow, title_1, title_2, subtitle) VALUES
      (1, ${'Siap?'}, ${'Yuk Bangun Sesuatu'}, ${'yang Luar Biasa'},
       ${'Kompetitor kamu sudah punya website keren. Saatnya punya yang lebih baik. Yuk ngobrol soal proyek kamu — tanpa komitmen, cuma diskusi santai.'})`;
  }

  const socialRows = await sql`SELECT id FROM socials WHERE id = 1`;
  if (!socialRows.length) {
    await sql`INSERT INTO socials (id, whatsapp, instagram, tiktok, phone_display)
      VALUES (1, ${'6285136910032'}, ${'cuansite.id'}, ${'cuansite.id'}, ${'+62 851-3691-0032'})`;
  }

  const pwdRows = await sql`SELECT value FROM settings WHERE key = 'admin_password'`;
  if (!pwdRows.length) {
    await sql`INSERT INTO settings (key, value) VALUES (${'admin_password'}, ${'cuansite2025'})`;
  }

  console.log('[CuanSite] Database ready');
})().catch(err => console.error('[CuanSite] DB init error:', err));

// Ensure DB is ready before every request
app.use(async (_req, _res, next) => {
  await dbInitPromise;
  next();
});

// ─── AUTH ROUTES ──────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const { password } = req.body;
    const rows = await sql`SELECT value FROM settings WHERE key = 'admin_password'`;
    if (rows.length && password === rows[0].value) {
      req.session.authenticated = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Password salah' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/logout', (req, res) => {
  req.session = null;
  res.json({ success: true });
});

app.get('/api/auth-check', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

app.post('/api/change-password', requireAuth, async (req, res) => {
  try {
    const { current, newPassword } = req.body;
    const rows = await sql`SELECT value FROM settings WHERE key = 'admin_password'`;
    if (rows.length && current === rows[0].value) {
      await sql`UPDATE settings SET value = ${newPassword} WHERE key = 'admin_password'`;
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Password lama salah' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUBLIC CONTENT ───────────────────────────────────────────────
app.get('/api/content', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const [hero, about, services, whyItems, processSteps, portfolio, testimonials, cta, socials] =
      await Promise.all([
        sql`SELECT * FROM hero WHERE id = 1`,
        sql`SELECT * FROM about WHERE id = 1`,
        sql`SELECT * FROM services ORDER BY sort_order ASC`,
        sql`SELECT * FROM why_items ORDER BY sort_order ASC`,
        sql`SELECT * FROM process_steps ORDER BY sort_order ASC`,
        sql`SELECT * FROM portfolio ORDER BY sort_order ASC`,
        sql`SELECT * FROM testimonials ORDER BY sort_order ASC`,
        sql`SELECT * FROM cta WHERE id = 1`,
        sql`SELECT * FROM socials WHERE id = 1`,
      ]);
    res.json({
      hero:         hero[0] || null,
      about:        about[0] || null,
      services,
      whyItems,
      processSteps,
      portfolio:    portfolio.map(p => ({ ...p, screenshot: (p.screenshot || '').trim() })),
      testimonials: testimonials.map((t, idx) => {
        const name = (t.name || '').trim();
        return {
          ...t,
          sort_order:    Number.isFinite(Number(t.sort_order)) ? Number(t.sort_order) : idx + 1,
          name,
          quote:         (t.quote || '').trim(),
          role:          (t.role  || '').trim(),
          avatar_letter: (t.avatar_letter || '').trim() || (name ? name.charAt(0).toUpperCase() : '?'),
        };
      }),
      cta:    cta[0]    || null,
      socials: socials[0] || null,
    });
  } catch (err) {
    console.error('/api/content error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── HERO ─────────────────────────────────────────────────────────
app.get('/api/hero', requireAuth, async (req, res) => {
  const rows = await sql`SELECT * FROM hero WHERE id = 1`;
  res.json(rows[0] || null);
});

app.put('/api/hero', requireAuth, async (req, res) => {
  try {
    const h = req.body;
    await sql`UPDATE hero SET
      badge=${h.badge}, title_1=${h.title_1}, title_2=${h.title_2}, title_3=${h.title_3},
      subtitle=${h.subtitle}, btn_primary=${h.btn_primary}, btn_secondary=${h.btn_secondary},
      stat_1_num=${h.stat_1_num}, stat_1_label=${h.stat_1_label},
      stat_2_num=${h.stat_2_num}, stat_2_label=${h.stat_2_label},
      stat_3_num=${h.stat_3_num}, stat_3_label=${h.stat_3_label},
      stat_4_num=${h.stat_4_num}, stat_4_label=${h.stat_4_label}
      WHERE id = 1`;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── ABOUT ────────────────────────────────────────────────────────
app.get('/api/about', requireAuth, async (req, res) => {
  const rows = await sql`SELECT * FROM about WHERE id = 1`;
  res.json(rows[0] || null);
});

app.put('/api/about', requireAuth, async (req, res) => {
  try {
    const a = req.body;
    await sql`UPDATE about SET
      eyebrow=${a.eyebrow}, title_1=${a.title_1}, title_2=${a.title_2}, description=${a.description},
      philosophy_label=${a.philosophy_label}, philosophy_title=${a.philosophy_title}, philosophy_desc=${a.philosophy_desc},
      badge_top_title=${a.badge_top_title}, badge_top_desc=${a.badge_top_desc},
      badge_bot_title=${a.badge_bot_title}, badge_bot_desc=${a.badge_bot_desc},
      feat_1_title=${a.feat_1_title}, feat_1_desc=${a.feat_1_desc},
      feat_2_title=${a.feat_2_title}, feat_2_desc=${a.feat_2_desc},
      feat_3_title=${a.feat_3_title}, feat_3_desc=${a.feat_3_desc}
      WHERE id = 1`;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── SERVICES ─────────────────────────────────────────────────────
app.get('/api/services', requireAuth, async (req, res) => {
  res.json(await sql`SELECT * FROM services ORDER BY sort_order ASC`);
});

app.post('/api/services', requireAuth, async (req, res) => {
  try {
    const s = req.body;
    const max = await sql`SELECT COALESCE(MAX(sort_order), 0) AS m FROM services`;
    const rows = await sql`INSERT INTO services (icon, title, description, tag, sort_order)
      VALUES (${s.icon}, ${s.title}, ${s.description}, ${s.tag}, ${parseInt(max[0].m) + 1})
      RETURNING id`;
    res.json({ success: true, id: rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/services/:id', requireAuth, async (req, res) => {
  try {
    const s = req.body;
    await sql`UPDATE services SET icon=${s.icon}, title=${s.title}, description=${s.description},
      tag=${s.tag}, sort_order=${s.sort_order} WHERE id=${req.params.id}`;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/services/:id', requireAuth, async (req, res) => {
  try {
    await sql`DELETE FROM services WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── WHY ITEMS ────────────────────────────────────────────────────
app.get('/api/why-items', requireAuth, async (req, res) => {
  res.json(await sql`SELECT * FROM why_items ORDER BY sort_order ASC`);
});

app.post('/api/why-items', requireAuth, async (req, res) => {
  try {
    const w = req.body;
    const max = await sql`SELECT COALESCE(MAX(sort_order), 0) AS m FROM why_items`;
    const rows = await sql`INSERT INTO why_items (title, description, sort_order)
      VALUES (${w.title}, ${w.description}, ${parseInt(max[0].m) + 1}) RETURNING id`;
    res.json({ success: true, id: rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/why-items/:id', requireAuth, async (req, res) => {
  try {
    const w = req.body;
    await sql`UPDATE why_items SET title=${w.title}, description=${w.description},
      sort_order=${w.sort_order} WHERE id=${req.params.id}`;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/why-items/:id', requireAuth, async (req, res) => {
  try {
    await sql`DELETE FROM why_items WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PROCESS STEPS ────────────────────────────────────────────────
app.get('/api/process-steps', requireAuth, async (req, res) => {
  res.json(await sql`SELECT * FROM process_steps ORDER BY sort_order ASC`);
});

app.post('/api/process-steps', requireAuth, async (req, res) => {
  try {
    const p = req.body;
    const max = await sql`SELECT COALESCE(MAX(sort_order), 0) AS m FROM process_steps`;
    const rows = await sql`INSERT INTO process_steps (title, description, sort_order)
      VALUES (${p.title}, ${p.description}, ${parseInt(max[0].m) + 1}) RETURNING id`;
    res.json({ success: true, id: rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/process-steps/:id', requireAuth, async (req, res) => {
  try {
    const p = req.body;
    await sql`UPDATE process_steps SET title=${p.title}, description=${p.description},
      sort_order=${p.sort_order} WHERE id=${req.params.id}`;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/process-steps/:id', requireAuth, async (req, res) => {
  try {
    await sql`DELETE FROM process_steps WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PORTFOLIO ────────────────────────────────────────────────────
app.get('/api/portfolio', requireAuth, async (req, res) => {
  res.json(await sql`SELECT * FROM portfolio ORDER BY sort_order ASC`);
});

function handleUpload(req, res, next) {
  upload.single('screenshot')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}

app.post('/api/portfolio', requireAuth, handleUpload, async (req, res) => {
  try {
    const p = req.body;
    const max = await sql`SELECT COALESCE(MAX(sort_order), 0) AS m FROM portfolio`;
    const nextOrder = parseInt(max[0].m) + 1;
    let screenshot = '';
    if (req.file) {
      screenshot = await uploadToCloudinary(req.file.buffer, 'portfolio-' + Date.now());
    }
    const rows = await sql`INSERT INTO portfolio
      (client_name, project_title, description, tags, live_url, browser_url, glow_color, screenshot, sort_order, created_at)
      VALUES (
        ${p.client_name || ''}, ${p.project_title || ''}, ${p.description || ''},
        ${p.tags || ''}, ${p.live_url || ''}, ${p.browser_url || ''},
        ${p.glow_color || 'rgba(212,175,55,.15)'}, ${screenshot}, ${nextOrder}, ${new Date().toISOString()}
      ) RETURNING id`;
    res.json({ success: true, id: rows[0].id });
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
      screenshot = await uploadToCloudinary(req.file.buffer, 'portfolio-' + Date.now());
    }
    await sql`UPDATE portfolio SET
      client_name=${p.client_name || ''}, project_title=${p.project_title || ''},
      description=${p.description || ''}, tags=${p.tags || ''},
      live_url=${p.live_url || ''}, browser_url=${p.browser_url || ''},
      glow_color=${p.glow_color || 'rgba(212,175,55,.15)'},
      screenshot=${screenshot}, sort_order=${parseInt(p.sort_order) || 0}
      WHERE id=${req.params.id}`;
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/portfolio error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/portfolio/:id', requireAuth, async (req, res) => {
  try {
    await sql`DELETE FROM portfolio WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/portfolio error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── TESTIMONIALS ────────────────────────────────────────────────
app.get('/api/testimonials', requireAuth, async (req, res) => {
  res.json(await sql`SELECT * FROM testimonials ORDER BY sort_order ASC`);
});

app.post('/api/testimonials', requireAuth, async (req, res) => {
  try {
    const t = req.body;
    const max = await sql`SELECT COALESCE(MAX(sort_order), 0) AS m FROM testimonials`;
    const avatarLetter = t.avatar_letter || (t.name ? t.name.charAt(0).toUpperCase() : '?');
    const rows = await sql`INSERT INTO testimonials (quote, name, role, avatar_letter, sort_order)
      VALUES (${t.quote}, ${t.name}, ${t.role}, ${avatarLetter}, ${parseInt(max[0].m) + 1}) RETURNING id`;
    res.json({ success: true, id: rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/testimonials/:id', requireAuth, async (req, res) => {
  try {
    const t = req.body;
    await sql`UPDATE testimonials SET quote=${t.quote}, name=${t.name}, role=${t.role},
      avatar_letter=${t.avatar_letter}, sort_order=${t.sort_order} WHERE id=${req.params.id}`;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/testimonials/:id', requireAuth, async (req, res) => {
  try {
    await sql`DELETE FROM testimonials WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CTA ─────────────────────────────────────────────────────────
app.get('/api/cta', requireAuth, async (req, res) => {
  const rows = await sql`SELECT * FROM cta WHERE id = 1`;
  res.json(rows[0] || null);
});

app.put('/api/cta', requireAuth, async (req, res) => {
  try {
    const c = req.body;
    await sql`UPDATE cta SET eyebrow=${c.eyebrow}, title_1=${c.title_1},
      title_2=${c.title_2}, subtitle=${c.subtitle} WHERE id = 1`;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── SOCIALS ─────────────────────────────────────────────────────
app.get('/api/socials', requireAuth, async (req, res) => {
  const rows = await sql`SELECT * FROM socials WHERE id = 1`;
  res.json(rows[0] || null);
});

app.put('/api/socials', requireAuth, async (req, res) => {
  try {
    const s = req.body;
    await sql`UPDATE socials SET whatsapp=${s.whatsapp}, instagram=${s.instagram},
      tiktok=${s.tiktok}, phone_display=${s.phone_display} WHERE id = 1`;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── EXPORT (Vercel serverless — no app.listen) ───────────────────
module.exports = app;
