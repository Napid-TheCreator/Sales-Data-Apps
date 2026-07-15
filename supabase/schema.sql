-- ============================================================
-- SCHEMA: db_umkm_karsa (Supabase / PostgreSQL)
-- Dikonversi dari MySQL ke PostgreSQL
-- ============================================================

-- ============================================================
-- TABEL: produk
-- ============================================================

CREATE TABLE IF NOT EXISTS public.produk (
  id_produk     TEXT        NOT NULL,
  nama_barang   TEXT        NOT NULL,
  harga_jual    INTEGER     NOT NULL,
  kategori      TEXT        NOT NULL DEFAULT 'Lainnya',
  status        TEXT        NOT NULL DEFAULT 'Ready' CHECK (status IN ('Ready', 'Sold')),
  tanggal_input DATE        NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (id_produk)
);

-- ============================================================
-- TABEL: transaksi
-- ============================================================

CREATE TABLE IF NOT EXISTS public.transaksi (
  id_transaksi  TEXT        NOT NULL,
  tipe          TEXT        NOT NULL CHECK (tipe IN ('Masuk', 'Keluar')),
  nominal       INTEGER     NOT NULL,
  keterangan    TEXT        NOT NULL,
  tanggal       DATE        NOT NULL DEFAULT CURRENT_DATE,
  id_produk     TEXT        DEFAULT NULL REFERENCES public.produk(id_produk) ON DELETE SET NULL ON UPDATE CASCADE,
  PRIMARY KEY (id_transaksi)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS agar data terlindungi, lalu buka akses publik
-- (untuk single-user app tanpa auth)
-- ============================================================

ALTER TABLE public.produk   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;

-- Policy: izinkan semua operasi untuk anon role (public access)
-- CATATAN: Untuk production dengan multi-user, ganti dengan policy berbasis auth.uid()

CREATE POLICY "Allow public read produk"
  ON public.produk FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert produk"
  ON public.produk FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update produk"
  ON public.produk FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete produk"
  ON public.produk FOR DELETE
  TO anon
  USING (true);

-- ----

CREATE POLICY "Allow public read transaksi"
  ON public.transaksi FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert transaksi"
  ON public.transaksi FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update transaksi"
  ON public.transaksi FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete transaksi"
  ON public.transaksi FOR DELETE
  TO anon
  USING (true);
