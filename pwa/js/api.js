/* Mobile PWA API Client */
const GAS_API = {
  _url: '', _connected: false,

  async init() {
    const d = JSON.parse(localStorage.getItem('gas_config') || '{}');
    if (d.url) this._url = d.url;
    return this._url;
  },

  setUrl(url) { this._url = url; const d = JSON.parse(localStorage.getItem('gas_config') || '{}'); d.url = url; localStorage.setItem('gas_config', JSON.stringify(d)); },
  getUrl() { return this._url; },
  getGeminiKey() { const d = JSON.parse(localStorage.getItem('gas_config') || '{}'); return d.geminiKey || ''; },
  setGeminiKey(key) { const d = JSON.parse(localStorage.getItem('gas_config') || '{}'); d.geminiKey = key; localStorage.setItem('gas_config', JSON.stringify(d)); },

  async _call(action, params = {}, method = 'POST') {
    if (!this._url) throw new Error('Web App URL belum diatur');
    const url = method === 'GET'
      ? `${this._url}?${new URLSearchParams({action,...params}).toString()}`
      : this._url;
    const opts = { method, headers: {'Content-Type':'application/x-www-form-urlencoded'} };
    if (method === 'POST') opts.body = new URLSearchParams({action,...params}).toString();
    const r = await fetch(url, opts);
    const t = await r.text();
    try { return JSON.parse(t); } catch { throw new Error('Respon tidak valid: ' + t.substring(0,100)); }
  },

  async testConnection() { const r = await this._call('info',{},'GET'); this._connected = true; return r; },
  isConnected() { return this._connected; },

  getAllData(sheet, opts) { return this._call('getAll',{sheet,...opts},'GET'); },
  getRow(sheet, id) { return this._call('getRow',{sheet,id},'GET'); },
  addRow(sheet, data) { return this._call('addRow',{sheet,data:JSON.stringify(data)}); },
  updateRow(sheet, id, data) { return this._call('updateRow',{sheet,id,data:JSON.stringify(data)}); },
  deleteRow(sheet, id) { return this._call('deleteRow',{sheet,id}); },
  searchData(sheet, query, opts) { return this._call('search',{sheet,query,...opts},'GET'); },
  listSheets() { return this._call('listSheets',{},'GET'); },
  createSheet(name, headers) { return this._call('createSheet',{name,headers:JSON.stringify(headers||[])}); },
  getStats(sheet) { return this._call('stats',{sheet},'GET'); },
};
