"""Wales council emissions, 2005 onwards, from the DESNZ local authority GHG dataset (table 1.1)."""
import pandas as pd, numpy as np
from common import raw, write_json, WALES_CODES

df = pd.read_excel(raw("2005-24-uk-local-authority-ghg-emissions.xlsx"), sheet_name="1_1", header=4)
w = df[df["Region/Country"] == "Wales"].copy()
POP = "Population ('000s, mid-year estimate)"
SECTORS = {'ind':'Industry Total','com':'Commercial Total','pub':'Public Sector Total','dom':'Domestic Total','tra':'Transport Total','agr':'Agriculture Total','was':'Waste Total','lul':'LULUCF Net Emissions'}
years = sorted(int(y) for y in w["Calendar Year"].unique())

la = {}
for name, g in w.groupby("Local Authority"):
    g = g.sort_values("Calendar Year")
    rec = {"name": name}
    for k, col in SECTORS.items():
        rec[k] = [round(v, 1) for v in g[col]]
    rec["tot"] = [round(v, 1) for v in g["Grand Total"]]
    rec["lii"] = [round(v, 1) for v in g["Large Industrial Installations"]]
    rec["pop"] = [round(v, 2) for v in g[POP]]
    la[WALES_CODES[name]] = rec

# Driver groupings (our own) built from the DESNZ sub-sectors
num = df.columns[5:46]
sub = [c for c in num if "Total" not in c and c != "LULUCF Net Emissions"]
groups = {
    "Electricity": [c for c in sub if "Electricity" in c],
    "Landfill": ["Landfill"],
    "Large industrial sites": ["Large Industrial Installations"],
    "Gas": [c for c in sub if c.endswith("Gas")],
    "Other fuels (oil, coal)": [c for c in sub if "'Other'" in c and "Transport" not in c and "Waste" not in c],
    "Road transport": [c for c in sub if "Road" in c],
    "Farming (livestock, soils)": ["Agriculture Livestock", "Agriculture Soils"],
    "Other waste": ["Waste 'Other'"],
    "Rail and other transport": ["Diesel Railways", "Transport 'Other'"],
    "Land use and forestry": [c for c in sub if c.startswith("Net Emissions")],
}
assigned = sum(groups.values(), [])
assert sorted(assigned) == sorted(sub), "Every sub-sector must sit in exactly one driver group"
by_year = w.groupby("Calendar Year")[sub].sum()
drv = {k: [round(v, 0) for v in by_year[cols].sum(axis=1)] for k, cols in groups.items()}

tot = w.groupby("Calendar Year")["Grand Total"].sum()
print(f"Wales: {tot.iloc[0]/1000:.1f} Mt in {years[0]}, {tot.iloc[-1]/1000:.1f} Mt in {years[-1]}")
write_json("emissions.json", {"la": la, "drv": drv, "years": years})
