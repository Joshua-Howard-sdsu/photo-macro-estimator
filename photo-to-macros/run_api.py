import os
import sys
import uvicorn

# Add the current directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Try a direct import instead of string-based import
try:
    from api.main import app
    print("Successfully imported the API module")
except ImportError as e:
    print(f"Error importing API module: {e}")
    # Show current sys.path for debugging
    print("Python path:")
    for path in sys.path:
        print(f"  - {path}")
    # Look for api directory
    print("\nLooking for API directory:")
    for item in os.listdir(current_dir):
        print(f"  - {item}")
    sys.exit(1)

if __name__ == "__main__":
    print("Starting FastAPI server...")
    # Use the imported app directly
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False) 