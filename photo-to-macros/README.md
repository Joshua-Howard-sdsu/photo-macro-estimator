# Photo to Macros

A web application that analyzes food photos to identify the food and provide nutritional information.

## Features

- Upload food photos via drag-and-drop or file selection
- AI-powered food recognition using Google Cloud Vision API
- Get nutritional information including calories, protein, carbs, and fat
- Modern, responsive UI built with React and Tailwind CSS

## Setup

### Prerequisites

- Python 3.9+ 
- Node.js 18+
- Google Cloud account with Vision API enabled

### Google Cloud Vision API Setup

1. Create a Google Cloud account and project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the Vision API for your project:
   - Go to APIs & Services > Library
   - Search for "Vision"
   - Click on "Cloud Vision API"
   - Click "Enable"
3. Create a service account:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "Service Account"
   - Enter a name and description
   - Grant the role "Cloud Vision API User"
   - Click "Done"
4. Create and download a service account key:
   - Find your service account in the list
   - Click on the service account name
   - Go to the "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Click "Create" to download the key file
5. Rename the downloaded file to `GCV_API.json`
6. Place the file in one of these locations:
   - Project root directory
   - `photo-to-macros/credentials/` directory

### Backend Setup

1. Create a virtual environment:
   ```
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   source .venv/bin/activate  # macOS/Linux
   ```

2. Install backend dependencies:
   ```
   cd photo-to-macros
   pip install -r requirements.txt
   ```

3. Run the backend server:
   ```
   python run_api.py
   ```

### Frontend Setup

1. Install frontend dependencies:
   ```
   cd photo-to-macros/frontend
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Open the application in your browser at `http://localhost:5173`

## Troubleshooting

### Google Vision API Credentials Issues

If you encounter errors related to Google Vision API credentials:

1. Make sure your Google Cloud project has:
   - Vision API enabled
   - Billing enabled
   - The service account has proper permissions

2. Try setting the credentials environment variable directly:
   ```
   # Windows
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your\GCV_API.json"
   
   # macOS/Linux
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/GCV_API.json"
   ```

## Project Structure

```
photo-to-macros/
├── api/                    # Backend API code
│   ├── main.py             # FastAPI application
│   ├── food_lookup.py      # Food database and nutritional info
│   └── prompts.py          # Text generation templates
├── credentials/            # Place for Google Cloud credentials
├── frontend/               # React frontend
│   ├── public/             # Static assets
│   └── src/                # Source code
│       ├── components/     # Reusable UI components
│       ├── pages/          # Application pages/routes
│       └── utils/          # Utility functions and API client
└── run_api.py              # API server starter
```
