import { db } from "@/db";
import { assets, categories, transactions } from "@/db/schema";

// Deterministic pseudo-random so reseeding yields consistent data
let seed = 42;
function rand() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
function between(min: number, max: number) {
  return Math.round((min + rand() * (max - min)) / 1000) * 1000;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

const INCOME_CATEGORIES = [
  { name: "Gaji", icon: "banknote", color: "#127A5B" },
  { name: "Usaha Sampingan", icon: "briefcase", color: "#2F9E77" },
  { name: "Investasi", icon: "trending-up", color: "#C9A227" },
  { name: "Bonus & THR", icon: "gift", color: "#7C6FD0" },
  { name: "Pemasukan Lain", icon: "circle-plus", color: "#5B8DEF" },
];

const EXPENSE_CATEGORIES = [
  { name: "Makanan & Belanja Dapur", icon: "utensils", color: "#E0762E" },
  { name: "Transportasi", icon: "car", color: "#5B8DEF" },
  { name: "Tagihan & Utilitas", icon: "receipt", color: "#D95D4E" },
  { name: "Belanja & Gaya Hidup", icon: "shopping-bag", color: "#C65D9E" },
  { name: "Pendidikan Anak", icon: "graduation-cap", color: "#7C6FD0" },
  { name: "Kesehatan", icon: "heart-pulse", color: "#E5484D" },
  { name: "Hiburan & Liburan", icon: "clapperboard", color: "#2F9E77" },
  { name: "Rumah Tangga", icon: "home", color: "#8A7B5C" },
  { name: "Cicilan & Kredit", icon: "landmark", color: "#B08968" },
  { name: "Pengeluaran Lain", icon: "more-horizontal", color: "#64748B" },
];

const EXPENSE_NOTES: Record<string, string[]> = {
  "Makanan & Belanja Dapur": ["Belanja mingguan di pasar", "Groceries supermarket", "Makan siang keluarga", "Sayur & buah segar", "Kopi dan roti pagi"],
  Transportasi: ["Bensin mobil", "Isi e-toll", "Servis ringan motor", "Ojek online ke kantor", "Parkir bulanan"],
  "Tagihan & Utilitas": ["Listrik PLN", "Internet rumah", "Air PDAM", "Pulsa & paket data", "Iuran lingkungan"],
  "Belanja & Gaya Hidup": ["Baju anak sekolah", "Skincare ibu", "Sepatu baru", "Peralatan dapur", "Mainan anak"],
  "Pendidikan Anak": ["SPP sekolah", "Buku pelajaran", "Les matematika", "Seragam sekolah", "Kursus bahasa Inggris"],
  Kesehatan: ["Vitamin keluarga", "Periksa ke dokter", "Obat apotek", "BPJS Kesehatan", "Imunisasi anak"],
  "Hiburan & Liburan": ["Nonton bioskop", "Tiket taman bermain", "Streaming bulanan", "Makan di luar akhir pekan", "Staycation hotel"],
  "Rumah Tangga": ["Gaji ART", "Sabun & kebutuhan bersih", "Gas LPG", "Perbaikan keran air", "Alat kebersihan"],
  "Cicilan & Kredit": ["Cicilan KPR", "Cicilan mobil", "Asuransi keluarga"],
  "Pengeluaran Lain": ["Hadiah pernikahan kerabat", "Donasi & zakat", "Iuran arisan", "Amplop acara keluarga"],
};

const INCOME_NOTES: Record<string, string[]> = {
  Gaji: ["Gaji bulanan ayah", "Gaji bulanan ibu"],
  "Usaha Sampingan": ["Omzet toko online", "Proyek freelance", "Penjualan kue titipan"],
  Investasi: ["Dividen saham", "Bunga deposito", "Capital gain reksa dana"],
  "Bonus & THR": ["Bonus kinerja", "THR", "Insentif proyek"],
  "Pemasukan Lain": ["Cashback", "Penjualan barang bekas", "Uang kaget dari kerabat"],
};

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Clearing existing data...");
  await db.delete(transactions);
  await db.delete(assets);
  await db.delete(categories);

  console.log("Seeding categories...");
  const incomeCats = await db
    .insert(categories)
    .values(INCOME_CATEGORIES.map((c) => ({ ...c, type: "income" })))
    .returning();
  const expenseCats = await db
    .insert(categories)
    .values(EXPENSE_CATEGORIES.map((c) => ({ ...c, type: "expense" })))
    .returning();

  const catByName = new Map<string, number>();
  [...incomeCats, ...expenseCats].forEach((c) => catByName.set(c.name, c.id));

  console.log("Seeding transactions (last 7 months + current month)...");
  const rows: {
    type: string;
    amount: string;
    categoryId: number | null;
    note: string;
    date: string;
  }[] = [];

  const now = new Date();
  for (let m = 7; m >= 0; m--) {
    const base = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const year = base.getFullYear();
    const month = base.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const maxDay = m === 0 ? Math.min(now.getDate(), daysInMonth) : daysInMonth;

    const add = (
      day: number,
      type: string,
      catName: string,
      amount: number,
      note?: string,
    ) => {
      if (day > maxDay) return;
      const notesMap = type === "income" ? INCOME_NOTES : EXPENSE_NOTES;
      rows.push({
        type,
        amount: amount.toFixed(2),
        categoryId: catByName.get(catName) ?? null,
        note: note ?? pick(notesMap[catName] ?? ["Transaksi"]),
        date: fmtDate(new Date(year, month, day)),
      });
    };

    // Income: salary on the 1st
    add(1, "income", "Gaji", 12500000, "Gaji bulanan ayah");
    add(1, "income", "Gaji", 6800000, "Gaji bulanan ibu");
    // Side business 2-3x a month
    const sideTimes = 2 + Math.floor(rand() * 2);
    for (let i = 0; i < sideTimes; i++) {
      add(3 + Math.floor(rand() * 24), "income", "Usaha Sampingan", between(850000, 2600000));
    }
    // Occasional investment income
    if (rand() > 0.45) {
      add(10 + Math.floor(rand() * 15), "income", "Investasi", between(350000, 1400000));
    }
    if (rand() > 0.7) {
      add(5 + Math.floor(rand() * 20), "income", "Pemasukan Lain", between(150000, 600000));
    }

    // Fixed monthly bills
    add(2, "expense", "Tagihan & Utilitas", between(650000, 900000), "Listrik PLN");
    add(5, "expense", "Tagihan & Utilitas", 375000, "Internet rumah");
    add(8, "expense", "Tagihan & Utilitas", between(180000, 280000), "Air PDAM");
    add(12, "expense", "Kesehatan", 300000, "BPJS Kesehatan");
    add(10, "expense", "Pendidikan Anak", 950000, "SPP sekolah");
    add(5, "expense", "Cicilan & Kredit", 3250000, "Cicilan KPR");
    add(15, "expense", "Cicilan & Kredit", 2100000, "Cicilan mobil");

    // Weekly groceries (~4x)
    for (let w = 0; w < 4; w++) {
      add(2 + w * 7 + Math.floor(rand() * 3), "expense", "Makanan & Belanja Dapur", between(450000, 800000));
    }
    // Dining out 2-4x
    const dine = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < dine; i++) {
      add(1 + Math.floor(rand() * 27), "expense", "Makanan & Belanja Dapur", between(120000, 450000), "Makan di luar akhir pekan");
    }
    // Transport 3-5x
    const tr = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < tr; i++) {
      add(1 + Math.floor(rand() * 27), "expense", "Transportasi", between(150000, 500000));
    }
    // Shopping 1-3x
    const sh = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < sh; i++) {
      add(1 + Math.floor(rand() * 27), "expense", "Belanja & Gaya Hidup", between(250000, 1200000));
    }
    // Household 2x
    for (let i = 0; i < 2; i++) {
      add(1 + Math.floor(rand() * 27), "expense", "Rumah Tangga", between(200000, 850000));
    }
    // Education extras
    if (rand() > 0.4) add(1 + Math.floor(rand() * 27), "expense", "Pendidikan Anak", between(350000, 900000));
    // Health extras
    if (rand() > 0.55) add(1 + Math.floor(rand() * 27), "expense", "Kesehatan", between(150000, 700000));
    // Entertainment
    if (rand() > 0.35) add(1 + Math.floor(rand() * 27), "expense", "Hiburan & Liburan", between(200000, 1500000));
    // Others
    if (rand() > 0.5) add(1 + Math.floor(rand() * 27), "expense", "Pengeluaran Lain", between(100000, 500000));
  }

  // Insert in batches
  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    await db.insert(transactions).values(rows.slice(i, i + BATCH));
  }
  console.log(`Inserted ${rows.length} transactions.`);

  console.log("Seeding assets...");
  await db.insert(assets).values([
    { name: "Rumah Keluarga (KPR)", type: "properti", value: "850000000", acquiredAt: "2019-06-14", note: "Rumah utama di Bekasi, sisa KPR 8 tahun" },
    { name: "Tanah Kavling Kampung Halaman", type: "properti", value: "120000000", acquiredAt: "2021-02-02", note: "Investasi jangka panjang" },
    { name: "Toyota Avanza 2018", type: "kendaraan", value: "155000000", acquiredAt: "2018-11-20", note: "Mobil keluarga" },
    { name: "Honda Vario 2022", type: "kendaraan", value: "19500000", acquiredAt: "2022-03-15", note: "Motor harian" },
    { name: "Tabungan BCA", type: "bank", value: "48500000", acquiredAt: null, note: "Dana darurat & operasional" },
    { name: "Deposito Bank Mandiri", type: "bank", value: "100000000", acquiredAt: "2023-01-10", note: "Jatuh tempo tahunan, bunga 5,5%" },
    { name: "Reksa Dana Pasar Uang", type: "investasi", value: "38500000", acquiredAt: "2022-07-01", note: "Bibit - likuid" },
    { name: "Saham BBCA & TLKM", type: "investasi", value: "27800000", acquiredAt: "2021-09-09", note: "Portofolio jangka panjang" },
    { name: "Emas Antam 25 gram", type: "investasi", value: "34500000", acquiredAt: "2020-12-24", note: "Disimpan di safe deposit box" },
    { name: "Kas Tunai Rumah", type: "tunai", value: "6500000", acquiredAt: null, note: "Uang tunai untuk kebutuhan harian" },
  ]);

  console.log("Seed complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
