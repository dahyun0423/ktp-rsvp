# 노션 원본(tools/notion/raw/*.json) → public/assets/notion/teams.json + 이미지(jpg) 생성
# 사용: python3 tools/notion/build.py   (fetch.py 다음에. macOS 의 sips 로 이미지를 변환한다)
import json, re, os, sys, html, subprocess, urllib.parse, hashlib
SCR = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(os.path.dirname(SCR))
OUT = os.path.join(PROJ, 'public/assets/notion')
SITE = 'https://ktechpioneers.notion.site'
SPACE = 'c69962b0-3951-485b-b10a-5bb29576bba8'
V = lambda b: (b.get('value', {}).get('value', b.get('value', {})))
slugs = open(os.path.join(SCR, 'pages.txt')).read().split()
# 노션 상세 페이지에 보이는 순서. 이름은 노션 스키마에서 그대로 가져온다(2026-10-29: 분야 칸 → 매칭 수요기업).
PROPS = ['mZ\\O', ';V_p', ';@NE', ';eTW', 'WwX;']

def fid(h): return f"{h[:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:]}"

def img_url(source, block_id, width=1600):
    if source.startswith('http') and 'amazonaws' not in source and 'attachment' not in source:
        return source
    return f"{SITE}/image/{urllib.parse.quote(source, safe='')}?table=block&id={block_id}&spaceId={SPACE}&width={width}&cache=v2"

def file_url(source, block_id):
    if source.startswith('attachment:'):
        return f"{SITE}/signed/{urllib.parse.quote(source, safe='')}?table=block&id={block_id}&spaceId={SPACE}"
    return source

