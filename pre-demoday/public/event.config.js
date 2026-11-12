// 행사별 설정 — 다음 행사에 재사용할 때는 이 파일만 바꾸면 된다.
// 페이지(브라우저)와 API(서버)가 같은 파일을 읽는다.
// id 를 바꾸면 응답이 새 폴더에 따로 쌓인다(이전 행사 응답은 그대로 보존).

export default {
  id: 'pre-demoday-2026-v2',
  // 예전 id 로 쌓인 응답. 관리자 페이지에서 골라 볼 수 있다(구글 시트도 예전 탭에 그대로 있음).
  // 2026-10-29: 신청서 질문 추가(관심 참가팀·비즈니스 매칭) 후 새 탭으로 받기 위해 id 를 바꿨다.
  previousIds: [{ id: 'pre-demoday-2026', label: '업데이트 전 응답 (~10/29)' }],

  brand: 'K-TECH PIONEERS',
  title: 'PRE-DEMO DAY',
  titleKo: '프리 데모데이',
  tagline: '글로벌 우수 기술 팀과 국내 산업이 만나는 시간',

  invitation: [
    '<b>혁신 기술</b>을 기반으로 <b>국내 기술사업화</b>를 추진하고 있는',
    '<b>K-테크 파이오니어즈 선정팀</b>의 <b>비전과 성장 가능성을 직접 만나보세요.</b>',
    'PRE-DEMO DAY에 귀하를 정중히 초청합니다.',
  ],

  // 현재 화면에서 ABOUT·PROGRAM 섹션은 빠져 있다(추후 수정 후 다시 노출 예정).
  about: [
    'K-테크 파이오니어즈는 <b>과학기술정보통신부와 정보통신산업진흥원(NIPA)</b>이 추진하는 글로벌 기술사업화 프로그램으로, 해외에서 활동하는 우수 한국인 기술 인재·창업팀과 국내 산업계를 연결합니다.',
    '이번 PRE-DEMO DAY에서는 <b>2026년 선정팀 20개사</b>가 데모데이에 앞서 그간의 성과와 비즈니스를 먼저 선보이고, 국내 수요기업 및 생태계 관계자와 새로운 협력 기회를 만들어갑니다.',
  ],

  // 화면 표시용. 비워두면 "추후 안내".
  date: '2026.11.23.',
  dateDay: 'MON',
  dateKo: '2026년 11월 23일(월)',
  time: '',
  // 행사 정보 카드(DATE)에만 쓰는 표기. 비워두면 date·dateKo 로 만든다.
  infoDate: '2026.11.23.(Mon)',
  infoDateSub: '13:00 - 18:00',
  venue: 'COEX Startup Branch',
  venueKo: '서울특별시 강남구 영동대로 513, 코엑스 2F-A01',
  address: '',
  deadline: '2026.11.19.(Thu)', // 예: '2026년 11월 20일(금)'. 비워두면 숨김.

  // 행사 정보 카드 아래 타임테이블. 비워두면(null) 숨김.
  // break 줄은 시간 없이 시간·IR 피칭 칸을 합쳐서 보여준다. match 는 비즈니스 매칭 칸 — 모든 줄을 하나로 합친 칸(제목 흰색, notes 회색).
  timetable: {
    head: ['시간', 'IR 피칭', '비즈니스 매칭'],
    rows: [
      { time: '13:30 – 15:30', ir: 'A분과', irNote: '피지컬AI, 산업용AI, 우주·항공' },
      { break: 'Break Time' },
      { time: '15:45 – 18:00', ir: 'B분과', irNote: '바이오·헬스케어, 미디어·커머스' },
    ],
    match: { title: '비즈니스 매칭', notes: ['사전 수요조사 기반 1:1 매칭', '현장 매칭 운영'] },
  },

  // [{ time: '16:00–17:30', en: 'Business Matching', ko: '비즈니스 매칭', note: '사전 매칭 시' }]
  // 비워두면 "세부 프로그램은 추후 안내" 로 표시된다.
  program: [],

  // 희망 세션 선택지. 비워두면 질문이 숨겨진다.
  sessions: [],

  // 선정팀 — 로고 띠와 "관심 있는 참가팀" 선택지에 쓰인다. 순서는 노션 「1기 선정팀」과 같게 둔다.
  // logo 는 public/assets/teams/ 의 흰색 로고. scale 은 눈으로 봤을 때 크기가 비슷해 보이도록 하는 개별 보정값.
  // 선정팀 카드·상세 내용은 노션에서 가져온 public/assets/notion/teams.json 을 쓴다(finalists.js).
  teams: [
    { name: 'Contoro Robotics', logo: 'contoro.png', scale: 1.25 },
    { name: 'SECA', logo: 'seca.png', scale: 1.05 },
    { name: 'OpenGraph Labs', logo: 'opengraph-labs.png', scale: 1.08 },
    { name: 'Surrey Space Solar', logo: 'surrey-space-solar.png', scale: 1.05 },
    { name: 'WayFinder Space', logo: 'wayfinder-space.png', scale: 1.22 },
    { name: 'Linqalpha', logo: 'linqalpha.png', scale: 0.95 },
    { name: 'Pinta AI', logo: 'pinta-ai.png' },
    { name: 'BizCrush', logo: 'bizcrush.png' },
    { name: 'SkinSeoulLab', logo: 'skinseoullab.png', scale: 1.2 },
    { name: 'Storika', logo: 'storika.png', scale: 0.88 },
    { name: 'Trxbx', logo: 'trxbx.png' },
    { name: 'aix', logo: 'aix.png', scale: 0.82 },
    { name: 'DocentPro', logo: 'docentpro.png' },
    { name: 'KINZ', logo: 'kinz.png', scale: 0.8 },
    { name: 'SERiD AI', logo: 'serid-ai.png', scale: 1.2 },
    { name: 'Pen-AI SMT', logo: 'pen-ai-smt.png', scale: 1.35 },
    { name: 'K-ATR', logo: 'roblossom.png', scale: 1.3 },
    { name: 'iQ Surgical', logo: 'iq-surgical.png', scale: 0.62 },
    { name: 'Celuragen Therapeutics', logo: 'celuragen.png', scale: 1.3 },
    { name: 'CyrenCare', logo: 'cyrencare.png' },
  ],
  // 로고 띠 아래 버튼. 비워두면 숨김.
  // 선정팀 상세를 사이트 안에서 보여주게 되어 노션 버튼은 뺐다(2026-10-28).
  teamsLink: null,

  // 선정팀 카드를 분과·분야별로 나눠 보여준다. teams 는 assets/notion/teams.json 의 slug(노션 페이지 이름).
  divisions: [
    {
      name: 'A분과',
      groups: [
        { field: '피지컬 AI', teams: ['Contoro-Robotics', 'OpenGraph-Labs', 'SECA'] },
        { field: '산업용 AI', teams: ['BizCrush', 'Linqalpha', 'Pen-AI-SMT-Smart-Manufacturing-Team', 'Pinta-AI', 'SERiD-AI'] },
        { field: '우주·항공', teams: ['Surrey-Space-Solar', 'WayFinder-Space'] },
      ],
    },
    {
      name: 'B분과',
      groups: [
        { field: '바이오·헬스케어', teams: ['Celuragen-Therapeutics', 'CyrenCare', 'iQ-Surgical', 'K-ATR'] },
        { field: '미디어·커머스', teams: ['aix', 'DocentPro', 'KINZ', 'SkinSeoulLab', 'Storika', 'Trxbx'] },
      ],
    },
  ],
  teamsHint: '관심 있는 선정팀을 골라주시면 현장 네트워킹·비즈니스 매칭에 참고하겠습니다.',
  // 신청서에 "관심 있는 참가팀" 질문을 받을지. true 로 바꾸면 질문과 관리자·엑셀·시트의 "관심 참가팀" 열이 다시 생긴다.
  askTeams: true,
  // "비즈니스 매칭 희망 여부" 질문(필수, 하나만 선택). 비워두면 질문과 관리자·엑셀·시트의 열이 숨겨진다.
  matching: ['희망합니다', '희망하지 않습니다'],

  privacy: {
    org: '(주)멋쟁이사자처럼',
    items: '소속, 성명, 직책, 연락처(이메일/휴대전화)',
    purpose: '행사 참가자 확인 및 안내, 비즈니스 매칭 운영 및 관련 연락',
    retention: '행사 종료 및 관련 운영 업무 완료 후 파기',
  },

  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/showcase/k-tech-pioneers/' },
    { label: 'Instagram', href: 'https://www.instagram.com/ktechpioneers/' },
  ],

  // true 로 바꾸면 신청이 마감되고 폼 대신 마감 안내가 보인다.
  closed: false,
};
