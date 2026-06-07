/**
 * GAS App Builder - Google Apps Script Backend
 * 
 * Cara Pakai:
 * 1. Buka Google Sheets → Extensions → Apps Script
 * 2. Paste kode ini
 * 3. Deploy → New deployment → Web app
 * 4. Copy URL Web App → paste di Chrome Extension
 * 
 * Endpoint API:
 * - GET    ?action=getAll&sheet=NamaSheet
 * - GET    ?action=getRow&sheet=NamaSheet&id=1
 * - POST   {action:"addRow", sheet:"NamaSheet", data:{...}}
 * - POST   {action:"updateRow", sheet:"NamaSheet", id:1, data:{...}}
 * - POST   {action:"deleteRow", sheet:"NamaSheet", id:1}
 * - POST   {action:"search", sheet:"NamaSheet", query:"...", column:"...", limit:10}
 * - GET    ?action=createSheet&name=NamaSheet
 * - GET    ?action=listSheets
 * - GET    ?action=info
 * - GET    ?action=stats&sheet=NamaSheet
 * - POST   {action:"generateScript", prompt:"...", geminiKey:"..."}
 * - POST   {action:"testGeminiKey", geminiKey:"..."}
 */

const SCRIPT_VERSION = "1.0.0";

// ========== WEB APP ENTRY POINTS ==========

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

// ========== MAIN REQUEST HANDLER ==========

function handleRequest(e, method) {
  try {
    const params = method === 'GET' ? e.parameter : JSON.parse(e.postData.contents);
    const action = params.action || 'info';
    
    switch(action) {
      // === DATA OPERATIONS ===
      case 'getAll':      return sendJSON(getAllData(params));
      case 'getRow':      return sendJSON(getRowData(params));
      case 'addRow':      return sendJSON(addRowData(params));
      case 'updateRow':   return sendJSON(updateRowData(params));
      case 'deleteRow':   return sendJSON(deleteRowData(params));
      case 'search':      return sendJSON(searchData(params));
      
      // === SHEET OPERATIONS ===
      case 'listSheets':  return sendJSON(listSheets());
      case 'createSheet': return sendJSON(createNewSheet(params));
      case 'info':        return sendJSON(getInfo());
      case 'stats':       return sendJSON(getSheetStats(params));
      
      // === ADMIN ===
      case 'bulkAdd':     return sendJSON(bulkAddData(params));
      case 'clearSheet':  return sendJSON(clearSheetData(params));
      
      // === AI ===
      case 'generateScript': return sendJSON(generateScript(params));
      case 'testGeminiKey':  return sendJSON(testGeminiKey(params));
      
      default:            return sendJSON({error: `Unknown action: ${action}`}, 400);
    }
  } catch(err) {
    return sendJSON({error: err.message, stack: err.stack}, 500);
  }
}

// ========== DATA OPERATIONS ==========

function getAllData(params) {
  const sheet = getSheet(params.sheet || 'Sheet1');
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) return {data: [], total: 0, sheet: params.sheet};
  
  const headers = data[0];
  const rows = data.slice(1).map((row, idx) => {
    const obj = {id: idx + 1}; // 1-based ID
    headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
    return obj;
  });
  
  // Filtering
  if (params.filter && params.value) {
    const filtered = rows.filter(r => 
      String(r[params.filter]).toLowerCase().includes(String(params.value).toLowerCase())
    );
    return {data: filtered, total: filtered.length, sheet: params.sheet};
  }
  
  // Pagination
  if (params.limit) {
    const limit = parseInt(params.limit) || 10;
    const offset = parseInt(params.offset) || 0;
    return {data: rows.slice(offset, offset + limit), total: rows.length, sheet: params.sheet};
  }
  
  return {data: rows, total: rows.length, sheet: params.sheet};
}

function getRowData(params) {
  const sheet = getSheet(params.sheet || 'Sheet1');
  const id = parseInt(params.id);
  if (isNaN(id) || id < 1) throw new Error('Invalid ID');
  
  const data = sheet.getDataRange().getValues();
  if (data.length === 0 || id >= data.length) throw new Error('Row not found');
  
  const headers = data[0];
  const row = data[id]; // id is 1-based, data[0] is headers
  const obj = {id};
  headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
  
  return {data: obj, sheet: params.sheet};
}