def fetch(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0: return
    tmp = dest + '.part'
    r = subprocess.run(['curl', '-sL', '-f', '-o', tmp, url])
    if r.returncode: raise SystemExit(f'download failed: {url}')
    os.replace(tmp, dest)

def to_jpg(srcf, dest, width, q=82):
    if os.path.exists(dest): return
    subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', str(q), '--resampleWidth', str(width), srcf, '--out', dest], capture_output=True, check=True)
    # 원본이 더 작으면 sips 가 키우므로, 원본 폭 이하로 다시 맞춘다
    w = int(re.search(r'pixelWidth: (\d+)', subprocess.run(['sips', '-g', 'pixelWidth', srcf], capture_output=True, text=True).stdout).group(1))
    if w < width:
        subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', str(q), srcf, '--out', dest], capture_output=True, check=True)

def rich(segs):
    out = []
    for seg in segs or []:
        text = html.escape(seg[0]).replace('\n', '<br>')
        for f in (seg[1] if len(seg) > 1 else []):
            k = f[0]
            if k == 'b': text = f'<b>{text}</b>'
            elif k == 'i': text = f'<i>{text}</i>'
            elif k == 's': text = f'<s>{text}</s>'
            elif k == '_': text = f'<u>{text}</u>'
            elif k == 'c': text = f'<code>{text}</code>'
            elif k == 'h': text = f'<span class="n-c-{f[1]}">{text}</span>'
            elif k == 'a':
                href = f[1] if f[1].startswith('http') else SITE + f[1]
                text = f'<a href="{html.escape(href)}" target="_blank" rel="noopener">{text}</a>'
        out.append(text)
    return ''.join(out)

def plain(segs): return ''.join(s[0] for s in segs or [])

teams = []
for s in slugs:
    name = s[:-33]; pid = fid(s[-32:])
    rm = json.load(open(os.path.join(SCR, 'raw', name + '.json')))
    B = {k: V(v) for k, v in rm['block'].items()}
    page = B[pid]
    d = os.path.join(OUT, name); os.makedirs(os.path.join(SCR, 'img', name), exist_ok=True); os.makedirs(d, exist_ok=True)
    n = [0]

    def image(source, bid, kind=None, width=1600):
        n[0] += 1
        key = kind or f'img{n[0]:02d}'
        raw = os.path.join(SCR, 'img', name, key + '.src')
        fetch(img_url(source, bid, 2000), raw)
        rel = f'{name}/{key}.jpg'
        to_jpg(raw, os.path.join(OUT, rel), width)
        return 'assets/notion/' + rel

    fmt = page.get('format', {})
    cover = image(fmt['page_cover'], pid, 'cover', 1600) if fmt.get('page_cover') else None
    thumb = None
    if cover:
        thumb = f'assets/notion/{name}/cover-sm.jpg'
        to_jpg(os.path.join(SCR, 'img', name, 'cover.src'), os.path.join(PROJ, 'public', thumb), 640, 80)
    icon = fmt.get('page_icon')
    if icon and (icon.startswith('attachment') or icon.startswith('http')):
        raw = os.path.join(SCR, 'img', name, 'icon.src'); fetch(img_url(icon, pid, 240), raw)
        dest = os.path.join(OUT, name, 'icon.png')
        # SVG 아이콘은 브라우저마다 <img> 표시가 달라서 다른 팀처럼 PNG 로 맞춘다(rsvg-convert 필요: brew install librsvg)
        if open(raw, 'rb').read(400).lstrip().startswith((b'<?xml', b'<svg')):
            subprocess.run(['rsvg-convert', '-w', '120', '-h', '120', '-a', raw, '-o', dest], check=True)
        else:
            subprocess.run(['sips', '-s', 'format', 'png', '-Z', '120', raw, '--out', dest], capture_output=True, check=True)
        icon = {'img': f'assets/notion/{name}/icon.png'}
    elif icon: icon = {'emoji': icon}

    props = []
    P = page.get('properties', {})
    coll = V(list(rm['collection'].values())[0])
    schema = coll['schema']
    for key in PROPS:
        if key not in schema: continue
        v = P.get(key); sc = schema[key]; label = sc['name']
        if sc.get('type') == 'file':
            files = [{'name': seg[0], 'url': file_url(f[1], pid)} for seg in (v or []) for f in (seg[1] if len(seg) > 1 else []) if f[0] == 'a']
            props.append({'label': label, 'type': 'files', 'files': files})
        elif sc.get('type') in ('select', 'multi_select'):
            colors = {o['value']: o.get('color', 'default') for o in sc.get('options', [])}
            vals = [x.strip() for x in plain(v).split(',') if x.strip()]
            # 옵션에서 지워진 값은 노션 화면에도 안 보이므로 뺀다
            props.append({'label': label, 'type': 'tags', 'values': [{'v': x, 'c': colors[x]} for x in vals if x in colors]})
        else:
            props.append({'label': label, 'type': 'text', 'text': plain(v)})

    def conv(ids):
        out = []
        for i in ids or []:
            b = B.get(i)
            if not b or not b.get('alive', True): continue
            t = b.get('type'); p = b.get('properties', {}); f = b.get('format', {}) or {}
            title = p.get('title')
            node = None
            if t in ('header', 'sub_header', 'sub_sub_header', 'header_4'):
                node = {'t': {'header': 'h2', 'sub_header': 'h3'}.get(t, 'h4'), 'html': rich(title)}
            elif t == 'text':
                node = {'t': 'p', 'html': rich(title)}
            elif t in ('bulleted_list', 'numbered_list', 'to_do'):
                node = {'t': {'bulleted_list': 'li', 'numbered_list': 'oli', 'to_do': 'li'}[t], 'html': rich(title)}
            elif t == 'quote':
                node = {'t': 'quote', 'html': rich(title)}
            elif t == 'callout':
                ic = f.get('page_icon') or ''
                node = {'t': 'callout', 'html': rich(title), 'color': f.get('block_color', ''), 'icon': ic if not ic.startswith('/') and not ic.startswith('http') and not ic.startswith('attach') else ''}
            elif t == 'divider':
                node = {'t': 'hr'}
            elif t == 'image':
                srcs = f.get('display_source') or plain(p.get('source'))
                if srcs:
                    node = {'t': 'img', 'src': image(srcs, i), 'w': f.get('block_width'), 'ratio': f.get('block_aspect_ratio'), 'caption': rich(p.get('caption'))}
            elif t in ('pdf', 'file'):
                srcs = f.get('display_source') or plain(p.get('source'))
                nm = plain(title) or (srcs.rsplit(':', 1)[-1] if srcs else '파일')
                if srcs: node = {'t': 'file', 'name': nm, 'url': file_url(srcs, i)}
            elif t == 'column_list':
                cols = [B[c] for c in b.get('content', []) if c in B]
                node = {'t': 'cols', 'cols': [{'ratio': (c.get('format') or {}).get('column_ratio', 1), 'children': conv(c.get('content'))} for c in cols]}
            elif t == 'toggle':
                node = {'t': 'toggle', 'html': rich(title)}
            else:
                print('  skip', name, t, file=sys.stderr)
            if node is None: continue
            kids = b.get('content') if t not in ('column_list', 'page') else None
            if kids: node['children'] = conv(kids)
            out.append(node)
        # 끝에 남은 빈 문단은 버린다
        while out and out[-1]['t'] == 'p' and not out[-1]['html'] and not out[-1].get('children'): out.pop()
        return out

    teams.append({'slug': name, 'name': plain(page['properties'].get('title')), 'icon': icon, 'cover': cover, 'coverSm': thumb,
                  'coverPos': fmt.get('page_cover_position', 0.5), 'notion': s, 'props': props, 'blocks': conv(page.get('content'))})
    print('ok', name, n[0], file=sys.stderr)

json.dump(teams, open(os.path.join(OUT, 'teams.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('wrote', len(teams))
