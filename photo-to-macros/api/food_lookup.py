def get_macros_from_label(label):
    fake_data = {
        "pizza": {"calories": 266, "protein": 11, "carbs": 33, "fat": 10},
        "apple": {"calories": 52, "protein": 0.3, "carbs": 14, "fat": 0.2},
    }
    return fake_data.get(label.lower(), {})