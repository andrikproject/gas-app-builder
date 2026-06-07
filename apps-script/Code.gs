/**
 * GAS App Builder - Google Apps Script Backend
 * 
 * Cara Pakai:
 * 1. Buka Google Sheets → Extensions → Apps Script
 * 2. Hapus kode lama, paste kode ini
 * 3. Di editor, buka Project Settings → centang "Show appsscript.json"
 * 4. Ganti isi appsscript.json dengan file yang sama
 * 5. Deploy → New deployment → Web app
 * 6. Copy URL → paste di PWA Settings
 * 
 * ⚠️ PENTING:
 * - Wajib pake V8 runtime (Project Settings → Runtime → V8)
 * - Deploy sebagai "Anyone" biar PWA bisa akses
 * - Web App URL yang BENAR
 * 
 * Endpoint API:
 * - GET    ?action=getAll&sheet=NamaSheet
 * - GET    ?action=getRow&sheet=NamaSheet&id=1
 * - POST   action=addRow&sheet=NamaSheet&data=...
 * - POST   action=updateRow&sheet=NamaSheet&id=1&data=...
 * - POST   action=deleteRow&sheet=NamaSheet&id=1
 * - POST   action=search&sheet=NamaSheet&query=...
 * - GET    ?action=createSheet&name=NamaSheet
 * - GET    ?action=listSheets
 * - GET    ?action=info
 * - GET    ?action=stats&sheet=NamaSheet
 * - POST   action=generateScript&prompt=...&geminiKey=...
 * - POST   action=testGeminiKey&geminiKey=...
 * - POST   action=generateSheet&prompt=...&geminiKey=...&name=...
 */

const SCRIPT_VERSION = '1.0.0';

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
    var params;
    if (method === 'GET') {
      params = e.parameter;
    } else {
      var content = e.postData.contents;
      // Handle both JSON form-urlencoded and regular JSON
      if (content.trim().charAt(0) === '{') {
        params = JSON.parse(content);
      } else {
        params = {};
        var pairs = content.split('&');
        for (var i = 0; i < pairs.length; i++) {
          var pair = pairs[i].split('=');
          var key = decodeURIComponent(pair[0]);
          var val = pair.length > 1 ? decodeURIComponent(pair[1]) : '';
          params[key] = val;
        }
        // Handle JSON data inside form field
        if (params.data && typeof params.data === 'string' && params.data.charAt(0) === '{') {
          try { params.data = JSON.parse(params.data); } catch(e) {}
        }
      }
    }
    
    var action = params.action || 'info';
    
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
      case 'generateSheet':  return sendJSON(generateSheetFromAI(params));
      
      default:            return sendJSON({error: 'Unknown action: ' + action}, 400);
    }
  } catch(err) {
    return sendJSON({error: err.message, stack: err.stack}, 500);
  }
}

// ========== DATA OPERATIONS ==========

function getAllData(params) {
  var sheet = getSheet(params.sheet || 'Sheet1');
  var data = sheet.getDataRange().getValues();
  
  if (data.length === 0) return {data: [], total: 0, sheet: params.sheet};
  
  var headers = data[0];
  var rows = [];
  for (var idx = 0; idx < data.length - 1; idx++) {
    var obj = {id: idx + 1};
    var row = data[idx + 1];
    for (var i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i] !== undefined ? row[i] : '';
    }
    rows.push(obj);
  }
  
  // Filtering
  if (params.filter && params.value) {
    var filtered = rows.filter(function(r) {
      return String(r[params.filter]).toLowerCase().indexOf(String(params.value).toLowerCase()) !== -1;
    });
    return {data: filtered, total: filtered.length, sheet: params.sheet};
  }
  
  // Pagination
  if (params.limit) {
    var limit = parseInt(params.limit) || 10;
    var offset = parseInt(params.offset) || 0;
    return {data: rows.slice(offset, offset + limit), total: rows.length, sheet: params.sheet};
  }
  
  return {data: rows, total: rows.length, sheet: params.sheet};
}

function getRowData(params) {
  var sheet = getSheet(params.sheet || 'Sheet1');
  var id = parseInt(params.id);
  if (isNaN(id) || id < 1) throw new Error('Invalid ID');
  
  var data = sheet.getDataRange().getValues();
  if (data.length === 0 || id >= data.length) throw new Error('Row not found');
  
  var headers = data[0];
  var row = data[id];
  var obj = {id: id};
  for (var i = 0; i < headers.length; i++) {
    obj[headers[i]] = row[i] !== undefined ? row[i] : '';
  }
  
  return {data: obj, sheet: params.sheet};
}

