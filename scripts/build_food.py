"""UK food imports with water stress, drought, flood, warming and deforestation risk layers.

Inputs (data-raw/): FAOSTAT detailed trade matrix (UK reporter, all partners, import value),
WRI Aqueduct 4.0 country rankings zip, Singh et al. (2026) physical trade model CSV,
World Bank CCKP CMIP6 tas anomaly workbook (all periods, SSP1-2.6/3-7.0/5-8.5)."""
import pandas as pd, pycountry, zipfile, io, re
from common import raw, write_json
from classify import grp, GN

YEAR, DEFOR_YEAR = 2024, 2023
d = pd.read_csv(raw("faostat_uk_imports.csv"))
def iso3(n):
    n = int(n)
    if n == 158: return "TWN"
    c = pycountry.countries.get(numeric=f"{n:03d}")
    return c.alpha_3 if c else None
d["iso"] = d["Partner Country Code (M49)"].map(iso3)
d["g"] = d["Item"].map(grp)
d = d[d["Item"] != "Rice, paddy (rice milled equivalent)"]  # aggregate that double counts rice products
v = d[d["g"].notna() & (d["Year"] == YEAR) & (d["Element"] == "Import value") & (d["Value"] > 0)]

with zipfile.ZipFile(raw("aqueduct-4-0-country-rankings.zip")) as z:
    xl = io.BytesIO(z.read(next(n for n in z.namelist() if n.endswith(".xlsx"))))
base = pd.read_excel(xl, sheet_name="country_baseline"); xl.seek(0)
fut = pd.read_excel(xl, sheet_name="country_future")
def cats(df, ind, wt):
    x = df[(df.indicator_name == ind) & (df.weight == wt)].set_index("gid_0").cat
    return {k: int(c) for k, c in x.items() if pd.notna(c) and c >= 0}
W0, DR, FL = cats(base, "bws", "Irr"), cats(base, "drr", "Irr"), cats(base, "rfr", "Pop")
WF = {}
for yr in [2030, 2050, 2080]:
    for sc in ["opt", "bau", "pes"]:
        x = fut[(fut.indicator_name == "bws") & (fut.weight == "Irr") & (fut.year == yr) & (fut.scenario == sc)].set_index("gid_0").cat
        WF[f"{yr}{sc}"] = {k: int(c) for k, c in x.items() if pd.notna(c) and c >= 0}

cx = pd.ExcelFile(raw("cckp_tas_anomaly.xlsx"))
PER = {"2020-2039": "2030", "2040-2059": "2050", "2060-2079": "2070", "2080-2099": "2080"}
SCN = {"ssp126": "opt", "ssp370": "bau", "ssp585": "pes"}
T = {}
for sh in cx.sheet_names:
    per, sc = sh.split("_")
    for _, r in pd.read_excel(cx, sheet_name=sh).iterrows():
        if pd.notna(r.iloc[2]): T.setdefault(r["code"], {})[PER[per] + SCN[sc]] = round(float(r.iloc[2]), 2)

u = pd.read_csv(raw("deduce_physical_trade.csv"))
u = u[(u["Consumer country ISO"] == "GBR") & (u["Producer country ISO"] != "GBR")]
H = "Deforestation risk, amortized (ha)"
u23 = u[u["Year"] == DEFOR_YEAR]
dcom = set(u23["Commodity"])
def family(item):
    t = item.lower()
    if "cocoa" in t or "chocolate" in t: return "Cocoa beans"
    if ("palm" in t and "oil" in t) or "palm kernel" in t: return "Oil palm fruit"
    if "soya" in t or "soybean" in t: return "Soya beans"
    if re.search(r"\b(cattle|beef|bovine|veal)\b", t): return "Cattle meat"
    if "coffee" in t: return "Coffee, green"
    if item in dcom: return item
    for c in dcom:
        if t.split(",")[0] == c.lower().split(",")[0]: return c
    return None

NAMES = {'China, mainland':'China','China, Taiwan Province of':'Taiwan','United States of America':'United States','Russian Federation':'Russia','Netherlands (Kingdom of the)':'Netherlands','Viet Nam':'Vietnam','Iran (Islamic Republic of)':'Iran','Republic of Korea':'South Korea','Bolivia (Plurinational State of)':'Bolivia','Venezuela (Bolivarian Republic of)':'Venezuela','United Republic of Tanzania':'Tanzania','Republic of Moldova':'Moldova','Syrian Arab Republic':'Syria',"Lao People's Democratic Republic":'Laos','China, Hong Kong SAR':'Hong Kong','Democratic Republic of the Congo':'DR Congo','United Kingdom of Great Britain and Northern Ireland':'United Kingdom'}
fao_names = v.groupby("iso")["Partner Countries"].first()
years = list(range(2005, DEFOR_YEAR + 1))
dyr_t = u.groupby(["Producer country ISO", "Year"])[H].sum().unstack(fill_value=0).reindex(columns=years, fill_value=0)

C = {}
for iso in set(v["iso"].dropna()) | set(u23["Producer country ISO"]):
    n = fao_names.get(iso)
    if n is None:
        pc = pycountry.countries.get(alpha_3=iso); n = pc.name if pc else iso
    rec = {"n": NAMES.get(n, n)}
    for key, src in [("w", W0), ("dr", DR), ("fl", FL)]:
        if iso in src: rec[key] = src[iso]
    rec["wf"] = {k: WF[k][iso] for k in WF if iso in WF[k]}
    dd = u23[u23["Producer country ISO"] == iso]
    if dd[H].sum() >= 1:
        rec["d"] = round(dd[H].sum())
        rec["dt"] = [[k, round(x)] for k, x in dd.groupby("Commodity")[H].sum().sort_values(ascending=False).head(3).items()]
    if iso in T: rec["t"] = T[iso]
    C[iso] = rec

P = []
for item, x in v.groupby("Item"):
    if x["Value"].sum() < 500: continue
    byc = x.groupby("iso")["Value"].sum()
    P.append({"n": item, "g": x["g"].iloc[0], "c": {k: round(val) for k, val in byc.items() if val >= 1}, "f": family(item)})
fams = {p["f"] for p in P if p["f"]}
dcc = u23.groupby(["Commodity", "Producer country ISO"])[H].sum()
FAM = {c: {iso: round(val) for iso, val in dcc[c].items() if val >= 1} for c in dcom if c in fams}
top = u23.groupby("Commodity")[H].sum().sort_values(ascending=False)
out = {"c": C, "p": P, "fam": FAM, "gn": GN,
       "dtrend": {int(k): int(round(x)) for k, x in u.groupby("Year")[H].sum().items()},
       "dcom": [[k, round(x)] for k, x in top.head(8).items()] + [["Other", round(top.iloc[8:].sum())]],
       "dyr": {iso: [int(round(x)) for x in row] for iso, row in dyr_t.iterrows() if row.max() >= 1}, "dyrs": years,
       "ukt": T.get("GBR", {})}
tot = sum(sum(p["c"].values()) for p in P)
ws = sum(val for p in P for k, val in p["c"].items() if C.get(k, {}).get("w", -1) >= 3)
print(f"{len(P)} foods from {len(C)} countries; US${tot/1e6:.1f}bn; {ws/tot*100:.1f}% from water-stressed countries")
write_json("food.json", out)
