"""Shared paths and helpers for the build scripts."""
import json, math, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data-raw")
OUT = os.path.join(ROOT, "data")

def raw(name):
    path = os.path.join(RAW, name)
    if not os.path.exists(path):
        raise SystemExit(f"Missing raw file: data-raw/{name}. See data-raw/README.md for where to download it.")
    return path

def write_json(name, obj):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, separators=(",", ":"), ensure_ascii=False)
    print(f"wrote data/{name} ({os.path.getsize(path)//1024} KB)")

def douglas_peucker(pts, eps):
    """Simplify a line, keeping points further than eps from the chord."""
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy)
    idx, dmax = 0, 0
    for j in range(1, len(pts) - 1):
        p = pts[j]
        d = abs(dy*p[0] - dx*p[1] + b[0]*a[1] - b[1]*a[0]) / L if L > 1e-9 else math.hypot(p[0]-a[0], p[1]-a[1])
        if d > dmax:
            idx, dmax = j, d
    if dmax > eps:
        return douglas_peucker(pts[:idx+1], eps)[:-1] + douglas_peucker(pts[idx:], eps)
    return [a, b]

WALES_CODES = {'Isle of Anglesey':'ANG','Gwynedd':'GWY','Conwy':'CNW','Denbighshire':'DEN','Flintshire':'FLN','Ceredigion':'CER','Powys':'POW','Wrexham':'WRX','Pembrokeshire':'PEM','Carmarthenshire':'CMN','Swansea':'SWA','Neath Port Talbot':'NPT','Rhondda Cynon Taf':'RCT','Merthyr Tydfil':'MER','Blaenau Gwent':'BGW','Torfaen':'TOF','Monmouthshire':'MON','Bridgend':'BGE','Vale of Glamorgan':'VGL','Cardiff':'CRF','Caerphilly':'CAE','Newport':'NWP'}
