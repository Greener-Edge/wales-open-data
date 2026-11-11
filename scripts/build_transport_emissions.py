"""Estimated transport emissions for UK food imports, per tonne, by origin and food group (and for key foods),
combining HMRC modes of arrival (build_transport_modes.py) with DESNZ 2026 freight factors and modelled distances.

Method (GE choices, stated on the Methods page):
- Factors: DESNZ 2026 "Freighting goods", kg CO2e per tonne-km. Air includes radiative forcing (RF) as the
  headline; the figure without RF is also kept.
- Ship type by food group: refrigerated cargo for fresh fruit, veg, meat, fish and dairy; bulk carrier for cereals
  and animal feed; container ship for everything else.
- Distances: sea by shipping-lane network (searoute) from the origin to Felixstowe; air by great circle to Heathrow
  plus an 8% routing uplift (our assumption); road by straight line to Calais plus a 20% road uplift (our assumption)
  and a 50 km Channel crossing; Ireland by road to Dublin and a 110 km Irish Sea crossing.
- A first leg of 300 km by lorry at origin for sea and air (our assumption).
- Goods from outside Europe recorded as arriving by lorry, rail or ferry are modelled as shipped to a European port,
  then 300 km by lorry and the Channel crossing (our assumption).
- Modes recorded as unknown or other are left out and reported as a share."""
import json, math, os
import pandas as pd, searoute as sr
from common import raw, write_json, OUT

d = pd.read_excel(raw("desnz_ghg_factors_2026_flat.xlsx"), "Factors by Category", header=None)
h = d.index[d.apply(lambda r: r.astype(str).str.contains("Level 1").any(), axis=1)][0]
d.columns = d.iloc[h]; d = d.iloc[h + 1:]
for c in ["Level 1", "Level 2", "Level 3", "Level 4", "Column Text", "UOM", "GHG/Unit"]: d[c] = d[c].astype(str).str.strip().replace("nan", None)
d = d[(d["Level 1"].astype(str).str.contains("Freighting goods")) & (d["UOM"].astype(str) == "tonne.km") & (d["GHG/Unit"].astype(str) == "kg CO2e")]
def f(l2, l3, l4=None, col=None):
    x = d[(d["Level 2"] == l2) & (d["Level 3"] == l3)]
    if l4 is not None: x = x[x["Level 4"] == l4]
    if col is not None: x = x[x["Column Text"] == col]
    assert len(x) == 1, (l2, l3, l4, col, len(x)); return float(x["GHG Conversion Factor 2026"].iloc[0])
EF = {"ship_reefer": f("Cargo ship", "Refrigerated cargo", "All dwt"), "ship_bulk": f("Cargo ship", "Bulk carrier", "Average"),
      "ship_container": f("Cargo ship", "Container ship", "Average"), "roro": f("Cargo ship", "RoRo-Ferry", "Average"),
      "hgv_reefer": f("HGV (refrigerated, all diesel)", "Average refrigerated HGVs", col="Average laden"),
      "hgv": f("HGV (non-refrigerated, all diesel)", "Average non-refrigerated HGVs", col="Average laden"),
      "rail": f("Rail", "Freight train"),
      "air_long_rf": f("Freight flights", "Long-haul, to/from UK", col="With RF"), "air_long": f("Freight flights", "Long-haul, to/from UK", col="Without RF"),
      "air_short_rf": f("Freight flights", "Short-haul, to/from UK", col="With RF"), "air_short": f("Freight flights", "Short-haul, to/from UK", col="Without RF")}
print("DESNZ 2026 factors (kg CO2e/t.km):", EF)
CHILLED = {"veg", "fru", "mt", "fish", "dai"}; BULK = {"cer", "feed"}
FELIX, LHR, CALAIS, DUBLIN = (1.30, 51.95), (-0.45, 51.47), (1.85, 50.95), (-6.26, 53.35)
ORIGIN_LEG, AIR_UPLIFT, ROAD_UPLIFT, CHANNEL, IRISH_SEA, SHORT_HAUL_KM, EU_LEG = 300, 1.08, 1.20, 50, 110, 3700, 300
def gc(a, b):
    lo1, la1, lo2, la2 = map(math.radians, (*a, *b))
    return 6371 * 2 * math.asin(math.sqrt(math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2))
globe = json.load(open(os.path.join(OUT, "globe.json")))
PT = {ft["id"]: (ft["properties"]["lx"], ft["properties"]["ly"]) for ft in globe["features"]}
sea_cache = {}
def sea_km(o):
    if o not in sea_cache:
        try: sea_cache[o] = float(sr.searoute(list(PT[o]), list(FELIX), units="km").properties["length"])
        except Exception: sea_cache[o] = gc(PT[o], FELIX) * 1.3
    return sea_cache[o]
