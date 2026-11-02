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
