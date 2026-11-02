"""How the UK uses food: animal feed versus people, soy in detail, and calorie and protein self-sufficiency.

Inputs (data-raw/): FAOSTAT Food Balance Sheets for the UK with use elements (feed, food, processing...)
and calories/protein, and FAOSTAT Supply Utilization Accounts for the UK (follows soybean meal and oil)."""
import pandas as pd, json, os
from common import raw, write_json, OUT

F = pd.read_csv(raw("faostat_uk_food_balances.csv"))
S = pd.read_csv(raw("faostat_uk_sua.csv"))
years = sorted(int(y) for y in S["Year"].unique())
Q = F.pivot_table(index="Item", columns="Element", values="Value", aggfunc="mean").fillna(0)
P = S.pivot_table(index="Item", columns="Element", values="Value", aggfunc="mean").fillna(0)
g = lambda df, i, e: float(df.loc[i, e]) if i in df.index and e in df.columns else 0.0

# Soy: follow beans, meal (cake) and oil through to their uses, in tonnes
feed = g(P, "Cake of soya beans", "Feed") + g(P, "Soya beans", "Feed")
food = sum(g(P, i, "Food supply quantity (tonnes)") for i in ["Soya bean oil", "Soya sauce", "Soya beans"])
proc = g(P, "Soya bean oil", "Processed")
other = g(P, "Soya bean oil", "Other uses (non-food)") + g(P, "Cake of soya beans", "Other uses (non-food)")
tot = feed + food + proc + other
soy = {"feed": round(feed), "food": round(food), "proc": round(proc), "other": round(other), "feed_share": round(feed / tot, 3),
       "meal_imports": round(g(P, "Cake of soya beans", "Import quantity")), "meal_made_here": round(g(P, "Cake of soya beans", "Production")),
       "bean_imports": round(g(P, "Soya beans", "Import quantity")), "beans_crushed": round(g(P, "Soya beans", "Processed")),
       "oil_imports": round(g(P, "Soya bean oil", "Import quantity"))}
meals = [{"n": n, "feed": round(g(P, i, "Feed")), "imports": round(g(P, i, "Import quantity")), "made_here": round(g(P, i, "Production"))}
         for n, i in [("Soybean meal", "Cake of soya beans"), ("Rapeseed meal", "Cake of rapeseed"), ("Sunflower meal", "Cake of sunflower seed"), ("Palm kernel meal", "Cake of palm kernel")]]

# Share of each main crop fed to animals (from the food balance sheets)
feedshare = {n: round(g(Q, i, "Feed") / g(Q, i, "Domestic supply quantity"), 3) for n, i in
             [("Wheat", "Wheat and products"), ("Barley", "Barley and products"), ("Maize", "Maize and products"), ("Oats", "Oats")]}

# Calories and protein: share supplied by UK production (production / supply, capped at 100% per food)
ss = (Q["Production"] / Q["Domestic supply quantity"]).replace([float("inf")], 0).fillna(0).clip(upper=1)
K, Pr = Q["Food supply (kcal/capita/day)"], Q["Protein supply quantity (g/capita/day)"]
fb = json.load(open(os.path.join(OUT, "food-balance.json")))  # run build_food_balance.py first
ws = pd.Series({r["item"]: r["ws"] for r in fb["rows"] if r.get("ws") is not None})
imp = K * (1 - ss); known = imp[imp.index.isin(ws.index)]
kcal = {"total": round(float(K.sum())), "home_share": round(float((K * ss).sum() / K.sum()), 3),
        "imported_share": round(float(imp.sum() / K.sum()), 3),
        "imported_ws_share": round(float((known * ws.reindex(known.index)).sum() / known.sum()), 3),
        "coverage": round(float(known.sum() / imp.sum()), 3),
        "protein_home_share": round(float((Pr * ss).sum() / Pr.sum()), 3)}
print(f"Soy used as feed: {soy['feed_share']*100:.0f}% by weight. Calories home-grown: {kcal['home_share']*100:.0f}%; protein {kcal['protein_home_share']*100:.0f}%")
write_json("food-uses.json", {"years": years, "soy": soy, "meals": meals, "feedshare": feedshare, "kcal": kcal})

# ---- People or animals: every food's use, by food group ----
# Food (what people eat) = domestic supply minus every other use, FAO's own accounting identity.
# Processing (turning one product into another that is counted separately, such as milk into butter
# or seeds into oil and meal) is left out, so nothing is counted twice. Oilseed meals aren't in the
# food balance sheets, so they're added from the supply utilization accounts, all as feed.
import re as _re
_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "build_food_balance.py")).read()
M = eval(_re.search(r"M = (\{.*?\n\})", _src, _re.S).group(1))
GROUPS = {"cer": "Cereals", "veg": "Vegetables, potatoes and pulses", "fru": "Fruit and nuts", "oil": "Oils and oilseeds", "dai": "Milk, dairy and eggs",
          "mt": "Meat", "fish": "Fish and seafood", "cof": "Sugar, cocoa, coffee and tea", "drk": "Drinks", "meal": "Oilseed meals"}
