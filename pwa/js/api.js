/* Mobile PWA - API Client with Multi-AI Provider */
const GAS_API = {
  getUrl() { const d = JSON.parse(localStorage.getItem('gas_config') || '{}'); return d.url || ''; },
  setUrl(url) { const d = JSON.parse(localStorage.getItem('gas_config') || '{}'); d.url = url; localStorage.setItem('gas_config', JSON.stringify(d)); },
  
  getProvider() { const d = JSON.parse(localStorage.getItem('gas_config') || '{}'); return d.provider || 'gemini'; },
  setProvider(p) { const d = JSON.parse(localStorage.getItem('gas_config') || '{}'); d.provider = p; localStorage.setItem('gas_config', JSON.stringify(d)); },
  
  getAiConfig() { const d = JSON.parse(localStorage.getItem('gas_config') || '{}'); return d.aiConfig || {}; },
  setAiConfig(cfg) { 
    const d = JSON.parse(localStorage.getItem('gas_config') || '{}'); 
    d.aiConfig = cfg; 
    localStorage.setItem('gas_config', JSON.stringify(d)); 
  },
  
  // Legacy Gemini helpers
  getGeminiKey() { const c = this.getAiConfig(); return c.geminiKey || ''; },
  setGeminiKey(key) { 
    const c = this.getAiConfig(); 
    c.geminiKey = key; 
    this.setAiConfig(c); 
  },
  
  async call(method, params) {
    const url = this.getUrl();
    if (!url) throw new Error('Web App URL belum diatur');
    const res = await fetch(url + (method === 'GET' ? '?' + new URLSearchParams(params) : ''), {
      method,
      headers: method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {},
      body: method === 'POST' ? new URLSearchParams(params) : undefined
    });
    return res.json();
  }
};
