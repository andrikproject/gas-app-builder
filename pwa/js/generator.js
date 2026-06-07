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
      label: '⚙️ Custom (OpenAI-compatible)',
      fields: [
        { key: 'customUrl', label: 'API URL', placeholder: 'https://your-api.com/v1/chat/completions' },
        { key: 'customKey', label: 'API Key', placeholder: 'sk-...', secret: true },
        { key: 'customModel', label: 'Model', placeholder: 'custom-model' }
      ],
      
      async chat(config, messages, sysPrompt) {
        if (!config.customUrl) throw new Error('Custom URL belum diatur');
        var model = config.customModel || 'default';
        var msgs = [];
        if (sysPrompt) msgs.push({role:'system', content:sysPrompt});
        msgs.push({role:'user', content:messages.join('\n')});
        var headers = {'Content-Type':'application/json'};
        if (config.customKey) headers['Authorization'] = 'Bearer ' + config.customKey;
        var res = await fetch(config.customUrl, {
          method:'POST', headers:headers,
          body: JSON.stringify({model:model, messages:msgs, temperature:0.3, max_tokens:4096})
        });
        var data = await res.json();
        if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
        return data.choices[0].message.content;
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
