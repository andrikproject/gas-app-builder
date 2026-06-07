/* Mobile PWA - AI Script Generator */
const AI_GENERATOR = {
  MODEL: 'gemini-2.0-flash',
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/',

  SYSTEM_PROMPT: `Kamu adalah asisten AI yang ahli di Google Apps Script (GAS).

TUGAS: Buat Google Apps Script code sesuai permintaan user.

ATURAN:
1. HANYA kode — tanpa penjelasan
2. Komentar // untuk penjelasan singkat
3. Siap copy-paste ke Apps Script editor
4. Sertakan doGet/doPost jika perlu Web App
5. Jangan tambah teks seperti "Ini dia kodenya"
6. LANGSUNG kode siap pakai`,

  async generate(prompt, apiKey) {
    if (!apiKey) throw new Error('Gemini API Key belum diatur');
    if (!prompt?.trim()) throw new Error('Masukkan deskripsi script');

    const url = `${this.API_URL}${this.MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: this.SYSTEM_PROMPT }] },
          { role: 'model', parts: [{ text: 'Siap. Berikan deskripsi script yang kamu butuhkan.' }] },
          { role: 'user', parts: [{ text: `Buat Google Apps Script untuk: ${prompt.trim()}` }] }
        ],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    if (!data.candidates?.length) throw new Error('Tidak ada response dari Gemini');
    return data.candidates[0].content.parts[0].text;
  },

  validateScript(code) {
    const issues = [];
    if (code.includes('function doGet') && !code.includes('ContentService')) issues.push('⚠️ doGet() tanpa ContentService');
    if (!code.includes('function') && !code.includes('const ') && !code.includes('var ') && !code.includes('let ')) issues.push('⚠️ Tidak ada fungsi aktif');
    return { valid: issues.length === 0, issues };
  }
};