function addRowData(params) {
  const sheet = getSheet(params.sheet || 'Sheet1');
  const inputData = params.data || params;
  
  if (!inputData || Object.keys(inputData).length === 0) throw new Error('No data provided');
  
  // Get headers
  const headers = sheet.getDataRange().getValues()[0] || [];
  
  // Create row
  const row = headers.map(h => inputData[h] !== undefined ? inputData[h] : '');
  sheet.appendRow(row);
  
  return {success: true, message: 'Row added', row: row, sheet: params.sheet};
}

function updateRowData(params) {
  const sheet = getSheet(params.sheet || 'Sheet1');
  const id = parseInt(params.id);
  if (isNaN(id) || id < 1) throw new Error('Invalid ID');
  
  const inputData = params.data || {};
  if (!inputData || Object.keys(inputData).length === 0) throw new Error('No data provided');
  
  const data = sheet.getDataRange().getValues();
  if (data.length === 0 || id >= data.length) throw new Error('Row not found');
  
  const headers = data[0];
  const rowNum = id + 1; // 1-based + header row
  
  headers.forEach((h, idx) => {
    if (inputData[h] !== undefined) {
      sheet.getRange(rowNum, idx + 1).setValue(inputData[h]);
    }
  });
  
  return {success: true, message: `Row ${id} updated`, sheet: params.sheet};
}

function deleteRowData(params) {
  const sheet = getSheet(params.sheet || 'Sheet1');
  const id = parseInt(params.id);
  if (isNaN(id) || id < 1) throw new Error('Invalid ID');
  
  const rowNum = id + 1; // 1-based + header row
  sheet.deleteRow(rowNum);
  
  return {success: true, message: `Row ${id} deleted`, sheet: params.sheet};
}

function searchData(params) {
  const sheet = getSheet(params.sheet || 'Sheet1');
  const query = String(params.query || '').toLowerCase();
  const limit = parseInt(params.limit) || 50;
  
  if (!query) return getAllData({...params, limit});
  
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return {data: [], total: 0, sheet: params.sheet};
  
  const headers = data[0];
  const rows = data.slice(1).map((row, idx) => {
    const obj = {id: idx + 1};
    headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
    return obj;
  });
  
  const column = params.column ? String(params.column).toLowerCase() : null;
  const results = rows.filter(r => {
    if (column) {
      return String(r[column] || '').toLowerCase().includes(query);
    }
    return Object.values(r).some(v => String(v).toLowerCase().includes(query));
  }).slice(0, limit);
  
  return {data: results, total: results.length, query, sheet: params.sheet};
}

// ========== SHEET OPERATIONS ==========

function listSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets().map(s => ({
    name: s.getName(),
    rows: s.getLastRow(),
    cols: s.getLastColumn()
  }));
  return {sheets, total: sheets.length};
}

function createNewSheet(params) {
  const name = params.name || params.sheet;
  if (!name) throw new Error('Sheet name required');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const existing = ss.getSheetByName(name);
  if (existing) throw new Error(`Sheet "${name}" already exists`);
  
  const sheet = ss.insertSheet(name);
  
  // Add default headers
  if (params.headers) {
    const headers = Array.isArray(params.headers) ? params.headers : [params.headers];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  
  return {success: true, message: `Sheet "${name}" created`, sheet: name};
}

function getSheetStats(params) {
  const sheet = getSheet(params.sheet || 'Sheet1');
  const data = sheet.getDataRange().getValues();
  
  if (data.length < 2) return {total: 0, columns: 0, sheet: params.sheet};
  
  const headers = data[0];
  const rows = data.slice(1);
  
  // Column stats
  const colStats = headers.map((h, i) => {
    const values = rows.map(r => r[i]).filter(v => v !== '');
    const unique = new Set(values.map(v => String(v).toLowerCase()));
    return {name: h, total: values.length, unique: unique.size};
  });
  
  return {
    sheet: params.sheet,
    total: rows.length,
    columns: headers.length,
    headers: headers,
    colStats: colStats,
    lastUpdated: new Date().toISOString()
  };
}

function clearSheetData(params) {
  const sheet = getSheet(params.sheet);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return {success: true, message: 'Sheet already empty'};
  
  sheet.getRange(2, 1, data.length - 1, data[0].length).clearContent();
  return {success: true, message: `${data.length - 1} rows cleared`};
}

function bulkAddData(params) {
  const sheet = getSheet(params.sheet || 'Sheet1');
  const rows = params.rows || [];
  
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('No rows provided');
  
  const headers = sheet.getDataRange().getValues()[0] || [];
  
  rows.forEach(rowData => {
    const row = headers.map(h => rowData[h] !== undefined ? rowData[h] : '');
    sheet.appendRow(row);
  });
  
  return {success: true, message: `${rows.length} rows added`, sheet: params.sheet};
}

// ========== INFO ==========

function getInfo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets().map(s => ({
    name: s.getName(),
    rows: s.getLastRow(),
    cols: s.getLastColumn()
  }));
  
  return {
    name: ss.getName(),
    id: ss.getId(),
    url: ss.getUrl(),
    sheets,
    version: SCRIPT_VERSION,
    time: new Date().toISOString()
  };
}

