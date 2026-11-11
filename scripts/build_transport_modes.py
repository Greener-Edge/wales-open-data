"""How UK food imports arrive: mode of transport by origin, food group and (for 50 key foods) product,
from HMRC's bulk import data sets (Overseas Trade Statistics, Open Government Licence).

Inputs (data-raw/hmrc/): the twelve monthly BDSimpYYMM.txt files for a year and a SMKA12 control file.
Mode is the mode at the UK border (data element 7/4), not the whole journey."""
import glob, os, json, collections
import pycountry
from common import RAW, write_json, OUT

HM = os.path.join(RAW, "hmrc")
files = sorted(glob.glob(os.path.join(HM, "BDSimp*.txt")))
if not files: raise SystemExit("Missing data-raw/hmrc/BDSimpYYMM.txt files. See data-raw/README.md.")
MODES = {"10": "sea", "60": "roro", "40": "air", "30": "road", "20": "rail", "70": "road", "80": "sea", "50": "other", "90": "other", "00": "other", "": "unknown"}
# Food and drink chapters only (no live animals, flowers, tobacco or non-food plant products)
FOOD_CH = {"02", "03", "04", "07", "08", "09", "10", "11", "12", "15", "16", "17", "18", "19", "20", "21", "22", "23"}
def group(cc):
    ch, h4 = cc[:2], cc[:4]
    if ch == "02": return "mt"
    if ch == "03" or h4 in ("1604", "1605"): return "fish"
    if ch == "04": return "dai"
    if ch == "07" or h4 in ("2001", "2002", "2003", "2004", "2005"): return "veg"
    if ch == "08" or h4 in ("2006", "2007", "2008"): return "fru"
    if h4 in ("0901", "0902", "0903") or ch in ("17", "18"): return "cof"
    if ch == "09" or ch == "21": return "spi"
    if ch in ("10", "11", "19"): return "cer"
    if ch in ("12", "15"): return "oil"
    if ch == "16": return "mt"
    if ch == "22" or h4 == "2009": return "drk"
    if ch == "23": return "feed"
    return "oth"
# 50 key foods: FAO item -> HMRC commodity code prefixes (checked against the SMKA12 descriptions)
PRODUCTS = {
 "Tomatoes": ["0702"], "Grapes": ["080610"], "Bananas": ["080390"], "Apples": ["080810"], "Pears": ["080830"], "Avocados": ["080440"],
 "Strawberries": ["081010"], "Raspberries": ["081020"], "Blueberries": ["081040"], "Cranberries": ["081040"], "Cherries": ["08092"],
 "Mangoes, guavas and mangosteens": ["080450"], "Papayas": ["080720"], "Pineapples": ["080430"], "Oranges": ["080510"],
 "Tangerines, mandarins, clementines": ["08052"], "Lemons and limes": ["080550"], "Peaches and nectarines": ["080930"],
 "Asparagus": ["070920"], "Lettuce and chicory": ["0705"], "Cucumbers and gherkins": ["0707"], "Onions and shallots, dry (excluding dehydrated)": ["070310"],
 "Cauliflowers and broccoli": ["070410"], "Mushrooms and truffles": ["07095"], "Chillies and peppers, green (Capsicum spp. and Pimenta spp.)": ["070960"],
 "Green corn (maize)": ["07099960"], "Peas, green": ["070810"], "Other beans, green": ["070820"], "Potatoes, frozen": ["200410", "071010"],
 "Vegetables frozen": ["0710"], "Olive oil": ["1509"], "Palm oil": ["1511"], "Sunflower-seed oil, crude": ["151211"],
 "Coffee, green": ["09011"], "Coffee, decaffeinated or roasted": ["09012"], "Tea leaves": ["0902"], "Cocoa beans": ["1801"], "Cocoa butter, fat and oil": ["1804"],
 "Rice, milled": ["100630"], "Husked rice": ["100620"], "Wheat": ["1001"], "Maize (corn)": ["1005"], "Soya beans": ["1201"], "Cake of soya beans": ["2304"],
 "Meat of cattle boneless, fresh or chilled": ["020130"], "Meat of chickens, fresh or chilled": ["020711", "020713"], "Meat of sheep, fresh or chilled": ["02041", "02042", "02043"],
 "Cheese from whole cow milk": ["0406"], "Butter of cow milk": ["040510"], "Wine": ["2204"], "Beer of barley, malted": ["2203"], "Orange juice": ["20091"],
 "Raw cane or beet sugar (centrifugal only)": ["17011"], "Refined sugar": ["170199"]}
SPECIAL = {"XS": "SRB", "XK": "XKX", "EL": "GRC", "UK": "GBR"}
def iso3(a2):
    if a2 in SPECIAL: return SPECIAL[a2]
    c = pycountry.countries.get(alpha_2=a2); return c.alpha_3 if c else None

grp = collections.defaultdict(lambda: collections.defaultdict(lambda: collections.Counter()))
prod = collections.defaultdict(lambda: collections.defaultdict(lambda: collections.Counter()))
total = collections.Counter(); air_cc = collections.Counter(); cc_mass = collections.Counter()
pref = sorted(((p, n) for n, ps in PRODUCTS.items() for p in ps), key=lambda x: -len(x[0]))
for fn in files:
    with open(fn, encoding="latin-1") as fh:
        for l in fh:
            if len(l) < 85 or l[6] != "1" or l[81:84] != "imp": continue
            cc = l[13:21]
            if cc[:2] not in FOOD_CH or not cc.isdigit(): continue
            a2 = l[40:42].strip() or l[29:31].strip()   # country of origin, else country of dispatch
            o = iso3(a2)
            if not o or o == "GBR": continue
            mode = MODES.get(l[42:44].strip(), "other"); m = int(l[56:68] or 0)
            grp[o][group(cc)][mode] += m; total[mode] += m; cc_mass[cc] += m
            if mode == "air": air_cc[cc] += m
            for p, n in pref:
                if cc.startswith(p): prod[n][o][mode] += m
desc = {}
for l in open(sorted(glob.glob(os.path.join(HM, "SMKA12*.txt")))[-1], encoding="latin-1"):
    if len(l) > 100 and l[:9].isdigit(): desc[l[:8]] = " ".join((l[94:155].strip() + " " + l[156:204].strip()).split())
t = lambda c: {k: round(v / 1000) for k, v in c.items() if v >= 500}   # tonnes
T = sum(total.values())
out = {"source": "HMRC Overseas Trade Statistics bulk imports, " + os.path.basename(files[0])[6:10] + " to " + os.path.basename(files[-1])[6:10],
       "unit": "tonnes (net mass)", "modes": ["sea", "roro", "air", "road", "rail", "other", "unknown"],
       "total": t(total), "groups": {o: {g: t(c) for g, c in gs.items()} for o, gs in grp.items()},
       "products": {n: {o: t(c) for o, c in os_.items() if sum(c.values()) >= 1000} for n, os_ in prod.items()},
       "top_air": [{"cc": c, "d": desc.get(c, c), "air_t": round(m / 1000), "air_share": round(m / cc_mass[c], 3)} for c, m in air_cc.most_common(30)]}
print("Food imports {:.1f} Mt; ".format(T / 1e9) + ", ".join(f"{k} {v/T*100:.1f}%" for k, v in total.most_common()))
write_json("transport-modes.json", out)
