# Photo to Macros

A web application that analyzes food photos to identify the food and provide nutritional information.

## Features

- Upload food photos via drag-and-drop or file selection
- AI-powered food recognition using Google Cloud Vision API
- Get nutritional information including calories, protein, carbs, and fat
- Modern, responsive UI built with React and Tailwind CSS

## Updated Setup for Easy Deployment

## Prerequisites

- Python 3.9+
- Node.js 18+
- Google Cloud Vision API credentials (see below)
- USDA FoodData Central API Key (free from https://fdc.nal.usda.gov/api-key-signup.html)

## Quick Start

### 1. Clone the repository
```sh
git clone <your-repo-url>
cd photo-macro-estimator/photo-to-macros
```

### 2. Set up environment variables

- Create a file named `.env` in `photo-to-macros/` with this content:
  ```
  USDA_API_KEY=your_usda_api_key_here
  ```
  (Do NOT commit your API key to version control.)

- Place your Google Vision API JSON file as `credentials/GCV_API.json`.

### 3. Backend Setup
```sh
python -m venv .venv
.venv\Scripts\activate  # Windows
# or
source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn api.main:app --reload
```

### 4. Frontend Setup
```sh
cd frontend
npm install
npm run dev
```

- Open [http://localhost:5173](http://localhost:5173) in your browser.

## Running the App
- Start the backend with `uvicorn api.main:app --reload` from inside `photo-to-macros/`.
- Start the frontend with `npm run dev` from inside `frontend/`.

## Environment Variables
- `.env` must be in `photo-to-macros/` directory for the backend to detect your USDA API key.
- Never commit `.env` or credential files to git.

## Google Cloud Vision API Setup (Summary)
1. Create a project on Google Cloud.
2. Enable the Vision API.
3. Create a service account with Vision API User role.
4. Download the JSON key and save as `credentials/GCV_API.json`.

## USDA FoodData Central API Setup
1. Sign up for a free API key at https://fdc.nal.usda.gov/api-key-signup.html
2. Add it to your `.env` file as shown above.

## Project Structure
```
photo-to-macros/
├── api/                # Backend FastAPI code
├── credentials/        # Place Google credentials here
├── frontend/           # React frontend
├── .env                # Your USDA API key (not committed)
├── requirements.txt    # Backend dependencies
└── README.md
```

## Troubleshooting
- If you see `USDA_API_KEY not set in environment`, check that `.env` is in the right place and restart the backend.
- If you see Google Vision API credential errors, check your service account JSON and path.

## Security
- Do NOT commit `.env` or credential files.
- Example `.env` for sharing:
  ```
  USDA_API_KEY=your_usda_api_key_here
  ```

---

This setup ensures anyone with the right API keys can run the app with minimal steps. For help, open an issue or see comments in the code.
