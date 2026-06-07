/**
 * GAS App Builder - API Layer
 * Menangani komunikasi dengan Google Apps Script Web App
 */

const GAS_API = {
  _url: '',
  _connected: false,

  setUrl(url) {
    this._url = url.replace(/\/+$/, '');
    chrome.storage.local.set({ gasWebAppUrl: this._url });
  },

  getUrl() {
    return this._url;
  },

  async init() {
    const data = await chrome.storage.local.get(['gasWebAppUrl']);
    if (data.gasWebAppUrl) {
      this._url = data.gasWebAppUrl;
    }
    return this._url;
  },

  /**
   * Kirim request ke GAS Web App
   */
  async _call(action, params = {}, method = 'POST') {
    if (!this._url) {
      throw new Error('Web App URL belum diatur. Klik ⚙️ untuk setting.');
    }

    const url = method === 'GET' 
      ? `${this._url}?${new URLSearchParams({ action, ...params }).toString()}`
      : this._url;

    const options = {
      method,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    };

    if (method === 'POST') {
      options.body = new URLSearchParams({ action, ...params }).toString();
    }

    const response = await fetch(url, options);
    const text = await response.text();
    
    // GAS returns JSON as text
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid response: ${text.substring(0, 100)}`);
    }
  },

  // ========== CONNECTION ==========

  async testConnection() {
    try {
      const result = await this._call('info', {}, 'GET');
      this._connected = true;
      return result;
    } catch(err) {
      this._connected = false;
      throw err;
    }
  },

  isConnected() { return this._connected; },

  // ========== DATA OPERATIONS ==========

  getAllData(sheet, options = {}) {
    return this._call('getAll', { sheet, ...options }, 'GET');
  },

  getRow(sheet, id) {
    return this._call('getRow', { sheet, id }, 'GET');
  },

  addRow(sheet, data) {
    return this._call('addRow', { sheet, data: JSON.stringify(data) });
  },

  updateRow(sheet, id, data) {
    return this._call('updateRow', { sheet, id, data: JSON.stringify(data) });
  },

  deleteRow(sheet, id) {
    return this._call('deleteRow', { sheet, id });
  },

  searchData(sheet, query, options = {}) {
    return this._call('search', { sheet, query, ...options }, 'GET');
  },

  // ========== SHEET OPERATIONS ==========

  listSheets() {
    return this._call('listSheets', {}, 'GET');
  },

  createSheet(name, headers = []) {
    return this._call('createSheet', { name, headers: JSON.stringify(headers) });
  },

  getStats(sheet) {
    return this._call('stats', { sheet }, 'GET');
  },

  // ========== BULK ==========

  bulkAdd(sheet, rows) {
    return this._call('bulkAdd', { sheet, rows: JSON.stringify(rows) });
  },

  clearSheet(sheet) {
    return this._call('clearSheet', { sheet });
  }
};