function addRowData(params) {
  var sheet = getSheet(params.sheet || 'Sheet1');
  var inputData = params.data || params;
  delete inputData.action;
  delete inputData.sheet;
  
  var allKeys = Object.keys(inputData);
  if (allKeys.length === 0) throw new Error('No data provided');
  
  // Get headers
  var existingData = sheet.getDataRange().getValues();
  var headers = existingData.length > 0 ? existingData[0] : [];
  
  if (headers.length === 0) {
    // New sheet - add headers
    headers = allKeys;
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  }
  
  // Create row
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    row.push(inputData[headers[i]] !== undefined ? inputData[headers[i]] : '');
  }
  sheet.appendRow(row);
  
  return {success: true, message: 'Row added', sheet: params.sheet};
}

function updateRowData(params) {
  var sheet = getSheet(params.sheet || 'Sheet1');
  var id = parseInt(params.id);
  if (isNaN(id) || id < 1) throw new Error('Invalid ID');
  
  var inputData = params.data || params;
  delete inputData.action;
  delete inputData.sheet;
  delete inputData.id;
  
  var allKeys = Object.keys(inputData);
  if (allKeys.length === 0) throw new Error('No data provided');
  
  var data = sheet.getDataRange().getValues();
  if (data.length === 0 || id >= data.length) throw new Error('Row not found');
  
  var headers = data[0];
  var rowNum = id + 1; // 1-based + header row
  
  for (var i = 0; i < headers.length; i++) {
    if (inputData[headers[i]] !== undefined) {
      sheet.getRange(rowNum, i + 1).setValue(inputData[headers[i]]);
    }
  }
  
  return {success: true, message: 'Row ' + id + ' updated', sheet: params.sheet};
}

function deleteRowData(params) {
  var sheet = getSheet(params.sheet || 'Sheet1');
  var id = parseInt(params.id);
  if (isNaN(id) || id < 1) throw new Error('Invalid ID');
  
  var rowNum = id + 1; // 1-based + header row
  sheet.deleteRow(rowNum);
  
  return {success: true, message: 'Row ' + id + ' deleted', sheet: params.sheet};
}

function searchData(params) {
  var sheet = getSheet(params.sheet || 'Sheet1');
  var query = String(params.query || '').toLowerCase();
  var limit = parseInt(params.limit) || 50;
  
  if (!query) return getAllData({sheet: params.sheet, limit: limit});
  
  var data = sheet.getDataRange().getValues();
  if (data.length === 0) return {data: [], total: 0, sheet: params.sheet};
  
  var headers = data[0];
  var rows = [];
  for (var idx = 0; idx < data.length - 1; idx++) {
    var obj = {id: idx + 1};
    var row = data[idx + 1];
    for (var i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i] !== undefined ? row[i] : '';
    }
    rows.push(obj);
  }
  
  var column = params.column ? String(params.column).toLowerCase() : null;
  var results = [];
  for (var r = 0; r < rows.length; r++) {
    var match = false;
    if (column) {
      match = String(rows[r][column] || '').toLowerCase().indexOf(query) !== -1;
    } else {
      var vals = Object.values(rows[r]);
      for (var v = 0; v < vals.length; v++) {
        if (String(vals[v]).toLowerCase().indexOf(query) !== -1) {
          match = true;
          break;
        }
      }
    }
    if (match) results.push(rows[r]);
    if (results.length >= limit) break;
  }
  
  return {data: results, total: results.length, query: query, sheet: params.sheet};
}

// ========== SHEET OPERATIONS ==========

function listSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetsArr = ss.getSheets();
  var sheets = [];
  for (var i = 0; i < sheetsArr.length; i++) {
    sheets.push({
      name: sheetsArr[i].getName(),
      rows: sheetsArr[i].getLastRow(),
      cols: sheetsArr[i].getLastColumn()
    });
  }
  return {sheets: sheets, total: sheets.length};
}

