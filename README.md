# Photo to Macros

An application that analyzes food images and provides nutritional information.

## Features

- Food detection using Google Cloud Vision API
- Nutritional analysis using OpenAI Vision API (now with GPT-4.1)
- Display of calories, protein, carbs, and fat content
- Breakdown of individual items for compound foods
- Improved response handling and error recovery
- Component-based analysis for detailed nutritional information

## Recent Updates

- **OpenAI Integration Improvements**: Updated to use GPT-4.1 for more accurate analysis
- **Component-Based Food Analysis**: Better handling of combination meals with separate nutritional data for each component
- **Improved Error Handling**: Robust fallback mechanisms ensure users always get a response
- **Performance Optimization**: Faster response times with efficient API handling
- **Enhanced Documentation**: Comprehensive documentation added for all API integrations

## Setup

### Prerequisites

- Python 3.8+
- Node.js 14+
- Google Cloud Vision API credentials
- OpenAI API key

### Installation

1. Clone the repository
2. Install Python dependencies:
   ```
   cd photo-to-macros
   pip install -r requirements.txt
   ```
3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

### Configuration

1. Create a `.env` file in the project root with your API credentials:
   ```
   # Google Cloud Vision API credentials
   # Option 1: Set path to credentials file
   GOOGLE_APPLICATION_CREDENTIALS=path/to/your/GCV_API.json
   
   # Option 2: Set credentials JSON directly
   # GOOGLE_CREDENTIALS={"type":"service_account",...}
   
   # OpenAI API Key for Vision analysis
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Optional: Port settings
   PORT=8000
   ```

2. Obtain Google Cloud Vision API credentials:
   - Create a Google Cloud account
   - Enable the Vision API
   - Create a service account and download the JSON key
   - Place the JSON key in the project directory or set the environment variable

3. Obtain OpenAI API key:
   - Create an OpenAI account
   - Generate an API key from your account dashboard
   - Add the key to your `.env` file

### Running the Application

1. Start the backend server:
   ```
   cd photo-to-macros
   python run_api.py
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

## How It Works

1. User uploads a food image
2. Google Vision API identifies the food items
3. The system attempts to get nutritional data in this order:
   - OpenAI Vision API analysis (most accurate)
   - Local database lookup (fallback)
   - AI estimation (if no other data is available)
4. Results are displayed with a breakdown of nutritional information

## AI Techniques Used

- **Computer Vision**: Google Cloud Vision API is used to detect and identify food items in photos
- **Nutritional Analysis**: OpenAI's GPT-4.1 model performs the nutritional analysis directly from image content, providing calories and macronutrients
- **Multi-component Detection**: The system can identify multiple food items within a single image and analyze each separately
- **Natural Language Processing**: Used to extract meaningful food descriptions and present information in a readable format
- **Error Handling Intelligence**: Smart fallback mechanisms ensure the system can recover from errors and still provide useful information

### OpenAI Integration

The application uses OpenAI's GPT-4.1 model to analyze food images and extract detailed nutritional information. The process includes:

1. Sending the identified food items and the image to OpenAI
2. Receiving a structured JSON response with detailed nutritional data
3. Processing the response to display total nutrition and individual components

Example response format:
```json
{
  "total": {
    "calories": 660,
    "protein": 36,
    "carbs": 70,
    "fat": 24
  },
  "components": [
    {
      "name": "Street Tacos (3 carne asada/al pastor)",
      "calories": 450,
      "protein": 30,
      "carbs": 45,
      "fat": 20
    },
    {
      "name": "Salsa (red, small portion)",
      "calories": 15,
      "protein": 0,
      "carbs": 3,
      "fat": 0
    },
    {
      "name": "Lime Wedge & Garnish",
      "calories": 5,
      "protein": 0,
      "carbs": 1,
      "fat": 0
    }
  ]
}
```

## Documentation

For more detailed documentation:
1. Run the application
2. Navigate to the Documentation page in the app
3. Review the complete API integration details

## Credits

- Food detection: Google Cloud Vision API
- Nutritional analysis: OpenAI Vision API
- Frontend: React with Tailwind CSS
- Backend: FastAPI

## License

MIT
