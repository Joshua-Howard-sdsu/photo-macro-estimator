def gpt_blurb(label, macros):
    return f"{label.capitalize()} is estimated to have {macros.get('calories', '?')} calories and {macros.get('protein', '?')}g protein. Great choice!"
