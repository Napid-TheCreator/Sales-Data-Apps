/**
 * Aplikasi Manajemen Inventaris & Keuangan UMKM
 * Core Logic Script (app.js)
 * Developer: Antigravity Pairing Agent 2026
 */

// ==========================================================================
// STATE MANAGEMENT & CONSTANTS
// ==========================================================================
let state = {
  products: [],
  transactions: [],
  theme: 'dark'
};

// Global chart instances
let cashflowChartInstance = null;
let stockChartInstance = null;

// Product undergoing status change to "Sold" for auto-transaction flow
let pendingSoldProduct = null;

// Demo Data Constants
const DEMO_PRODUCTS = [
  { id: 'p1', nama: 'Jaket Parka Canvas Hooded', harga: 245000, kategori: 'Jaket', status: 'Ready', tanggalInput: '2026-06-24' },
  { id: 'p2', nama: 'Baju Kaos Oversize Cotton White', harga: 89000, kategori: 'Baju', status: 'Ready', tanggalInput: '2026-06-25' },
  { id: 'p3', nama: 'Celana Chino Slimfit Charcoal', harga: 185000, kategori: 'Celana', status: 'Ready', tanggalInput: '2026-06-26' },
  { id: 'p4', nama: 'Baju Kemeja Flanel Slimfit Red', harga: 150000, kategori: 'Baju', status: 'Sold', tanggalInput: '2026-06-22' },
  { id: 'p5', nama: 'Jaket Bomber Leather Vintage', harga: 350000, kategori: 'Jaket', status: 'Sold', tanggalInput: '2026-06-23' }
];

const DEMO_TRANSACTIONS = [
  { id: 't1', tipe: 'Keluar', nominal: 1500000, keterangan: 'Modal awal modal kain & produksi', tanggal: '2026-06-20' },
  { id: 't2', tipe: 'Masuk', nominal: 150000, keterangan: 'Penjualan Baju Kemeja Flanel Slimfit Red', tanggal: '2026-06-22' },
  { id: 't3', tipe: 'Masuk', nominal: 350000, keterangan: 'Penjualan Jaket Bomber Leather Vintage', tanggal: '2026-06-23' },
  { id: 't4', tipe: 'Keluar', nominal: 75000, keterangan: 'Pembelian Hanger & Rak Display Baju', tanggal: '2026-06-25' }
];

// ==========================================================================
// TOAST NOTIFICATION UTILITY
// ==========================================================================
function showToast(message, icon = 'info') {
  const toast = document.getElementById('toast-notification');
  const toastMsg = document.getElementById('toast-message');
  const toastIcon = toast.querySelector('.toast-icon');

  toastMsg.textContent = message;
  toastIcon.setAttribute('data-lucide', icon);
  
  // Re-render lucide icon
  if (window.lucide) {
    lucide.createIcons({
      attrs: { class: 'toast-icon' }
    });
  }

  toast.classList.remove('hidden');
  
  // Slide out after 3 seconds
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// Currency Formatter Utility
function formatIDR(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

// Format Date Utility
function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('id-ID', options);
}

// ==========================================================================
// DATABASE INTERACTION (localStorage)
// ==========================================================================
function saveToLocalStorage() {
  localStorage.setItem('umkm_state', JSON.stringify(state));
}

function loadFromLocalStorage() {
  const savedState = localStorage.getItem('umkm_state');
  if (savedState) {
    try {
      state = JSON.parse(savedState);
    } catch (e) {
      console.error('Error parsing localStorage state:', e);
      loadDemoData();
    }
  } else {
    loadDemoData();
  }
}

function loadDemoData() {
  state.products = [...DEMO_PRODUCTS];
  state.transactions = [...DEMO_TRANSACTIONS];
  state.theme = state.theme || 'dark';
  saveToLocalStorage();
  showToast('Data demo berhasil dimuat!', 'refresh-cw');
}

// ==========================================================================
// THEME CONTROL (LIGHT / DARK)
// ==========================================================================
function initTheme() {
  const html = document.documentElement;
  html.setAttribute('data-theme', state.theme);
  
  const themeToggleBtn = document.getElementById('theme-toggle');
  themeToggleBtn.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', state.theme);
    saveToLocalStorage();
    showToast(`Mode ${state.theme === 'dark' ? 'Gelap' : 'Terang'} aktif`, state.theme === 'dark' ? 'moon' : 'sun');
    
    // Redraw charts with theme appropriate styling
    renderCharts();
  });
}

