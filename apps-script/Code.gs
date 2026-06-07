// GAS App Builder - MINIMAL BACKEND
// Copy paste ini ke Apps Script -> Deploy -> Web App

function doGet(e) {
  return handle(e, 'GET');
}

function doPost(e) {
  return handle(e, 'POST');
}

function handle(e, method) {
  try {
    var params = {};
    if (method === 'GET') {
      params = e.parameter;
    } else {
      var content = e.postData.contents;
      if (content.indexOf('{') === 0) {
        params = JSON.parse(content);
      } else {
        var pairs = content.split('&');
        for (var i = 0; i < pairs.length; i++) {
          var pair = pairs[i].split('=');
          params[decodeURIComponent(pair[0])] = pair.length > 1 ? decodeURIComponent(pair[1]) : '';
        }
      }
    }
    
    var a = params.action || 'info';
    
    if (a === 'getAll') return j(getAll(params));
    if (a === 'getRow') return j(getRow(params));
    if (a === 'addRow') return j(addRow(params));
    if (a === 'updateRow') return j(updateRow(params));
    if (a === 'deleteRow') return j(deleteRow(params));
    if (a === 'search') return j(search(params));
    if (a === 'listSheets') return j(listSheets());
    if (a === 'createSheet') return j(createSheet(params));
    if (a === 'info') return j(getInfo());
    if (a === 'stats') return j(getStats(params));
    if (a === 'generateScript') return j(genScript(params));
    if (a === 'testGeminiKey') return j(testKey(params));
    if (a === 'generateSheet') return j(genSheet(params));
    return j({error:'Unknown action: '+a}, 400);
  } catch(e) {
    return j({error: e.message}, 500);
  }
}

function j(data, code) {
  var out = ContentService.createTextOutput(JSON.stringify(data));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}

function gs(name) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name || 'Sheet1');
  if (!s) throw new Error('Sheet "'+name+'" not found');
  return s;
}

function getAll(p) {
  var s = gs(p.sheet);
  var d = s.getDataRange().getValues();
  if (!d.length) return {data:[], total:0};
  var h = d[0], rows = [];
  for (var i = 1; i < d.length; i++) {
    var o = {id: i};
    for (var c = 0; c < h.length; c++) o[h[c]] = d[i][c] || '';
    rows.push(o);
  }
  return {data: rows, total: rows.length};
}

function getRow(p) {
  var s = gs(p.sheet);
  var d = s.getDataRange().getValues();
  var id = parseInt(p.id);
  if (!id || id < 1 || id >= d.length) throw new Error('Invalid ID');
  var h = d[0], o = {id: id};
  for (var c = 0; c < h.length; c++) o[h[c]] = d[id][c] || '';
  return {data: o};
}

function addRow(p) {
  var s = gs(p.sheet);
  var d = s.getDataRange().getValues();
  var h = d.length ? d[0] : [];
  var input = p.data || p;
  delete input.action; delete input.sheet;
  var keys = Object.keys(input);
  if (!keys.length) throw new Error('No data');
  if (!h.length) {
    h = keys;
    s.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold');
  }
  var row = [];
  for (var i = 0; i < h.length; i++) row.push(input[h[i]] !== undefined ? input[h[i]] : '');
  s.appendRow(row);
  return {success: true, message: 'Row added'};
}

function updateRow(p) {
  var s = gs(p.sheet);
  var id = parseInt(p.id);
  if (!id || id < 1) throw new Error('Invalid ID');
  var d = s.getDataRange().getValues();
  if (id >= d.length) throw new Error('Row not found');
  var h = d[0];
  var input = p.data || p;
  delete input.action; delete input.sheet; delete input.id;
  for (var i = 0; i < h.length; i++) {
    if (input[h[i]] !== undefined) s.getRange(id+1, i+1).setValue(input[h[i]]);
  }
  return {success: true, message: 'Row '+id+' updated'};
}

function deleteRow(p) {
  var s = gs(p.sheet);
  var id = parseInt(p.id);
  if (!id || id < 1) throw new Error('Invalid ID');
  s.deleteRow(id + 1);
  return {success: true, message: 'Row '+id+' deleted'};
}

function search(p) {
  var s = gs(p.sheet);
  var d = s.getDataRange().getValues();
  if (!d.length) return {data:[], total:0};
  var h = d[0], q = String(p.query || '').toLowerCase(), col = p.column;
  var rows = [];
  for (var i = 1; i < d.length; i++) {
    var o = {id: i}, match = false;
    for (var c = 0; c < h.length; c++) {
      o[h[c]] = d[i][c] || '';
      if (!col || col === h[c]) {
        if (String(d[i][c]).toLowerCase().indexOf(q) >= 0) match = true;
      }
    }
    if (match) rows.push(o);
    if (rows.length >= (parseInt(p.limit)||50)) break;
  }
  return {data: rows, total: rows.length, query: p.query};
}

function listSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var arr = ss.getSheets(), out = [];
  for (var i = 0; i < arr.length; i++) out.push({name: arr[i].getName(), rows: arr[i].getLastRow(), cols: arr[i].getLastColumn()});
  return {sheets: out, total: out.length};
}

function createSheet(p) {
  if (!p.name && !p.sheet) throw new Error('Name required');
  var name = p.name || p.sheet;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName(name)) throw new Error('Already exists');
  var s = ss.insertSheet(name);
  if (p.headers) s.getRange(1,1,1,Array.isArray(p.headers)?p.headers.length:1).setValues([Array.isArray(p.headers)?p.headers:[p.headers]]);
  return {success: true, sheet: name};
}

function getStats(p) {
  var s = gs(p.sheet);
  var d = s.getDataRange().getValues();
  if (d.length < 2) return {total:0};
  return {sheet: p.sheet, total: d.length-1, columns: d[0].length, headers: d[0]};
}

function getInfo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var arr = ss.getSheets(), out = [];
  for (var i = 0; i < arr.length; i++) out.push({name: arr[i].getName(), rows: arr[i].getLastRow(), cols: arr[i].getLastColumn()});
  return {name: ss.getName(), sheets: out, version: '1.0'};
}

function callGemini(key, prompt, sys) {
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + key;
  var c = [];
  if (sys) { c.push({role:'user', parts:[{text:sys}]}); c.push({role:'model', parts:[{text:'Siap.'}]}); }
  c.push({role:'user', parts:[{text:prompt}]});
  var opt = {method:'post', contentType:'application/json', payload:JSON.stringify({contents:c, generationConfig:{temperature:0.3, maxOutputTokens:4096}}), muteHttpExceptions:true};
  var r = JSON.parse(UrlFetchApp.fetch(url, opt));
  if (r.error) throw new Error(r.error.message);
  if (!r.candidates || !r.candidates.length) throw new Error('No response');
  return r.candidates[0].content.parts[0].text;
}

function genScript(p) {
  var k = p.geminiKey || p.apiKey;
  if (!p.prompt) throw new Error('Prompt diperlukan');
  if (!k) throw new Error('Gemini key diperlukan');
  var sys = 'Kamu asisten AI ahli Google Apps Script (GAS).\nTUGAS: Buat kode GAS sesuai permintaan user.\nATURAN:\n1. HANYA kode, tanpa penjelasan\n2. Sertakan doGet/doPost jika perlu\n3. SIAP PAKAI copy-paste';
  var t = callGemini(k, 'Buat Google Apps Script untuk: '+p.prompt, sys);
  var code = t.replace(/```[a-z]*\n?/g,'').trim();
  return {success: true, code: code, length: code.length};
}

function testKey(p) {
  var k = p.geminiKey || p.apiKey;
  if (!k) throw new Error('Key diperlukan');
  callGemini(k, 'Balas: OK', null);
  return {success: true, message: 'Key valid!'};
}

function genSheet(p) {
  var k = p.geminiKey || p.apiKey;
  if (!p.prompt) throw new Error('Prompt diperlukan');
  if (!k) throw new Error('Key diperlukan');
  var sys = 'Kamu buat data JSON untuk Google Sheets.\nFORMAT: [{"kol1":"val1","kol2":"val2"},...]\n5+ baris data, realistis, bahasa Indonesia.\nHANYA JSON, tanpa markdown.';
  var t = callGemini(k, 'Buat data untuk: '+p.prompt, sys);
  t = t.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
  var data = JSON.parse(t);
  if (!Array.isArray(data) || !data.length) throw new Error('Data invalid');
  var name = p.name || ('AI_'+new Date().toISOString().slice(0,10));
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(name) || ss.insertSheet(name);
  s.clear();
  var h = Object.keys(data[0]);
  s.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold');
  var rows = [];
  for (var r = 0; r < data.length; r++) {
    var row = [];
    for (var c = 0; c < h.length; c++) row.push(data[r][h[c]] !== undefined ? data[r][h[c]] : '');
    rows.push(row);
  }
  if (rows.length) s.getRange(2,1,rows.length,h.length).setValues(rows);
  return {success: true, sheet: name, rows: data.length, headers: h, url: ss.getUrl()};
}
