/* PWA - Multi-AI Provider Generator */
const AI_GEN = {
  // ===== PROVIDERS =====
  providers: {
    gemini: {
      label: '🤖 Google Gemini',
      fields: [
        { key: 'geminiKey', label: 'API Key', placeholder: 'AIzaSy...', secret: true }
      ],
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=',
      
      async chat(config, messages, sysPrompt) {
        if (!config.geminiKey) throw new Error('Gemini Key belum diatur');
        var contents = [];
        if (sysPrompt) {
          contents.push({role:'user', parts:[{text:sysPrompt}]});
          contents.push({role:'model', parts:[{text:'Siap.'}]});
        }
        contents.push({role:'user', parts:[{text:messages.join('\n')}]});
        var res = await fetch(this.url + config.geminiKey, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({contents: contents, generationConfig:{temperature:0.3, maxOutputTokens:4096}})
        });
        var data = await res.json();
        if (data.error) throw new Error(data.error.message);
        if (!data.candidates || !data.candidates.length) throw new Error('No response');
        return data.candidates[0].content.parts[0].text;
      },
      
      testKey(config) { return this.chat(config, ['Balas: OK saja'], null); }
    },
    
    openai: {
      label: '🟢 OpenAI (ChatGPT)',
      fields: [
        { key: 'openaiKey', label: 'API Key', placeholder: 'sk-...', secret: true },
        { key: 'openaiModel', label: 'Model', placeholder: 'gpt-4o-mini', default: 'gpt-4o-mini' },
        { key: 'openaiUrl', label: 'Base URL (opsional)', placeholder: 'https://api.openai.com/v1', default: 'https://api.openai.com/v1' }
      ],
      
      async chat(config, messages, sysPrompt) {
        if (!config.openaiKey) throw new Error('OpenAI Key belum diatur');
        var baseUrl = config.openaiUrl || 'https://api.openai.com/v1';
        var model = config.openaiModel || 'gpt-4o-mini';
        var msgs = [];
        if (sysPrompt) msgs.push({role:'system', content:sysPrompt});
        msgs.push({role:'user', content:messages.join('\n')});
        var res = await fetch(baseUrl + '/chat/completions', {
          method:'POST', headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + config.openaiKey},
          body: JSON.stringify({model:model, messages:msgs, temperature:0.3, max_tokens:4096})
        });
        var data = await res.json();
        if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
        return data.choices[0].message.content;
      },
      
      testKey(config) { return this.chat(config, ['Balas: OK'], null); }
    },
    
    ollama: {
      label: '🦙 Ollama (Local/VPS)',
      fields: [
        { key: 'ollamaUrl', label: 'Server URL', placeholder: 'http://192.168.1.100:11434' },
        { key: 'ollamaModel', label: 'Model', placeholder: 'llama3.2', default: 'llama3.2' }
      ],
      
      async chat(config, messages, sysPrompt) {
        if (!config.ollamaUrl) throw new Error('Ollama URL belum diatur');
        var url = config.ollamaUrl.replace(/\/+$/, '') + '/api/chat';
        var model = config.ollamaModel || 'llama3.2';
        var msgs = [];
        if (sysPrompt) msgs.push({role:'system', content:sysPrompt});
        msgs.push({role:'user', content:messages.join('\n')});
        var res = await fetch(url, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({model:model, messages:msgs, stream:false, options:{temperature:0.3}})
        });
        var data = await res.json();
        if (data.error) throw new Error(data.error);
        return data.message.content;
      },
      
      testKey(config) { return this.chat(config, ['Balas: OK'], null); }
    },
    
    custom: {
      label: '⚙️ Custom API (OpenAI-compatible)',
      fields: [
        { key: 'customUrl', label: 'API URL', placeholder: 'https://your-api.com/v1/chat/completions' },
        { key: 'customKey', label: 'API Key (kosongin kalo gak perlu)', placeholder: 'sk-...', secret: true },
        { key: 'customModel', label: 'Model', placeholder: 'gpt-4o-mini, llama3, dll' },
        { key: 'customHeader', label: 'Auth Header (opsional)', placeholder: 'Authorization', default: 'Authorization' }
      ],
      
      async chat(config, messages, sysPrompt) {
        if (!config.customUrl) throw new Error('Custom URL belum diatur');
        var url = config.customUrl;
        var model = config.customModel || '';
        var msgs = [];
        if (sysPrompt) msgs.push({role:'system', content:sysPrompt});
        msgs.push({role:'user', content:messages.join('\n')});
        var headers = {'Content-Type':'application/json'};
        if (config.customKey) {
          var headerName = config.customHeader || 'Authorization';
          headers[headerName] = config.customKey.startsWith('Bearer ') ? config.customKey : 'Bearer ' + config.customKey;
        }
        var body = {messages:msgs, temperature:0.3, max_tokens:4096};
        if (model) body.model = model;
        
        var res = await fetch(url, {method:'POST', headers:headers, body:JSON.stringify(body)});
        var data = await res.json();
        if (data.error) throw new Error(typeof data.error === 'string' ? data.error : 
          data.error.message || JSON.stringify(data.error));
        
        // Coba berbagai format response
        var text = '';
        if (data.choices && data.choices[0]) {
          text = data.choices[0].message?.content || data.choices[0].text || '';
        } else if (data.candidates && data.candidates[0]) {
          text = data.candidates[0].content?.parts?.[0]?.text || data.candidates[0].output || '';
        } else if (data.response) {
          text = typeof data.response === 'string' ? data.response : data.response.text || '';
        } else if (data.content) {
          text = typeof data.content === 'string' ? data.content : '';
        } else if (data.text) {
          text = data.text;
        } else if (data.message) {
          text = data.message.content || data.message.text || '';
        } else if (data.output) {
          text = typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
        }
        
        if (!text) throw new Error('Gagal parse response API: ' + JSON.stringify(data).slice(0,200));
        return text;
      },
      
      testKey(config) { return this.chat(config, ['Balas: OK'], null); }
    }
  },
  
  // ===== SYSTEM PROMPTS =====
  SCRIPT_PROMPT: 'Kamu adalah asisten AI ahli Google Apps Script (GAS).\nTUGAS: Buat kode GAS sesuai permintaan user.\nATURAN:\n1. HANYA kode, tanpa penjelasan\n2. Komentar // untuk penjelasan\n3. Siap copy-paste\n4. Sertakan doGet/doPost jika perlu Web App\n5. LANGSUNG kode siap pakai',
  
  SHEET_PROMPT: 'Kamu buat data JSON untuk Google Sheets.\nFORMAT: [{"kolom1":"value1","kolom2":"value2"},...]\nMinimal 5 baris data sample, realistis, bahasa Indonesia.\nHANYA JSON array, tanpa markdown.',
  
  // ===== GENERATE =====
  async generate(type, prompt, config) {
    if (!prompt || !prompt.trim()) throw new Error('Masukkan prompt');
    var provider = AI_GEN.providers[config._provider || 'gemini'];
    if (!provider) throw new Error('Provider tidak dikenal');
    
    var sysPrompt = type === 'sheet' ? this.SHEET_PROMPT : this.SCRIPT_PROMPT;
    var userMsg = type === 'sheet'
      ? 'Buat data spreadsheet untuk: ' + prompt
      : 'Buat Google Apps Script untuk: ' + prompt;
    
    var text = await provider.chat(config, [userMsg], sysPrompt);
    
    if (type === 'script') {
      text = text.replace(/```[a-z]*\n?/g, '').trim();
      return {type:'script', code:text, length:text.length};
    } else {
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      var data = JSON.parse(text);
      return {type:'sheet', data:data, headers:Object.keys(data[0]||{}), rows:data.length};
    }
  },
  
  // ===== TEST CONNECTION =====
  async test(config) {
    var provider = AI_GEN.providers[config._provider || 'gemini'];
    if (!provider) throw new Error('Provider tidak dikenal');
    await provider.testKey(config);
    return true;
  },
  
  // ===== GET PROVIDER LIST =====
  getProviderList() {
    var list = [];
    for (var key in this.providers) {
      list.push({id:key, label:this.providers[key].label});
    }
    return list;
  },
  
  // ===== GET FIELDS FOR PROVIDER =====
  getFields(providerId) {
    var p = this.providers[providerId];
    return p ? p.fields || [] : [];
  }
};
