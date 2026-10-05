"""Simplified Welsh council outlines as SVG paths, from ONS boundaries via UK-GeoJSON (gb/lad.json)."""
import json, math
from common import raw, write_json, douglas_peucker, WALES_CODES

d = json.load(open(raw("gb_lad.json")))
feats = [f for f in d["features"] if f["properties"]["LAD13CD"].startswith("W06")]
k = math.cos(math.radians(52.4))
proj = lambda p: (p[0]*k, -p[1])
pts = [proj(p) for f in feats for poly in (f["geometry"]["coordinates"] if f["geometry"]["type"]=="MultiPolygon" else [f["geometry"]["coordinates"]]) for ring in poly for p in ring]
minx, maxx = min(p[0] for p in pts), max(p[0] for p in pts)
miny, maxy = min(p[1] for p in pts), max(p[1] for p in pts)
W = 600; s = W/(maxx-minx); H = (maxy-miny)*s
xy = lambda p: ((proj(p)[0]-minx)*s, (proj(p)[1]-miny)*s)
area = lambda r: abs(sum(r[i][0]*r[i-1][1]-r[i-1][0]*r[i][1] for i in range(len(r))))/2

out = {}
for f in feats:
    code = WALES_CODES[f["properties"]["LAD13NM"]]
    polys = f["geometry"]["coordinates"] if f["geometry"]["type"]=="MultiPolygon" else [f["geometry"]["coordinates"]]
    path, best = [], (0, None)
    for poly in polys:
        for ri, ring in enumerate(poly):
            r = [xy(p) for p in ring]; A = area(r)
            if A < 0.6: continue
            r2 = douglas_peucker(r, 0.35)
            if len(r2) < 4: continue
            path.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in r2) + "Z")
            if ri == 0 and A > best[0]: best = (A, r)
    r = best[1]; A = cx = cy = 0
    for i in range(len(r)):
        x0, y0 = r[i-1]; x1, y1 = r[i]; c = x0*y1-x1*y0; A += c; cx += (x0+x1)*c; cy += (y0+y1)*c
    out[code] = {"d": "".join(path), "cx": round(cx/(3*A), 1), "cy": round(cy/(3*A), 1)}
write_json("wales-boundaries.json", {"w": W, "h": round(H, 1), "p": out})
