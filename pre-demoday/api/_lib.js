import { timingSafeEqual } from 'node:crypto';
import { list, get, put } from '@vercel/blob';
import event from '../public/event.config.js';

export { event };

export const prefix = (eventId = event.id) => `responses/${eventId}/`;

const ALL_COLUMNS = [
  { key: 'submittedAt', header: '제출일시', width: 20 },
  { key: 'org', header: '소속', width: 24 },
  { key: 'name', header: '성함', width: 12 },
  { key: 'position', header: '직책', width: 16 },
  { key: 'phone', header: '휴대폰 번호', width: 16 },
  { key: 'email', header: '이메일', width: 28 },
  { key: 'sessions', header: '희망 세션', width: 28 },
  { key: 'teams', header: '관심 참가팀', width: 40 },
  { key: 'matching', header: '비즈니스 매칭 희망', width: 18 },
  { key: 'message', header: '남기실 말씀', width: 36 },
  { key: 'consent', header: '개인정보 동의', width: 12 },
  { key: 'updatedAt', header: '수정일시', width: 20 },
];

// 이번 행사에서 받지 않는 질문의 열은 관리자·엑셀·시트에서 뺀다
export const COLUMNS = ALL_COLUMNS.filter(
  ({ key }) => (key !== 'sessions' || event.sessions.length) && (key !== 'teams' || event.askTeams) && (key !== 'matching' || event.matching?.length),
);

// 구글 시트 열 순서. 행을 찾는 응답 ID 는 항상 마지막 열이다.
export const SHEET_FIELDS = [...COLUMNS.map(({ key, header }) => [key, header]), ['id', '응답 ID']];

const clean = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// 신청서 본문 검증. 신청(rsvp)과 관리자 수정(responses PATCH)이 같이 쓴다.
export function parse(body, { requireConsent = true } = {}) {
  const data = {
    org: clean(body.org),
    name: clean(body.name, 60),
    position: clean(body.position, 60),
    phone: clean(body.phone, 30),
    email: clean(body.email, 120).toLowerCase(),
    sessions: Array.isArray(body.sessions) ? body.sessions.filter((s) => event.sessions.includes(s)) : [],
    teams: event.askTeams && Array.isArray(body.teams) ? body.teams.filter((t) => event.teams.some((x) => x.name === t)) : [],
    matching: event.matching?.includes(body.matching) ? body.matching : '',
    message: clean(body.message, 1000),
    consent: body.consent === true,
  };

  const errors = {};
  if (!data.org) errors.org = '소속을 입력해주세요.';
  if (!data.name) errors.name = '성함을 입력해주세요.';
  if (!data.position) errors.position = '직책을 입력해주세요.';
  if (!/^[0-9+\-\s()]{9,}$/.test(data.phone)) errors.phone = '휴대폰 번호를 확인해주세요.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = '이메일 주소를 확인해주세요.';
  if (event.sessions.length && !data.sessions.length) errors.sessions = '희망 세션을 선택해주세요.';
  // 관리자 수정(requireConsent=false)은 이 질문이 생기기 전 응답도 고칠 수 있게 비워둬도 된다
  if (requireConsent && event.matching?.length && !data.matching) errors.matching = '비즈니스 매칭 희망 여부를 선택해주세요.';
  if (requireConsent && !data.consent) errors.consent = '개인정보 수집·이용에 동의해주세요.';
  return { data, errors: Object.keys(errors).length ? errors : null };
}

export function isAdmin(req) {
  // 환경변수를 넣을 때 앞뒤 공백·줄바꿈이 딸려 들어가는 일이 있어 양쪽 모두 다듬어서 비교한다
  const expected = process.env.ADMIN_PASSWORD?.trim();
  const given = req.headers['x-admin-key']?.trim();
  if (!expected || typeof given !== 'string') return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function listBlobs(eventId) {
  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix: prefix(eventId), cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

async function readBlob(pathname) {
  const res = await get(pathname, { access: 'private', useCache: false });
  if (!res || res.statusCode !== 200) return null;
  return JSON.parse(await new Response(res.stream).text());
}

export async function readAll(eventId) {
  const blobs = await listBlobs(eventId);
  const rows = [];
  for (let i = 0; i < blobs.length; i += 20) {
    const chunk = await Promise.all(blobs.slice(i, i + 20).map((b) => readBlob(b.pathname)));
    rows.push(...chunk.filter(Boolean));
  }
  return rows.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

// 응답 파일 이름은 `${제출일시}_${id}.json` 이다
export async function findOne(id, eventId) {
  const blob = (await listBlobs(eventId)).find((b) => b.pathname.endsWith(`_${id}.json`));
  if (!blob) return null;
  const record = await readBlob(blob.pathname);
  return record && { pathname: blob.pathname, record };
}

export function writeRecord(pathname, record) {
  return put(pathname, JSON.stringify(record), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export function kst(iso) {
  return new Date(iso).toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' });
}

// 엑셀·구글 시트에 들어갈 한 줄
export function toRow(r) {
  return {
    ...r,
    submittedAt: kst(r.submittedAt),
    updatedAt: r.updatedAt ? kst(r.updatedAt) : '',
    sessions: (r.sessions || []).join(', '),
    teams: (r.teams || []).join(', '),
    consent: r.consent ? '동의' : '미동의',
  };
}

// KTP 계정 구글 시트(Apps Script 웹 앱, sheet/Code.gs)로 응답을 복사한다.
// 원본은 Blob 이고 시트는 사본이라, 연결이 없거나 실패해도 신청·관리자 기능은 그대로 동작한다.
export async function syncSheet(action, payload = {}, eventId = event.id) {
  if (!process.env.SHEET_WEBHOOK_URL || !process.env.SHEET_SECRET) return { ok: false, error: 'not_configured' };
  try {
    const res = await fetch(process.env.SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // 시트 탭 이름 = SHEET_TAB_PREFIX + 행사 id. 테스트 사이트는 접두어(예: "TEST_")를 줘서 실제 참가자 탭과 섞이지 않게 한다.
      body: JSON.stringify({ secret: process.env.SHEET_SECRET, eventId: (process.env.SHEET_TAB_PREFIX || '') + eventId, action, fields: SHEET_FIELDS, ...payload }),
      signal: AbortSignal.timeout(10000),
    });
    const result = (await res.json().catch(() => null)) || { ok: false, error: `http_${res.status}` };
    // event.config.js 로 열 구성이 바뀐 뒤 첫 반영이면 탭 전체를 새 열 구성으로 다시 채운다
    if (result.error === 'stale_header' && action !== 'replace') {
      return syncSheet('replace', { rows: (await readAll(eventId)).map(toRow) }, eventId);
    }
    return result;
  } catch (e) {
    console.error('sheet sync failed', action, e);
    return { ok: false, error: 'unreachable' };
  }
}