// Get appropriate theme colors for charts
function getChartColors() {
  const isDark = state.theme === 'dark';
  return {
    gridColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
    textColor: isDark ? '#94a3b8' : '#64748b',
    primaryColor: '#8b5cf6',
    successColor: '#10b981',
    dangerColor: '#ef4444',
    warningColor: '#f59e0b',
    neutralLight: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
  };
}

// ==========================================================================
// TABS CONTROLLER
// ==========================================================================
function initTabs() {
  const navItems = document.querySelectorAll('.nav-item');
  const panels = document.querySelectorAll('.tab-panel');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabName = item.getAttribute('data-tab');
      
      // Update Active Navigation Item
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Toggle Active Panel
      panels.forEach(panel => {
        if (panel.id === `panel-${tabName}`) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });

      // Special action: refresh charts when entering dashboard
      if (tabName === 'dashboard') {
        renderCharts();
      }

      // Re-trigger icons refresh in case new elements rendered
      lucide.createIcons();
    });
  });
}

// ==========================================================================
// CHART INITIALIZATION & RENDERING
// ==========================================================================
function renderCharts() {
  const colors = getChartColors();
  
  // ----------------------------------
  // 1. CASHFLOW CHART (Line/Bar)
  // ----------------------------------
  const cashflowCtx = document.getElementById('cashflow-chart').getContext('2d');
  
  // Destroy existing chart to prevent canvas overlap
  if (cashflowChartInstance) {
    cashflowChartInstance.destroy();
  }

  // Aggregate transactions by date (limit to last 7 transaction dates)
  const groupedData = {};
  state.transactions.forEach(t => {
    if (!groupedData[t.tanggal]) {
      groupedData[t.tanggal] = { masuk: 0, keluar: 0 };
    }
    if (t.tipe === 'Masuk') {
      groupedData[t.tanggal].masuk += t.nominal;
    } else {
      groupedData[t.tanggal].keluar += t.nominal;
    }
  });

  const sortedDates = Object.keys(groupedData).sort().slice(-7); // Last 7 transaction days
  const masukValues = sortedDates.map(date => groupedData[date].masuk);
  const keluarValues = sortedDates.map(date => groupedData[date].keluar);
  const readableDates = sortedDates.map(date => formatDateIndo(date));

  cashflowChartInstance = new Chart(cashflowCtx, {
    type: 'bar',
    data: {
      labels: readableDates.length > 0 ? readableDates : ['Belum Ada Data'],
      datasets: [
        {
          label: 'Pemasukan',
          data: masukValues.length > 0 ? masukValues : [0],
          backgroundColor: colors.successColor,
          borderRadius: 6,
          maxBarThickness: 16
        },
        {
          label: 'Pengeluaran',
          data: keluarValues.length > 0 ? keluarValues : [0],
          backgroundColor: colors.dangerColor,
          borderRadius: 6,
          maxBarThickness: 16
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: colors.textColor,
            font: { family: 'Inter', size: 11, weight: '500' }
          },
          position: 'top'
        },
        tooltip: {
          backgroundColor: state.theme === 'dark' ? '#1e293b' : '#ffffff',
          titleColor: colors.textColor,
          bodyColor: state.theme === 'dark' ? '#ffffff' : '#0f172a',
          borderColor: colors.gridColor,
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${formatIDR(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: colors.textColor, font: { size: 10 } }
        },
        y: {
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.textColor,
            font: { size: 10 },
            callback: function(value) {
              return value >= 1000000 ? (value / 1000000) + 'jt' : value >= 1000 ? (value / 1000) + 'rb' : value;
            }
          }
        }
      }
    }
  });

  // ----------------------------------
  // 2. STOCK & CATEGORIES DISTRIBUTION
  // ----------------------------------
  const stockCtx = document.getElementById('stock-chart').getContext('2d');
  
  if (stockChartInstance) {
    stockChartInstance.destroy();
  }

  // Count by categories: Baju, Celana, Jaket, Lainnya
  const categories = { Baju: 0, Celana: 0, Jaket: 0, Lainnya: 0 };
  state.products.forEach(p => {
    if (categories[p.kategori] !== undefined) {
      categories[p.kategori]++;
    } else {
      categories.Lainnya++;
    }
  });

  const categoryLabels = Object.keys(categories);
  const categoryValues = Object.values(categories);
  const hasProducts = state.products.length > 0;

  stockChartInstance = new Chart(stockCtx, {
    type: 'doughnut',
    data: {
      labels: categoryLabels,
      datasets: [{
        data: hasProducts ? categoryValues : [1],
        backgroundColor: hasProducts ? [
          '#6366f1', // Baju - Violet
          '#06b6d4', // Celana - Cyan
          '#f59e0b', // Jaket - Amber
          '#64748b'  // Lainnya - Slate
        ] : [colors.gridColor],
        borderWidth: 2,
        borderColor: state.theme === 'dark' ? '#090d16' : '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: colors.textColor,
            font: { family: 'Inter', size: 11 }
          }
        },
        tooltip: {
          enabled: hasProducts,
          backgroundColor: state.theme === 'dark' ? '#1e293b' : '#ffffff',
          bodyColor: state.theme === 'dark' ? '#ffffff' : '#0f172a',
          borderColor: colors.gridColor,
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const val = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((val / total) * 100);
              return ` ${context.label}: ${val} barang (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// ==========================================================================
// CALCULATE & RENDER DASHBOARD SUMMARY
// ==========================================================================
function renderDashboardSummary() {
  let totalPemasukan = 0;
  let totalPengeluaran = 0;
  let countPemasukan = 0;
  let countPengeluaran = 0;

  state.transactions.forEach(t => {
    if (t.tipe === 'Masuk') {
      totalPemasukan += t.nominal;
      countPemasukan++;
    } else if (t.tipe === 'Keluar') {
      totalPengeluaran += t.nominal;
      countPengeluaran++;
    }
  });

  const saldo = totalPemasukan - totalPengeluaran;
  const readyStock = state.products.filter(p => p.status === 'Ready').length;
  const totalStock = state.products.length;

  // DOM Elements Updates
  document.getElementById('dashboard-saldo').textContent = formatIDR(saldo);
  
  const saldoCard = document.querySelector('.balance-card');
  if (saldo < 0) {
    document.getElementById('dashboard-saldo').classList.add('text-danger');
  } else {
    document.getElementById('dashboard-saldo').classList.remove('text-danger');
  }

  document.getElementById('dashboard-pemasukan').textContent = formatIDR(totalPemasukan);
  document.getElementById('dashboard-pemasukan-count').textContent = `${countPemasukan} Transaksi`;

  document.getElementById('dashboard-pengeluaran').textContent = formatIDR(totalPengeluaran);
  document.getElementById('dashboard-pengeluaran-count').textContent = `${countPengeluaran} Transaksi`;

  document.getElementById('dashboard-ready-stock').textContent = readyStock;
  document.getElementById('dashboard-total-stock').textContent = `${totalStock} Total Produk`;
}

// ==========================================================================
// PRODUCTS LIST MANAGEMENT (Katalog)
// ==========================================================================
function renderProducts() {
  const container = document.getElementById('products-list');
  const emptyState = document.getElementById('produk-empty-state');
  
  const searchQuery = document.getElementById('search-produk').value.toLowerCase();
  const filterKategori = document.getElementById('filter-kategori-produk').value;
  const filterStatus = document.getElementById('filter-status-produk').value;

  container.innerHTML = '';

  const filteredProducts = state.products.filter(p => {
    const matchesSearch = p.nama.toLowerCase().includes(searchQuery);
    const matchesKategori = filterKategori === 'Semua' || p.kategori === filterKategori;
    const matchesStatus = filterStatus === 'Semua' || p.status === filterStatus;
    return matchesSearch && matchesKategori && matchesStatus;
  });

  if (filteredProducts.length === 0) {
    emptyState.classList.remove('hidden');
    container.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  container.classList.remove('hidden');

  filteredProducts.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const categoryClass = `badge-${p.kategori.toLowerCase()}`;
    const statusClass = p.status === 'Ready' ? 'ready' : 'sold';
    const statusIcon = p.status === 'Ready' ? 'check' : 'shopping-bag';

    card.innerHTML = `
      <div class="product-card-top">
        <span class="product-category-badge ${categoryClass}">${p.kategori}</span>
        <button class="product-delete-btn" data-id="${p.id}" title="Hapus Produk">
          <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
        </button>
      </div>
      <h4 class="product-name" title="${p.nama}">${p.nama}</h4>
      <div class="product-price">${formatIDR(p.harga)}</div>
      <div class="product-card-bottom">
        <div class="status-toggle-pill ${statusClass}" data-id="${p.id}" data-status="${p.status}">
          <i data-lucide="${statusIcon}"></i>
          <span>${p.status}</span>
        </div>
        <button class="product-edit-btn" data-id="${p.id}" title="Edit Produk">
          <i data-lucide="edit-3" style="width:14px; height:14px;"></i>
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  // Bind Actions
  bindProductCardEvents();
  lucide.createIcons();
}

function bindProductCardEvents() {
  // Delete handler (restricted to #products-list to prevent binding transaction buttons)
  document.querySelectorAll('#products-list .product-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const prod = state.products.find(p => p.id === id);
      
      if (confirm(`Apakah Anda yakin ingin menghapus "${prod.nama}" dari katalog?`)) {
        state.products = state.products.filter(p => p.id !== id);
        saveToLocalStorage();
        renderProducts();
        renderDashboardSummary();
        renderCharts();
        showToast('Produk berhasil dihapus', 'trash-2');
      }
    });
  });

  // Edit handler
  document.querySelectorAll('#products-list .product-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const prod = state.products.find(p => p.id === id);
      
      openProductModal(prod);
    });
  });

  // Status toggle handler
  document.querySelectorAll('#products-list .status-toggle-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = pill.getAttribute('data-id');
      const currentStatus = pill.getAttribute('data-status');
      const nextStatus = currentStatus === 'Ready' ? 'Sold' : 'Ready';
      
      const product = state.products.find(p => p.id === id);
      
      if (nextStatus === 'Sold') {
        // Trigger smart sale auto-transaction dialog
        pendingSoldProduct = product;
        
        document.getElementById('sale-confirm-name').textContent = product.nama;
        document.getElementById('sale-confirm-price').textContent = formatIDR(product.harga);
        document.getElementById('modal-sale-confirm').classList.remove('hidden');
      } else {
        // Change from Sold back to Ready
        product.status = 'Ready';
        
        // Remove associated transaction to revert balance
        const initialCount = state.transactions.length;
        state.transactions = state.transactions.filter(t => {
          const isLinked = t.produkId === product.id;
          const isMatchingDesc = t.keterangan === `Penjualan ${product.nama}` && t.tipe === 'Masuk' && t.nominal === product.harga;
          return !(isLinked || isMatchingDesc);
        });
        const removedCount = initialCount - state.transactions.length;

        saveToLocalStorage();
        renderProducts();
        renderTransactions();
        renderDashboardSummary();
        renderCharts();
        
        if (removedCount > 0) {
          showToast(`Status "${product.nama}" kembali ke Ready & transaksi dihapus`, 'check');
        } else {
          showToast(`Status "${product.nama}" kembali ke Ready`, 'check');
        }
      }
    });
  });
}

