import re
from .usda_lookup import get_usda_macros

def get_macros_from_label(label):
    """
    Get macronutrient information for a given food label.
    Values are per 100g of food.
    """
    # Extract quantities from labels like "3 tacos"
    quantity = 1
    base_label = label.lower()
    
    # Check for quantity pattern like "3 tacos"
    quantity_match = re.match(r'^(\d+)\s+(\w+)s?$', label.lower())
    if quantity_match:
        quantity = int(quantity_match.group(1))
        base_label = quantity_match.group(2)
        # Remove trailing 's' if it exists
        if base_label.endswith('s') and len(base_label) > 1:
            base_label = base_label[:-1]
    else:
        base_label = base_label.strip()

    # Try USDA API first
    usda_macros = get_usda_macros(base_label)
    if usda_macros:
        # Scale macros by quantity if needed
        usda_macros = usda_macros.copy()
        if quantity > 1:
            for k in ['calories', 'protein', 'carbs', 'fat']:
                if k in usda_macros and isinstance(usda_macros[k], (int, float)):
                    usda_macros[k] *= quantity
        usda_macros['quantity'] = quantity
        usda_macros['base_item'] = base_label
        return usda_macros

    # If the label contains any of these words, use the first match
    compound_foods = {
        "pizza": ["pizza", "pepperoni", "cheese pizza", "slice"],
        "hamburger": ["burger", "cheeseburger", "hamburger", "beef burger"],
        "salad": ["salad", "garden salad", "caesar salad", "greek salad"],
        "pasta": ["pasta", "spaghetti", "noodle", "macaroni", "fettuccine", "linguine"],
        "rice": ["rice", "fried rice", "white rice", "brown rice"],
        "bread": ["bread", "toast", "baguette", "sourdough", "roll"],
        "chicken": ["chicken", "fried chicken", "grilled chicken", "roast chicken"],
        "steak": ["steak", "beef", "beef steak", "meat"],
        "soup": ["soup", "broth", "chowder", "stew"],
        "sandwich": ["sandwich", "sub", "wrap", "hoagie"],
        "cake": ["cake", "birthday cake", "chocolate cake", "cheesecake"],
        "cookie": ["cookie", "biscuit", "chocolate chip"],
        "ice cream": ["ice cream", "gelato", "frozen yogurt"],
        "fish": ["fish", "salmon", "tuna", "tilapia", "cod"],
        "french fries": ["fries", "french fries", "chips", "potato wedges"],
        "taco": ["taco", "tacos", "soft taco", "hard taco", "street taco"],
        "sushi": ["sushi", "maki", "nigiri", "sashimi"],
    }
    
    # Check if label matches any compound food keywords
    matched_key = None
    for food_key, keywords in compound_foods.items():
        if any(keyword in base_label for keyword in keywords):
            matched_key = food_key
            break
    
    # Use the matched key or the original base label
    lookup_label = matched_key if matched_key else base_label
    
    # Database of common foods with their macronutrients
    food_data = {
        # Fallback for generic "food"
        "food": {"calories": 200, "protein": 10, "carbs": 25, "fat": 8},
        
        # Basic foods
        "pizza": {"calories": 266, "protein": 11, "carbs": 33, "fat": 10},
        "apple": {"calories": 52, "protein": 0.3, "carbs": 14, "fat": 0.2},
        "banana": {"calories": 89, "protein": 1.1, "carbs": 23, "fat": 0.3},
        "orange": {"calories": 47, "protein": 0.9, "carbs": 12, "fat": 0.1},
        "strawberry": {"calories": 32, "protein": 0.7, "carbs": 7.7, "fat": 0.3},
        "grapes": {"calories": 69, "protein": 0.6, "carbs": 18, "fat": 0.2},
        "watermelon": {"calories": 30, "protein": 0.6, "carbs": 7.6, "fat": 0.2},
        "pineapple": {"calories": 50, "protein": 0.5, "carbs": 13, "fat": 0.1},
        "mango": {"calories": 60, "protein": 0.8, "carbs": 15, "fat": 0.4},
        "avocado": {"calories": 160, "protein": 2, "carbs": 8.5, "fat": 15},
        "carrot": {"calories": 41, "protein": 0.9, "carbs": 10, "fat": 0.2},
        "broccoli": {"calories": 34, "protein": 2.8, "carbs": 7, "fat": 0.4},
        "spinach": {"calories": 23, "protein": 2.9, "carbs": 3.6, "fat": 0.4},
        "tomato": {"calories": 18, "protein": 0.9, "carbs": 3.9, "fat": 0.2},
        "potato": {"calories": 77, "protein": 2, "carbs": 17, "fat": 0.1},
        "sweet potato": {"calories": 86, "protein": 1.6, "carbs": 20, "fat": 0.1},
        "onion": {"calories": 40, "protein": 1.1, "carbs": 9.3, "fat": 0.1},
        "garlic": {"calories": 149, "protein": 6.4, "carbs": 33, "fat": 0.5},
        "rice": {"calories": 130, "protein": 2.7, "carbs": 28, "fat": 0.3},
        "bread": {"calories": 265, "protein": 9, "carbs": 49, "fat": 3.2},
        "pasta": {"calories": 158, "protein": 5.8, "carbs": 31, "fat": 1.1},
        "oats": {"calories": 389, "protein": 16.9, "carbs": 66, "fat": 6.9},
        "quinoa": {"calories": 120, "protein": 4.4, "carbs": 21, "fat": 1.9},
        "chicken": {"calories": 239, "protein": 27, "carbs": 0, "fat": 14},
        "steak": {"calories": 271, "protein": 26, "carbs": 0, "fat": 19},
        "pork": {"calories": 242, "protein": 26, "carbs": 0, "fat": 14},
        "lamb": {"calories": 294, "protein": 25, "carbs": 0, "fat": 21},
        "fish": {"calories": 206, "protein": 22, "carbs": 0, "fat": 12},
        "salmon": {"calories": 208, "protein": 20, "carbs": 0, "fat": 13},
        "tuna": {"calories": 144, "protein": 30, "carbs": 0, "fat": 1},
        "shrimp": {"calories": 99, "protein": 24, "carbs": 0, "fat": 0.3},
        "egg": {"calories": 155, "protein": 13, "carbs": 1.1, "fat": 11},
        "milk": {"calories": 42, "protein": 3.4, "carbs": 5, "fat": 1},
        "cheese": {"calories": 402, "protein": 25, "carbs": 1.3, "fat": 33},
        "yogurt": {"calories": 59, "protein": 3.5, "carbs": 5, "fat": 3.3},
        "butter": {"calories": 717, "protein": 0.9, "carbs": 0.1, "fat": 81},
        "olive oil": {"calories": 884, "protein": 0, "carbs": 0, "fat": 100},
        
        # Compound foods
        "hamburger": {"calories": 295, "protein": 17, "carbs": 30, "fat": 14},
        "french fries": {"calories": 312, "protein": 3.4, "carbs": 41, "fat": 15},
        "salad": {"calories": 152, "protein": 1.2, "carbs": 3.3, "fat": 15},
        "sandwich": {"calories": 290, "protein": 15, "carbs": 38, "fat": 9},
        "sushi": {"calories": 150, "protein": 6, "carbs": 30, "fat": 0.5},
        "taco": {"calories": 210, "protein": 9, "carbs": 21, "fat": 10},
        "burrito": {"calories": 329, "protein": 14, "carbs": 50, "fat": 9},
        "soup": {"calories": 75, "protein": 4, "carbs": 9, "fat": 2.5},
        "ice cream": {"calories": 207, "protein": 3.5, "carbs": 24, "fat": 11},
        "cake": {"calories": 367, "protein": 5, "carbs": 50, "fat": 16},
        "cookie": {"calories": 502, "protein": 6.4, "carbs": 61, "fat": 25},
        "chocolate": {"calories": 546, "protein": 7.8, "carbs": 61, "fat": 31},
    }
    
    # Get the base macros
    base_macros = food_data.get(lookup_label.lower(), {})
    
    # If we found macros and have a quantity > 1, multiply the values
    if base_macros and quantity > 1:
        return {
            "calories": base_macros.get("calories", 0) * quantity,
            "protein": base_macros.get("protein", 0) * quantity,
            "carbs": base_macros.get("carbs", 0) * quantity,
            "fat": base_macros.get("fat", 0) * quantity,
            "quantity": quantity,
            "base_item": lookup_label
        }
    
    return base_macros