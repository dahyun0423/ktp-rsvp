import { randomUUID } from 'node:crypto';
import { event, prefix, parse, writeRecord, syncSheet, toRow } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (event.closed) return res.status(403).json({ error: '신청이 마감되었습니다.' });

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  // 봇이 채우는 숨김 필드
  if (body.website) return res.status(200).json({ ok: true });

  const { data, errors } = parse(body);
  if (errors) return res.status(400).json({ errors });

  const submittedAt = new Date().toISOString();
  const id = randomUUID();
  const record = { id, submittedAt, eventId: event.id, ...data };

  await writeRecord(`${prefix()}${submittedAt.replace(/[:.]/g, '-')}_${id}.json`, record);
  await syncSheet('upsert', { row: toRow(record) });

  return res.status(200).json({ ok: true, id });
}