// Setup Smart Auto-Transaction Confirmation Listeners
function initAutoSaleDialog() {
  // Option: Skip recording transaction
  document.getElementById('btn-sale-skip').addEventListener('click', () => {
    if (pendingSoldProduct) {
      pendingSoldProduct.status = 'Sold';
      saveToLocalStorage();
      renderProducts();
      renderDashboardSummary();
      renderCharts();
      showToast(`"${pendingSoldProduct.nama}" telah terjual!`, 'shopping-bag');
    }
    document.getElementById('modal-sale-confirm').classList.add('hidden');
    pendingSoldProduct = null;
  });

  // Option: Record cash receipt automatically
  document.getElementById('btn-sale-record').addEventListener('click', () => {
    if (pendingSoldProduct) {
      // 1. Update Product status
      pendingSoldProduct.status = 'Sold';
      
      // 2. Create dynamic Pemasukan transaction with reference
      const newTransaction = {
        id: 't_' + Date.now(),
        tipe: 'Masuk',
        nominal: pendingSoldProduct.harga,
        keterangan: `Penjualan ${pendingSoldProduct.nama}`,
        tanggal: new Date().toISOString().split('T')[0],
        produkId: pendingSoldProduct.id
      };
      
      state.transactions.unshift(newTransaction);
      
      saveToLocalStorage();
      renderProducts();
      renderTransactions();
      renderDashboardSummary();
      renderCharts();
      
      showToast(`Sukses mencatat pemasukan kas ${formatIDR(pendingSoldProduct.harga)}!`, 'trending-up');
    }
    document.getElementById('modal-sale-confirm').classList.add('hidden');
    pendingSoldProduct = null;
  });
}