// ========== HELPERS ==========

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name || 'Sheet1');
  if (!sheet) throw new Error(`Sheet "${name}" not found. Available: ${ss.getSheets().map(s => s.getName()).join(', ')}`);
  return sheet;
}

function sendJSON(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  
  if (statusCode >= 400) {
    output.setContent(JSON.stringify(data, null, 2));
  }
  
  return output;
}

// ========== AI INTEGRATION ==========

const AI_SYSTEM_PROMPT = `Kamu adalah asisten AI yang ahli dalam Google Apps Script (GAS).

TUGAS KAMU:
Buatkan Google Apps Script code berdasarkan permintaan user.

ATURAN:
1. HASILKAN HANYA KODE - tanpa penjelasan
2. Gunakan komentar (//) untuk penjelasan singkat
3. Pastikan kode SIAP PAKAI (copy-paste ke Apps Script editor)
4. Tambahkan fungsi doGet() dan doPost() jika perlu Web App
5. JANGAN tambahkan teks seperti "Ini dia kodenya"
6. LANGSUNG berikan kode yang siap pakai`;

function generateScript(params) {
  const prompt = params.prompt || params.text;
  const apiKey = params.geminiKey || params.apiKey;
  
  if (!prompt) throw new Error('Prompt diperlukan');
  if (!apiKey) throw new Error('Gemini API Key diperlukan');
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [
      { role: "user", parts: [{ text: AI_SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Siap. Berikan deskripsi script yang kamu butuhkan." }] },
      { role: "user", parts: [{ text: `Buatkan Google Apps Script untuk: ${prompt}` }] }
    ],
    generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  
  if (result.error) throw new Error(result.error.message);
  if (!result.candidates || result.candidates.length === 0) throw new Error('No response from Gemini');
  
  const text = result.candidates[0].content.parts[0].text;
  const cleanCode = text.replace(/```javascript\n?/g, '').replace(/```\n?/g, '').trim();
  
  return {
    success: true,
    code: cleanCode,
    model: 'gemini-2.0-flash',
    length: cleanCode.length
  };
}

function testGeminiKey(params) {
  const apiKey = params.geminiKey || params.apiKey;
  if (!apiKey) throw new Error('Gemini API Key diperlukan');
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: 'Halo, balas: "OK" saja' }] }],
    generationConfig: { maxOutputTokens: 10 }
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  
  if (result.error) throw new Error(result.error.message);
  
  return {
    success: true,
    message: 'API Key valid!',
    model: 'gemini-2.0-flash'
  };
}

// ========== TEST FUNCTION (run in editor) ==========

function testConnection() {
  Logger.log('=== GAS App Builder Test ===');
  Logger.log('Spreadsheet: ' + SpreadsheetApp.getActiveSpreadsheet().getName());
  Logger.log('Sheets: ' + SpreadsheetApp.getActiveSpreadsheet().getSheets().length);
  Logger.log('Version: ' + SCRIPT_VERSION);
  Logger.log('=== Test Complete ===');
}
