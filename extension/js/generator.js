/**
 * GAS App Builder - AI Script Generator
 * Menghasilkan Google Apps Script code menggunakan Gemini AI
 */

const AI_GENERATOR = {
  MODEL: 'gemini-2.0-flash',
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/',

  SYSTEM_PROMPT: `Kamu adalah asisten AI yang ahli dalam **Google Apps Script (GAS)** dan **Google Sheets API**.

TUGAS KAMU:
Buatkan Google Apps Script code berdasarkan permintaan user.

ATURAN:
1. HASILKAN HANYA KODE — tanpa penjelasan panjang lebar
2. Gunakan komentar (#) untuk penjelasan singkat
3. Pastikan kode SIAP PAKAI (copy-paste ke Apps Script editor)
4. Tambahkan fungsi doGet() dan doPost() jika perlu Web App
5. Gunakan SpreadsheetApp.getActiveSpreadsheet() secara default
6. Sertakan error handling dasar (try/catch)
7. Jika user minta fitur CRUD, gunakan pola yang sudah ada
8. Bahasa: Indonesia atau Inggris (ikuti bahasa user)

CONTOH OUTPUT:
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({status: "ok"}));
  .setMimeType(ContentService.MimeType.JSON);
}

function getData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  const data = sheet.getDataRange().getValues();
  return data;
}

JANGAN tambahkan teks seperti "Ini dia kodenya:" atau "Berikut script-nya:"
LANGSUNG berikan kode yang siap pakai.`,

  /**
   * Generate Apps Script code dari prompt user
   */
  async generate(prompt, apiKey) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY belum diatur. Buka ⚙️ Settings untuk mengatur.');
    }
    if (!prompt || !prompt.trim()) {
      throw new Error('Masukkan deskripsi script yang kamu mau!');
    }

    const url = `${this.API_URL}${this.MODEL}:generateContent?key=${apiKey}`;
    
    const userPrompt = `Buatkan Google Apps Script untuk: ${prompt.trim()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: this.SYSTEM_PROMPT }]
          },
          {
            role: 'model',
            parts: [{ text: 'Siap. Saya akan langsung memberikan kode Google Apps Script yang siap pakai. Berikan deskripsi script yang kamu butuhkan.' }]
          },
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
          topP: 0.95
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Gagal terhubung ke Gemini API');
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Tidak ada response dari Gemini. Coba lagi.');
    }

    const text = data.candidates[0].content.parts[0].text;
    return this._formatOutput(text);
  },

  /**
   * Generate dengan opsi spesifik (CRUD, Web App, etc)
   */
  async generateWithOptions(options, apiKey) {
    let prompt = options.purpose || '';

    if (options.sheetName) {
      prompt += `\nSheet name: ${options.sheetName}`;
    }
    if (options.headers && options.headers.length > 0) {
      prompt += `\nKolom/Headers: ${options.headers.join(', ')}`;
    }
    if (options.isWebApp) {
      prompt += `\nBuat sebagai Web App dengan doGet() dan doPost()`;
    }
    if (options.includeCrud) {
      prompt += `\nSertakan fungsi CRUD lengkap (create, read, update, delete)`;
    }
    if (options.extraFeatures) {
      prompt += `\nFitur tambahan: ${options.extraFeatures}`;
    }

    return this.generate(prompt, apiKey);
  },

  /**
   * Format output - extract code blocks
   */
  _formatOutput(text) {
    // Jika output sudah dalam format code block ```javascript ... ```
    if (text.includes('```')) {
      return text;
    }
    
    // Wrap in code block if not already
    return '```javascript\n' + text + '\n```';
  },

  /**
   * Validate script syntax (basic checks)
   */
  validateScript(script) {
    const issues = [];
    
    // Check for common issues
    if (script.includes('function doGet') && !script.includes('ContentService')) {
      issues.push('⚠️ doGet() ada tapi ContentService tidak ditemukan');
    }
    
    if (!script.includes('function') && !script.includes('const ') && !script.includes('var ')) {
      issues.push('⚠️ Script tidak mengandung fungsi — mungkin hanya komentar');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
};
