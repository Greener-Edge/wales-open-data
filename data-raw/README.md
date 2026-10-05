# Raw data

These files are not committed (they're large, and each source publishes its own). Download each one into this folder with the file name shown, then run `python scripts/build_all.py` from the repo root.

| File name here | Source | How to get it |
|---|---|---|
| `2005-24-uk-local-authority-ghg-emissions.xlsx` | DESNZ, UK local authority and regional GHG emissions statistics, 2005 to 2024 | gov.uk statistics page, "data tables" Excel file |
| `gb_lad.json` | ONS local authority boundaries via the UK-GeoJSON project | `raw.githubusercontent.com/martinjc/UK-GeoJSON/master/json/administrative/gb/lad.json` |
| `non-domestic-csv.zip` | MHCLG Energy Performance of Buildings Data | get-energy-performance-data.communities.gov.uk, Download files, Non-domestic EPCs (GOV.UK One Login needed) |
| `ne_110m_admin_0_countries.geojson` | Natural Earth 1:110m countries | `raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson` |
| `faostat_uk_imports.csv` | FAO, FAOSTAT Detailed Trade Matrix | fao.org/faostat, Detailed trade matrix: reporter United Kingdom, all partners, elements Import value and Import quantity, all items, latest two years, CSV |
| `aqueduct-4-0-country-rankings.zip` | WRI Aqueduct 4.0 country rankings | wri.org/data/aqueduct-40-country-rankings |
| `deduce_physical_trade.csv` | Singh et al. (2026), version 2.1 | doi.org/10.5281/zenodo.18953516, file 2 (physical trade model), renamed |
| `cckp_tas_anomaly.xlsx` | World Bank Climate Change Knowledge Portal | Download Data: global_countries, cmip6-x0.25, climatology, tas, anomaly, annual, all four periods, median, ssp126 + ssp370 + ssp585; renamed |
| `welsh_june_survey_2025.ods` | Welsh Government, Survey of agriculture and horticulture: June 2025 | gov.wales statistics release, data spreadsheet |

When a source publishes a new edition, download it, keep the same file name, rebuild, and check the printed totals against the source's own headline figures before pushing.
