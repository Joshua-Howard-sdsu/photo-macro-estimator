import os
import requests
import re

USDA_API_KEY = os.getenv("USDA_API_KEY")
USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"


def get_usda_macros(label):
    """
    Query the USDA FoodData Central API for macros for the given food label.
    Returns a dict with calories, protein, carbs, fat if found, else None.
    """
    if not USDA_API_KEY:
        print("USDA_API_KEY not set in environment.")
        return None
    # Remove quantity from label, e.g. '3 tacos' -> 'taco'
    match = re.match(r"^(\d+)\s+(\w+)s?$", label.lower())
    if match:
        label = match.group(2)
    params = {
        "api_key": USDA_API_KEY,
        "query": label,
        "pageSize": 1,
        "dataType": ["Foundation", "SR Legacy", "Branded"]
    }
    try:
        resp = requests.get(USDA_SEARCH_URL, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        if data.get("foods"):
            food = data["foods"][0]
            nutrients = {n["nutrientName"].lower(): n["value"] for n in food.get("foodNutrients", [])}
            calories = nutrients.get("energy", nutrients.get("energy (kcal)", 0))
            protein = nutrients.get("protein", 0)
            carbs = nutrients.get("carbohydrate, by difference", 0)
            fat = nutrients.get("total lipid (fat)", 0)
            return {
                "calories": calories,
                "protein": protein,
                "carbs": carbs,
                "fat": fat
            }
        return None
    except Exception as e:
        print(f"USDA lookup failed for {label}: {e}")
        return None
