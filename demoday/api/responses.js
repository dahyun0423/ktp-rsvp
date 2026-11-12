import ExcelJS from 'exceljs';
import { del } from '@vercel/blob';
import { event, isAdmin, readAll, findOne, writeRecord, parse, syncSheet, toRow, COLUMNS, kst } from './_lib.js';

// GET 목록·엑셀 / PATCH ?id= 수정 / DELETE ?id= 삭제 / POST ?action=sync 구글 시트 전체 동기화
export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });

  const eventId = typeof req.query.event === 'string' ? req.query.event : event.id;
  const id = typeof req.query.id === 'string' ? req.query.id : '';

  if (req.method === 'PATCH' || req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'id 가 필요합니다.' });
    const found = await findOne(id, eventId);
    if (!found) return res.status(404).json({ error: '해당 신청을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.' });

    if (req.method === 'DELETE') {
      await del(found.pathname);
      const sheet = await syncSheet('delete', { id }, eventId);
      return res.status(200).json({ ok: true, sheet: sheet.ok });
    }

    const body = typeof req.body === 'object' && req.body ? req.body : {};
    // 관리자 수정은 개인정보 동의 여부를 바꾸지 않는다
    const { data, errors } = parse({ ...body, consent: found.record.consent }, { requireConsent: false });
    if (errors) return res.status(400).json({ errors });
    if (!event.askTeams) data.teams = found.record.teams || []; // 질문을 꺼둔 동안 예전 답은 그대로 둔다
    const record = { ...found.record, ...data, updatedAt: new Date().toISOString() };
    await writeRecord(found.pathname, record);
    const sheet = await syncSheet('upsert', { row: toRow(record) }, eventId);
    return res.status(200).json({ ok: true, row: record, sheet: sheet.ok });
  }

  if (req.method === 'POST' && req.query.action === 'sync') {
    const rows = await readAll(eventId);
    const sheet = await syncSheet('replace', { rows: rows.map(toRow) }, eventId);
    if (sheet.error === 'not_configured') return res.status(400).json({ error: '구글 시트가 아직 연결되지 않았습니다.' });
    if (!sheet.ok) return res.status(502).json({ error: '구글 시트 동기화에 실패했습니다.' });
    return res.status(200).json({ ok: true, count: rows.length });
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const rows = await readAll(eventId);

  if (req.query.format !== 'xlsx') {
    return res.status(200).json({
      eventId, title: event.title, count: rows.length, sheetUrl: process.env.SHEET_URL || '', rows,
    });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('RSVP', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = COLUMNS.map(({ key, header, width }) => ({ key, header, width }));
  for (const r of rows) ws.addRow(toRow(r));
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B2A6B' } };
  ws.autoFilter = { from: 'A1', to: { row: 1, column: COLUMNS.length } };

  const stamp = kst(new Date().toISOString()).slice(0, 10);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="rsvp_${eventId}_${stamp}.xlsx"`,
  );
  res.status(200).send(Buffer.from(await wb.xlsx.writeBuffer()));
}