// Product Form Modal Control
function openProductModal(product = null) {
  const modal = document.getElementById('modal-produk');
  const title = document.getElementById('modal-produk-title');
  const form = document.getElementById('form-produk');
  const hargaInput = document.getElementById('produk-harga');
  
  form.reset();

  if (product) {
    title.textContent = 'Edit Informasi Produk';
    document.getElementById('produk-id').value = product.id;
    document.getElementById('produk-nama').value = product.nama;
    hargaInput.value = product.harga;
    document.getElementById('produk-kategori').value = product.kategori;
    document.getElementById('produk-status').value = product.status;
    
    // Disable price input if status is Sold
    if (product.status === 'Sold') {
      hargaInput.disabled = true;
      hargaInput.title = 'Harga produk yang sudah terjual tidak dapat diubah';
    } else {
      hargaInput.disabled = false;
      hargaInput.title = '';
    }
  } else {
    title.textContent = 'Tambah Produk Baru';
    document.getElementById('produk-id').value = '';
    document.getElementById('produk-status').value = 'Ready';
    hargaInput.value = '';
    hargaInput.disabled = false;
    hargaInput.title = '';
  }

  modal.classList.remove('hidden');
}

function initProductForm() {
  document.getElementById('btn-tambah-produk').addEventListener('click', () => openProductModal());
  document.getElementById('btn-close-modal-produk').addEventListener('click', () => {
    document.getElementById('modal-produk').classList.add('hidden');
  });
  document.getElementById('btn-cancel-produk').addEventListener('click', () => {
    document.getElementById('modal-produk').classList.add('hidden');
  });

  // Dynamic disabling of price input based on modal status select
  const statusSelect = document.getElementById('produk-status');
  const hargaInput = document.getElementById('produk-harga');
  statusSelect.addEventListener('change', () => {
    if (statusSelect.value === 'Sold') {
      hargaInput.disabled = true;
      hargaInput.title = 'Harga produk yang sudah terjual tidak dapat diubah';
    } else {
      hargaInput.disabled = false;
      hargaInput.title = '';
    }
  });

  const form = document.getElementById('form-produk');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('produk-id').value;
    const nama = document.getElementById('produk-nama').value.trim();
    const harga = parseInt(document.getElementById('produk-harga').value);
    const kategori = document.getElementById('produk-kategori').value;
    const status = document.getElementById('produk-status').value;

    if (id) {
      // Edit mode
      const index = state.products.findIndex(p => p.id === id);
      if (index !== -1) {
        const oldProduct = state.products[index];
        const statusChanged = oldProduct.status !== status;

        // If changed from Sold to Ready, remove transaction
        if (statusChanged && oldProduct.status === 'Sold' && status === 'Ready') {
          state.transactions = state.transactions.filter(t => {
            const isLinked = t.produkId === id;
            const isMatchingDesc = t.keterangan === `Penjualan ${oldProduct.nama}` && t.tipe === 'Masuk' && t.nominal === oldProduct.harga;
            return !(isLinked || isMatchingDesc);
          });
        }
        // If changed from Ready to Sold, add transaction
        else if (statusChanged && oldProduct.status === 'Ready' && status === 'Sold') {
          state.transactions.unshift({
            id: 't_' + Date.now(),
            tipe: 'Masuk',
            nominal: harga,
            keterangan: `Penjualan ${nama}`,
            tanggal: new Date().toISOString().split('T')[0],
            produkId: id
          });
        }

        state.products[index] = {
          ...state.products[index],
          nama,
          harga,
          kategori,
          status
        };
        showToast('Informasi produk diperbarui!', 'edit-3');
      }
    } else {
      // Create mode
      const newId = 'p_' + Date.now();
      const newProduct = {
        id: newId,
        nama,
        harga,
        kategori,
        status,
        tanggalInput: new Date().toISOString().split('T')[0]
      };
      
      // If product status is initially Sold, add transaction
      if (status === 'Sold') {
        state.transactions.unshift({
          id: 't_' + Date.now(),
          tipe: 'Masuk',
          nominal: harga,
          keterangan: `Penjualan ${nama}`,
          tanggal: new Date().toISOString().split('T')[0],
          produkId: newId
        });
      }
      
      state.products.unshift(newProduct);
      showToast('Produk baru ditambahkan ke katalog!', 'plus');
    }

    saveToLocalStorage();
    renderProducts();
    renderTransactions(); // Re-render transactions list to update Arus Kas
    renderDashboardSummary();
    renderCharts();
    
    document.getElementById('modal-produk').classList.add('hidden');
  });

  // Search & Filter event bindings
  document.getElementById('search-produk').addEventListener('input', renderProducts);
  document.getElementById('filter-kategori-produk').addEventListener('change', renderProducts);
  document.getElementById('filter-status-produk').addEventListener('change', renderProducts);
}

