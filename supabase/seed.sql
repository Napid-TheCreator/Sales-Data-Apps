-- ============================================================
-- SEED DATA: db_umkm_karsa (Supabase / PostgreSQL)
-- Data demo awal untuk UMKM Karsa
-- Aman dijalankan berulang (ON CONFLICT DO NOTHING)
-- ============================================================

-- ============================================================
-- SEED: Tabel produk
-- ============================================================

INSERT INTO public.produk (id_produk, nama_barang, harga_jual, kategori, status, tanggal_input)
VALUES
  ('p1', 'Jaket Parka Canvas Hooded',        245000, 'Jaket',  'Ready', '2026-06-24'),
  ('p2', 'Baju Kaos Oversize Cotton White',   89000, 'Baju',   'Ready', '2026-06-25'),
  ('p3', 'Celana Chino Slimfit Charcoal',    185000, 'Celana', 'Ready', '2026-06-26'),
  ('p4', 'Baju Kemeja Flanel Slimfit Red',   150000, 'Baju',   'Sold',  '2026-06-22'),
  ('p5', 'Jaket Bomber Leather Vintage',     350000, 'Jaket',  'Sold',  '2026-06-23'),
  ('p6', 'Celana Jeans Regular Fit Blue',    220000, 'Celana', 'Ready', '2026-06-27'),
  ('p7', 'Baju Polo Knit Premium Navy',      125000, 'Baju',   'Ready', '2026-06-28'),
  ('p8', 'Jaket Hoodie Fleece Black',        175000, 'Jaket',  'Sold',  '2026-06-29'),
  ('p9', 'Celana Cargo Jogger Olive',        195000, 'Celana', 'Sold',  '2026-06-30')
ON CONFLICT (id_produk) DO NOTHING;

-- ============================================================
-- SEED: Tabel transaksi
-- ============================================================

INSERT INTO public.transaksi (id_transaksi, tipe, nominal, keterangan, tanggal, id_produk)
VALUES
  ('t1', 'Keluar', 1500000, 'Modal awal modal kain & produksi',          '2026-06-20', NULL),
  ('t2', 'Masuk',   150000, 'Penjualan Baju Kemeja Flanel Slimfit Red',  '2026-06-22', 'p4'),
  ('t3', 'Masuk',   350000, 'Penjualan Jaket Bomber Leather Vintage',    '2026-06-23', 'p5'),
  ('t4', 'Keluar',   75000, 'Pembelian Hanger & Rak Display Baju',       '2026-06-25', NULL),
  ('t5', 'Masuk',   175000, 'Penjualan Jaket Hoodie Fleece Black',       '2026-06-29', 'p8'),
  ('t6', 'Masuk',   195000, 'Penjualan Celana Cargo Jogger Olive',       '2026-06-30', 'p9'),
  ('t7', 'Keluar',  320000, 'Restock bahan kain kaos combed & benang jahit', '2026-07-02', NULL)
ON CONFLICT (id_transaksi) DO NOTHING;
