"""지구본(app.js createGlobe)용 데이터 만들기.

입력: world-atlas@2.0.2 (Natural Earth, public domain) 의 land-110m.json, countries-110m.json
      https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/
출력: public/assets/globe.json  { dots: [lat, lon, ...], lines: [[lat, lon, ...], ...] }
  - dots  : 지구 전체에 고르게 뿌린 점 중 육지에 있는 것만 (반짝이는 대륙)
  - lines : 나라 경계선 + 해안선
사용: python3 -I tools/globe/build.py <world-atlas 폴더>
"""
import json, math, sys, os

src = sys.argv[1]
out = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'assets', 'globe.json')

def decode(topo, key):
    sx, sy = topo['transform']['scale']; tx, ty = topo['transform']['translate']
    arcs = []
    for arc in topo['arcs']:
        x = y = 0; pts = []
        for dx, dy in arc:
            x += dx; y += dy
            pts.append((x * sx + tx, y * sy + ty))  # (lon, lat)
        arcs.append(pts)
    def ring(idx):
        pts = []
        for i in idx:
            a = arcs[i] if i >= 0 else arcs[~i][::-1]
            pts.extend(a if not pts else a[1:])
        return pts
    polys = []
    for geo in topo['objects'][key]['geometries']:
        if geo['type'] == 'Polygon':
            polys.append([ring(r) for r in geo['arcs']])
        elif geo['type'] == 'MultiPolygon':
            polys.extend([[ring(r) for r in p] for p in geo['arcs']])
    return polys

land = decode(json.load(open(os.path.join(src, 'land-110m.json'))), 'land')
countries = decode(json.load(open(os.path.join(src, 'countries-110m.json'))), 'countries')

def bbox(r):
    xs = [p[0] for p in r]; ys = [p[1] for p in r]
    return min(xs), min(ys), max(xs), max(ys)
land_b = [(p, bbox(p[0])) for p in land]

def inside_ring(lon, lat, r):
    c = False; n = len(r); j = n - 1
    for i in range(n):
        xi, yi = r[i]; xj, yj = r[j]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi:
            c = not c
        j = i
    return c

def on_land(lon, lat):
    for p, (x0, y0, x1, y1) in land_b:
        if x0 <= lon <= x1 and y0 <= lat <= y1 and inside_ring(lon, lat, p[0]):
            if not any(inside_ring(lon, lat, h) for h in p[1:]):
                return True
    return False

N = 16000
dots = []
for i in range(N):
    y = 1 - 2 * (i + 0.5) / N
    r = math.sqrt(1 - y * y)
    th = i * math.pi * (3 - math.sqrt(5))
    lat = math.degrees(math.asin(y)); lon = math.degrees(math.atan2(math.sin(th) * r, math.cos(th) * r))
    if lat < -60:  # 남극은 화면에서 거의 안 보이고 점만 많아져서 뺀다
        continue
    if on_land(lon, lat):
        dots += [round(lat, 2), round(lon, 2)]

lines = []
for poly in countries:
    for r in poly:
        pts = []; last = None
        for lon, lat in r:
            q = (round(lat, 1), round(lon, 1))
            if q != last:
                pts += list(q); last = q
        if len(pts) >= 6:
            lines.append(pts)

json.dump({'source': 'Natural Earth via world-atlas@2.0.2 (public domain)', 'dots': dots, 'lines': lines},
          open(out, 'w'), separators=(',', ':'))
print('dots', len(dots) // 2, 'lines', len(lines), 'bytes', os.path.getsize(out))
