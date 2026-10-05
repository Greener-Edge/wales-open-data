"""Rebuild every dataset in data/ from the raw downloads in data-raw/."""
import runpy, os
here = os.path.dirname(os.path.abspath(__file__))
for s in ["build_emissions", "build_wales_boundaries", "build_world", "build_epc", "build_food", "build_food_balance", "build_farming"]:
    print(f"\n== {s} ==")
    runpy.run_path(os.path.join(here, s + ".py"), run_name="__main__")
