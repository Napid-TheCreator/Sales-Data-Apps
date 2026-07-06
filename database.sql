-- SQL Database Schema untuk Aplikasi Manajemen Inventaris & Keuangan UMKM (Karsa Mandiri)
-- Cocok untuk diimpor langsung via phpMyAdmin (MySQL)
-- Dibuat pada: 2026-07-03

CREATE DATABASE IF NOT EXISTS `db_karsa_mandiri` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `db_karsa_mandiri`;

-- ==========================================================================
-- 1. TABEL PRODUK
-- ==========================================================================
DROP TABLE IF EXISTS `produk`;
CREATE TABLE `produk` (
  `id_produk` int(11) NOT NULL AUTO_INCREMENT,
  `nama_barang` varchar(255) NOT NULL COMMENT 'Nama produk pakaian (baju, celana, jaket)',
  `harga_jual` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Harga jual satuan produk',
  `status` enum('Ready','Sold') NOT NULL DEFAULT 'Ready' COMMENT 'Status kesediaan produk',
  `tanggal_input` date NOT NULL COMMENT 'Tanggal produk didaftarkan',
  PRIMARY KEY (`id_produk`),
  KEY `idx_status` (`status`),
  KEY `idx_tanggal_input` (`tanggal_input`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel inventaris produk pakaian UMKM';

-- ==========================================================================
-- 2. TABEL TRANSAKSI
-- ==========================================================================
DROP TABLE IF EXISTS `transaksi`;
CREATE TABLE `transaksi` (
  `id_transaksi` int(11) NOT NULL AUTO_INCREMENT,
  `tipe` enum('Masuk','Keluar') NOT NULL COMMENT 'Tipe arus kas: Pemasukan atau Pengeluaran',
  `nominal` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Jumlah uang transaksi',
  `keterangan` text NOT NULL COMMENT 'Deskripsi detail transaksi',
  `tanggal` date NOT NULL COMMENT 'Tanggal pencatatan kas',
  PRIMARY KEY (`id_transaksi`),
  KEY `idx_tipe` (`tipe`),
  KEY `idx_tanggal` (`tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel log transaksi kas pemasukan dan pengeluaran';

-- ==========================================================================
-- 3. INSERT DEMO DATA (OPSIONAL - DATA AWAL)
-- ==========================================================================
INSERT INTO `produk` (`nama_barang`, `harga_jual`, `status`, `tanggal_input`) VALUES
('Jaket Parka Canvas Hooded', 245000.00, 'Ready', '2026-06-24'),
('Baju Kaos Oversize Cotton White', 89000.00, 'Ready', '2026-06-25'),
('Celana Chino Slimfit Charcoal', 185000.00, 'Ready', '2026-06-26'),
('Baju Kemeja Flanel Slimfit Red', 150000.00, 'Sold', '2026-06-22'),
('Jaket Bomber Leather Vintage', 350000.00, 'Sold', '2026-06-23');

INSERT INTO `transaksi` (`tipe`, `nominal`, `keterangan`, `tanggal`) VALUES
('Keluar', 1500000.00, 'Modal awal modal kain & produksi', '2026-06-20'),
('Masuk', 150000.00, 'Penjualan Baju Kemeja Flanel Slimfit Red', '2026-06-22'),
('Masuk', 350000.00, 'Penjualan Jaket Bomber Leather Vintage', '2026-06-23'),
('Keluar', 75000.00, 'Pembelian Hanger & Rak Display Baju', '2026-06-25');

-- ==========================================================================
-- 4. CONTOH QUERY LAPORAN & DASHBOARD
-- ==========================================================================

-- A. Perhitungan Saldo Aktif (Total Pemasukan - Total Pengeluaran)
-- SELECT 
--   SUM(CASE WHEN tipe = 'Masuk' THEN nominal ELSE 0 END) AS total_pemasukan,
--   SUM(CASE WHEN tipe = 'Keluar' THEN nominal ELSE 0 END) AS total_pengeluaran,
--   (SUM(CASE WHEN tipe = 'Masuk' THEN nominal ELSE 0 END) - SUM(CASE WHEN tipe = 'Keluar' THEN nominal ELSE 0 END)) AS saldo_aktif
-- FROM transaksi;

-- B. Perhitungan Jumlah Produk Ready & Total Nilai Aset Ready
-- SELECT 
--   COUNT(*) AS jumlah_produk_ready,
--   SUM(harga_jual) AS estimasi_nilai_aset
-- FROM produk 
-- WHERE status = 'Ready';
