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
    } catch(e) { setStatus('settingsUrlStatus', '❌ ' + e.message, 'error'); }
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
  let currentAIMode = 'script';
  let lastGeneratedCode = '';
  let lastGeneratedSheet = null;

  // Mode switching
  document.querySelectorAll('.ai-mode').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.ai-mode').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentAIMode = btn.dataset.mode;
      document.getElementById('aiModeScript').style.display = currentAIMode === 'script' ? 'block' : 'none';
      document.getElementById('aiModeSheet').style.display = currentAIMode === 'sheet' ? 'block' : 'none';
      document.getElementById('aiResult').style.display = 'none';
    };
  });

  // Script mode - quick chips
  document.querySelectorAll('#aiModeScript .chip').forEach(c => c.onclick = () => {
    document.getElementById('aiPrompt').value = c.dataset.prompt;
    document.getElementById('aiPrompt').focus();
  });

  // Sheet mode - quick chips
  document.querySelectorAll('#aiModeSheet .chip').forEach(c => c.onclick = () => {
    document.getElementById('aiSheetPrompt').value = c.dataset.prompt;
    document.getElementById('aiSheetPrompt').focus();
  });

  // ===== HELPER: get AI config for current provider =====
  function getAiCfg() {
    var cfg = GAS_API.getAiConfig();
    if (!cfg._provider) { cfg._provider = 'gemini'; GAS_API.setAiConfig(cfg); }
    return cfg;
  }

  // ===== GENERATE SCRIPT =====
  document.getElementById('aiGenerateBtn').onclick = async function() {
    var prompt = document.getElementById('aiPrompt').value.trim();
    var cfg = getAiCfg();
    if (!prompt) { toast('Tulis deskripsi dulu!', 'error'); return; }
    
    // Validate provider config
    var p = AI_GEN.providers[cfg._provider || 'gemini'];
    var missing = [];
    for (var i = 0; i < (p.fields || []).length; i++) {
      var f = p.fields[i];
      if (f.secret && !cfg[f.key]) missing.push(f.label);
    }
    if (missing.length) { toast('Atur ' + missing.join(', ') + ' di Settings!', 'error'); return; }

    showAIResult();
    try {
      var result = await AI_GEN.generate('script', prompt, cfg);
      lastGeneratedCode = result.code;
      
      hideAILoading();
      document.getElementById('aiResult').style.display = 'block';
      document.getElementById('resultTitle').textContent = '📜 Script Generated';
      document.getElementById('aiCode').textContent = lastGeneratedCode;

      document.getElementById('aiValidation').innerHTML = 
        '<span class="ok">✅ Siap pakai</span>';

      document.getElementById('aiCopyBtn').style.display = '';
      document.getElementById('aiDeployBtn').style.display = '';
      document.getElementById('aiPushSheetBtn').style.display = '';

      document.getElementById('aiCopyBtn').onclick = copyCode;
      document.getElementById('aiDeployBtn').onclick = deployScript;
      document.getElementById('aiPushSheetBtn').onclick = pushToSheet;
    } catch(e) {
      showAIError(e);
    } finally {
      document.getElementById('aiGenerateBtn').disabled = false;
      document.getElementById('aiGenerateBtn').textContent = '🚀 Generate Script';
    }
  };

  // ===== GENERATE & PUSH SHEET =====
  document.getElementById('aiSheetBtn').onclick = async function() {
    var prompt = document.getElementById('aiSheetPrompt').value.trim();
    var sheetName = document.getElementById('aiSheetName').value.trim() || ('AI_Sheet_' + new Date().toISOString().slice(0,10));
    var cfg = getAiCfg();
    
    if (!prompt) { toast('Tulis deskripsi data dulu!', 'error'); return; }
    
    var p = AI_GEN.providers[cfg._provider || 'gemini'];
    var missing = [];
    for (var i = 0; i < (p.fields || []).length; i++) {
      var f = p.fields[i];
      if (f.secret && !cfg[f.key]) missing.push(f.label);
    }
    if (missing.length) { toast('Atur ' + missing.join(', ') + ' di Settings!', 'error'); return; }

    showAIResult();
    document.getElementById('resultTitle').textContent = '⏳ Generate & Push ke Sheets...';

    try {
      // Generate data dengan AI
      var result = await AI_GEN.generate('sheet', prompt, cfg);
      lastGeneratedSheet = result;
      
      // Kirim ke GAS backend untuk buat sheet
      var url = GAS_API.getUrl();
      if (!url) throw new Error('Web App URL belum diatur di Settings');
      
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'bulkAdd',
          sheet: sheetName,
          rows: JSON.stringify(result.data),
          headers: result.headers.join(',')
        })
      });
      var r = await res.json();
      if (r.error) throw new Error(r.error);
      
      // Coba buat sheet dulu kalo bulkAdd gagal karena sheet belum ada
      if (r.error && r.error.indexOf('not found') >= 0) {
        await fetch(url, {
          method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
          body: new URLSearchParams({action:'createSheet', name:sheetName, headers: result.headers.join(',')})
        });
        // Coba lagi
        res = await fetch(url, {
          method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
          body: new URLSearchParams({action:'bulkAdd', sheet:sheetName, rows:JSON.stringify(result.data)})
        });
        r = await res.json();
        if (r.error) throw new Error(r.error);
      }

      hideAILoading();
      document.getElementById('aiResult').style.display = 'block';
      
      document.getElementById('resultTitle').textContent = '✅ Sheet Created!';
      document.getElementById('aiCode').textContent = 
        '📊 Sheet: ' + sheetName + '\n' +
        '📋 Baris: ' + result.rows + '\n' +
        '📋 Kolom: ' + result.headers.length + '\n' +
        '🔤 Headers: ' + result.headers.join(', ') + '\n';
      document.getElementById('aiValidation').innerHTML = 
        '<span class="ok">✅ ' + result.rows + ' baris data berhasil dibuat!</span>';

      document.getElementById('aiCopyBtn').style.display = '';
      document.getElementById('aiDeployBtn').style.display = 'none';
      document.getElementById('aiPushSheetBtn').style.display = 'none';
      
      document.getElementById('aiCopyBtn').onclick = function() {
        navigator.clipboard.writeText(sheetName)
          .then(function() { toast('✅ Nama sheet tercopy!', 'success'); })
          .catch(function() { toast('❌ Gagal copy', 'error'); });
      };
      
      // Refresh sheet list
      loadSheetsDropdowns();
    } catch(e) {
      showAIError(e);
    } finally {
      document.getElementById('aiSheetBtn').disabled = false;
      document.getElementById('aiSheetBtn').textContent = '📊 Generate & Push';
    }
  };

  // ===== PUSH TO SHEET =====
  async function pushToSheet() {
    if (!lastGeneratedCode) { toast('Generate script dulu!', 'error'); return; }
    var sheetName = 'GAS_Code_' + new Date().toISOString().slice(0,10);
    
    showAILoading('📤 Simpan kode ke sheet...');
    try {
      var url = GAS_API.getUrl();
      var res = await fetch(url, {
        method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body: new URLSearchParams({action:'createSheet', name:sheetName, headers:'timestamp,prompt,code'})
      });
      await res.json();
      
      res = await fetch(url, {
        method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body: new URLSearchParams({
          action:'addRow', sheet:sheetName,
          data: JSON.stringify({timestamp: new Date().toISOString(), prompt: document.getElementById('aiPrompt').value.trim(), code: lastGeneratedCode})
        })
      });
      var r = await res.json();
      if (r.error) throw new Error(r.error);
      
      hideAILoading();
      toast('✅ Kode tersimpan di sheet "' + sheetName + '"!', 'success');
      loadSheetsDropdowns();
    } catch(e) {
      hideAILoading();
      toast('❌ Gagal: ' + e.message, 'error');
    }
  }

  // ===== DEPLOY SCRIPT =====
  async function deployScript() {
    if (!lastGeneratedCode) { toast('Generate script dulu!', 'error'); return; }
    var sheetName = 'GAS_Script_' + new Date().toISOString().slice(0,10);
    
    showAILoading('📤 Simpan kode ke sheet...');
    try {
      var url = GAS_API.getUrl();
      // Buat sheet dulu
      var res = await fetch(url, {
        method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body: new URLSearchParams({action:'createSheet', name:sheetName, headers:'timestamp,prompt,code'})
      });
      await res.json();
      
      // Simpan kode
      res = await fetch(url, {
        method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body: new URLSearchParams({
          action:'addRow', sheet:sheetName,
          data: JSON.stringify({timestamp: new Date().toISOString(), prompt: document.getElementById('aiPrompt').value.trim(), code: lastGeneratedCode})
        })
      });
      var r = await res.json();
      if (r.error) throw new Error(r.error);
      
      hideAILoading();
      toast('✅ Kode tersimpan di sheet "' + sheetName + '"!', 'success');
      
      setTimeout(function() {
        window.open('https://script.new', '_blank');
        toast('📋 Buka tab baru, paste kode dari sheet, lalu deploy!', 'info');
      }, 1000);
      
      document.getElementById('aiResult').style.display = 'block';
      document.getElementById('resultTitle').textContent = '✅ Kode Tersimpan!';
      document.getElementById('aiCode').textContent = 
        '📋 Kode tersimpan di sheet: "' + sheetName + '"\n\n' +
        '📝 Langkah-langkah:\n' +
        '1. Tab baru terbuka: script.new\n' +
        '2. Buka sheet "' + sheetName + '"\n' +
        '3. Copy kode dari kolom "code"\n' +
        '4. Paste di editor Apps Script\n' +
        '5. Deploy → New deployment → Web app';
      document.getElementById('aiValidation').innerHTML = 
        '<span class="ok">✅ Siap deploy!</span>';
      
      document.getElementById('aiCopyBtn').style.display = '';
      document.getElementById('aiDeployBtn').style.display = '';
      document.getElementById('aiPushSheetBtn').style.display = 'none';
      document.getElementById('aiCopyBtn').onclick = copyCode;
      document.getElementById('aiDeployBtn').onclick = function() { window.open('https://script.new', '_blank'); };
    } catch(e) {
      hideAILoading();
      toast('❌ Gagal: ' + e.message, 'error');
      setTimeout(function() { window.open('https://script.new', '_blank'); }, 500);
    }
  }

  // ===== COPY CODE =====
  function copyCode() {
    if (!lastGeneratedCode) { toast('Tidak ada kode!', 'error'); return; }
    navigator.clipboard.writeText(lastGeneratedCode)
      .then(function() { toast('✅ Kode tercopy!', 'success'); })
      .catch(function() { 
        var t = document.createElement('textarea');
        t.value = lastGeneratedCode; 
        document.body.appendChild(t); 
        t.select(); 
        document.execCommand('copy'); 
        t.remove(); 
        toast('✅ Tercopy!', 'success'); 
      });
  }

  // ===== HELPERS =====
  function showAIResult() {
    document.getElementById('aiResult').style.display = 'block';
    document.getElementById('resultTitle').textContent = '⏳ Memproses...';
    document.getElementById('aiCode').textContent = '';
    document.getElementById('aiValidation').innerHTML = '<div class="loader" style="margin:16px auto"></div>';
    document.getElementById('aiCopyBtn').style.display = 'none';
    document.getElementById('aiDeployBtn').style.display = 'none';
    document.getElementById('aiPushSheetBtn').style.display = 'none';
  }
  
  function showAILoading(msg) {
    var t = document.getElementById('resultTitle');
    document.getElementById('aiResult').style.display = 'block';
    t.textContent = '⏳ ' + msg;
    document.getElementById('aiCode').textContent = '';
    document.getElementById('aiValidation').innerHTML = '<div class="loader" style="margin:16px auto"></div>';
  }
  
  function hideAILoading() {
    document.getElementById('resultTitle').textContent = document.getElementById('resultTitle').textContent.replace('⏳ ','');
  }
  
  function showAIError(e) {
    document.getElementById('aiResult').style.display = 'block';
    document.getElementById('resultTitle').textContent = '❌ Error!';
    document.getElementById('aiCode').textContent = e.message || 'Unknown error';
    document.getElementById('aiValidation').innerHTML = '<span class="warn">⚠️ Cek koneksi dan API key</span>';
    document.getElementById('aiCopyBtn').style.display = 'none';
    document.getElementById('aiDeployBtn').style.display = 'none';
    document.getElementById('aiPushSheetBtn').style.display = 'none';
    toast(e.message, 'error');
  }

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

  function updateAiBadge() {
    var cfg = GAS_API.getAiConfig();
    var provider = cfg._provider || 'gemini';
    var badge = document.getElementById('aiStatusBadge');
    badge.textContent = '✅ ' + provider.toUpperCase();
    badge.className = 'badge badge-success';
  }

  // ===== INIT =====
  async function initApp() {
    loadDashboard();
    loadSheetsDropdowns();
    loadSheets();
    updateAiBadge();
  }
});
