/* GAS App Builder - Mobile PWA */
document.addEventListener('DOMContentLoaded', async () => {
  let state = { curSheet: '', curPage: 1, pageSize: 15, data: [] };

  // Init
  const hasConfig = localStorage.getItem('gas_config');
  if (hasConfig) {
    await GAS_API.init();
    if (GAS_API.getUrl()) {
      showMain();
      initApp();
    }
  }

  // ===== SETUP =====
  document.getElementById('setupUrlBtn').onclick = async () => {
    const url = document.getElementById('setupUrl').value.trim();
    if (!url?.startsWith('https://script.google.com')) {
      setStatus('setupUrlStatus', '❌ URL harus dari script.google.com', 'error'); return;
    }
    GAS_API.setUrl(url);
    setStatus('setupUrlStatus', '⏳ Menghubungkan...', 'loading');
    try {
      const info = await GAS_API.testConnection();
      setStatus('setupUrlStatus', `✅ Terhubung: ${info.name}`, 'success');
    } catch(e) {
      setStatus('setupUrlStatus', `❌ ${e.message}`, 'error');
    }
  };

  document.getElementById('setupGeminiBtn').onclick = () => {
    const key = document.getElementById('setupGeminiKey').value.trim();
    if (!key?.startsWith('AIza')) {
      setStatus('setupGeminiStatus', '❌ Key harus AIza...', 'error'); return;
    }
    GAS_API.setGeminiKey(key);
    setStatus('setupGeminiStatus', '✅ Key tersimpan!', 'success');
  };

  document.getElementById('setupStartBtn').onclick = () => {
    const cfg = JSON.parse(localStorage.getItem('gas_config') || '{}');
    if (!cfg.url) { toast('Atur Web App URL dulu!', 'error'); return; }
    showMain();
    initApp();
  };

  function showMain() {
    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('mainScreen').style.display = 'flex';
  }

  // ===== NAVIGATION =====
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('page-' + btn.dataset.page).classList.add('active');
      document.getElementById('headerTitle').textContent = 
        btn.querySelector('span').textContent;
    };
  });

  // Settings button in header
  document.getElementById('headerSettings').onclick = () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelector('.nav-item[data-page="settings"]').classList.add('active');
    document.getElementById('page-settings').classList.add('active');
    document.getElementById('headerTitle').textContent = 'Settings';
    loadSettings();
  };

  // ===== SETTINGS PAGE =====
  function loadSettings() {
    const cfg = JSON.parse(localStorage.getItem('gas_config') || '{}');
    document.getElementById('settingsUrl').value = cfg.url || '';
    document.getElementById('settingsGeminiKey').value = cfg.geminiKey || '';
  }

  document.getElementById('settingsSaveUrl').onclick = async () => {
    const url = document.getElementById('settingsUrl').value.trim();
    if (!url?.startsWith('https://script.google.com')) {
      setStatus('settingsUrlStatus', '❌ URL tidak valid', 'error'); return;
    }
    GAS_API.setUrl(url);
    setStatus('settingsUrlStatus', '⏳ Tes koneksi...', 'loading');
    try {
      await GAS_API.testConnection();
      setStatus('settingsUrlStatus', '✅ Tersimpan & terhubung!', 'success');
      updateHeaderStatus(true);
    } catch(e) {
      setStatus('settingsUrlStatus', `⚠️ Tersimpan, tapi ${e.message}`, 'error');
    }
  };

  document.getElementById('settingsTestUrl').onclick = async () => {
    const url = document.getElementById('settingsUrl').value.trim();
    if (!url) { setStatus('settingsUrlStatus', 'Masukkan URL dulu', 'error'); return; }
    setStatus('settingsUrlStatus', '⏳ Testing...', 'loading');
    try {
      await GAS_API.testConnection();
      setStatus('settingsUrlStatus', '✅ Koneksi OK!', 'success');
    } catch(e) { setStatus('settingsUrlStatus', `❌ ${e.message}`, 'error'); }
  };

  document.getElementById('settingsSaveGemini').onclick = () => {
    const key = document.getElementById('settingsGeminiKey').value.trim();
    if (!key?.startsWith('AIza')) { setStatus('settingsGeminiStatus', '❌ Key tidak valid', 'error'); return; }
    GAS_API.setGeminiKey(key);
    setStatus('settingsGeminiStatus', '✅ Key tersimpan!', 'success');
    updateGeminiBadge();
  };

  document.getElementById('settingsTestGemini').onclick = async () => {
    const key = document.getElementById('settingsGeminiKey').value.trim();
    if (!key) { setStatus('settingsGeminiStatus', 'Masukkan key dulu', 'error'); return; }
    setStatus('settingsGeminiStatus', '⏳ Testing...', 'loading');
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({contents:[{parts:[{text:'Halo'}]}]})
      });
      const d = await res.json();
      if (d.candidates) setStatus('settingsGeminiStatus', '✅ Key valid!', 'success');
      else throw new Error(d.error?.message||'Gagal');
    } catch(e) { setStatus('settingsGeminiStatus', `❌ ${e.message}`, 'error'); }
  };

  document.getElementById('clearDataBtn').onclick = () => {
    if (confirm('Reset semua data lokal?')) {
      localStorage.removeItem('gas_config');
      location.reload();
    }
  };

  // ===== DASHBOARD =====
  async function loadDashboard() {
    try {
      const info = await GAS_API.testConnection();
      const sheets = info.sheets || [];
      let total = 0, html = '';
      for (const s of sheets) total += s.rows;
      document.getElementById('dashTotal').textContent = total;

      html = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div class="stat-card"><div style="font-size:24px;font-weight:700;color:var(--accent)">${sheets.length}</div><div style="font-size:12px;color:var(--text3)">Sheets</div></div>
        <div class="stat-card"><div style="font-size:24px;font-weight:700;color:var(--success)">${total}</div><div style="font-size:12px;color:var(--text3)">Total Baris</div></div>
      </div>`;

      if (sheets.length) {
        html += '<div style="margin-bottom:8px;font-size:13px;font-weight:600;color:var(--text2)">📄 Daftar Sheet:</div>';
        sheets.forEach(s => {
          html += `<div class="data-card" onclick="document.querySelector('[data-page=data]').click();setTimeout(()=>document.getElementById('dataSheetSelect').value='${s.name}',100)">
            <div class="data-card-top"><span class="data-card-title">📄 ${s.name}</span><span class="data-card-id">${s.rows} baris</span></div>
            <div class="data-card-body">${s.cols} kolom</div>
          </div>`;
        });
      } else {
        html += '<div class="empty-state"><div class="empty-icon">📋</div><p>Sheet masih kosong</p></div>';
      }
      document.getElementById('dashContent').innerHTML = html;
      updateHeaderStatus(true);
    } catch(e) {
      document.getElementById('dashContent').innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`;
      updateHeaderStatus(false);
    }
  }

  // ===== DATA =====
  const dataSheet = document.getElementById('dataSheetSelect');
  const dataSearch = document.getElementById('dataSearch');
  const dataList = document.getElementById('dataList');
  const dataPagination = document.getElementById('dataPagination');

  async function loadSheetsDropdowns() {
    try {
      const r = await GAS_API.listSheets();
      const sheets = r.sheets || [];
      const opts = sheets.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
      document.querySelectorAll('.select-sm').forEach(el => {
        const v = el.value; el.innerHTML = '<option>Pilih sheet...</option>' + opts;
        if (v && sheets.find(s => s.name === v)) el.value = v;
      });
    } catch(e) { console.error(e); }
  }

  dataSheet.onchange = () => {
    state.curSheet = dataSheet.value;
    state.curPage = 1;
    if (state.curSheet && state.curSheet !== 'Pilih sheet...') loadData();
    else dataList.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>Pilih sheet</p></div>';
  };

  let searchTimer;
  dataSearch.oninput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if (dataSearch.value.trim() && state.curSheet) {
        searchData(dataSearch.value.trim());
      } else if (state.curSheet) loadData();
    }, 400);
  };

  async function loadData() {
    dataList.innerHTML = '<div class="loader" style="margin:32px auto"></div>';
    try {
      const r = await GAS_API.getAllData(state.curSheet, {limit: state.pageSize, offset: (state.curPage-1)*state.pageSize});
      state.data = r.data || [];
      renderData(state.data);
      renderPagination(r.total || 0);
    } catch(e) {
      dataList.innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`;
    }
  }

  async function searchData(q) {
    try {
      const r = await GAS_API.searchData(state.curSheet, q, {limit:50});
      renderData(r.data||[]);
      dataPagination.innerHTML = '';
    } catch(e) { toast(e.message, 'error'); }
  }

  function renderData(data) {
    if (!data?.length) {
      dataList.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>Data kosong</p></div>';
      return;
    }
    const keys = Object.keys(data[0]).filter(k => k !== 'id');
    dataList.innerHTML = data.map(r => {
      const first = r[keys[0]] || '(kosong)';
      const more = keys.slice(1,3).map(k => r[k]).filter(v=>v).join(' · ');
      return `<div class="data-card" onclick="showDetail(${r.id})">
        <div class="data-card-top">
          <span class="data-card-title">${esc(String(first).substring(0,50))}</span>
          <span class="data-card-id">#${r.id}</span>
        </div>
        ${more ? `<div class="data-card-body">${esc(String(more).substring(0,100))}</div>` : ''}
        <div class="data-card-actions">
          <button onclick="event.stopPropagation();editRow(${r.id})">✏️ Edit</button>
          <button class="del" onclick="event.stopPropagation();delRow(${r.id})">🗑️ Hapus</button>
        </div>
      </div>`;
    }).join('');
    window.showDetail = showDetail;
    window.editRow = editRow;
    window.delRow = delRow;
  }

  function renderPagination(total) {
    const pages = Math.ceil(total / state.pageSize);
    let html = '';
    if (state.curPage > 1) html += `<button onclick="goPage(${state.curPage-1})">←</button>`;
    for (let i = Math.max(1,state.curPage-2); i <= Math.min(pages, state.curPage+2); i++)
      html += `<button class="${i===state.curPage?'active':''}" onclick="goPage(${i})">${i}</button>`;
    if (state.curPage < pages) html += `<button onclick="goPage(${state.curPage+1})">→</button>`;
    dataPagination.innerHTML = html;
    window.goPage = p => { state.curPage = p; loadData(); };
  }

  dataRefresh.onclick = () => { if (state.curSheet) loadData(); };

  // ===== DETAIL / EDIT / DELETE =====
  async function showDetail(id) {
    try {
      const r = await GAS_API.getRow(state.curSheet, id);
      const d = r.data || {};
      const keys = Object.keys(d).filter(k => k !== 'id');
      const body = keys.map(k => `<div class="field-row"><span class="field-label">${esc(k)}</span><span class="field-value">${esc(String(d[k]))}</span></div>`).join('');
      showModal(`📋 #${id}`, body);
    } catch(e) { toast(e.message, 'error'); }
  }

  async function editRow(id) {
    try {
      const r = await GAS_API.getRow(state.curSheet, id);
      const d = r.data || {};
      const keys = Object.keys(d).filter(k => k !== 'id');
      let form = keys.map(k => `<div class="form-field"><label>${esc(k)}</label><input type="text" id="ef-${esc(k)}" value="${esc(String(d[k]||''))}"></div>`).join('');
      form += `<button class="btn btn-primary btn-full" onclick="saveEdit(${id})">💾 Simpan</button>`;
      showModal(`✏️ Edit #${id}`, form);
      window.saveEdit = async (eid) => {
        const fd = {};
        keys.forEach(k => { fd[k] = document.getElementById(`ef-${esc(k)}`).value; });
        try {
          await GAS_API.updateRow(state.curSheet, eid, fd);
          toast('✅ Diupdate!', 'success'); closeModal(); loadData();
        } catch(e) { toast(e.message, 'error'); }
      };
    } catch(e) { toast(e.message, 'error'); }
  }

  async function delRow(id) {
    if (!confirm(`Hapus #${id}?`)) return;
    try { await GAS_API.deleteRow(state.curSheet, id); toast('🗑️ Dihapus!', 'success'); loadData(); }
    catch(e) { toast(e.message, 'error'); }
  }

  // ===== ADD DATA =====
  const addSheet = document.getElementById('addSheetSelect');
  const addForm = document.getElementById('addForm');

  addSheet.onchange = async () => {
    const s = addSheet.value;
    if (!s || s === 'Pilih sheet...') { addForm.innerHTML = '<div class="empty-state"><div class="empty-icon">➕</div><p>Pilih sheet</p></div>'; document.getElementById('addSubmit').style.display='none'; return; }
    try {
      const r = await GAS_API.getAllData(s, {limit:1});
      const data = r.data || [];
      const keys = (data[0] && Object.keys(data[0]).filter(k=>k!=='id')) || ['kolom1'];
      addForm.innerHTML = keys.map(k => `<div class="form-field"><label>${esc(k)}</label><input type="text" data-field="${esc(k)}" placeholder="${esc(k)}"></div>`).join('');
      document.getElementById('addSubmit').style.display = 'block';
    } catch(e) { addForm.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
  };

  document.getElementById('addSubmit').onclick = async () => {
    const s = addSheet.value;
    const fd = {};
    addForm.querySelectorAll('input[data-field]').forEach(el => { fd[el.dataset.field] = el.value; });
    try {
      await GAS_API.addRow(s, fd);
      toast('✅ Data ditambahkan!', 'success');
      addForm.querySelectorAll('input').forEach(el => el.value = '');
      state.curSheet = s;
      dataSheet.value = s;
      loadData();
      document.querySelector('.nav-item[data-page="data"]').click();
    } catch(e) { toast(e.message, 'error'); }
  };

  // ===== SHEETS =====
  async function loadSheets() {
    try {
      const r = await GAS_API.listSheets();
      const sheets = r.sheets || [];
      if (!sheets.length) {
        document.getElementById('sheetsList').innerHTML = '<div class="empty-state"><div class="empty-icon">🗂️</div><p>Belum ada sheet</p></div>';
        return;
      }
      document.getElementById('sheetsList').innerHTML = sheets.map(s => `<div class="sheet-item">
        <div><div class="sheet-name">📄 ${s.name}</div><div class="sheet-meta">${s.rows} baris · ${s.cols} kolom</div></div>
        <button class="btn btn-sm" onclick="openSheet('${s.name}')">Buka</button>
      </div>`).join('');
      window.openSheet = n => { dataSheet.value = n; dataSheet.dispatchEvent(new Event('change')); document.querySelector('.nav-item[data-page="data"]').click(); };
    } catch(e) { document.getElementById('sheetsList').innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`; }
  }

  document.getElementById('sheetsRefresh').onclick = () => { loadSheets(); loadSheetsDropdowns(); };
  document.getElementById('createSheetBtn').onclick = async () => {
    const n = document.getElementById('newSheetInput').value.trim();
    if (!n) { toast('Masukkan nama sheet!', 'error'); return; }
    try { await GAS_API.createSheet(n); toast(`✅ Sheet "${n}" dibuat!`, 'success');
      document.getElementById('newSheetInput').value = '';
      loadSheets(); loadSheetsDropdowns();
    } catch(e) { toast(e.message, 'error'); }
  };

  // ===== AI GENERATOR =====
  document.querySelectorAll('.chip').forEach(c => c.onclick = () => {
    document.getElementById('aiPrompt').value = c.dataset.prompt;
    document.getElementById('aiPrompt').focus();
  });

  document.getElementById('aiGenerateBtn').onclick = async () => {
    const prompt = document.getElementById('aiPrompt').value.trim();
    const key = GAS_API.getGeminiKey();
    if (!prompt) { toast('Tulis deskripsi dulu!', 'error'); return; }
    if (!key) { toast('Atur Gemini Key di Settings!', 'error'); return; }

    document.getElementById('aiLoading').style.display = 'block';
    document.getElementById('aiResult').style.display = 'none';
    document.getElementById('aiGenerateBtn').disabled = true;
    document.getElementById('aiGenerateBtn').textContent = '⏳ Menulis...';

    try {
      const raw = await AI_GENERATOR.generate(prompt, key);
      const code = raw.replace(/```javascript\n?/g,'').replace(/```\n?/g,'').trim();
      document.getElementById('aiLoading').style.display = 'none';
      document.getElementById('aiResult').style.display = 'block';
      document.getElementById('aiCode').textContent = code;

      const v = AI_GENERATOR.validateScript(code);
      document.getElementById('aiValidation').innerHTML = v.valid ? '<span class="ok">✅ Siap pakai</span>' : v.issues.map(i => `<span class="warn">${i}</span>`).join('<br>');

      document.getElementById('aiCopyBtn').onclick = () => {
        navigator.clipboard.writeText(code).then(() => toast('✅ Tercopy!', 'success'))
          .catch(() => { const t = document.createElement('textarea'); t.value = code; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); toast('✅ Tercopy!', 'success'); });
      };
      document.getElementById('aiDeployBtn').onclick = () => {
        const u = GAS_API.getUrl();
        window.open(u ? u.replace(/\/macros\/s\/.*/,'/edit') : 'https://script.google.com', '_blank');
      };
    } catch(e) {
      document.getElementById('aiLoading').style.display = 'none';
      document.getElementById('aiResult').style.display = 'block';
      document.getElementById('aiCode').textContent = `❌ ${e.message}`;
      document.getElementById('aiValidation').innerHTML = '<span class="warn">Cek API Key atau koneksi</span>';
    } finally {
      document.getElementById('aiGenerateBtn').disabled = false;
      document.getElementById('aiGenerateBtn').textContent = '🚀 Generate Script';
    }
  };

  // ===== STATS =====
  document.getElementById('statsSheetSelect').onchange = async () => {
    const s = document.getElementById('statsSheetSelect').value;
    if (!s || s === 'Pilih sheet...') { document.getElementById('statsContent').innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><p>Pilih sheet</p></div>'; return; }
    document.getElementById('statsContent').innerHTML = '<div class="loader" style="margin:32px auto"></div>';
    try {
      const r = await GAS_API.getStats(s);
      let html = `<div class="stat-card">
        <div style="font-size:14px;font-weight:600;margin-bottom:8px">📊 ${r.sheet}</div>
        <div class="stat-row"><span class="stat-label">Total Baris</span><span class="stat-val">${r.total}</span></div>
        <div class="stat-row"><span class="stat-label">Total Kolom</span><span class="stat-val">${r.columns}</span></div>
        <div class="stat-row"><span class="stat-label">Terakhir</span><span class="stat-val">${new Date(r.lastUpdated).toLocaleString('id-ID')}</span></div>
      </div>`;
      if (r.colStats?.length) {
        html += '<div class="stat-card"><div style="font-size:14px;font-weight:600;margin-bottom:8px">📈 Per Kolom</div>';
        const max = Math.max(...r.colStats.map(c => c.total), 1);
        r.colStats.forEach(c => {
          html += `<div style="margin-bottom:8px">
            <div class="stat-row"><span class="stat-label">${esc(c.name)}</span><span class="stat-val">${c.total} data · ${c.unique} unik</span></div>
            <div class="stat-bar"><div class="stat-fill" style="width:${(c.total/max)*100}%"></div></div>
          </div>`;
        });
        html += '</div>';
      }
      document.getElementById('statsContent').innerHTML = html;
    } catch(e) { document.getElementById('statsContent').innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`; }
  };

  // ===== HELPERS =====
  function showModal(title, body) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modalOverlay').style.display = 'flex';
  }
  window.closeModal = () => { document.getElementById('modalOverlay').style.display = 'none'; };
  document.getElementById('modalClose').onclick = window.closeModal;
  document.getElementById('modalOverlay').onclick = (e) => { if (e.target === document.getElementById('modalOverlay')) closeModal(); };

  function toast(msg, type = 'info') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 2800);
  }
  window.toast = toast;

  function setStatus(id, msg, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `status-msg ${type}`; el.textContent = msg;
  }

  function esc(s) {
    const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
  }

  function updateHeaderStatus(connected) {
    const dot = document.getElementById('connStatus');
    dot.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
  }

  function updateGeminiBadge() {
    const key = GAS_API.getGeminiKey();
    const badge = document.getElementById('aiStatusBadge');
    if (key) { badge.textContent = '✅ Key OK'; badge.className = 'badge badge-success'; }
    else { badge.textContent = '⚠️ Key?'; badge.className = 'badge badge-warning'; }
  }

  // ===== INIT =====
  async function initApp() {
    loadDashboard();
    loadSheetsDropdowns();
    loadSheets();
    updateGeminiBadge();
  }
});