function createNewSheet(params) {
  var name = params.name || params.sheet;
  if (!name) throw new Error('Sheet name required');
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var existing = ss.getSheetByName(name);
  if (existing) throw new Error('Sheet "' + name + '" already exists');
  
  var sheet = ss.insertSheet(name);
  
  // Add default headers
  if (params.headers) {
    var headers = Array.isArray(params.headers) ? params.headers : [params.headers];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  
  return {success: true, message: 'Sheet "' + name + '" created', sheet: name};
}

function getSheetStats(params) {
  var sheet = getSheet(params.sheet || 'Sheet1');
  var data = sheet.getDataRange().getValues();
  
  if (data.length < 2) return {total: 0, columns: 0, sheet: params.sheet};
  
  var headers = data[0];
  var rows = data.slice(1);
  
  // Column stats
  var colStats = [];
  for (var i = 0; i < headers.length; i++) {
    var vals = [];
    for (var r = 0; r < rows.length; r++) {
      if (rows[r][i] !== '') vals.push(rows[r][i]);
    }
    var unique = {};
    for (var v = 0; v < vals.length; v++) {
      unique[String(vals[v]).toLowerCase()] = true;
    }
    colStats.push({
      name: headers[i],
      total: vals.length,
      unique: Object.keys(unique).length
    });
  }
  
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
  var sheet = getSheet(params.sheet || 'Sheet1');
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return {success: true, message: 'Sheet already empty'};
  
  sheet.getRange(2, 1, data.length - 1, data[0].length).clearContent();
  return {success: true, message: (data.length - 1) + ' rows cleared'};
}

function bulkAddData(params) {
  var sheet = getSheet(params.sheet || 'Sheet1');
  var rowsArr = params.rows || [];
  
  if (!Array.isArray(rowsArr) || rowsArr.length === 0) throw new Error('No rows provided');
  
  var existingData = sheet.getDataRange().getValues();
  var headers = existingData.length > 0 ? existingData[0] : [];
  
  for (var r = 0; r < rowsArr.length; r++) {
    var rowData = rowsArr[r];
    var row = [];
    for (var i = 0; i < headers.length; i++) {
      row.push(rowData[headers[i]] !== undefined ? rowData[headers[i]] : '');
    }
    sheet.appendRow(row);
  }
  
  return {success: true, message: rowsArr.length + ' rows added', sheet: params.sheet};
}

// ========== INFO ==========

function getInfo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetsArr = ss.getSheets();
  var sheets = [];
  for (var i = 0; i < sheetsArr.length; i++) {
    sheets.push({
      name: sheetsArr[i].getName(),
      rows: sheetsArr[i].getLastRow(),
      cols: sheetsArr[i].getLastColumn()
    });
  }
  
  return {
    name: ss.getName(),
    id: ss.getId(),
    url: ss.getUrl(),
    sheets: sheets,
    version: SCRIPT_VERSION,
    time: new Date().toISOString()
  };
}

// ========== HELPERS ==========

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name || 'Sheet1');
  if (!sheet) {
    var names = ss.getSheets().map(function(s) { return s.getName(); });
    throw new Error('Sheet "' + name + '" not found. Available: ' + names.join(', '));
  }
  return sheet;
}

