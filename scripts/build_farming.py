"""Welsh farming: land use and livestock from the June 2025 survey of agriculture and horticulture."""
import pandas as pd, json, os
from common import raw, write_json, OUT

f = raw("welsh_june_survey_2025.ods")
num = lambda x: (lambda s: round(float(s)) if s.replace(".", "", 1).lstrip("-").isdigit() else None)(str(x).replace(",", "").replace(" (r)", "").strip())
H = pd.read_excel(f, engine="odf", sheet_name="Historical_Series", header=None)
L = pd.read_excel(f, engine="odf", sheet_name="Land_Area", header=None)
Lv = pd.read_excel(f, engine="odf", sheet_name="Livestock", header=None)
out = {
    "yrs": [int(float(x)) for x in H.iloc[13, 1:].tolist()],
    "ls": {k: [num(x) for x in H.iloc[i, 1:].tolist()] for k, i in [("sheep", 14), ("cattle", 15), ("pigs", 16), ("poultry", 17)]},
    "land": {k: [num(x) for x in H.iloc[i, 1:].tolist()] for k, i in [("pasture", 6), ("rough", 7), ("newgrass", 8), ("arable", 9)]},
    "lu": {str(r[0]).strip(): num(r[28]) for _, r in L.iloc[5:27].iterrows()},
    "layers": {"yrs": [num(x) for x in Lv.iloc[34, 1:].tolist()], "v": [num(x) for x in Lv.iloc[35, 1:].tolist()]},
    "maize": {"yrs": list(range(1998, 2026)), "v": [num(x) for x in L.iloc[10, 1:].tolist()]},
}
em = os.path.join(OUT, "emissions.json")
if os.path.exists(em):  # population for "sheep per person"
    out["pop"] = sum(v["pop"][-1] for v in json.load(open(em))["la"].values())
print(f"Total farm area {out['lu']['TOTAL AREA ON FARMS']:,} ha; sheep {out['ls']['sheep'][-1]:,}")
write_json("farming.json", out)
