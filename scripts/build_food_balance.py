"""UK production versus imports (self-sufficiency) by food, from FAOSTAT Food Balance Sheets,
with the share of each food's imports (by value) coming from water-stressed countries."""
import pandas as pd, json, os
from common import raw, write_json, OUT

d = pd.read_csv(raw("faostat_uk_food_balances.csv"))
years = sorted(int(y) for y in d["Year"].unique())
p = d.pivot_table(index="Item", columns="Element", values="Value", aggfunc="mean").fillna(0)
p = p.rename(columns={"Production": "prod", "Import quantity": "imp", "Export quantity": "exp", "Domestic supply quantity": "dom"})
# Primary crops processed into other items, and non-food or catch-all lines
DROP = {"Sugar beet", "Sugar cane", "Alcohol, Non-Food", "Miscellaneous", "Infant food", "Fats, Animals, Raw", "Cottonseed"}
p = p[(p["dom"] >= 50) & ~p.index.isin(DROP)]

# Plain names, food groups (matching the imports page) and keywords to find each item's traded products
M = {
 "Milk - Excluding Butter": ("Milk and cheese", "dai", ["milk", "cheese", "yoghurt", "cream", "whey"]),
 "Butter, Ghee": ("Butter", "dai", ["butter of"]), "Eggs": ("Eggs", "dai", ["eggs"]),
 "Wheat and products": ("Wheat", "cer", ["wheat", "flour of wheat", "pasta", "bread", "pastry", "biscuit"]),
 "Barley and products": ("Barley", "cer", ["barley", "malt"]), "Oats": ("Oats", "cer", ["oats"]),
 "Rye and products": ("Rye", "cer", ["rye"]), "Maize and products": ("Maize (grain)", "cer", ["maize"]),
 "Rice and products": ("Rice", "cer", ["rice"]), "Cereals, other": ("Other cereals", "cer", ["cereal"]),
 "Potatoes and products": ("Potatoes", "veg", ["potatoes", "potato"]), "Tomatoes and products": ("Tomatoes", "veg", ["tomato"]),
 "Onions": ("Onions", "veg", ["onion"]), "Vegetables, other": ("Other vegetables", "veg", ["vegetable", "lettuce", "cabbage", "cauliflower", "carrot", "cucumber", "chillies", "mushroom", "leek", "spinach", "asparagus", "pumpkin", "garlic", "beans, green", "peas, green"]),
 "Peas": ("Peas (dried)", "veg", ["peas, dry"]), "Beans": ("Beans (dried)", "veg", ["beans, dry"]),
 "Pulses, Other and products": ("Other pulses", "veg", ["lentil", "chick", "broad beans"]), "Sweet potatoes": ("Sweet potatoes", "veg", ["sweet potato"]),
 "Apples and products": ("Apples", "fru", ["apple"]), "Bananas": ("Bananas", "fru", ["banana"]),
 "Oranges, Mandarines": ("Oranges and easy peelers", "fru", ["orange", "tangerine"]), "Lemons, Limes and products": ("Lemons and limes", "fru", ["lemon"]),
 "Grapes and products (excl wine)": ("Grapes", "fru", ["grape", "raisin"]), "Pineapples and products": ("Pineapples", "fru", ["pineapple"]),
 "Fruits, other": ("Other fruit", "fru", ["fruit", "berr", "strawberr", "raspberr", "mango", "avocado", "melon", "pear", "cherr", "peach", "plum", "kiwi"]),
 "Nuts and products": ("Nuts", "fru", ["nut", "almond", "cashew", "hazelnut", "walnut", "pistachio"]), "Olives (including preserved)": ("Olives", "fru", ["olives"]),
 "Bovine Meat": ("Beef", "mt", ["cattle", "bovine", "beef"]), "Mutton & Goat Meat": ("Lamb and mutton", "mt", ["sheep", "mutton", "lamb"]),
 "Pigmeat": ("Pork, bacon and ham", "mt", ["pig", "bacon", "sausage"]), "Poultry Meat": ("Chicken and poultry", "mt", ["chicken", "poultry", "turkey"]),
 "Offals, Edible": ("Offal", "mt", ["offal"]), "Meat, Other": ("Other meat", "mt", []),
 "Sugar (Raw Equivalent)": ("Sugar", "cof", ["sugar"]), "Sweeteners, Other": ("Other sweeteners", "cof", ["glucose", "fructose", "syrup"]),
 "Coffee and products": ("Coffee", "cof", ["coffee"]), "Cocoa Beans and products": ("Cocoa and chocolate", "cof", ["cocoa", "chocolate"]),
 "Tea (including mate)": ("Tea", "cof", ["tea"]), "Honey": ("Honey", "cof", ["honey"]),
 "Rape and Mustardseed": ("Rapeseed", "oil", ["rape"]), "Rape and Mustard Oil": ("Rapeseed oil", "oil", ["rapeseed oil", "rape or colza seed oil"]),
 "Soyabeans": ("Soybeans", "oil", ["soya beans"]), "Soyabean Oil": ("Soybean oil", "oil", ["soya bean oil"]),
 "Palm Oil": ("Palm oil", "oil", ["palm oil"]), "Sunflowerseed Oil": ("Sunflower oil", "oil", ["sunflower-seed oil"]),
 "Olive Oil": ("Olive oil", "oil", ["olive oil"]), "Groundnuts": ("Peanuts", "oil", ["groundnut"]),
 "Oilcrops Oil, Other": ("Other vegetable oils", "oil", []), "Oilcrops, Other": ("Other oilseeds", "oil", []), "Coconuts - Incl Copra": ("Coconuts", "oil", ["coconut"]), "Sunflower seed": ("Sunflower seeds", "oil", ["sunflower seed"]),
 "Beer": ("Beer", "drk", ["beer"]), "Wine": ("Wine", "drk", ["wine"]), "Beverages, Alcoholic": ("Spirits", "drk", ["alcohol"]), "Beverages, Fermented": ("Cider and other fermented drinks", "drk", ["cider"]),
 "Spices, Other": ("Spices", "spi", ["spice", "ginger", "turmeric", "cinnamon", "anise"]),
 "Pelagic Fish": ("Oily fish (mackerel, herring)", "fish", []), "Demersal Fish": ("White fish (cod, haddock)", "fish", []),
 "Freshwater Fish": ("Salmon and freshwater fish", "fish", []), "Crustaceans": ("Prawns and crabs", "fish", []), "Molluscs, Other": ("Shellfish", "fish", []),
}
food = json.load(open(os.path.join(OUT, "food.json")))  # run build_food.py first
C = food["c"]
rows = []
for item, r in p.iterrows():
    name, g, kws = M.get(item, (item, "oth", []))
    tv = ws = 0.0
    for prod in food["p"]:
        n = prod["n"].lower()
        if kws and any(k in n for k in kws):
            for k, v in prod["c"].items():
                tv += v
                if C.get(k, {}).get("w", -1) >= 3: ws += v
    rows.append({"item": item, "n": name, "g": g, "prod": round(r["prod"]), "imp": round(r["imp"]), "exp": round(r["exp"]), "dom": round(r["dom"]),
                 "ss": round(r["prod"] / r["dom"], 3) if r["dom"] else None, "ws": round(ws / tv, 3) if tv else None})
rows.sort(key=lambda x: -x["dom"])
for x in rows[:12]: print(f"{x['n']:<30} grows {x['ss']*100:5.0f}% of what it uses; water-stressed share of imports {x['ws']*100 if x['ws'] is not None else float('nan'):4.0f}%")
write_json("food-balance.json", {"years": years, "unit": "thousand tonnes, average of the years shown", "rows": rows})