// ==========================================================================
// TRANSACTIONS LIST MANAGEMENT (Kas Keuangan)
// ==========================================================================
function renderTransactions() {
  const container = document.getElementById('transactions-list');
  const emptyState = document.getElementById('transaksi-empty-state');
  
  const searchQuery = document.getElementById('search-transaksi').value.toLowerCase();
  const filterTipe = document.getElementById('filter-tipe-transaksi').value;

  container.innerHTML = '';

  const filteredTransactions = state.transactions.filter(t => {
    const matchesSearch = t.keterangan.toLowerCase().includes(searchQuery);
    const matchesTipe = filterTipe === 'Semua' || t.tipe === filterTipe;
    return matchesSearch && matchesTipe;
  });

  // Show/Hide Empty state
  if (filteredTransactions.length === 0) {
    emptyState.classList.remove('hidden');
    document.querySelector('.transaction-table-wrapper').classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  document.querySelector('.transaction-table-wrapper').classList.remove('hidden');

  // Render Table rows
  filteredTransactions.forEach(t => {
    const row = document.createElement('tr');
    
    const isMasuk = t.tipe === 'Masuk';
    const amountPrefix = isMasuk ? '+' : '-';
    const colorClass = isMasuk ? 'text-success' : 'text-danger';
    const badgeClass = isMasuk ? 'masuk' : 'keluar';
    const iconName = isMasuk ? 'trending-up' : 'trending-down';

    row.innerHTML = `
      <td>
        <div class="transaction-date">${formatDateIndo(t.tanggal)}</div>
      </td>
      <td>
        <span class="badge-transaksi ${badgeClass}">
          <i data-lucide="${iconName}" style="width:10px; height:10px;"></i>
          ${t.tipe === 'Masuk' ? 'Masuk' : 'Keluar'}
        </span>
      </td>
      <td>
        <span class="transaction-desc">${t.keterangan}</span>
      </td>
      <td class="text-right font-bold ${colorClass}">
        ${amountPrefix} ${formatIDR(t.nominal)}
      </td>
      <td class="text-center">
        <button class="product-delete-btn delete-trans-btn" data-id="${t.id}" title="Hapus Log">
          <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
        </button>
      </td>
    `;

    container.appendChild(row);
  });

  // Bind Actions
  bindTransactionEvents();
  lucide.createIcons();
}

function bindTransactionEvents() {
  document.querySelectorAll('.delete-trans-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const trans = state.transactions.find(t => t.id === id);
      
      if (confirm(`Apakah Anda yakin ingin menghapus catatan transaksi "${trans.keterangan}"?`)) {
        state.transactions = state.transactions.filter(t => t.id !== id);
        saveToLocalStorage();
        renderTransactions();
        renderDashboardSummary();
        renderCharts();
        showToast('Log transaksi dihapus', 'trash-2');
      }
    });
  });
}

