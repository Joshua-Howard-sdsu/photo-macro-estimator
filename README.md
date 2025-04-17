# 📸🍽️ Photo‑to‑Meal Macro Estimator

*A lightweight, API‑first service that turns a food photo into an instant macronutrient log for **NomLog***

---

## 1. What is this?

A FastAPI web service that:

1. Accepts an image upload from the user.
2. (Right now) always classifies it as "pizza" with fixed macros (mocked for testing).
3. Returns fake calories, protein, carbs & fats.
4. Includes a GPT‑style summary blurb (also mocked).

> **What's working now:** File upload to FastAPI is functional via Swagger UI (`/docs`).
> You can test the endpoint with any image to simulate a full recognition + nutrition result.

---

## 2. Project structure

```text
├─ api/                  # FastAPI service (mock working now)
│  ├─ main.py            # /analyze route
│  ├─ food_lookup.py     # mocked macros (returns pizza)
│  └─ prompts.py         # mocked GPT blurb
├─ data/
│  └─ usda_food.csv      # (not used yet)
├─ .env.sample           # API keys (Google, OpenAI)
├─ .gitignore
├─ requirements.txt      # Python deps
└─ README.md             # you are here
```

---

## 3. Quick‑start (local)

```bash
# 1. Clone & enter
$ git clone https://github.com/Joshua-Howard-sdsu/photo-macro-estimator.git
$ cd photo-macro-estimator

# 2. Set up virtual environment
$ python -m venv .venv
$ .venv\Scripts\activate

# 3. Install requirements
$ pip install -r requirements.txt

# 4. Run FastAPI server
$ uvicorn api.main:app --reload
```

Visit: [http://localhost:8000/docs](http://localhost:8000/docs) → upload an image and get a mocked prediction.

---

## 4. Key endpoints

| Method | Route                | Purpose                                                                 |
| ------ | -------------------- | ----------------------------------------------------------------------- |
| `POST` | `/analyze`           | Upload image → get fixed label ("pizza") and fake macros + summary     |

---

## 5. What’s coming next?

- 🔄 Replace mock label with real **Google Cloud Vision API** response
- 📊 Replace fake macros with **USDA CSV** lookup
- 🤖 Replace fake GPT summary with **real GPT-4 API** call
- 🌐 Add frontend (NomLog UI) to hit this `/analyze` endpoint

---

## 6. AI techniques used 🚀

| Course topic                 | Where it appears                                     |
| ---------------------------- | ---------------------------------------------------- |
| **Supervised Learning**      | (planned) via Google Vision's food classification     |
| **Knowledge Representation** | USDA food → macro lookup                             |
| **LLM prompting**            | GPT summary generation (mocked for now)              |

---

## 7. License

MIT © 2025 Josh Howard

