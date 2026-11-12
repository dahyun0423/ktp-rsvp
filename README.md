# K-TECH PIONEERS · 행사 RSVP 사이트

구글폼 대신 쓰는 K-TECH PIONEERS 행사 참석 신청(RSVP) 사이트입니다. 정적 페이지와 Vercel Functions 로 이루어져 있습니다.

| 폴더 | 행사 | 배포 |
|---|---|---|
| [`pre-demoday/`](pre-demoday) | PRE-DEMO DAY · 2026.11.23 COEX Startup Branch | https://ktp-rsvp.vercel.app |
| [`demoday/`](demoday) | DEMO DAY · 2026.12.10 그랜드 머큐어 임피리얼 팰리스 서울 강남 | https://ktp-demoday-test.vercel.app (테스트) |

## 구조
- `public/` — 페이지(`index.html`, `app.js`, `styles.css`), 선정팀 카드·상세(`finalists.js`), 관리자 페이지(`admin/`)
- `public/event.config.js` — **행사별 설정은 이 파일만 바꾸면 된다**(제목·일정·장소·타임테이블·선정팀·질문 항목). `id` 를 바꾸면 응답이 따로 쌓인다.
- `api/` — 신청 저장(`rsvp.js`), 관리자 조회·수정·삭제·엑셀(`responses.js`). 응답은 Vercel Blob(private)에 저장
- `sheet/Code.gs` — 응답을 구글 시트로 복사하는 Apps Script
- `tools/notion/` — 노션 「선정팀」 페이지를 가져와 카드 데이터로 만드는 스크립트
- `tools/globe/` (demoday) — 지구본 대륙·국경 데이터 생성(Natural Earth, public domain)

## 환경 변수 (Vercel)
| 이름 | 용도 |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Blob 스토어 연결 시 자동 생성 |
| `ADMIN_PASSWORD` | `/admin` 비밀번호 |
| `SHEET_WEBHOOK_URL`, `SHEET_SECRET`, `SHEET_URL` | 구글 시트 연동(없으면 건너뜀) |
| `SHEET_TAB_PREFIX` | 테스트 사이트용 시트 탭 접두어(예: `TEST_`) |

## 로컬 실행
```bash
cd demoday   # 또는 pre-demoday
npm install
vercel dev
```