function sendJSON(data, statusCode) {
  statusCode = statusCode || 200;
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ========== AI INTEGRATION ==========

function callGemini(apiKey, prompt, systemPrompt, options) {
  options = options || {};
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + (options.model || 'gemini-2.0-flash') + ':generateContent?key=' + apiKey;
  
  var contents = [];
  if (systemPrompt) {
    contents.push({role: 'user', parts: [{text: systemPrompt}]});
    contents.push({role: 'model', parts: [{text: 'Siap.'}]});
  }
  contents.push({role: 'user', parts: [{text: prompt}]});
  
  var payload = {
    contents: contents,
    generationConfig: {
      temperature: options.temperature || 0.3,
      maxOutputTokens: options.maxTokens || 4096
    }
  };
  
  var fetchOptions = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  var response = UrlFetchApp.fetch(url, fetchOptions);
  var result = JSON.parse(response.getContentText());
  
  if (result.error) throw new Error(result.error.message);
  if (!result.candidates || result.candidates.length === 0) throw new Error('No response from Gemini');
  
  return result.candidates[0].content.parts[0].text;
}

function generateScript(params) {
  var prompt = params.prompt || params.text;
  var apiKey = params.geminiKey || params.apiKey;
  
  if (!prompt) throw new Error('Prompt diperlukan');
  if (!apiKey) throw new Error('Gemini API Key diperlukan');
  
  var systemPrompt = 'Kamu adalah asisten AI yang ahli dalam Google Apps Script (GAS).\n\n' +
    'TUGAS KAMU: Buatkan Google Apps Script code berdasarkan permintaan user.\n\n' +
    'ATURAN:\n' +
    '1. HASILKAN HANYA KODE - tanpa penjelasan\n' +
    '2. Gunakan komentar // untuk penjelasan singkat\n' +
    '3. Pastikan kode SIAP PAKAI (copy-paste ke Apps Script editor)\n' +
    '4. Sertakan doGet() dan doPost() jika perlu Web App\n' +
    '5. JANGAN tambahkan teks seperti "Ini dia kodenya"\n' +
    '6. LANGSUNG berikan kode yang siap pakai';
  
  var text = callGemini(apiKey, 'Buatkan Google Apps Script untuk: ' + prompt, systemPrompt);
  
  var cleanCode = text.replace(/```javascript\n?/g, '').replace(/```\n?/g, '').trim();
  
  return {
    success: true,
    code: cleanCode,
    model: 'gemini-2.0-flash',
    length: cleanCode.length
  };
}

function testGeminiKey(params) {
  var apiKey = params.geminiKey || params.apiKey;
  if (!apiKey) throw new Error('Gemini API Key diperlukan');
  
  callGemini(apiKey, 'Halo, balas: "OK" saja', null, {maxTokens: 10});
  
  return {
    success: true,
    message: 'API Key valid!',
    model: 'gemini-2.0-flash'
  };
}

// ========== GENERATE SHEET FROM AI ==========

var SHEET_AI_PROMPT = 'Kamu adalah AI yang membuat data sample untuk Google Sheets.\n\n' +
  'TUGAS: Buat data JSON untuk spreadsheet berdasarkan deskripsi user.\n\n' +
  'ATURAN:\n' +
  '1. HASILKAN HANYA JSON ARRAY - tanpa penjelasan\n' +
  '2. Format: [{"kolom1":"value1","kolom2":"value2"}, ...]\n' +
  '3. Minimal 5 baris data sample\n' +
  '4. Gunakan bahasa Indonesia untuk value\n' +
  '5. Value yang relevan dan realistis\n' +
  '6. Setiap object harus punya KEY yang SAMA semua\n' +
  '7. JANGAN tambahkan markdown atau teks lain';

function generateSheetFromAI(params) {
  var prompt = params.prompt;
  var apiKey = params.geminiKey || params.apiKey;
  var sheetName = params.name || ('AI_Sheet_' + new Date().toISOString().slice(0,10));
  
  if (!prompt) throw new Error('Prompt diperlukan');
  if (!apiKey) throw new Error('Gemini API Key diperlukan');
  
  var text = callGemini(apiKey, 'Buat data spreadsheet untuk: ' + prompt, SHEET_AI_PROMPT, {temperature: 0.7});
  
  // Bersihkan markdown JSON
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  var data;
  try {
    data = JSON.parse(text);
  } catch(e) {
    throw new Error('Gagal parse JSON dari Gemini: ' + text.substring(0,100));
  }
  
  if (!Array.isArray(data) || data.length === 0) throw new Error('Data harus berupa array');
  
  // Buat sheet baru
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet;
  
  var existing = ss.getSheetByName(sheetName);
  if (existing) {
    existing.clear();
    sheet = existing;
  } else {
    sheet = ss.insertSheet(sheetName);
  }
  
  // Extract headers dari keys
  var headers = Object.keys(data[0]);
  
  // Tulis headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  
  // Tulis data
  var rows = [];
  for (var r = 0; r < data.length; r++) {
    var row = [];
    for (var h = 0; h < headers.length; h++) {
      row.push(data[r][headers[h]] !== undefined ? data[r][headers[h]] : '');
    }
    rows.push(row);
  }
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    for (var i = 0; i < headers.length; i++) {
      sheet.autoResizeColumn(i + 1);
    }
  }
  
  return {
    success: true,
    sheet: sheetName,
    rows: data.length,
    columns: headers.length,
    headers: headers,
    url: ss.getUrl()
  };
}

// ========== TEST FUNCTION (run in editor) ==========

function testConnection() {
  Logger.log('=== GAS App Builder Test ===');
  Logger.log('Spreadsheet: ' + SpreadsheetApp.getActiveSpreadsheet().getName());
  Logger.log('Sheets: ' + SpreadsheetApp.getActiveSpreadsheet().getSheets().length);
  Logger.log('Version: ' + SCRIPT_VERSION);
  Logger.log('Runtime: V8');
  Logger.log('============================');
  return {success: true, message: 'Test OK', version: SCRIPT_VERSION};
}
