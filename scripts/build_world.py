"""World maps from Natural Earth 1:110m countries: Equal Earth SVG paths (flat map) and simplified lon/lat (globe)."""
import json, math
from common import raw, write_json, douglas_peucker

ne = json.load(open(raw("ne_110m_admin_0_countries.geojson")))
A1, A2, A3, A4 = 1.340264, -0.081106, 0.000893, 0.003796; M = math.sqrt(3)/2
def equal_earth(lon, lat):
    l, p = math.radians(lon), math.radians(lat); th = math.asin(M*math.sin(p)); t2 = th*th; t6 = t2**3
    x = 2*math.sqrt(3)*l*math.cos(th)/(3*(9*A4*t6*t2+7*A3*t6+3*A2*t2+A1))
    y = th*(A1+A2*t2+t6*(A3+A4*t2))
    return x, y
xmax, _ = equal_earth(180, 0); _, ymax = equal_earth(0, 90)
W = 960; s = W/(2*xmax); H = round(2*ymax*s*0.83); ytop = ymax*s
P = lambda lon, lat: ((equal_earth(lon, lat)[0]+xmax)*s, ytop-equal_earth(lon, lat)[1]*s)

flat, globe = {}, []
for f in ne["features"]:
    pr = f["properties"]; iso = pr["ISO_A3_EH"] if pr["ISO_A3_EH"] != "-99" else pr["ADM0_A3"]
    if iso == "ATA": continue
    g = f["geometry"]; polys = g["coordinates"] if g["type"]=="MultiPolygon" else [g["coordinates"]]
    path, gpolys = "", []
    for poly in polys:
        grings = []
        for ring in poly:
            r = douglas_peucker([P(*p) for p in ring], 0.4)
            if len(r) >= 4: path += "M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in r) + "Z"
            rg = douglas_peucker(ring, 0.35)
            if len(rg) >= 4: grings.append([[round(x, 1), round(y, 1)] for x, y in rg])
        if grings: gpolys.append(grings)
    lx, ly = P(pr["LABEL_X"], pr["LABEL_Y"])
    flat[iso] = {"d": path, "x": round(lx, 1), "y": round(ly, 1)}
    if gpolys:
        globe.append({"type":"Feature","id":iso,"properties":{"lx":round(pr["LABEL_X"],1),"ly":round(pr["LABEL_Y"],1)},"geometry":{"type":"MultiPolygon","coordinates":gpolys}})
uk = P(-1.5, 52.5)
write_json("world-map.json", {"w": W, "h": H, "uk": [round(uk[0], 1), round(uk[1], 1)], "p": flat})
write_json("globe.json", {"type": "FeatureCollection", "features": globe})
