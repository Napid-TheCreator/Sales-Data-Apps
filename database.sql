-- Database: db_umkm_karsa
-- Dibuat untuk phpMyAdmin MySQL

CREATE DATABASE IF NOT EXISTS `db_umkm_karsa` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `db_umkm_karsa`;

-- --------------------------------------------------------

--
-- Struktur dari tabel `produk`
--

CREATE TABLE IF NOT EXISTS `produk` (
  `id_produk` varchar(50) NOT NULL,
  `nama_barang` varchar(150) NOT NULL,
  `harga_jual` int(11) NOT NULL,
  `status` enum('Ready','Sold') NOT NULL DEFAULT 'Ready',
  `tanggal_input` date NOT NULL,
  PRIMARY KEY (`id_produk`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data (Seeding) untuk tabel `produk`
--

INSERT INTO `produk` (`id_produk`, `nama_barang`, `harga_jual`, `status`, `tanggal_input`) VALUES
('p1', 'Jaket Parka Canvas Hooded', 245000, 'Ready', '2026-06-24'),
('p2', 'Baju Kaos Oversize Cotton White', 89000, 'Ready', '2026-06-25'),
('p3', 'Celana Chino Slimfit Charcoal', 185000, 'Ready', '2026-06-26'),
('p4', 'Baju Kemeja Flanel Slimfit Red', 150000, 'Sold', '2026-06-22'),
('p5', 'Jaket Bomber Leather Vintage', 350000, 'Sold', '2026-06-23'),
('p6', 'Celana Jeans Regular Fit Blue', 220000, 'Ready', '2026-06-27'),
('p7', 'Baju Polo Knit Premium Navy', 125000, 'Ready', '2026-06-28'),
('p8', 'Jaket Hoodie Fleece Black', 175000, 'Sold', '2026-06-29'),
('p9', 'Celana Cargo Jogger Olive', 195000, 'Sold', '2026-06-30');

-- --------------------------------------------------------

--
-- Struktur dari tabel `transaksi`
--

CREATE TABLE IF NOT EXISTS `transaksi` (
  `id_transaksi` varchar(50) NOT NULL,
  `tipe` enum('Masuk','Keluar') NOT NULL,
  `nominal` int(11) NOT NULL,
  `keterangan` text NOT NULL,
  `tanggal` date NOT NULL,
  `id_produk` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_transaksi`),
  KEY `fk_produk_transaksi` (`id_produk`),
  CONSTRAINT `fk_produk_transaksi` FOREIGN KEY (`id_produk`) REFERENCES `produk` (`id_produk`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data (Seeding) untuk tabel `transaksi`
--

INSERT INTO `transaksi` (`id_transaksi`, `tipe`, `nominal`, `keterangan`, `tanggal`, `id_produk`) VALUES
('t1', 'Keluar', 1500000, 'Modal awal modal kain & produksi', '2026-06-20', NULL),
('t2', 'Masuk', 150000, 'Penjualan Baju Kemeja Flanel Slimfit Red', '2026-06-22', 'p4'),
('t3', 'Masuk', 350000, 'Penjualan Jaket Bomber Leather Vintage', '2026-06-23', 'p5'),
('t4', 'Keluar', 75000, 'Pembelian Hanger & Rak Display Baju', '2026-06-25', NULL),
('t5', 'Masuk', 175000, 'Penjualan Jaket Hoodie Fleece Black', '2026-06-29', 'p8'),
('t6', 'Masuk', 195000, 'Penjualan Celana Cargo Jogger Olive', '2026-06-30', 'p9'),
('t7', 'Keluar', 320000, 'Restock bahan kain kaos combed & benang jahit', '2026-07-02', NULL);
