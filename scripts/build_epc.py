"""Current non-domestic EPCs in Wales by council, from the MHCLG Energy Performance of Buildings bulk download."""
import pandas as pd, numpy as np, zipfile, io
from common import raw, write_json, WALES_CODES

COLS = ['certificate_number','address','postcode','local_authority','local_authority_label','asset_rating_band','property_type','lodgement_date','transaction_type','main_heating_fuel','floor_area','uprn']
parts = []
with zipfile.ZipFile(raw("non-domestic-csv.zip")) as z:
    for name in sorted(n for n in z.namelist() if n.startswith("certificates-") and n.endswith(".csv")):
        with z.open(name) as fh:
            for ch in pd.read_csv(fh, usecols=COLS, chunksize=200000, low_memory=False):
                parts.append(ch[ch["local_authority"].astype(str).str.startswith("W06")])
w = pd.concat(parts, ignore_index=True)
w["lodgement_date"] = pd.to_datetime(w["lodgement_date"], errors="coerce")
# One record per building: latest certificate, matched on UPRN where available, otherwise address
addr = "A" + w["address"].astype(str).str.lower().str.strip() + "|" + w["postcode"].astype(str).str.upper().str.replace(" ", "")
w["key"] = np.where(w["uprn"].notna(), "U" + w["uprn"].fillna(0).astype("int64").astype(str), addr)
w = w.drop_duplicates("certificate_number").sort_values("lodgement_date").drop_duplicates("key", keep="last")
w = w.drop(columns=["address", "postcode"])  # no address data beyond this point
DOWNLOAD_DATE = "2026-10-02"  # date the bulk file was downloaded; certificates from the 10 years before count as current
CUTOFF = pd.Timestamp(DOWNLOAD_DATE) - pd.DateOffset(years=10)
V = w[w["lodgement_date"] >= CUTOFF].copy()

def group(t):
    t = str(t).lower()
    if "retail" in t: return "ret"
    if "office" in t: return "off"
    if any(x in t for x in ("restaurant", "hotel", "assembly", "leisure")): return "hos"
    if any(x in t for x in ("industrial", "storage", "distribution")): return "ind"
    return "oth"
V["g"] = V["property_type"].map(group)
V["big"] = V["floor_area"] > 1000
V["let"] = V["transaction_type"].str.contains("to let", na=False)
BANDS = ['A+','A','B','C','D','E','F','G']
count = lambda d: [int((d["asset_rating_band"] == b).sum()) for b in BANDS]

la = {}
for name, code in WALES_CODES.items():
    x = V[V["local_authority_label"] == name]; la[code] = {"name": name}
    for g in ["all", "ret", "off", "hos", "ind", "oth"]:
        y = x if g == "all" else x[x["g"] == g]
        la[code][g] = {"all": count(y), "big": count(y[y["big"]]), "bigLet": count(y[y["big"] & y["let"]])}
below = V[V["big"] & ~V["asset_rating_band"].isin(["A+", "A", "B"])]
fuel = below["main_heating_fuel"].fillna("Other").replace({"Grid Supplied Electricity": "Electricity (grid)", "Natural Gas": "Mains gas"}).value_counts()
fuelj = {k: int(v) for k, v in fuel.head(4).items()}; fuelj["Other"] = int(fuel.iloc[4:].sum())
grp_big = {g: count(V[V["big"] & (V["g"] == g)]) for g in ["ret", "off", "hos", "ind", "oth"]}
print(f"{len(V):,} current certificates; {int(V['big'].sum()):,} large; {len(below):,} large below B")
write_json("epc.json", {"la": la, "fuel": fuelj, "grpBig": grp_big, "bands": BANDS, "cutoff": str(CUTOFF.date())})
