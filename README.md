# Wales and the UK, in open data

Interactive pages by Greener Edge Sustainability, built entirely on public, openly licensed data. Live at **greener-edge.github.io/wales-open-data**.

| Page | Folder |
|---|---|
| Where did Wales's emissions go? | `emissions/` |
| Is Wales's commercial property ready for EPC B? | `commercial-epc/` |
| The UK's food: imports and risk, grown in the UK, and Wales (three tabs) | `uk-food-imports/` |
| Check your supply chain (runs entirely in the browser) | `supply-chain-checker/` |
| What does Wales grow? (now redirects to the food page's Wales tab) | `what-wales-grows/` |
| Methods, sources and licences | `methods/` |

## How the repo is organised

```
index.html                 landing page
<page>/index.html          each page: layout and text only
assets/css/site.css        styles shared by every page
assets/css/<page>.css      styles for one page
assets/js/load.js          loads a page's data files, then its script
assets/js/<page>.js        the page's interactive code
data/*.json                processed data the pages read (generated, don't edit by hand)
scripts/                   Python that turns raw downloads into data/*.json
data-raw/                  raw downloads (not committed; see data-raw/README.md)
```

No build tools or frameworks: GitHub Pages serves the files as they are. The food map loads D3 from cdnjs.

## Viewing locally

Pages fetch their data, which browsers block for files opened directly from disk. Run a small local server from the repo root instead:

```
python -m http.server 8000
```

then open http://localhost:8000.

## Refreshing the data

```
pip install -r scripts/requirements.txt
python scripts/build_all.py
```

Each script prints headline figures (for example Wales's total emissions) so you can check them against the source before pushing. Individual datasets can be rebuilt with `python scripts/build_food.py` and so on.

## Licences

DESNZ, MHCLG and Welsh Government data: Open Government Licence v3.0. WRI Aqueduct 4.0: CC BY 4.0. World Bank CCKP: Open Database License. Singh et al. (2026): CC BY. FAOSTAT: FAO terms for statistical databases, with attribution. Boundaries: ONS (contains OS data © Crown copyright and database right) and Natural Earth (public domain). Full details on the Methods page.