USES = ["people", "animals", "nonfood", "seedloss"]
fb_ws = {r["item"]: r["ws"] for r in fb["rows"]}
EXCL = {"Sugar beet", "Sugar cane", "Alcohol, Non-Food", "Miscellaneous", "Infant food"}
grp = {k: dict.fromkeys(USES, 0.0) for k in GROUPS}
imp_use = dict.fromkeys(USES, 0.0); ws_use = dict.fromkeys(USES, 0.0); items_out = []
for it, r in Q.iterrows():
    if it in EXCL: continue
    gk = M.get(it, (it, None, []))[1]
    if gk not in GROUPS: continue
    dom = r.get("Domestic supply quantity", 0)
    u = {"animals": r.get("Feed", 0), "nonfood": r.get("Other uses (non-food)", 0), "seedloss": r.get("Seed", 0) + r.get("Losses", 0)}
    food = dom - (sum(u.values()) + r.get("Processing", 0) + r.get("Residuals", 0))
    u["people"] = max(food, 0)
    tot = sum(u.values())
    if tot <= 0: continue
    for k in USES: grp[gk][k] += u[k]
    share = {k: u[k] / tot for k in USES}
    imp = r.get("Import quantity", 0)
    for k in USES: imp_use[k] += imp * share[k]
    w = fb_ws.get(it)
    if w is not None:
        for k in USES: ws_use[k] += imp * w * share[k]
    items_out.append({"item": it, "n": M.get(it, (it,))[0], "g": gk, **{k: round(u[k]) for k in USES}})
for n_, i_ in [("Soybean meal", "Cake of soya beans"), ("Rapeseed meal", "Cake of rapeseed"), ("Sunflower meal", "Cake of sunflower seed"), ("Palm kernel meal", "Cake of palm kernel")]:
    f_ = g(P, i_, "Feed") / 1000; grp["meal"]["animals"] += f_; imp_use["animals"] += g(P, i_, "Import quantity") / 1000
groups_out = [{"k": k, "n": GROUPS[k], **{u_: round(v[u_]) for u_ in USES}} for k, v in grp.items() if sum(v.values()) > 50]
tot_all = {u_: sum(x[u_] for x in groups_out) for u_ in USES}
palm = {"nonfood_share": round(g(Q, "Palm Oil", "Other uses (non-food)") / max(1, g(Q, "Palm Oil", "Domestic supply quantity")), 3)}
extra = {"groups": groups_out, "totals": tot_all, "imports": {k: round(v) for k, v in imp_use.items()},
         "ws_imports": {k: round(v) for k, v in ws_use.items()}, "items": items_out, "palm": palm}
out = json.load(open(os.path.join(OUT, "food-uses.json"))); out.update(extra)
T = sum(tot_all.values())
print("All food used in the UK (thousand t): " + ", ".join(f"{k} {tot_all[k]/T*100:.0f}%" for k in USES))
TI = sum(imp_use.values()); print("Imports: " + ", ".join(f"{k} {imp_use[k]/TI*100:.0f}%" for k in USES))
write_json("food-uses.json", out)

# ---- Deforestation risk in UK imports, by end use ----
# Oilseed crops are split by what their oil and meal are used for (by weight, from the supply utilization accounts).
# Other crops (cocoa, beef, coffee, fruit...) are treated as food for people.
def oilseed_split(seed, oil, meal, kernel_oil=None, extra_food=()):
    animals = g(P, meal, "Feed") + g(P, seed, "Feed")
    people = g(P, oil, "Food supply quantity (tonnes)") + g(P, seed, "Food supply quantity (tonnes)") + g(P, oil, "Processed") + sum(g(P, x, "Food supply quantity (tonnes)") for x in extra_food)
    nonfood = g(P, oil, "Other uses (non-food)") + (g(P, kernel_oil, "Other uses (non-food)") if kernel_oil else 0)
    t = animals + people + nonfood
    return {"people": people / t, "animals": animals / t, "nonfood": nonfood / t}
SPLIT = {"Soya beans": oilseed_split("Soya beans", "Soya bean oil", "Cake of soya beans", extra_food=("Soya sauce",)),
         "Sunflower seed": oilseed_split("Sunflower seed", "Sunflower-seed oil, crude", "Cake of sunflower seed"),
         "Oil palm fruit": oilseed_split("Palm kernels", "Palm oil", "Cake of palm kernel", "Oil of palm kernel"),
         "Rape or colza seed": oilseed_split("Rape or colza seed", "Rapeseed or canola oil, crude", "Cake of rapeseed")}
food_json = json.load(open(os.path.join(OUT, "food.json")))
defo = dict.fromkeys(["people", "animals", "nonfood"], 0.0); defo_by = {}
for fam_, d_ in food_json["fam"].items():
    ha = sum(d_.values()); s_ = SPLIT.get(fam_, {"people": 1, "animals": 0, "nonfood": 0})
    for k in defo: defo[k] += ha * s_[k]
    if fam_ in SPLIT: defo_by[fam_] = {k: round(ha * v) for k, v in s_.items()}
out = json.load(open(os.path.join(OUT, "food-uses.json")))
out["defo_uses"] = {k: round(v) for k, v in defo.items()}; out["defo_split"] = {k: {kk: round(vv, 3) for kk, vv in v.items()} for k, v in SPLIT.items()}; out["defo_by"] = defo_by
T = sum(defo.values()); print("Deforestation risk by end use: " + ", ".join(f"{k} {v/T*100:.0f}%" for k, v in defo.items()))
write_json("food-uses.json", out)
