/* ============================================================
   PUNDI — Kas Keluarga (versi standalone)
   Seluruh logika aplikasi: state, render, chart, form.
   Data disimpan di localStorage perangkat (tanpa server).
   ============================================================ */
'use strict';

(function () {
  /* ---------------------------------------------------------
     1. UTILITAS & FORMAT
  --------------------------------------------------------- */
  var MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  var MON = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  var DAYS = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

  function pad2(n) { return String(n).padStart(2, '0'); }
  function iso(y, m, d) { return y + '-' + pad2(m + 1) + '-' + pad2(d); }
  function todayISO() { var t = new Date(); return iso(t.getFullYear(), t.getMonth(), t.getDate()); }
  function curMonthKey() { return todayISO().slice(0, 7); }
  function parseD(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

  var nfIDR = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });
  var nf0 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

  function fmtIDR(n) { return nfIDR.format(n); }
  function fmtShort(n) {
    var a = Math.abs(n);
    if (a >= 1e9) return 'Rp ' + nf1.format(n / 1e9) + ' M';
    if (a >= 1e6) return 'Rp ' + nf1.format(n / 1e6) + ' jt';
    if (a >= 1e3) return 'Rp ' + nf0.format(n / 1e3) + ' rb';
    return fmtIDR(n);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function monthLabel(k) { var p = k.split('-'); return MONTHS[+p[1] - 1] + ' ' + p[0]; }
  function shiftKey(k, d) { var p = k.split('-'); var t = new Date(+p[0], +p[1] - 1 + d, 1); return t.getFullYear() + '-' + pad2(t.getMonth() + 1); }
  function fmtDate(s) { var d = parseD(s); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); }
  function fmtDateLong(s) { var d = parseD(s); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function dayLabel(s) {
    if (s === todayISO()) return 'Hari ini';
    var diff = Math.round((parseD(todayISO()) - parseD(s)) / 86400000);
    if (diff === 1) return 'Kemarin';
    var d = parseD(s);
    return DAYS[d.getDay()] + ', ' + fmtDate(s);
  }
  function greeting() {
    var h = new Date().getHours();
    return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 19 ? 'Selamat sore' : 'Selamat malam';
  }
  function pctDelta(cur, prev) { if (!prev) return null; return ((cur - prev) / prev) * 100; }

  var ICON_ALIAS = { utensils: 'utensils-crossed' };
  function lic(name, sz, sw) {
    name = ICON_ALIAS[name] || name;
    return '<i data-lucide="' + name + '" style="--ic:' + (sz || 18) + 'px;--isw:' + (sw || 2.1) + '"></i>';
  }
  function iconBadge(name, color, bg, size) {
    return '<span class="ibadge" style="width:' + size + 'px;height:' + size + 'px;background:' + bg + ';color:' + color + '">' +
      lic(name, Math.round(size * 0.45), 2.2) + '</span>';
  }
  function catDot(color, icon, size) {
    var c = color || '#64748B';
    return iconBadge(icon || 'circle-dashed', c, c + '16', size || 38);
  }
  function deltaChip(pct, invert) {
    if (pct === null || !isFinite(pct)) return '';
    var up = pct >= 0;
    var good = invert ? !up : up;
    return '<span class="delta ' + (good ? 'good' : 'bad') + '">' + (up ? '▲' : '▼') + ' ' + Math.abs(pct).toFixed(0) + '%</span>';
  }

  /* ---------------------------------------------------------
     2. DATA CONTOH (SEED) — 8 bulan transaksi + 10 aset
  --------------------------------------------------------- */
  var INCOME_CATS = [
    { name: 'Gaji', icon: 'banknote', color: '#127A5B' },
    { name: 'Usaha Sampingan', icon: 'briefcase', color: '#2F9E77' },
    { name: 'Investasi', icon: 'trending-up', color: '#C9A227' },
    { name: 'Bonus & THR', icon: 'gift', color: '#7C6FD0' },
    { name: 'Pemasukan Lain', icon: 'circle-plus', color: '#5B8DEF' }
  ];
  var EXPENSE_CATS = [
    { name: 'Makanan & Belanja Dapur', icon: 'utensils', color: '#E0762E' },
    { name: 'Transportasi', icon: 'car', color: '#5B8DEF' },
    { name: 'Tagihan & Utilitas', icon: 'receipt', color: '#D95D4E' },
    { name: 'Belanja & Gaya Hidup', icon: 'shopping-bag', color: '#C65D9E' },
    { name: 'Pendidikan Anak', icon: 'graduation-cap', color: '#7C6FD0' },
    { name: 'Kesehatan', icon: 'heart-pulse', color: '#E5484D' },
    { name: 'Hiburan & Liburan', icon: 'clapperboard', color: '#2F9E77' },
    { name: 'Rumah Tangga', icon: 'home', color: '#8A7B5C' },
    { name: 'Cicilan & Kredit', icon: 'landmark', color: '#B08968' },
    { name: 'Pengeluaran Lain', icon: 'more-horizontal', color: '#64748B' }
  ];
  var EXP_NOTES = {
    'Makanan & Belanja Dapur': ['Belanja mingguan di pasar', 'Groceries supermarket', 'Makan siang keluarga', 'Sayur & buah segar', 'Kopi dan roti pagi'],
    'Transportasi': ['Bensin mobil', 'Isi e-toll', 'Servis ringan motor', 'Ojek online ke kantor', 'Parkir bulanan'],
    'Tagihan & Utilitas': ['Listrik PLN', 'Internet rumah', 'Air PDAM', 'Pulsa & paket data', 'Iuran lingkungan'],
    'Belanja & Gaya Hidup': ['Baju anak sekolah', 'Skincare ibu', 'Sepatu baru', 'Peralatan dapur', 'Mainan anak'],
    'Pendidikan Anak': ['SPP sekolah', 'Buku pelajaran', 'Les matematika', 'Seragam sekolah', 'Kursus bahasa Inggris'],
    'Kesehatan': ['Vitamin keluarga', 'Periksa ke dokter', 'Obat apotek', 'BPJS Kesehatan', 'Imunisasi anak'],
    'Hiburan & Liburan': ['Nonton bioskop', 'Tiket taman bermain', 'Streaming bulanan', 'Makan di luar akhir pekan', 'Staycation hotel'],
    'Rumah Tangga': ['Gaji ART', 'Sabun & kebutuhan bersih', 'Gas LPG', 'Perbaikan keran air', 'Alat kebersihan'],
    'Cicilan & Kredit': ['Cicilan KPR', 'Cicilan mobil', 'Asuransi keluarga'],
    'Pengeluaran Lain': ['Hadiah pernikahan kerabat', 'Donasi & zakat', 'Iuran arisan', 'Amplop acara keluarga']
  };
  var INC_NOTES = {
    'Gaji': ['Gaji bulanan ayah', 'Gaji bulanan ibu'],
    'Usaha Sampingan': ['Omzet toko online', 'Proyek freelance', 'Penjualan kue titipan'],
    'Investasi': ['Dividen saham', 'Bunga deposito', 'Capital gain reksa dana'],
    'Bonus & THR': ['Bonus kinerja', 'THR', 'Insentif proyek'],
    'Pemasukan Lain': ['Cashback', 'Penjualan barang bekas', 'Uang kaget dari kerabat']
  };
  var SEED_ASSETS = [
    { name: 'Rumah Keluarga (KPR)', type: 'properti', value: 850000000, acquiredAt: '2019-06-14', note: 'Rumah utama di Bekasi, sisa KPR 8 tahun' },
    { name: 'Tanah Kavling Kampung Halaman', type: 'properti', value: 120000000, acquiredAt: '2021-02-02', note: 'Investasi jangka panjang' },
    { name: 'Toyota Avanza 2018', type: 'kendaraan', value: 155000000, acquiredAt: '2018-11-20', note: 'Mobil keluarga' },
    { name: 'Honda Vario 2022', type: 'kendaraan', value: 19500000, acquiredAt: '2022-03-15', note: 'Motor harian' },
    { name: 'Tabungan BCA', type: 'bank', value: 48500000, acquiredAt: null, note: 'Dana darurat & operasional' },
    { name: 'Deposito Bank Mandiri', type: 'bank', value: 100000000, acquiredAt: '2023-01-10', note: 'Jatuh tempo tahunan, bunga 5,5%' },
    { name: 'Reksa Dana Pasar Uang', type: 'investasi', value: 38500000, acquiredAt: '2022-07-01', note: 'Bibit - likuid' },
    { name: 'Saham BBCA & TLKM', type: 'investasi', value: 27800000, acquiredAt: '2021-09-09', note: 'Portofolio jangka panjang' },
    { name: 'Emas Antam 25 gram', type: 'investasi', value: 34500000, acquiredAt: '2020-12-24', note: 'Disimpan di safe deposit box' },
    { name: 'Kas Tunai Rumah', type: 'tunai', value: 6500000, acquiredAt: null, note: 'Uang tunai untuk kebutuhan harian' }
  ];
  var ASSET_TYPES = {
    tunai: { label: 'Tunai', icon: 'wallet', color: '#7C6A3F', bg: '#F4EEDC' },
    bank: { label: 'Bank & Deposito', icon: 'landmark', color: '#2B6CB0', bg: '#E3EEF9' },
    investasi: { label: 'Investasi', icon: 'trending-up', color: '#127A5B', bg: '#DFF0E8' },
    properti: { label: 'Properti', icon: 'home', color: '#B08968', bg: '#F2E8DF' },
    kendaraan: { label: 'Kendaraan', icon: 'car', color: '#7C6FD0', bg: '#E9E6F8' },
    lainnya: { label: 'Lainnya', icon: 'gem', color: '#64748B', bg: '#E8ECF1' }
  };
  function assetMeta(t) { return ASSET_TYPES[t] || ASSET_TYPES.lainnya; }

  function buildSeed() {
    var s = 42;
    function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    function pick(a) { return a[Math.floor(rnd() * a.length)]; }
    function between(a, b) { return Math.round((a + rnd() * (b - a)) / 1000) * 1000; }

    var categories = [], cid = 1;
    INCOME_CATS.forEach(function (c) { categories.push({ id: cid++, type: 'income', name: c.name, icon: c.icon, color: c.color }); });
    EXPENSE_CATS.forEach(function (c) { categories.push({ id: cid++, type: 'expense', name: c.name, icon: c.icon, color: c.color }); });
    var byName = {};
    categories.forEach(function (c) { byName[c.name] = c.id; });

    var transactions = [], tid = 1;
    var now = new Date();
    for (var off = 7; off >= 0; off--) {
      var ref = new Date(now.getFullYear(), now.getMonth() - off, 1);
      var y = ref.getFullYear(), m = ref.getMonth();
      var dim = new Date(y, m + 1, 0).getDate();
      var maxD = off === 0 ? Math.min(now.getDate(), dim) : dim;

      function add(d, type, cat, amt, note) {
        if (d > maxD) return;
        var notes = type === 'income' ? INC_NOTES : EXP_NOTES;
        transactions.push({
          id: tid++, type: type, amount: amt,
          categoryId: byName[cat] || null,
          note: note || pick(notes[cat] || ['Transaksi']),
          date: iso(y, m, d)
        });
      }

      add(1, 'income', 'Gaji', 12500000, 'Gaji bulanan ayah');
      add(1, 'income', 'Gaji', 6800000, 'Gaji bulanan ibu');
      var side = 2 + Math.floor(rnd() * 2);
      for (var i = 0; i < side; i++) add(3 + Math.floor(rnd() * 24), 'income', 'Usaha Sampingan', between(850000, 2600000));
      if (rnd() > 0.45) add(10 + Math.floor(rnd() * 15), 'income', 'Investasi', between(350000, 1400000));
      if (rnd() > 0.7) add(5 + Math.floor(rnd() * 20), 'income', 'Pemasukan Lain', between(150000, 600000));

      add(2, 'expense', 'Tagihan & Utilitas', between(650000, 900000), 'Listrik PLN');
      add(5, 'expense', 'Tagihan & Utilitas', 375000, 'Internet rumah');
      add(8, 'expense', 'Tagihan & Utilitas', between(180000, 280000), 'Air PDAM');
      add(12, 'expense', 'Kesehatan', 300000, 'BPJS Kesehatan');
      add(10, 'expense', 'Pendidikan Anak', 950000, 'SPP sekolah');
      add(5, 'expense', 'Cicilan & Kredit', 3250000, 'Cicilan KPR');
      add(15, 'expense', 'Cicilan & Kredit', 2100000, 'Cicilan mobil');

      for (var w = 0; w < 4; w++) add(2 + w * 7 + Math.floor(rnd() * 3), 'expense', 'Makanan & Belanja Dapur', between(450000, 800000));
      var dine = 2 + Math.floor(rnd() * 3);
      for (var d2 = 0; d2 < dine; d2++) add(1 + Math.floor(rnd() * 27), 'expense', 'Makanan & Belanja Dapur', between(120000, 450000), 'Makan di luar akhir pekan');
      var tr = 3 + Math.floor(rnd() * 3);
      for (var t2 = 0; t2 < tr; t2++) add(1 + Math.floor(rnd() * 27), 'expense', 'Transportasi', between(150000, 500000));
      var sh = 1 + Math.floor(rnd() * 3);
      for (var s2 = 0; s2 < sh; s2++) add(1 + Math.floor(rnd() * 27), 'expense', 'Belanja & Gaya Hidup', between(250000, 1200000));
      for (var h2 = 0; h2 < 2; h2++) add(1 + Math.floor(rnd() * 27), 'expense', 'Rumah Tangga', between(200000, 850000));
      if (rnd() > 0.4) add(1 + Math.floor(rnd() * 27), 'expense', 'Pendidikan Anak', between(350000, 900000));
      if (rnd() > 0.55) add(1 + Math.floor(rnd() * 27), 'expense', 'Kesehatan', between(150000, 700000));
      if (rnd() > 0.35) add(1 + Math.floor(rnd() * 27), 'expense', 'Hiburan & Liburan', between(200000, 1500000));
      if (rnd() > 0.5) add(1 + Math.floor(rnd() * 27), 'expense', 'Pengeluaran Lain', between(100000, 500000));
    }

    var assets = SEED_ASSETS.map(function (a, i) {
      return { id: i + 1, name: a.name, type: a.type, value: a.value, acquiredAt: a.acquiredAt, note: a.note };
    });
    return { categories: categories, transactions: transactions, assets: assets };
  }

  /* ---------------------------------------------------------
     3. PENYIMPANAN (localStorage)
  --------------------------------------------------------- */
  var KEY = 'pundi-v1';
  var state = null;
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { state = JSON.parse(raw); return; }
    } catch (e) { /* abaikan */ }
    state = buildSeed();
    save();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* penuh/privat */ } }
  function nextId(arr) { return arr.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1; }

  /* ---------------------------------------------------------
     4. SELEKTOR / AGREGASI
  --------------------------------------------------------- */
  function totalsAll() {
    var i = 0, e = 0;
    state.transactions.forEach(function (t) { if (t.type === 'income') i += t.amount; else e += t.amount; });
    return { i: i, e: e };
  }
  function aggMonth(k) {
    var i = 0, e = 0;
    state.transactions.forEach(function (t) {
      if (t.date.indexOf(k) === 0) { if (t.type === 'income') i += t.amount; else e += t.amount; }
    });
    return { i: i, e: e };
  }
  function series(n) {
    var out = [];
    for (var i = n - 1; i >= 0; i--) {
      var k = shiftKey(curMonthKey(), -i);
      var a = aggMonth(k);
      out.push({ key: k, label: MON[+k.slice(5, 7) - 1], income: a.i, expense: a.e });
    }
    return out;
  }
  function yearSeries(y) {
    var out = [];
    for (var m = 0; m < 12; m++) {
      var k = y + '-' + pad2(m + 1);
      var a = aggMonth(k);
      out.push({ key: k, label: MON[m], income: a.i, expense: a.e });
    }
    return out;
  }
  function catById(id) {
    for (var i = 0; i < state.categories.length; i++) if (state.categories[i].id === id) return state.categories[i];
    return null;
  }
  function catSlices(type, pred) {
    var map = {};
    state.transactions.forEach(function (t) {
      if (t.type !== type || !pred(t)) return;
      var c = catById(t.categoryId);
      var name = c ? c.name : 'Tanpa kategori';
      if (!map[name]) map[name] = { name: name, color: c ? c.color : '#64748B', icon: c ? c.icon : 'circle-dashed', value: 0 };
      map[name].value += t.amount;
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.value - a.value; });
  }
  function totalAssets() { return state.assets.reduce(function (a, b) { return a + b.value; }, 0); }
  function assetByType() {
    var map = {};
    state.assets.forEach(function (a) { map[a.type] = (map[a.type] || 0) + a.value; });
    return Object.keys(map).map(function (k) { return { type: k, value: map[k] }; }).sort(function (a, b) { return b.value - a.value; });
  }
  function filteredTx() {
    var q = ui.txQ.trim().toLowerCase();
    var rows = state.transactions.filter(function (t) {
      if (ui.txType !== 'all' && t.type !== ui.txType) return false;
      if (ui.txMonth !== 'all' && t.date.indexOf(ui.txMonth) !== 0) return false;
      if (q) {
        var c = catById(t.categoryId);
        var hay = ((t.note || '') + ' ' + (c ? c.name : '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    rows.sort(function (a, b) { return b.date.localeCompare(a.date) || b.id - a.id; });
    return rows.slice(0, 400);
  }

  /* ---------------------------------------------------------
     5. UI STATE & CHART HELPERS
  --------------------------------------------------------- */
  var ui = {
    view: 'dashboard',
    txType: 'all',
    txMonth: curMonthKey(),
    txQ: '',
    assetFilter: 'all',
    reportYear: new Date().getFullYear()
  };
  var charts = [];
  var chartDefs = [];
  var txSheet = null, assetSheet = null, confirmState = null;

  function destroyCharts() {
    charts.forEach(function (c) { try { c.destroy(); } catch (e) {} });
    charts = [];
  }
  function tooltipCfg(numeric) {
    return {
      backgroundColor: '#0b2e24', padding: 12, cornerRadius: 14, boxPadding: 6,
      titleColor: 'rgba(242,240,232,.6)', titleFont: { size: 11, weight: '700', family: "'Plus Jakarta Sans',sans-serif" },
      bodyColor: '#f2f0e8', bodyFont: { size: 12.5, weight: '600', family: "'Plus Jakarta Sans',sans-serif" },
      callbacks: numeric ? { label: function (c) { return ' ' + c.label + ': ' + fmtIDR(c.parsed); } }
                         : { label: function (c) { return ' ' + c.dataset.label + ': ' + fmtIDR(c.parsed.y); } }
    };
  }
  function axisTick() { return { color: '#7a857e', font: { size: 11.5, weight: '600', family: "'Plus Jakarta Sans',sans-serif" } }; }
  function makeBarChart(el, pts) {
    return new Chart(el, {
      type: 'bar',
      data: {
        labels: pts.map(function (p) { return p.label; }),
        datasets: [
          { label: 'Pemasukan', data: pts.map(function (p) { return p.income; }), backgroundColor: '#127a5b', borderRadius: 7, borderSkipped: false, maxBarThickness: 20 },
          { label: 'Pengeluaran', data: pts.map(function (p) { return p.expense; }), backgroundColor: '#d95d4e', borderRadius: 7, borderSkipped: false, maxBarThickness: 20 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: tooltipCfg(false) },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: axisTick() },
          y: { grid: { color: '#e9e5d8' }, border: { display: false }, ticks: Object.assign(axisTick(), { maxTicksLimit: 5, callback: function (v) { return fmtShort(v).replace('Rp ', ''); } }) }
        }
      }
    });
  }
  function makeDonut(el, slices) {
    return new Chart(el, {
      type: 'doughnut',
      data: {
        labels: slices.map(function (s) { return s.name; }),
        datasets: [{ data: slices.map(function (s) { return s.value; }), backgroundColor: slices.map(function (s) { return s.color; }), borderWidth: 0, spacing: 3, borderRadius: 7 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: tooltipCfg(true) } }
    });
  }
  function makeNetChart(el, pts) {
    return new Chart(el, {
      type: 'line',
      data: {
        labels: pts.map(function (p) { return p.label; }),
        datasets: [{
          label: 'Selisih Bersih',
          data: pts.map(function (p) { return p.income - p.expense; }),
          borderColor: '#127a5b', borderWidth: 2.5, tension: 0.35, fill: true,
          pointRadius: 3.5, pointBackgroundColor: '#127a5b', pointBorderColor: '#faf9f3', pointBorderWidth: 2,
          backgroundColor: function (ctx) {
            var area = ctx.chart.chartArea;
            var g = ctx.chart.ctx.createLinearGradient(0, area ? area.top : 0, 0, area ? area.bottom : 260);
            g.addColorStop(0, 'rgba(18,122,91,.25)');
            g.addColorStop(1, 'rgba(18,122,91,.02)');
            return g;
          }
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: tooltipCfg(false) },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: axisTick() },
          y: { grid: { color: '#e9e5d8' }, border: { display: false }, ticks: Object.assign(axisTick(), { maxTicksLimit: 5, callback: function (v) { return fmtShort(v).replace('Rp ', ''); } }) }
        }
      }
    });
  }
  function initCharts() {
    if (!window.Chart) return;
    Chart.defaults.font.family = "'Plus Jakarta Sans',sans-serif";
    chartDefs.forEach(function (d) {
      var el = document.getElementById(d.id);
      if (!el) return;
      try { var c = d.make(el.getContext('2d'), el); if (c) charts.push(c); } catch (e) { /* abaikan */ }
    });
  }

  /* ---------------------------------------------------------
     6. TAMPILAN: DASHBOARD
  --------------------------------------------------------- */
  function cu(value, fmt) { return 'data-cu="' + value + '" data-cu-fmt="' + fmt + '"'; }

  function kpiCard(i, iconHtml, iconCls, label, value, deltaHtml, noteHtml) {
    return '<section class="card kpi fade-up" style="animation-delay:' + i * 60 + 'ms">' +
      '<div class="kpi-top"><span class="kpi-ic ' + iconCls + '">' + iconHtml + '</span>' +
      '<p class="kpi-label">' + label + '</p></div>' +
      '<p class="num kpi-value" title="' + fmtIDR(value) + '" ' + cu(value, 'short') + '>–</p>' +
      '<div class="kpi-foot">' + (deltaHtml || '') + '<span>' + (noteHtml || '') + '</span></div></section>';
  }

  function viewDashboard() {
    var t = totalsAll();
    var bal = t.i - t.e;
    var mk = curMonthKey();
    var cur = aggMonth(mk), prev = aggMonth(shiftKey(mk, -1));
    var ta = totalAssets(), nw = bal + ta;
    var pts = series(8);
    var slices = catSlices('expense', function (tx) { return tx.date.indexOf(mk) === 0; });
    var expTot = slices.reduce(function (a, b) { return a + b.value; }, 0);
    var recent = state.transactions.slice().sort(function (a, b) { return b.date.localeCompare(a.date) || b.id - a.id; }).slice(0, 8);
    var byType = assetByType();
    var topAssets = state.assets.slice().sort(function (a, b) { return b.value - a.value; }).slice(0, 5);

    chartDefs.push({ id: 'cfChart', make: function (el) { return makeBarChart(el, pts); } });
    if (slices.length) chartDefs.push({ id: 'donutChart', make: function (el) { return makeDonut(el, slices.slice(0, 6)); } });

    var recentHtml = recent.map(function (tx) {
      var c = catById(tx.categoryId);
      var inc = tx.type === 'income';
      return '<li class="txline">' + catDot(c ? c.color : null, c ? c.icon : null, 38) +
        '<div class="tl-main"><p class="tl-note">' + esc(tx.note || (c ? c.name : 'Transaksi')) + '</p>' +
        '<p class="tl-sub">' + esc(c ? c.name : 'Tanpa kategori') + ' · ' + fmtDate(tx.date) + '</p></div>' +
        '<p class="num tl-amt ' + (inc ? 'pos' : '') + '">' + (inc ? '+' : '−') + fmtShort(tx.amount) + '</p></li>';
    }).join('');

    var allocHtml = byType.map(function (bt) {
      var meta = assetMeta(bt.type);
      return '<span style="width:' + (ta ? (bt.value / ta) * 100 : 0) + '%;background:' + meta.color + '" title="' + meta.label + ' — ' + esc(fmtIDR(bt.value)) + '"></span>';
    }).join('');

    var topAssetsHtml = topAssets.map(function (a) {
      var meta = assetMeta(a.type);
      return '<li class="assetline">' + iconBadge(meta.icon, meta.color, meta.bg, 36) +
        '<div class="tl-main"><p class="tl-note">' + esc(a.name) + '</p><p class="tl-sub">' + meta.label + '</p></div>' +
        '<p class="num tl-amt">' + fmtShort(a.value) + '</p></li>';
    }).join('');

    return '' +
    '<div class="wrap">' +
      '<header class="hdr fade-up">' +
        '<div><p class="hdr-date">' + fmtDateLong(todayISO()) + '</p>' +
        '<h1 class="hdr-title">' + greeting() + ', Keluarga Wijaya</h1></div>' +
        '<button class="btn btn-gold" data-action="open-tx">' + lic('plus', 17, 2.6) + 'Tambah Transaksi</button>' +
      '</header>' +

      '<div class="kpi-grid">' +
        '<section class="kpi kpi-dark fade-up" style="animation-delay:60ms">' +
          '<div class="glow glow-a"></div><div class="glow glow-b"></div>' +
          '<div class="kpi-top"><span class="kpi-ic kpi-ic-gold">' + lic('scale', 16, 2.2) + '</span>' +
          '<p class="kpi-label">Kekayaan Bersih</p></div>' +
          '<p class="num kpi-value" title="' + fmtIDR(nw) + '" ' + cu(nw, 'short') + '>–</p>' +
          '<p class="kpi-note">' + state.assets.length + ' aset tercatat + saldo kas <b>' + fmtShort(bal) + '</b></p>' +
        '</section>' +
        kpiCard(2, lic('arrow-down-left', 16, 2.6), 'kpi-ic-in', 'Pemasukan · ' + monthLabel(mk), cur.i, deltaChip(pctDelta(cur.i, prev.i)), 'vs bulan lalu') +
        kpiCard(3, lic('arrow-up-right', 16, 2.6), 'kpi-ic-out', 'Pengeluaran · ' + monthLabel(mk), cur.e, deltaChip(pctDelta(cur.e, prev.e), true), 'vs bulan lalu') +
        '<section class="card kpi fade-up" style="animation-delay:240ms">' +
          '<div class="kpi-top"><span class="kpi-ic kpi-ic-gold">' + lic('gem', 16, 2.2) + '</span>' +
          '<p class="kpi-label">Nilai Aset</p></div>' +
          '<p class="num kpi-value" title="' + fmtIDR(ta) + '" ' + cu(ta, 'short') + '>–</p>' +
          '<div class="kpi-foot"><a class="link" href="#/aset">Kelola aset ' + lic('arrow-right', 13, 2.6) + '</a></div>' +
        '</section>' +
      '</div>' +

      '<div class="grid-2">' +
        '<section class="card pad fade-up" style="animation-delay:300ms">' +
          '<div class="card-hdr"><div><h2 class="card-title">Arus Kas</h2><p class="card-sub">8 bulan terakhir</p></div>' +
          '<div class="legend"><span class="lg"><i style="background:#127a5b"></i>Pemasukan</span><span class="lg"><i style="background:#d95d4e"></i>Pengeluaran</span></div></div>' +
          '<div class="chartbox" style="height:300px"><canvas id="cfChart"></canvas></div>' +
        '</section>' +
        '<section class="card pad fade-up" style="animation-delay:360ms">' +
          '<h2 class="card-title">Pengeluaran</h2><p class="card-sub">' + monthLabel(mk) + ' · per kategori</p>' +
          (slices.length === 0
            ? '<div class="muted-center">Belum ada pengeluaran bulan ini</div>'
            : '<div class="donut-wrap"><div style="width:190px;height:190px;position:relative"><canvas id="donutChart"></canvas>' +
              '<div class="donut-center"><span>TOTAL</span><b class="num">' + fmtShort(expTot) + '</b></div></div></div>' +
              '<ul class="lg-list">' + slices.slice(0, 4).map(function (c) {
                  return '<li><i style="background:' + c.color + '"></i><span>' + esc(c.name) + '</span><b>' + (expTot ? Math.round(c.value / expTot * 100) : 0) + '%</b></li>';
                }).join('') + '</ul>' +
              '<a class="link" href="#/laporan">Lihat laporan lengkap ' + lic('arrow-right', 13, 2.6) + '</a>') +
        '</section>' +
      '</div>' +

      '<div class="grid-3">' +
        '<section class="card pad fade-up" style="animation-delay:420ms">' +
          '<div class="card-hdr"><div><h2 class="card-title">Transaksi Terbaru</h2>' +
          '<p class="card-sub">' + state.transactions.length + ' transaksi tercatat</p></div>' +
          '<a class="btn btn-ghost sm" href="#/transaksi">Semua ' + lic('arrow-right', 14, 2.5) + '</a></div>' +
          '<ul class="lines">' + recentHtml + '</ul>' +
        '</section>' +
        '<section class="card pad fade-up" style="animation-delay:480ms">' +
          '<div class="card-hdr"><h2 class="card-title">Portofolio Aset</h2>' +
          '<a class="link" href="#/aset">Detail ' + lic('arrow-right', 13, 2.6) + '</a></div>' +
          '<p class="num big-num" ' + cu(ta, 'short') + '>–</p>' +
          '<div class="alloc">' + allocHtml + '</div>' +
          '<div class="alloc-lg">' + byType.slice(0, 4).map(function (bt) {
            var meta = assetMeta(bt.type);
            return '<span><i style="background:' + meta.color + '"></i>' + meta.label + '</span>';
          }).join('') + '</div>' +
          '<ul class="lines roomy">' + topAssetsHtml + '</ul>' +
        '</section>' +
      '</div>' +

      '<footer class="foot fade-up" style="animation-delay:540ms">' +
        'Pundi menyimpan seluruh data di perangkat ini (localStorage). ' +
        '<button class="linkbtn" data-action="reset-data">Muat ulang data contoh</button>' +
      '</footer>' +
    '</div>';
  }

  /* ---------------------------------------------------------
     7. TAMPILAN: TRANSAKSI
  --------------------------------------------------------- */
  function viewTransaksi() {
    var rows = filteredTx();
    var inc = 0, exp = 0;
    rows.forEach(function (t) { if (t.type === 'income') inc += t.amount; else exp += t.amount; });
    var net = inc - exp;

    var groups = [], gmap = {};
    rows.forEach(function (t) {
      if (!gmap[t.date]) { gmap[t.date] = []; groups.push([t.date, gmap[t.date]]); }
      gmap[t.date].push(t);
    });

    var listHtml = groups.map(function (g, gi) {
      var dayNet = g[1].reduce(function (a, t) { return a + (t.type === 'income' ? t.amount : -t.amount); }, 0);
      var items = g[1].map(function (tx) {
        var c = catById(tx.categoryId);
        var isInc = tx.type === 'income';
        return '<li class="txline row">' +
          catDot(c ? c.color : null, c ? c.icon : null, 38) +
          '<div class="tl-main"><p class="tl-note">' + esc(tx.note || (c ? c.name : 'Transaksi')) + '</p>' +
          '<p class="tl-sub">' + esc(c ? c.name : 'Tanpa kategori') + '</p></div>' +
          '<p class="num tl-amt ' + (isInc ? 'pos' : '') + '">' + (isInc ? '+' : '−') + fmtIDR(tx.amount) + '</p>' +
          '<div class="row-actions">' +
            '<button class="iconbtn" data-action="edit-tx" data-id="' + tx.id + '" aria-label="Ubah">' + lic('pencil', 15, 2.2) + '</button>' +
            '<button class="iconbtn danger" data-action="del-tx" data-id="' + tx.id + '" aria-label="Hapus">' + lic('trash-2', 15, 2.2) + '</button>' +
          '</div></li>';
      }).join('');
      return '<section class="fade-up" style="animation-delay:' + Math.min(gi * 40, 300) + 'ms">' +
        '<div class="dayhead"><h3>' + dayLabel(g[0]) + '</h3>' +
        '<span class="' + (dayNet >= 0 ? 'pos' : 'neg') + '">' + (dayNet >= 0 ? '+' : '−') + fmtShort(Math.abs(dayNet)) + '</span></div>' +
        '<ul class="card lines block">' + items + '</ul></section>';
    }).join('');

    var emptyHtml = '<div class="card empty">' + lic('receipt-text', 26, 1.8) +
      '<p class="empty-title">Belum ada transaksi</p>' +
      '<p class="hint">Tidak ada transaksi yang cocok dengan filter saat ini. Coba ubah periode atau kata kunci pencarian.</p>' +
      '<button class="btn btn-primary" data-action="open-tx">' + lic('plus', 15, 2.6) + 'Catat transaksi pertama</button></div>';

    return '' +
    '<div class="wrap w-md">' +
      '<header class="hdr fade-up">' +
        '<div><h1 class="hdr-title">Transaksi</h1>' +
        '<p class="hdr-sub">Semua catatan pemasukan dan pengeluaran keluarga</p></div>' +
        '<button class="btn btn-gold" data-action="open-tx">' + lic('plus', 17, 2.6) + 'Tambah Transaksi</button>' +
      '</header>' +

      '<div class="sum-grid fade-up" style="animation-delay:60ms">' +
        '<div class="card sum"><div class="sum-lbl in">' + lic('arrow-down-left', 14, 2.6) + ' Masuk</div>' +
        '<p class="num sum-val" title="' + fmtIDR(inc) + '">' + fmtShort(inc) + '</p></div>' +
        '<div class="card sum"><div class="sum-lbl out">' + lic('arrow-up-right', 14, 2.6) + ' Keluar</div>' +
        '<p class="num sum-val" title="' + fmtIDR(exp) + '">' + fmtShort(exp) + '</p></div>' +
        '<div class="card sum"><div class="sum-lbl">Selisih</div>' +
        '<p class="num sum-val ' + (net >= 0 ? 'pos' : 'neg') + '" title="' + fmtIDR(net) + '">' + (net >= 0 ? '+' : '−') + fmtShort(Math.abs(net)) + '</p></div>' +
      '</div>' +

      '<div class="filters fade-up" style="animation-delay:100ms">' +
        '<div class="seg">' +
          segBtn('seg-tx', 'all', 'Semua', ui.txType) +
          segBtn('seg-tx', 'income', 'Pemasukan', ui.txType) +
          segBtn('seg-tx', 'expense', 'Pengeluaran', ui.txType) +
        '</div>' +
        '<div class="seg">' +
          '<button class="seg-nav" data-action="month-prev" aria-label="Bulan sebelumnya">' + lic('chevron-left', 16, 2.4) + '</button>' +
          '<button class="seg-mid" data-action="month-all" title="Klik untuk semua periode">' + (ui.txMonth === 'all' ? 'Semua Periode' : monthLabel(ui.txMonth)) + '</button>' +
          '<button class="seg-nav" data-action="month-next" aria-label="Bulan berikutnya">' + lic('chevron-right', 16, 2.4) + '</button>' +
        '</div>' +
        (ui.txMonth !== curMonthKey() ? '<button class="linkbtn" data-action="month-reset">' + lic('rotate-ccw', 12, 2.6) + ' Bulan ini</button>' : '') +
        '<div class="searchbox">' + lic('search', 16) +
        '<input id="txSearch" class="input" placeholder="Cari catatan atau kategori…" value="' + esc(ui.txQ) + '" autocomplete="off"></div>' +
      '</div>' +

      '<div class="list-zone">' + (rows.length === 0 ? emptyHtml : listHtml) + '</div>' +
    '</div>';
  }
  function segBtn(action, val, label, cur) {
    return '<button class="seg-btn' + (cur === val ? ' on' : '') + '" data-action="' + action + '" data-val="' + val + '">' + label + '</button>';
  }

  /* ---------------------------------------------------------
     8. TAMPILAN: ASET
  --------------------------------------------------------- */
  function viewAset() {
    var ta = totalAssets();
    var byType = assetByType();
    var list = state.assets.slice().sort(function (a, b) { return b.value - a.value; });
    var filtered = list.filter(function (a) { return ui.assetFilter === 'all' || a.type === ui.assetFilter; });

    var chips = '<button class="chip" data-active="' + (ui.assetFilter === 'all') + '" data-action="asset-filter" data-val="all">Semua · ' + list.length + '</button>';
    Object.keys(ASSET_TYPES).forEach(function (k) {
      var n = list.filter(function (a) { return a.type === k; }).length;
      if (!n) return;
      chips += '<button class="chip" data-active="' + (ui.assetFilter === k) + '" data-action="asset-filter" data-val="' + k + '">' + ASSET_TYPES[k].label + ' · ' + n + '</button>';
    });

    var cards = filtered.map(function (a, i) {
      var meta = assetMeta(a.type);
      var share = ta ? (a.value / ta) * 100 : 0;
      return '<article class="card acard fade-up" style="animation-delay:' + Math.min(i * 50, 400) + 'ms;--acc:' + meta.color + '">' +
        '<div class="acard-top">' + iconBadge(meta.icon, meta.color, meta.bg, 44) +
        '<div class="row-actions">' +
          '<button class="iconbtn" data-action="edit-asset" data-id="' + a.id + '" aria-label="Ubah aset">' + lic('pencil', 15, 2.2) + '</button>' +
          '<button class="iconbtn danger" data-action="del-asset" data-id="' + a.id + '" aria-label="Hapus aset">' + lic('trash-2', 15, 2.2) + '</button>' +
        '</div></div>' +
        '<h3 class="acard-name">' + esc(a.name) + '</h3>' +
        '<p class="acard-type" style="color:' + meta.color + '">' + meta.label +
        (a.acquiredAt ? '<span class="muted"> · sejak ' + fmtDate(a.acquiredAt) + '</span>' : '') + '</p>' +
        '<p class="num acard-val" title="' + fmtIDR(a.value) + '">' + fmtShort(a.value) + '</p>' +
        '<div class="sharebar"><span style="width:' + Math.max(share, 2) + '%;background:' + meta.color + '"></span></div>' +
        '<p class="sharenote">' + share.toFixed(1) + '% dari total aset</p>' +
        (a.note ? '<p class="acard-note">' + esc(a.note) + '</p>' : '') +
      '</article>';
    }).join('');

    var emptyHtml = '<div class="card empty">' + lic('gem', 26, 1.8) +
      '<p class="empty-title">Belum ada aset</p>' +
      '<p class="hint">Mulai catat kekayaan keluarga seperti rumah, kendaraan, tabungan, dan investasi.</p>' +
      '<button class="btn btn-primary" data-action="open-asset">' + lic('plus', 15, 2.6) + 'Catat aset pertama</button></div>';

    return '' +
    '<div class="wrap">' +
      '<header class="hdr fade-up">' +
        '<div><h1 class="hdr-title">Aset Keluarga</h1>' +
        '<p class="hdr-sub">Pencatatan harta &amp; kekayaan per ' + fmtDate(todayISO()) + '</p></div>' +
        '<button class="btn btn-gold" data-action="open-asset">' + lic('plus', 17, 2.6) + 'Tambah Aset</button>' +
      '</header>' +

      '<section class="hero fade-up" style="animation-delay:60ms">' +
        '<div class="glow glow-a"></div><div class="glow glow-b"></div>' +
        '<div class="hero-grid">' +
          '<div><p class="hero-lbl">Total Nilai Aset</p>' +
          '<p class="num hero-val" title="' + fmtIDR(ta) + '" ' + cu(ta, 'short') + '>–</p>' +
          '<p class="hero-note">' + lic('trending-up', 15) + ' ' + state.assets.length + ' aset tercatat dalam ' + Object.keys(byType).length + ' kategori</p></div>' +
          '<div><div class="alloc lg">' + byType.map(function (bt) {
            var meta = assetMeta(bt.type);
            return '<span style="width:' + (ta ? (bt.value / ta) * 100 : 0) + '%;background:' + meta.color + '" title="' + meta.label + ' — ' + esc(fmtIDR(bt.value)) + '"></span>';
          }).join('') + '</div>' +
          '<ul class="hero-legend">' + byType.map(function (bt) {
            var meta = assetMeta(bt.type);
            return '<li><i style="background:' + meta.color + '"></i><span>' + meta.label + '</span><b class="num">' + (ta ? Math.round(bt.value / ta * 100) : 0) + '%</b></li>';
          }).join('') + '</ul></div>' +
        '</div>' +
      '</section>' +

      '<div class="chips fade-up" style="animation-delay:120ms">' + chips + '</div>' +
      '<div class="asset-grid">' + (filtered.length === 0 ? emptyHtml : cards) + '</div>' +
    '</div>';
  }

  /* ---------------------------------------------------------
     9. TAMPILAN: LAPORAN
  --------------------------------------------------------- */
  function viewLaporan() {
    var y = ui.reportYear;
    var pts = yearSeries(y);
    var totI = pts.reduce(function (a, p) { return a + p.income; }, 0);
    var totE = pts.reduce(function (a, p) { return a + p.expense; }, 0);
    var net = totI - totE;
    var rate = totI ? (net / totI) * 100 : 0;
    var cats = catSlices('expense', function (t) { return t.date.indexOf(String(y)) === 0; });
    var maxCat = cats.length ? cats[0].value : 1;

    chartDefs.push({ id: 'repBar', make: function (el) { return makeBarChart(el, pts); } });
    chartDefs.push({ id: 'repNet', make: function (el) { return makeNetChart(el, pts); } });

    var active = pts.filter(function (p) { return p.income > 0 || p.expense > 0; });
    var insightHtml = '';
    if (active.length) {
      var best = active.slice().sort(function (a, b) { return (b.income - b.expense) - (a.income - a.expense); })[0];
      var worst = active.slice().sort(function (a, b) { return (a.income - a.expense) - (b.income - b.expense); })[0];
      var avg = totE / active.length;
      insightHtml = '<div class="insight-grid fade-up" style="animation-delay:540ms">' +
        '<div class="card ins"><p class="ins-lbl">Bulan Paling Hemat</p><p class="ins-val">' + MONTHS[+best.key.slice(5, 7) - 1] + '</p><p class="ins-note pos">Surplus ' + fmtIDR(best.income - best.expense) + '</p></div>' +
        '<div class="card ins"><p class="ins-lbl">Bulan Terboros</p><p class="ins-val">' + MONTHS[+worst.key.slice(5, 7) - 1] + '</p><p class="ins-note neg">Pengeluaran ' + fmtIDR(worst.expense) + '</p></div>' +
        '<div class="card ins"><p class="ins-lbl">Rata-rata Pengeluaran</p><p class="ins-val">' + fmtShort(avg) + '</p><p class="ins-note muted">per bulan sepanjang ' + y + '</p></div>' +
      '</div>';
    }

    var rankHtml = cats.length === 0
      ? '<p class="muted-center">Belum ada data pengeluaran</p>'
      : '<ul class="rank">' + cats.slice(0, 6).map(function (c, i) {
          var shareAll = totE ? (c.value / totE) * 100 : 0;
          return '<li><span class="num rk-no">' + (i + 1) + '</span>' + iconBadge(c.icon, c.color, c.color + '16', 32) +
            '<div class="rk-main"><p class="tl-note">' + esc(c.name) + '</p>' +
            '<div class="rk-bar"><span style="width:' + (c.value / maxCat) * 100 + '%;background:' + c.color + ';animation-delay:' + (300 + i * 70) + 'ms"></span></div></div>' +
            '<div class="rk-amt"><p class="num">' + fmtShort(c.value) + '</p><p class="rk-pct">' + shareAll.toFixed(0) + '%</p></div></li>';
        }).join('') + '</ul>';

    var tableRows = pts.map(function (p, i) {
      var n = p.income - p.expense;
      var empty = p.income === 0 && p.expense === 0;
      return '<tr>' +
        '<td class="t-month">' + MONTHS[i] + (empty ? ' <span class="muted">—</span>' : '') + '</td>' +
        '<td class="num">' + (empty ? '–' : fmtShort(p.income)) + '</td>' +
        '<td class="num">' + (empty ? '–' : fmtShort(p.expense)) + '</td>' +
        '<td class="num ' + (empty ? 'muted' : n >= 0 ? 'pos' : 'neg') + '">' + (empty ? '–' : (n >= 0 ? '+' : '−') + fmtShort(Math.abs(n))) + '</td>' +
        '<td class="num">' + (empty || !p.income ? '–' : Math.round((p.income - p.expense) / p.income * 100) + '%') + '</td>' +
      '</tr>';
    }).join('');

    return '' +
    '<div class="wrap">' +
      '<header class="hdr fade-up">' +
        '<div><h1 class="hdr-title">Laporan</h1>' +
        '<p class="hdr-sub">Analisis arus kas keluarga sepanjang tahun</p></div>' +
        '<div class="seg">' +
          '<button class="seg-nav" data-action="year-prev" aria-label="Tahun sebelumnya">' + lic('chevron-left', 16, 2.4) + '</button>' +
          '<span class="num seg-year">' + y + '</span>' +
          '<button class="seg-nav" data-action="year-next" ' + (y >= new Date().getFullYear() ? 'disabled' : '') + ' aria-label="Tahun berikutnya">' + lic('chevron-right', 16, 2.4) + '</button>' +
        '</div>' +
      '</header>' +

      '<div class="kpi-grid kpi-grid-4 fade-up" style="animation-delay:60ms">' +
        '<div class="card sum"><div class="sum-lbl in">' + lic('arrow-down-left', 14, 2.6) + ' Pemasukan ' + y + '</div>' +
        '<p class="num sum-val" title="' + fmtIDR(totI) + '" ' + cu(totI, 'short') + '>–</p></div>' +
        '<div class="card sum"><div class="sum-lbl out">' + lic('arrow-up-right', 14, 2.6) + ' Pengeluaran ' + y + '</div>' +
        '<p class="num sum-val" title="' + fmtIDR(totE) + '" ' + cu(totE, 'short') + '>–</p></div>' +
        '<div class="card sum"><div class="sum-lbl">Selisih Bersih</div>' +
        '<p class="num sum-val ' + (net >= 0 ? 'pos' : 'neg') + '" title="' + fmtIDR(net) + '">' + (net >= 0 ? '+' : '−') + fmtShort(Math.abs(net)) + '</p></div>' +
        '<div class="sum sum-dark"><div class="glow glow-a"></div><div class="sum-lbl dim">' + lic('piggy-bank', 14) + ' Rasio Menabung</div>' +
        '<p class="num sum-val">' + rate.toFixed(0) + '%</p></div>' +
      '</div>' +

      '<div class="rep-grid">' +
        '<section class="card pad fade-up" style="animation-delay:120ms">' +
          '<h2 class="card-title">Pemasukan vs Pengeluaran</h2><p class="card-sub">Per bulan sepanjang ' + y + '</p>' +
          '<div class="legend" style="margin:8px 0 12px"><span class="lg"><i style="background:#127a5b"></i>Pemasukan</span><span class="lg"><i style="background:#d95d4e"></i>Pengeluaran</span></div>' +
          '<div class="chartbox" style="height:280px"><canvas id="repBar"></canvas></div>' +
        '</section>' +
        '<section class="card pad fade-up" style="animation-delay:180ms">' +
          '<h2 class="card-title">Tren Selisih Bersih</h2><p class="card-sub">Surplus atau defisit tiap bulan</p>' +
          '<div class="chartbox" style="height:280px;margin-top:12px"><canvas id="repNet"></canvas></div>' +
        '</section>' +
      '</div>' +

      '<div class="rep-grid-2">' +
        '<section class="card pad fade-up" style="animation-delay:240ms">' +
          '<h2 class="card-title">Kategori Teratas</h2><p class="card-sub">Pengeluaran terbesar di ' + y + '</p>' + rankHtml +
        '</section>' +
        '<section class="card pad fade-up" style="animation-delay:300ms">' +
          '<h2 class="card-title">Rincian Bulanan</h2>' +
          '<div class="tblwrap"><table class="tbl"><thead><tr>' +
          '<th>Bulan</th><th class="r">Masuk</th><th class="r">Keluar</th><th class="r">Selisih</th><th class="r">Rasio</th>' +
          '</tr></thead><tbody>' + tableRows + '</tbody></table></div>' +
        '</section>' +
      '</div>' +
      insightHtml +
    '</div>';
  }

  /* ---------------------------------------------------------
     10. SHEET FORM (TRANSAKSI & ASET) + KONFIRMASI + TOAST
  --------------------------------------------------------- */
  var overlayEl = null;

  function groupDigits(v) { return v ? Number(v).toLocaleString('id-ID') : ''; }
  function digitsOnly(v) { return String(v).replace(/[^\d]/g, '').slice(0, 15); }

  function openOverlay(html) {
    overlayEl.innerHTML = html;
    requestAnimationFrame(function () { overlayEl.classList.add('open'); });
    if (window.lucide) lucide.createIcons();
    document.body.style.overflow = 'hidden';
  }
  function closeOverlay() {
    overlayEl.classList.remove('open');
    setTimeout(function () { overlayEl.innerHTML = ''; document.body.style.overflow = ''; }, 300);
    txSheet = null; assetSheet = null; confirmState = null;
  }

  function txCatsHtml() {
    return state.categories.filter(function (c) { return c.type === txSheet.type; }).map(function (c) {
      var on = txSheet.categoryId === c.id;
      return '<button type="button" class="catbtn' + (on ? ' on' : '') + '" data-action="tx-cat" data-id="' + c.id + '">' +
        '<span class="catbtn-ic" style="background:' + (on ? 'rgba(242,240,232,.14)' : c.color + '18') + ';color:' + (on ? '#f2f0e8' : c.color) + '">' + lic(c.icon, 14, 2.4) + '</span>' +
        '<span>' + esc(c.name) + '</span></button>';
    }).join('');
  }

  function openTxSheet(editing) {
    txSheet = editing
      ? { editingId: editing.id, type: editing.type, amount: String(Math.round(editing.amount)), categoryId: editing.categoryId, date: editing.date, note: editing.note || '' }
      : { editingId: null, type: 'expense', amount: '', categoryId: null, date: todayISO(), note: '' };

    openOverlay(
      '<div class="backdrop" data-action="sheet-close"></div>' +
      '<div class="sheet">' +
        '<div class="sheet-head"><div><h2>' + (editing ? 'Ubah Transaksi' : 'Tambah Transaksi') + '</h2>' +
        '<p>' + (editing ? 'Perbarui detail catatan keuangan' : 'Catat pemasukan atau pengeluaran baru') + '</p></div>' +
        '<button class="iconbtn" data-action="sheet-close" aria-label="Tutup">' + lic('x', 18) + '</button></div>' +
        '<div class="sheet-body"><form id="txForm" novalidate>' +
          '<div class="type2">' +
            '<button type="button" class="tbtn out' + (txSheet.type === 'expense' ? ' on' : '') + '" data-action="tx-type" data-val="expense">' + lic('arrow-up-right', 17, 2.5) + ' Pengeluaran</button>' +
            '<button type="button" class="tbtn in' + (txSheet.type === 'income' ? ' on' : '') + '" data-action="tx-type" data-val="income">' + lic('arrow-down-left', 17, 2.5) + ' Pemasukan</button>' +
          '</div>' +
          '<div class="fld"><label class="label">Jumlah</label>' +
            '<div class="amt-wrap"><span class="num">Rp</span>' +
            '<input id="txAmount" class="input amt num" inputmode="numeric" placeholder="0" value="' + groupDigits(txSheet.amount) + '" autocomplete="off"></div></div>' +
          '<div class="fld"><label class="label">Kategori</label><div id="catGrid" class="cat-grid">' + txCatsHtml() + '</div></div>' +
          '<div class="fld"><label class="label">Tanggal</label><input id="txDate" type="date" class="input" value="' + txSheet.date + '"></div>' +
          '<div class="fld"><label class="label">Catatan (opsional)</label>' +
            '<input id="txNote" class="input" maxlength="160" placeholder="mis. Belanja mingguan di pasar" value="' + esc(txSheet.note) + '"></div>' +
          '<button id="txSave" class="btn btn-primary big" type="submit">Simpan Transaksi</button>' +
        '</form></div>' +
      '</div>'
    );
    validateTxSheet();
  }

  function validateTxSheet() {
    if (!txSheet) return;
    var btn = document.getElementById('txSave');
    if (!btn) return;
    var ok = txSheet.amount !== '' && Number(txSheet.amount) > 0 && txSheet.categoryId !== null && txSheet.date !== '';
    btn.disabled = !ok;
    btn.textContent = txSheet.editingId ? 'Simpan Perubahan' : 'Simpan Transaksi';
  }

  function openAssetSheet(editing) {
    assetSheet = editing
      ? { editingId: editing.id, name: editing.name, type: editing.type, value: String(Math.round(editing.value)), acquiredAt: editing.acquiredAt || '', note: editing.note || '' }
      : { editingId: null, name: '', type: 'tunai', value: '', acquiredAt: '', note: '' };

    var typeBtns = Object.keys(ASSET_TYPES).map(function (k) {
      var meta = ASSET_TYPES[k];
      var on = assetSheet.type === k;
      return '<button type="button" class="catbtn' + (on ? ' on' : '') + '" data-action="asset-type" data-val="' + k + '">' +
        '<span class="catbtn-ic" style="background:' + (on ? 'rgba(242,240,232,.14)' : meta.bg) + ';color:' + (on ? '#f2f0e8' : meta.color) + '">' + lic(meta.icon, 14, 2.4) + '</span>' +
        '<span>' + meta.label + '</span></button>';
    }).join('');

    openOverlay(
      '<div class="backdrop" data-action="sheet-close"></div>' +
      '<div class="sheet">' +
        '<div class="sheet-head"><div><h2>' + (editing ? 'Ubah Aset' : 'Tambah Aset') + '</h2>' +
        '<p>Catat harta dan kekayaan keluarga</p></div>' +
        '<button class="iconbtn" data-action="sheet-close" aria-label="Tutup">' + lic('x', 18) + '</button></div>' +
        '<div class="sheet-body"><form id="assetForm" novalidate>' +
          '<div class="fld"><label class="label">Nama Aset</label>' +
            '<input id="assetName" class="input" maxlength="120" placeholder="mis. Rumah Keluarga, Deposito BCA" value="' + esc(assetSheet.name) + '"></div>' +
          '<div class="fld"><label class="label">Jenis Aset</label><div class="cat-grid">' + typeBtns + '</div></div>' +
          '<div class="fld"><label class="label">Nilai Saat Ini</label>' +
            '<div class="amt-wrap"><span class="num">Rp</span>' +
            '<input id="assetValue" class="input amt num" inputmode="numeric" placeholder="0" value="' + groupDigits(assetSheet.value) + '" autocomplete="off"></div>' +
            '<p class="hint" style="margin-top:8px">Isi estimasi nilai wajar saat ini, bukan harga beli.</p></div>' +
          '<div class="fld"><label class="label">Tanggal Perolehan (opsional)</label>' +
            '<input id="assetDate" type="date" class="input" value="' + assetSheet.acquiredAt + '"></div>' +
          '<div class="fld"><label class="label">Catatan (opsional)</label>' +
            '<textarea id="assetNote" class="input" rows="3" maxlength="240" placeholder="mis. Sisa KPR 8 tahun, bunga deposito 5,5%">' + esc(assetSheet.note) + '</textarea></div>' +
          '<button id="assetSave" class="btn btn-primary big" type="submit">Simpan Aset</button>' +
        '</form></div>' +
      '</div>'
    );
    validateAssetSheet();
  }

  function validateAssetSheet() {
    if (!assetSheet) return;
    var btn = document.getElementById('assetSave');
    if (!btn) return;
    var ok = assetSheet.name.trim().length > 1 && assetSheet.value !== '' && Number(assetSheet.value) > 0;
    btn.disabled = !ok;
    btn.textContent = assetSheet.editingId ? 'Simpan Perubahan' : 'Simpan Aset';
  }

  function openConfirm(cfg) {
    confirmState = cfg;
    openOverlay(
      '<div class="backdrop" data-action="sheet-close"></div>' +
      '<div class="confirm">' +
        '<div class="confirm-ic">' + lic('trash-2', 22, 2) + '</div>' +
        '<h3>' + cfg.title + '</h3><p>' + cfg.message + '</p>' +
        '<div class="confirm-btns">' +
          '<button class="btn btn-ghost" data-action="sheet-close">Batal</button>' +
          '<button class="btn btn-danger" data-action="confirm-yes">' + cfg.confirmLabel + '</button>' +
        '</div>' +
      '</div>'
    );
  }

  function toast(msg, kind) {
    var box = document.getElementById('toasts');
    var el = document.createElement('div');
    el.className = 'toast ' + (kind === 'err' ? 'err' : 'ok');
    el.innerHTML = lic(kind === 'err' ? 'ban' : 'check', 16, 2.4) + '<span>' + esc(msg) + '</span>';
    box.appendChild(el);
    if (window.lucide) lucide.createIcons();
    requestAnimationFrame(function () { el.classList.add('in'); });
    setTimeout(function () {
      el.classList.remove('in');
      setTimeout(function () { el.remove(); }, 260);
    }, 3000);
  }

  /* ---------------------------------------------------------
     11. RENDER UTAMA & ROUTER
  --------------------------------------------------------- */
  var appEl = null;

  function setActiveNav() {
    var items = document.querySelectorAll('[data-nav]');
    items.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-nav') === ui.view);
    });
  }

  function render() {
    var active = document.activeElement;
    var refocus = active && active.id === 'txSearch' ? { id: 'txSearch', pos: active.selectionStart } : null;

    destroyCharts();
    chartDefs = [];
    setActiveNav();
    if (ui.view === 'transaksi') appEl.innerHTML = viewTransaksi();
    else if (ui.view === 'aset') appEl.innerHTML = viewAset();
    else if (ui.view === 'laporan') appEl.innerHTML = viewLaporan();
    else appEl.innerHTML = viewDashboard();

    if (window.lucide) lucide.createIcons();
    runCountups();
    initCharts();

    if (refocus) {
      var el = document.getElementById(refocus.id);
      if (el) {
        el.focus();
        var len = el.value.length;
        try { el.setSelectionRange(Math.min(refocus.pos, len), Math.min(refocus.pos, len)); } catch (e) {}
      }
    }
  }

  function runCountups() {
    document.querySelectorAll('[data-cu]').forEach(function (el) {
      var v = Number(el.getAttribute('data-cu')) || 0;
      var short = el.getAttribute('data-cu-fmt') === 'short';
      var t0 = performance.now(), dur = 850;
      function frame(t) {
        var p = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - p, 4);
        el.textContent = (short ? fmtShort : fmtIDR)(v * e);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  function route() {
    var h = (location.hash || '').replace('#/', '').replace('#', '') || 'dashboard';
    ui.view = ['dashboard', 'transaksi', 'aset', 'laporan'].indexOf(h) >= 0 ? h : 'dashboard';
    render();
  }

  /* ---------------------------------------------------------
     12. EVENT DELEGATION
  --------------------------------------------------------- */
  function findTx(id) { return state.transactions.find(function (t) { return t.id === id; }) || null; }
  function findAsset(id) { return state.assets.find(function (a) { return a.id === id; }) || null; }

  function onClick(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    var id = Number(btn.getAttribute('data-id')) || null;
    var val = btn.getAttribute('data-val');

    switch (action) {
      case 'open-tx': openTxSheet(null); break;
      case 'edit-tx': { var t = findTx(id); if (t) openTxSheet(t); break; }
      case 'del-tx': {
        var t2 = findTx(id); if (!t2) break;
        openConfirm({
          kind: 'tx', id: id,
          title: 'Hapus transaksi ini?',
          message: '“' + esc(t2.note || 'Transaksi') + '” senilai ' + esc(fmtIDR(t2.amount)) + ' akan dihapus permanen dan tidak dapat dikembalikan.',
          confirmLabel: 'Ya, hapus'
        });
        break;
      }
      case 'open-asset': openAssetSheet(null); break;
      case 'edit-asset': { var a = findAsset(id); if (a) openAssetSheet(a); break; }
      case 'del-asset': {
        var a2 = findAsset(id); if (!a2) break;
        openConfirm({
          kind: 'asset', id: id,
          title: 'Hapus aset ini?',
          message: '“' + esc(a2.name) + '” senilai ' + esc(fmtIDR(a2.value)) + ' akan dihapus dari pencatatan kekayaan keluarga.',
          confirmLabel: 'Ya, hapus'
        });
        break;
      }
      case 'reset-data':
        openConfirm({
          kind: 'reset', id: null,
          title: 'Muat ulang data contoh?',
          message: 'Seluruh perubahan yang Anda buat akan digantikan dengan data contoh yang baru.',
          confirmLabel: 'Ya, muat ulang'
        });
        break;
      case 'confirm-yes': {
        if (!confirmState) break;
        if (confirmState.kind === 'tx') {
          state.transactions = state.transactions.filter(function (t) { return t.id !== confirmState.id; });
          save(); toast('Transaksi dihapus');
        } else if (confirmState.kind === 'asset') {
          state.assets = state.assets.filter(function (a) { return a.id !== confirmState.id; });
          save(); toast('Aset dihapus');
        } else if (confirmState.kind === 'reset') {
          state = buildSeed(); save(); toast('Data contoh berhasil dimuat ulang');
        }
        closeOverlay(); render();
        break;
      }
      case 'sheet-close': closeOverlay(); break;
      case 'seg-tx': ui.txType = val; render(); break;
      case 'month-prev': ui.txMonth = ui.txMonth === 'all' ? curMonthKey() : shiftKey(ui.txMonth, -1); render(); break;
      case 'month-next': ui.txMonth = ui.txMonth === 'all' ? curMonthKey() : shiftKey(ui.txMonth, 1); render(); break;
      case 'month-all': ui.txMonth = 'all'; render(); break;
      case 'month-reset': ui.txMonth = curMonthKey(); render(); break;
      case 'asset-filter': ui.assetFilter = val; render(); break;
      case 'year-prev': ui.reportYear--; render(); break;
      case 'year-next': if (ui.reportYear < new Date().getFullYear()) { ui.reportYear++; render(); } break;
      case 'tx-type':
        txSheet.type = val;
        if (txSheet.categoryId) {
          var c = catById(txSheet.categoryId);
          if (!c || c.type !== val) txSheet.categoryId = null;
        }
        document.querySelectorAll('.tbtn').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-val') === val); });
        var grid = document.getElementById('catGrid');
        if (grid) { grid.innerHTML = txCatsHtml(); if (window.lucide) lucide.createIcons(); }
        validateTxSheet();
        break;
      case 'tx-cat':
        txSheet.categoryId = id;
        document.querySelectorAll('#catGrid .catbtn').forEach(function (b) {
          var on = Number(b.getAttribute('data-id')) === id;
          b.classList.toggle('on', on);
        });
        // perbarui warna ikon tombol
        document.getElementById('catGrid').innerHTML = txCatsHtml();
        if (window.lucide) lucide.createIcons();
        validateTxSheet();
        break;
      case 'asset-type':
        assetSheet.type = val;
        document.querySelectorAll('[data-action="asset-type"]').forEach(function (b) {
          b.classList.toggle('on', b.getAttribute('data-val') === val);
        });
        validateAssetSheet();
        break;
    }
  }

  function onInput(e) {
    var el = e.target;
    if (el.id === 'txSearch') {
      var v = el.value;
      clearTimeout(onInput._t);
      onInput._t = setTimeout(function () { ui.txQ = v; render(); }, 280);
      return;
    }
    if (el.id === 'txAmount' && txSheet) {
      txSheet.amount = digitsOnly(el.value);
      el.value = groupDigits(txSheet.amount);
      validateTxSheet();
      return;
    }
    if (el.id === 'txDate' && txSheet) { txSheet.date = el.value; validateTxSheet(); return; }
    if (el.id === 'txNote' && txSheet) { txSheet.note = el.value; return; }
    if (el.id === 'assetValue' && assetSheet) {
      assetSheet.value = digitsOnly(el.value);
      el.value = groupDigits(assetSheet.value);
      validateAssetSheet();
      return;
    }
    if (el.id === 'assetName' && assetSheet) { assetSheet.name = el.value; validateAssetSheet(); return; }
    if (el.id === 'assetDate' && assetSheet) { assetSheet.acquiredAt = el.value; return; }
    if (el.id === 'assetNote' && assetSheet) { assetSheet.note = el.value; return; }
  }

  function onSubmit(e) {
    if (e.target.id === 'txForm' && txSheet) {
      e.preventDefault();
      var amt = Number(txSheet.amount);
      if (!(amt > 0) || !txSheet.categoryId || !txSheet.date) return;
      if (txSheet.editingId) {
        var t = findTx(txSheet.editingId);
        if (t) {
          t.type = txSheet.type; t.amount = amt; t.categoryId = txSheet.categoryId;
          t.date = txSheet.date; t.note = txSheet.note.trim() || null;
        }
        toast('Transaksi berhasil diperbarui');
      } else {
        state.transactions.push({
          id: nextId(state.transactions), type: txSheet.type, amount: amt,
          categoryId: txSheet.categoryId, date: txSheet.date, note: txSheet.note.trim() || null
        });
        toast('Transaksi ' + fmtIDR(amt) + ' tercatat');
      }
      save(); closeOverlay(); render();
      return;
    }
    if (e.target.id === 'assetForm' && assetSheet) {
      e.preventDefault();
      var val = Number(assetSheet.value);
      if (!(val > 0) || assetSheet.name.trim().length < 2) return;
      if (assetSheet.editingId) {
        var a = findAsset(assetSheet.editingId);
        if (a) {
          a.name = assetSheet.name.trim(); a.type = assetSheet.type; a.value = val;
          a.acquiredAt = assetSheet.acquiredAt || null; a.note = assetSheet.note.trim() || null;
        }
        toast('Aset berhasil diperbarui');
      } else {
        state.assets.push({
          id: nextId(state.assets), name: assetSheet.name.trim(), type: assetSheet.type,
          value: val, acquiredAt: assetSheet.acquiredAt || null, note: assetSheet.note.trim() || null
        });
        toast('Aset baru berhasil dicatat');
      }
      save(); closeOverlay(); render();
    }
  }

  function onKey(e) {
    if (e.key === 'Escape' && (txSheet || assetSheet || confirmState)) closeOverlay();
  }

  /* ---------------------------------------------------------
     13. INISIALISASI
  --------------------------------------------------------- */
  function init() {
    appEl = document.getElementById('app');
    overlayEl = document.getElementById('overlay');
    load();
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onInput);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', route);
    route();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