function initTransactionForm() {
  document.getElementById('btn-tambah-transaksi').addEventListener('click', () => {
    const modal = document.getElementById('modal-transaksi');
    document.getElementById('form-transaksi').reset();
    document.getElementById('transaksi-tanggal').value = new Date().toISOString().split('T')[0];
    modal.classList.remove('hidden');
  });

  document.getElementById('btn-close-modal-transaksi').addEventListener('click', () => {
    document.getElementById('modal-transaksi').classList.add('hidden');
  });
  document.getElementById('btn-cancel-transaksi').addEventListener('click', () => {
    document.getElementById('modal-transaksi').classList.add('hidden');
  });

  const form = document.getElementById('form-transaksi');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const tipe = form.querySelector('input[name="transaksi-tipe"]:checked').value;
    const nominal = parseInt(document.getElementById('transaksi-nominal').value);
    const keterangan = document.getElementById('transaksi-keterangan').value.trim();
    const tanggal = document.getElementById('transaksi-tanggal').value;

    const newTransaction = {
      id: 't_' + Date.now(),
      tipe,
      nominal,
      keterangan,
      tanggal
    };

    state.transactions.unshift(newTransaction);
    saveToLocalStorage();
    renderTransactions();
    renderDashboardSummary();
    renderCharts();

    document.getElementById('modal-transaksi').classList.add('hidden');
    showToast('Transaksi kas baru berhasil dicatat!', 'check');
  });

  // Search & Filter event bindings
  document.getElementById('search-transaksi').addEventListener('input', renderTransactions);
  document.getElementById('filter-tipe-transaksi').addEventListener('change', renderTransactions);
}

