// KTP RSVP 응답 사본 — KTP 계정 구글 시트에 붙이는 Apps Script 웹 앱.
// 원본은 Vercel Blob 이고, 신청·관리자 수정·삭제가 일어날 때마다 이 시트로 복사된다.
// 시트를 직접 고쳐도 사이트에는 반영되지 않는다(관리자 페이지에서 고칠 것).
//
// 설치: 시트 > 확장 프로그램 > Apps Script 에 이 파일을 붙여넣고 SECRET 을 바꾼 뒤
//       배포 > 새 배포 > 웹 앱 / 실행: 나 / 액세스: 모든 사용자
// SECRET 은 Vercel 의 SHEET_SECRET 환경변수와 같아야 한다.

const SECRET = 'PASTE_SECRET';

// 열 구성(fields)은 사이트가 매 요청마다 보낸다 — event.config.js 설정에 따라 바뀌어도 이 스크립트는 그대로 둔다.
// fields: [[key, 헤더], ...], 마지막은 항상 응답 ID.

function doPost(e) {
  const body = JSON.parse(e.postData.contents || '{}');
  if (body.secret !== SECRET) return json({ ok: false, error: 'unauthorized' });
  const fields = body.fields || [];
  if (!fields.length) return json({ ok: false, error: 'no fields' });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = sheetFor(body.eventId, fields);
    // 열 구성이 바뀐 뒤 첫 요청이면 사이트가 전체(replace)를 다시 보내도록 알린다
    if (body.action !== 'replace' && !sameHeader(sheet, fields)) return json({ ok: false, error: 'stale_header' });
    switch (body.action) {
      case 'upsert': return json(upsert(sheet, fields, body.row));
      case 'delete': return json(remove(sheet, fields, body.id));
      case 'replace': return json(replace(sheet, fields, body.rows || []));
      default: return json({ ok: false, error: 'bad action' });
    }
  } finally {
    lock.releaseLock();
  }
}

// 행사(eventId)마다 탭을 따로 만든다
function sheetFor(eventId, fields) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(eventId);
  if (!sheet) {
    sheet = ss.insertSheet(eventId);
    writeHeader(sheet, fields);
  }
  return sheet;
}

function sameHeader(sheet, fields) {
  const current = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0] : [];
  return current.join('\t') === fields.map(([, h]) => h).join('\t');
}

// 탭을 비우고 머리줄을 새로 쓴다
function writeHeader(sheet, fields) {
  sheet.clear();
  sheet.getRange(1, 1, 1, fields.length).setValues([fields.map(([, h]) => h)])
    .setFontWeight('bold').setBackground('#1b2a6b').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  const phone = fields.findIndex(([k]) => k === 'phone');
  if (phone >= 0) sheet.getRange(1, phone + 1, sheet.getMaxRows(), 1).setNumberFormat('@'); // 휴대폰 번호 앞자리 0 보존
}

function rowIndex(sheet, fields, id) {
  const last = sheet.getLastRow();
  if (last < 2) return -1;
  const ids = sheet.getRange(2, fields.length, last - 1, 1).getValues();
  const i = ids.findIndex(([v]) => v === id);
  return i < 0 ? -1 : i + 2;
}

// = + - @ 로 시작하는 입력이 수식으로 실행되지 않도록 ' 를 붙인다
function toValues(fields, row) {
  return fields.map(([k]) => {
    const v = row[k] == null ? '' : String(row[k]);
    return /^[=+\-@]/.test(v) ? `'${v}` : v;
  });
}

function upsert(sheet, fields, row) {
  const i = rowIndex(sheet, fields, row.id);
  if (i < 0) sheet.appendRow(toValues(fields, row));
  else sheet.getRange(i, 1, 1, fields.length).setValues([toValues(fields, row)]);
  return { ok: true };
}

function remove(sheet, fields, id) {
  const i = rowIndex(sheet, fields, id);
  if (i > 0) sheet.deleteRow(i);
  return { ok: true };
}

// 관리자 페이지 "시트 다시 동기화" — 탭 내용을 사이트 응답으로 통째로 바꾼다
function replace(sheet, fields, rows) {
  writeHeader(sheet, fields);
  if (rows.length) sheet.getRange(2, 1, rows.length, fields.length).setValues(rows.map((r) => toValues(fields, r)));
  return { ok: true, count: rows.length };
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