def per_tonne(o, g, mix):
    """kg CO2e per tonne for a mode mix {mode: tonnes}; returns (with RF, without RF, share of tonnes modelled, legs)."""
    if o not in PT: return None
    known = {m: t for m, t in mix.items() if m in ("sea", "air", "roro", "road", "rail")}
    tk = sum(known.values()); tt = sum(mix.values())
    if tk <= 0: return None
    hgv = EF["hgv_reefer"] if g in CHILLED else EF["hgv"]
    ship = EF["ship_reefer"] if g in CHILLED else EF["ship_bulk"] if g in BULK else EF["ship_container"]
    first = ORIGIN_LEG * hgv
    if o == "IRL": road_km, cross, xf = gc(PT[o], DUBLIN) * ROAD_UPLIFT, IRISH_SEA, EF["roro"]
    else: road_km, cross, xf = gc(PT[o], CALAIS) * ROAD_UPLIFT, CHANNEL, EF["roro"]
    air_km = gc(PT[o], LHR) * AIR_UPLIFT; short = air_km <= SHORT_HAUL_KM
    sea = first + sea_km(o) * ship
    # Lorries on ferries / road / rail at the border: driven all the way from Europe (and Morocco and Tunisia, by short ferry);
    # from further away the goods are shipped to a European port first, then trucked and ferried to the UK (our assumption).
    lon, lat = PT[o]; overland = (-25 <= lon <= 45 and lat >= 35) or o in ("MAR", "TUN")
    if not overland: road_km = EU_LEG * ROAD_UPLIFT
    per = {"sea": sea,
           "air_rf": first + air_km * EF["air_short_rf" if short else "air_long_rf"], "air": first + air_km * EF["air_short" if short else "air_long"],
           "roro": road_km * hgv + cross * xf + (0 if overland else sea), "road": road_km * hgv + cross * EF["rail"] + (0 if overland else sea), "rail": road_km * EF["rail"] + cross * EF["rail"] + (0 if overland else sea)}
    rf = sum(t * (per["air_rf"] if m == "air" else per[m]) for m, t in known.items()) / tk
    no = sum(t * per[m] for m, t in known.items()) / tk
    air_part = known.get("air", 0) * per["air_rf"] / tk
    return {"rf": round(rf, 1), "norf": round(no, 1), "air_share_of_em": round(air_part / rf, 3) if rf else 0, "modelled": round(tk / tt, 3),
            "mix": {m: round(t / tt, 3) for m, t in mix.items() if t / tt >= 0.005}, "t": round(tt)}
TM = json.load(open(os.path.join(OUT, "transport-modes.json")))
out_g = {}; tot_em = tot_t = air_em = 0.0
for o, gs in TM["groups"].items():
    for g, mix in gs.items():
        r = per_tonne(o, g, mix)
        if not r: continue
        out_g.setdefault(o, {})[g] = r
        modelled_t = r["t"] * r["modelled"]; tot_em += r["rf"] * modelled_t; tot_t += modelled_t; air_em += r["rf"] * r["air_share_of_em"] * modelled_t
GROUP_OF = {}
F = json.load(open(os.path.join(OUT, "food.json")))
for p in F["p"]: GROUP_OF[p["n"]] = p["g"]
out_p = {}
for n, os_ in TM["products"].items():
    g = GROUP_OF.get(n, "oth")
    for o, mix in os_.items():
        r = per_tonne(o, g, mix)
        if r: out_p.setdefault(n, {})[o] = r
summary = {"t_modelled": round(tot_t), "kt_co2e": round(tot_em / 1e6), "air_share_of_emissions": round(air_em / tot_em, 3),
           "kg_per_t": round(tot_em / tot_t, 1), "air_share_of_tonnes": round(TM["total"].get("air", 0) / sum(TM["total"].values()), 4)}
print(f"Modelled {tot_t/1e6:.1f} Mt; transport {tot_em/1e9:.2f} Mt CO2e ({tot_em/tot_t:.0f} kg/t); air = {summary['air_share_of_emissions']*100:.0f}% of emissions from {summary['air_share_of_tonnes']*100:.1f}% of tonnes")
write_json("transport-emissions.json", {"factors": EF, "summary": summary, "groups": out_g, "products": out_p,
    "assumptions": {"origin_leg_km": ORIGIN_LEG, "europe_leg_km": EU_LEG, "air_uplift": AIR_UPLIFT, "road_uplift": ROAD_UPLIFT, "channel_km": CHANNEL, "irish_sea_km": IRISH_SEA, "short_haul_max_km": SHORT_HAUL_KM},
    "source": "DESNZ GHG conversion factors 2026 (flat file v1.2), Freighting goods; HMRC 2025 import modes"})
