# 노션 「1기 선정팀」 각 팀 페이지 원본을 tools/notion/raw/ 에 받는다. 다음에 build.py 를 돌린다.
# 사용: python3 tools/notion/fetch.py   (프로젝트 폴더에서)
import json, re, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); PROJ = os.path.dirname(os.path.dirname(HERE))
SITE = 'https://ktechpioneers.notion.site'
# 팀 페이지 주소(노션 데이터베이스 순서). 팀이 바뀌면 여기를 고친다.
PAGES = open(os.path.join(HERE, 'pages.txt')).read().split()
V = lambda b: (b.get('value', {}).get('value', b.get('value', {})))
def post(path, body):
    out = subprocess.run(['curl', '-s', '-X', 'POST', SITE + path, '-H', 'content-type: application/json', '-d', json.dumps(body)], capture_output=True, text=True).stdout
    return json.loads(out)
def fid(h): return f"{h[:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:]}"
os.makedirs(os.path.join(HERE, 'raw'), exist_ok=True)
for s in PAGES:
    pid = fid(s[-32:]); cursor = {'stack': []}; rm = None; blocks = {}
    for _ in range(20):
        d = post('/api/v3/loadCachedPageChunkV2', {'page': {'id': pid}, 'limit': 500, 'cursor': cursor, 'verticalColumns': False})
        rm = d['recordMap']; blocks.update(rm['block'])
        if not d.get('cursors'): break
        cursor = d['cursors'][0]
    for _ in range(5):
        missing = {c for b in blocks.values() for c in (V(b).get('content') or []) if c not in blocks and V(b).get('type') != 'collection_view'}
        if not missing: break
        got = post('/api/v3/syncRecordValuesMain', {'requests': [{'pointer': {'table': 'block', 'id': m}, 'version': -1} for m in missing]}).get('recordMap', {}).get('block', {})
        if not got: break
        blocks.update(got)
    rm['block'] = blocks
    json.dump(rm, open(os.path.join(HERE, 'raw', s[:-33] + '.json'), 'w'), ensure_ascii=False)
    print('fetched', s[:-33], len(blocks))
