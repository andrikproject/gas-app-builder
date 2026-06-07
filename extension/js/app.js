/**
 * GAS App Builder - Main Application
 */

document.addEventListener('DOMContentLoaded', async () => {
  // State
  let currentSheet = '';
  let currentPage = 1;
  const PAGE_SIZE = 20;
  let allData = [];

  // Init
  await GAS_API.init();
  await checkConnection();
  setupTabNavigation();

  // === EVENT LISTENERS ===

  // Settings
  document.getElementById('btnSettings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Sheet selector (Data tab)
  document.getElementById('sheetSelect').addEventListener('change', async (e) => {
    currentSheet = e.target.value;
    currentPage = 1;
    if (currentSheet) {
      await loadData(currentSheet);
      syncSheetSelectors(currentSheet);
    } else {
      document.getElementById('dataContainer').innerHTML = getEmptyState('📋', 'Pilih sheet untuk melihat data');
    }
  });

  // Search
  let searchTimeout;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      const q = e.target.value.trim();
      if (q && currentSheet) {
        try {
          showToast('🔍 Mencari...', 'info');
          const result = await GAS_API.searchData(currentSheet, q, { limit: 50 });
          renderData(result.data || []);
        } catch(err) {
          showToast(`Error: ${err.message}`, 'error');
        }
      } else if (currentSheet) {
        await loadData(currentSheet);
      }
    }, 500);
  });

  // Refresh
  document.getElementById('btnRefresh').addEventListener('click', async () => {
    if (currentSheet) await loadData(currentSheet);
  });

  // Create Sheet
  document.getElementById('btnCreateSheet').addEventListener('click', async () => {
    const name = document.getElementById('newSheetName').value.trim();
    if (!name) { showToast('Masukkan nama sheet!', 'error'); return; }
    try {
      await GAS_API.createSheet(name);
      showToast(`Sheet "${name}" dibuat!`, 'success');
      document.getElementById('newSheetName').value = '';
      await loadSheets();
    } catch(err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  });

  document.getElementById('btnRefreshSheets').addEventListener('click', loadSheets);

  // Add form
  document.getElementById('addSheetSelect').addEventListener('change', async (e) => {
    const sheet = e.target.value;
    if (sheet) {
      await buildAddForm(sheet);
    } else {
      document.getElementById('addFormContainer').innerHTML = getEmptyState('➕', 'Pilih sheet untuk menambah data');
      document.getElementById('btnSubmitAdd').style.display = 'none';
    }
  });

  document.getElementById('btnSubmitAdd').addEventListener('click', async () => {
    const sheet = document.getElementById('addSheetSelect').value;
    if (!sheet) return;
    
    const formData = {};
    document.querySelectorAll('.form-field input, .form-field textarea').forEach(el => {
      formData[el.dataset.field] = el.value;
    });

    try {
      await GAS_API.addRow(sheet, formData);
      showToast('✅ Data berhasil ditambahkan!', 'success');
      // Reset form
      document.querySelectorAll('.form-field input, .form-field textarea').forEach(el => el.value = '');
      // Refresh data
      currentSheet = sheet;
      document.getElementById('sheetSelect').value = sheet;
      await loadData(sheet);
      // Switch to data tab
      switchTab('data');
    } catch(err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  });

  // Stats
  document.getElementById('statsSheetSelect').addEventListener('change', async (e) => {
    const sheet = e.target.value;
    if (sheet) await loadStats(sheet);
  });

  document.getElementById('btnRefreshStats').addEventListener('click', async () => {
    const sheet = document.getElementById('statsSheetSelect').value;
    if (sheet) await loadStats(sheet);
  });

  // Modal
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

  // Initial load
  await loadSheets();

  // ======== FUNCTIONS ========

  async function checkConnection() {
    const statusDot = document.getElementById('connectionStatus');
    const footer = document.getElementById('footerInfo');

    if (!GAS_API.getUrl()) {
      statusDot.className = 'status-dot disconnected';
      footer.textContent = '⚠️ Atur URL Web App di ⚙️ Settings';
      return;
    }

    statusDot.className = 'status-dot loading';
    footer.textContent = 'Menghubungkan...';

    try {
      const info = await GAS_API.testConnection();
      statusDot.className = 'status-dot connected';
      footer.textContent = `✅ Terhubung: ${info.name || 'Google Sheets'}`;
    } catch(err) {
      statusDot.className = 'status-dot disconnected';
      footer.textContent = `❌ ${err.message}`;
    }
  }

  function setupTabNavigation() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        switchTab(tabName);
      });
    });
  }

  function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    document.querySelector(`.tab[data-tab="${tabName}"]`)?.classList.add('active');
    document.getElementById(`tab-${tabName}`)?.classList.add('active');
  }

  function syncSheetSelectors(selectedSheet) {
    document.querySelectorAll('.select').forEach(sel => {
      if (sel.id !== 'sheetSelect') {
        sel.value = selectedSheet;
      }
    });
  }

  async function loadSheets() {
    try {
      const result = await GAS_API.listSheets();
      const sheets = result.sheets || [];
      
      const options = ['<option value="">-- Pilih Sheet --</option>'];
      sheets.forEach(s => {
        options.push(`<option value="${s.name}">${s.name} (${s.rows} baris)</option>`);
      });
      
      document.querySelectorAll('.select').forEach(sel => {
        const currentVal = sel.value;
        sel.innerHTML = options.join('');
        if (currentVal) sel.value = currentVal;
      });

      // Render sheets list
      const listEl = document.getElementById('sheetsList');
      if (sheets.length === 0) {
        listEl.innerHTML = getEmptyState('🗂️', 'Belum ada sheet. Buat sheet baru!');
      } else {
        listEl.innerHTML = sheets.map(s => `
          <div class="sheet-item">
            <div class="sheet-info">
              <span>📄</span>
              <div>
                <div class="sheet-name">${s.name}</div>
                <div class="sheet-meta">${s.rows} baris · ${s.cols} kolom</div>
              </div>
            </div>
            <button class="btn btn-sm" onclick="document.getElementById('sheetSelect').value='${s.name}'; document.getElementById('sheetSelect').dispatchEvent(new Event('change')); switchTab('data');">Buka</button>
          </div>
        `).join('');
        window.switchTab = switchTab;
      }
    } catch(err) {
      document.getElementById('sheetsList').innerHTML = getEmptyState('❌', `Gagal memuat: ${err.message}`);
    }
  }

  async function loadData(sheet, page = 1) {
    const container = document.getElementById('dataContainer');
    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
      const result = await GAS_API.getAllData(sheet, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
      allData = result.data || [];
      const total = result.total || 0;

      if (allData.length === 0) {
        container.innerHTML = getEmptyState('📭', 'Belum ada data. Klik tab ➕ Tambah');
        document.getElementById('pagination').innerHTML = '';
        return;
      }

      renderData(allData);

      // Pagination
      const totalPages = Math.ceil(total / PAGE_SIZE);
      renderPagination(totalPages, page);
    } catch(err) {
      container.innerHTML = getEmptyState('❌', `Error: ${err.message}`);
    }
  }

  function renderData(data) {
    const container = document.getElementById('dataContainer');
    if (!data || data.length === 0) {
      container.innerHTML = getEmptyState('📭', 'Data tidak ditemukan');
      return;
    }

    const headers = Object.keys(data[0]).filter(h => h !== 'id');
    
    container.innerHTML = data.map(row => {
      const firstValue = row[headers[0]] || '(kosong)';
      const otherValues = headers.slice(1, 4).map(h => row[h]).filter(v => v).join(' · ');
      
      return `
        <div class="data-card" onclick="openDetail(${row.id})">
          <div class="data-card-header">
            <span class="data-card-title">${escapeHtml(String(firstValue).substring(0, 50))}</span>
            <span class="data-card-id">#${row.id}</span>
          </div>
          <div class="data-card-body">
            ${otherValues ? `<span>${escapeHtml(String(otherValues).substring(0, 80))}</span>` : ''}
          </div>
          <div class="data-card-actions">
            <button class="edit-btn" onclick="event.stopPropagation(); editRow(${row.id})">✏️ Edit</button>
            <button class="delete-btn" onclick="event.stopPropagation(); deleteRow(${row.id})">🗑️ Hapus</button>
          </div>
        </div>
      `;
    }).join('');

    // Expose functions globally
    window.openDetail = openDetail;
    window.editRow = editRow;
    window.deleteRow = deleteRow;
  }

  function renderPagination(totalPages, currentPage) {
    const pagination = document.getElementById('pagination');
    let html = '';
    
    if (currentPage > 1) {
      html += `<button onclick="changePage(${currentPage - 1})">←</button>`;
    }
    
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      html += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    
    if (currentPage < totalPages) {
      html += `<button onclick="changePage(${currentPage + 1})">→</button>`;
    }
    
    pagination.innerHTML = html;
    window.changePage = (page) => {
      currentPage = page;
      loadData(currentSheet, page);
    };
  }

  async function buildAddForm(sheet) {
    const container = document.getElementById('addFormContainer');
    try {
      const result = await GAS_API.getAllData(sheet, { limit: 1 });
      const data = result.data || [];
      
      if (data.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);padding:12px;">Sheet kosong — form akan muncul setelah ada data.</p>';
        // Show manual input
        container.innerHTML = `
          <div class="form-field">
            <label>Kolom 1</label>
            <input type="text" data-field="kolom1" placeholder="Masukkan nilai...">
          </div>
        `;
        document.getElementById('btnSubmitAdd').style.display = 'block';
        return;
      }

      const headers = Object.keys(data[0]).filter(h => h !== 'id');
      
      container.innerHTML = headers.map(h => `
        <div class="form-field">
          <label>${escapeHtml(h)}</label>
          <input type="text" data-field="${escapeHtml(h)}" placeholder="Masukkan ${escapeHtml(h)}..." />
        </div>
      `).join('');

      document.getElementById('btnSubmitAdd').style.display = 'block';
    } catch(err) {
      container.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
  }

  async function loadStats(sheet) {
    const container = document.getElementById('statsContainer');
    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
      const result = await GAS_API.getStats(sheet);
      
      let html = `
        <div class="stat-card">
          <h3 style="margin-bottom:8px;font-size:14px;">📊 Ringkasan ${escapeHtml(sheet)}</h3>
          <div class="stat-row">
            <span class="stat-label">Total Baris</span>
            <span class="stat-value">${result.total}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Total Kolom</span>
            <span class="stat-value">${result.columns}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Terakhir Update</span>
            <span class="stat-value">${new Date(result.lastUpdated).toLocaleString('id-ID')}</span>
          </div>
        </div>
        <div class="stat-card">
          <h3 style="margin-bottom:8px;font-size:14px;">📈 Statistik per Kolom</h3>
      `;

      if (result.colStats) {
        const maxTotal = Math.max(...result.colStats.map(c => c.total));
        result.colStats.forEach(col => {
          const pct = maxTotal > 0 ? (col.total / maxTotal) * 100 : 0;
          html += `
            <div style="margin-bottom:8px;">
              <div class="stat-row">
                <span class="stat-label">${escapeHtml(col.name)}</span>
                <span class="stat-value">${col.total} data · ${col.unique} unik</span>
              </div>
              <div class="stat-bar">
                <div class="stat-bar-fill" style="width:${pct}%"></div>
              </div>
            </div>
          `;
        });
      }

      html += '</div>';
      container.innerHTML = html;
    } catch(err) {
      container.innerHTML = `<div class="empty-state"><span class="empty-icon">❌</span><p>${err.message}</p></div>`;
    }
  }

  async function openDetail(id) {
    if (!currentSheet) return;
    try {
      const result = await GAS_API.getRow(currentSheet, id);
      const data = result.data || {};
      const headers = Object.keys(data).filter(h => h !== 'id');

      let body = headers.map(h => `
        <div class="field-row">
          <span class="field-label">${escapeHtml(h)}</span>
          <span class="field-value">${escapeHtml(String(data[h]))}</span>
        </div>
      `).join('');

      showModal(`📋 Detail #${id}`, body);
    } catch(err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  }

  async function editRow(id) {
    if (!currentSheet) return;
    try {
      const result = await GAS_API.getRow(currentSheet, id);
      const data = result.data || {};
      const headers = Object.keys(data).filter(h => h !== 'id');

      let form = headers.map(h => `
        <div class="form-field">
          <label>${escapeHtml(h)}</label>
          <input type="text" id="edit-${escapeHtml(h)}" value="${escapeHtml(String(data[h] || ''))}" />
        </div>
      `).join('');

      form += `<button class="btn btn-primary" style="width:100%;margin-top:8px;" onclick="saveEdit(${id})">💾 Simpan</button>`;

      showModal(`✏️ Edit #${id}`, form);
      window.saveEdit = async (editId) => {
        const formData = {};
        headers.forEach(h => {
          formData[h] = document.getElementById(`edit-${escapeHtml(h)}`).value;
        });
        try {
          await GAS_API.updateRow(currentSheet, editId, formData);
          showToast('✅ Data diupdate!', 'success');
          closeModal();
          await loadData(currentSheet, currentPage);
        } catch(err) {
          showToast(`Error: ${err.message}`, 'error');
        }
      };
    } catch(err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  }

  async function deleteRow(id) {
    if (!confirm(`Hapus data #${id}?`)) return;
    try {
      await GAS_API.deleteRow(currentSheet, id);
      showToast('🗑️ Data dihapus!', 'success');
      await loadData(currentSheet, currentPage);
    } catch(err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  }

  // ======== UI HELPERS ========

  function showModal(title, body) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modalOverlay').style.display = 'flex';
  }

  function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
  }

  function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function getEmptyState(icon, message) {
    return `<div class="empty-state"><span class="empty-icon">${icon}</span><p>${message}</p></div>`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