// ==========================================================================
// EXPORT & IMPORT DATA (GOOGLE SHEETS COMPATIBLE CSV)
// ==========================================================================
function exportToCSV() {
  // 1. EXPORT PRODUCTS CSV
  let productCSV = '\uFEFF'; // BOM for UTF-8 Excel support
  productCSV += '"Nama Barang","Harga","Kategori","Status","Tanggal Input"\n';
  
  state.products.forEach(p => {
    productCSV += `"${p.nama.replace(/"/g, '""')}","${p.harga}","${p.kategori}","${p.status}","${p.tanggalInput}"\n`;
  });
  
  downloadFile(productCSV, 'karsa_produk_inventaris.csv', 'text/csv;charset=utf-8;');

  // 2. EXPORT TRANSACTIONS CSV
  // Add small delay to avoid browser blocking multiple downloads
  setTimeout(() => {
    let transCSV = '\uFEFF'; // BOM for UTF-8
    transCSV += '"Tanggal","Tipe","Keterangan","Nominal"\n';
    
    state.transactions.forEach(t => {
      transCSV += `"${t.tanggal}","${t.tipe}","${t.keterangan.replace(/"/g, '""')}","${t.nominal}"\n`;
    });

    downloadFile(transCSV, 'karsa_riwayat_transaksi.csv', 'text/csv;charset=utf-8;');
    showToast('CSV Berhasil diekspor! Periksa unduhan Anda.', 'download');
  }, 400);
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Smart CSV Import with Auto-detection based on header columns
function importFromCSV(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const csvText = evt.target.result;
    const rows = parseCSVText(csvText);
    
    if (rows.length < 2) {
      showToast('Gagal mengimpor: Berkas CSV kosong atau rusak', 'x');
      return;
    }

    const headers = rows[0].map(h => h.trim().toLowerCase());
    
    // Auto-detect CSV schema
    const isProductCSV = headers.includes('nama barang') || headers.includes('harga') || headers.includes('status');
    const isTransactionCSV = headers.includes('tipe') || headers.includes('nominal') || headers.includes('keterangan');

    if (isProductCSV) {
      // Map columns indexes
      const idxNama = headers.indexOf('nama barang');
      const idxHarga = headers.indexOf('harga');
      const idxKategori = headers.indexOf('kategori');
      const idxStatus = headers.indexOf('status');
      const idxTanggal = headers.indexOf('tanggal input');

      const importedProducts = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2 || !row[idxNama]) continue;
        
        importedProducts.push({
          id: 'p_imp_' + Date.now() + '_' + i,
          nama: row[idxNama],
          harga: parseInt(row[idxHarga]) || 0,
          kategori: row[idxKategori] || 'Lainnya',
          status: row[idxStatus] || 'Ready',
          tanggalInput: row[idxTanggal] || new Date().toISOString().split('T')[0]
        });
      }

      if (importedProducts.length > 0) {
        state.products = [...importedProducts, ...state.products];
        // Deduplicate or clean? We just prepend.
        saveToLocalStorage();
        renderProducts();
        renderDashboardSummary();
        renderCharts();
        showToast(`Berhasil mengimpor ${importedProducts.length} Produk!`, 'upload');
      } else {
        showToast('Format CSV Produk tidak valid', 'x');
      }

    } else if (isTransactionCSV) {
      // Map columns indexes
      const idxTanggal = headers.indexOf('tanggal');
      const idxTipe = headers.indexOf('tipe');
      const idxKeterangan = headers.indexOf('keterangan');
      const idxNominal = headers.indexOf('nominal');

      const importedTransactions = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue;

        importedTransactions.push({
          id: 't_imp_' + Date.now() + '_' + i,
          tanggal: row[idxTanggal] || new Date().toISOString().split('T')[0],
          tipe: row[idxTipe] || 'Masuk',
          keterangan: row[idxKeterangan] || 'Transaksi Impor',
          nominal: parseInt(row[idxNominal]) || 0
        });
      }

      if (importedTransactions.length > 0) {
        state.transactions = [...importedTransactions, ...state.transactions];
        saveToLocalStorage();
        renderTransactions();
        renderDashboardSummary();
        renderCharts();
        showToast(`Berhasil mengimpor ${importedTransactions.length} Transaksi!`, 'upload');
      } else {
        showToast('Format CSV Transaksi tidak valid', 'x');
      }

    } else {
      showToast('Format berkas tidak dikenali. Pastikan nama kolom sesuai.', 'info');
    }
    
    // Reset file input so user can import the same file again if needed
    e.target.value = '';
  };

  reader.readAsText(file);
}

// Utility to parse CSV properly handling double quotes
function parseCSVText(text) {
  const result = [];
  let row = [];
  let entry = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') { // Double double quote is escaped double quote
          entry += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        entry += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(entry);
        entry = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(entry);
        result.push(row);
        row = [];
        entry = '';
      } else {
        entry += char;
      }
    }
  }
  
  if (entry || row.length > 0) {
    row.push(entry);
    result.push(row);
  }
  
  return result.filter(r => r.length > 0 && r.some(cell => cell.trim() !== ''));
}

// ==========================================================================
// SYSTEM RESET & DATA SETUP BINDINGS
// ==========================================================================
function initSettingsActions() {
  // Export button
  document.getElementById('btn-export-csv').addEventListener('click', exportToCSV);
  
  // Import file change listener
  document.getElementById('import-csv-file').addEventListener('change', importFromCSV);

  // Load demo button
  document.getElementById('btn-load-demo').addEventListener('click', () => {
    if (confirm('Muat ulang data demo? Tindakan ini akan menggabungkan/menimpa data demo dengan data saat ini.')) {
      loadDemoData();
      renderProducts();
      renderTransactions();
      renderDashboardSummary();
      renderCharts();
    }
  });

  // Reset database button
  document.getElementById('btn-reset-data').addEventListener('click', () => {
    if (confirm('PERINGATAN: Apakah Anda benar-benar ingin menghapus seluruh data barang dan transaksi? Tindakan ini tidak dapat dibatalkan.')) {
      state.products = [];
      state.transactions = [];
      saveToLocalStorage();
      
      renderProducts();
      renderTransactions();
      renderDashboardSummary();
      renderCharts();
      
      showToast('Seluruh data berhasil dihapus!', 'trash-2');
    }
  });
}

// ==========================================================================
// INITIAL SETUP ON CONTENT LOAD
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial State Load
  loadFromLocalStorage();

  // 2. Setup Modules UI
  initTheme();
  initTabs();
  initAutoSaleDialog();
  initProductForm();
  initTransactionForm();
  initSettingsActions();

  // 3. Render View Elements
  renderDashboardSummary();
  renderProducts();
  renderTransactions();
  
  // Render Chart.js items
  renderCharts();

  // 4. Initial Icon Rendering
  if (window.lucide) {
    lucide.createIcons();
  }
});
