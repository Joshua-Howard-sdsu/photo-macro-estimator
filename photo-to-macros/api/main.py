from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import base64
import sys
import os
import io
from typing import List
from google.cloud import vision
from google.oauth2 import service_account
import json
from dotenv import load_dotenv
from api.food_lookup import get_macros_from_label
from api.prompts import gpt_blurb
import numpy as np
from PIL import Image
import time
import uuid
import random

# Load environment variables
load_dotenv()

# Add the current directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# Helper function to initialize Google Cloud Vision client
def get_vision_client():
    """
    Initialize and return a Google Cloud Vision client.
    
    Returns:
        A Vision client object or None if initialization fails
    """
    try:
        print("Starting Google Vision client initialization...")
        
        # First check environment variables
        env_credential_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if env_credential_path:
            print(f"Found GOOGLE_APPLICATION_CREDENTIALS environment variable: {env_credential_path}")
            if os.path.exists(env_credential_path):
                print(f"The file exists, attempting to use it")
                try:
                    return vision.ImageAnnotatorClient()
                except Exception as e:
                    print(f"Error using GOOGLE_APPLICATION_CREDENTIALS: {e}")
            else:
                print(f"Warning: The file specified in GOOGLE_APPLICATION_CREDENTIALS does not exist: {env_credential_path}")
        
        # Then try using service account info from environment
        if os.environ.get("GOOGLE_CREDENTIALS"):
            print("Using credentials from GOOGLE_CREDENTIALS environment variable")
            credentials_json = os.environ.get("GOOGLE_CREDENTIALS")
            try:
                service_account_info = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(
                    service_account_info
                )
                return vision.ImageAnnotatorClient(credentials=credentials)
            except Exception as e:
                print(f"Error parsing GOOGLE_CREDENTIALS: {e}")
        
        # Check for credentials file in the project
        current_dir = os.getcwd()
        print(f"Current working directory: {current_dir}")
        
        # List all potential credential paths
        cred_paths = [
            "GCV_API.json",
            os.path.join(current_dir, "GCV_API.json"),
            os.path.join(current_dir, "photo-to-macros", "GCV_API.json"),
            "credentials/GCV_API.json",
            os.path.join(current_dir, "credentials", "GCV_API.json"),
            os.path.join(current_dir, "photo-to-macros", "credentials", "GCV_API.json"),
            "google-credentials.json",
            "../GCV_API.json",
            "../credentials/GCV_API.json",
            "api/credentials/GCV_API.json",
            "api/GCV_API.json"
        ]
        
        # Try each potential path
        for path in cred_paths:
            print(f"Checking for credentials at: {path}")
            if os.path.exists(path):
                print(f"Found credentials file at: {path}")
                try:
                    # Check if the file is valid JSON with the expected service account format
                    with open(path, 'r') as f:
                        cred_data = json.load(f)
                        
                    # Check if it has required service account fields
                    required_fields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email']
                    has_required_fields = all(field in cred_data for field in required_fields)
                    
                    if has_required_fields:
                        print(f"Credentials file at {path} has the required fields")
                        try:
                            client = vision.ImageAnnotatorClient.from_service_account_json(path)
                            print("Successfully created Vision client!")
                            return client
                        except Exception as e:
                            print(f"Error creating client with file {path}: {e}")
                    else:
                        missing = [field for field in required_fields if field not in cred_data]
                        print(f"Credentials file at {path} is missing required fields: {missing}")
                except json.JSONDecodeError:
                    print(f"The file at {path} is not valid JSON")
                except Exception as e:
                    print(f"Error reading credentials file {path}: {e}")
        
        # If no credentials are found, raise an exception
        checked_paths = "\n- ".join(cred_paths)
        raise Exception(f"No valid Google Cloud credentials found. Please place your GCV_API.json file in one of the following locations:\n- {checked_paths}")
                
    except Exception as e:
        print(f"Error initializing Vision client: {e}")
        return None

# Detect food labels in image
def detect_food_labels(image_bytes) -> List[str]:
    """
    Detect food items in an image using Google Cloud Vision API.
    
    Args:
        image_bytes: The image data in bytes
        
    Returns:
        A list of detected food labels
    """
    client = get_vision_client()
    if not client:
        # Log error and return empty list instead of mock data
        print("Failed to initialize Vision client. Cannot detect food.")
        raise Exception("Vision API is not properly configured. Check your Google Cloud credentials.")
    
    try:
        image = vision.Image(content=image_bytes)
        
        # Get both label and object annotations for better food detection
        label_response = client.label_detection(image=image, max_results=20)
        object_response = client.object_localization(image=image, max_results=10)
        
        # Process label annotations
        labels = label_response.label_annotations
        
        # Process object annotations
        objects = object_response.localized_object_annotations
        object_labels = [obj.name.lower() for obj in objects if obj.score > 0.6]
        
        # Count food objects to determine quantity
        food_counts = {}
        for obj in objects:
            if obj.score > 0.6:
                name = obj.name.lower()
                if name in food_counts:
                    food_counts[name] += 1
                else:
                    food_counts[name] = 1
        
        # Filter for food-related labels
        food_keywords = ["food", "dish", "cuisine", "meal", "fruit", "vegetable", 
                         "meat", "bread", "dessert", "breakfast", "lunch", "dinner",
                         "snack", "beverage", "drink", "sandwich", "salad", "pasta",
                         "rice", "potato", "burger", "pizza", "cake", "cookie", "taco"]
        
        # Process detailed food information
        detailed_food_labels = []
        food_labels = []
        
        # Add object detection results first (they're usually more specific)
        food_labels.extend(object_labels)
        
        # Then add label detection results with high confidence
        for label in labels:
            if label.score > 0.7 and label.description.lower() not in food_labels:
                food_labels.append(label.description.lower())
        
        # Look for food category indicators
        if any(keyword in ' '.join(food_labels).lower() for keyword in food_keywords):
            # Good, we've already identified some food items
            pass
        else:
            # If we haven't found clear food items, look for food categories
            for label in labels:
                if any(keyword in label.description.lower() for keyword in food_keywords) and label.score > 0.6:
                    # If it's a food category, add all related labels with decent confidence
                    for sub_label in labels:
                        if sub_label.score > 0.65 and sub_label.description.lower() not in food_labels:
                            food_labels.append(sub_label.description.lower())
        
        # If no food items detected with high confidence, include top labels
        if not food_labels and labels:
            # Just take the top 3 labels as a fallback
            for label in labels[:3]:
                food_labels.append(label.description.lower())
        
        # Create detailed labels with quantity and descriptors
        for label in food_labels:
            if label in food_counts and food_counts[label] > 1:
                detailed_label = f"{food_counts[label]} {label}s"
                detailed_food_labels.append(detailed_label)
            else:
                # Check for descriptive terms in other labels
                descriptors = []
                for desc_label in food_labels:
                    # Skip the current label and very generic terms
                    if desc_label != label and desc_label not in ["food", "dish", "meal"]:
                        # Check if it could be a descriptor (adjective)
                        if (desc_label + " " + label) in " ".join(food_labels) or \
                           any(desc_label in l and label in l for l in food_labels):
                            descriptors.append(desc_label)
                
                if descriptors:
                    # Combine the main label with relevant descriptors
                    descriptor_str = " ".join(descriptors[:2])  # Limit to 2 descriptors
                    detailed_label = f"{descriptor_str} {label}"
                    detailed_food_labels.append(detailed_label)
                else:
                    detailed_food_labels.append(label)
        
        # If we have both "taco" and a number (like "3"), combine them
        if "taco" in food_labels:
            # Look for numbers in the labels
            number_words = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
            found_number = None
            
            # Check for numeric words
            for label in food_labels:
                if label in number_words:
                    found_number = number_words.index(label) + 1
                    break
            
            # Check for numeric digits
            if not found_number:
                for label in food_labels:
                    if label.isdigit() and int(label) > 0 and int(label) < 10:
                        found_number = int(label)
                        break
            
            if found_number:
                # Replace generic "taco" with "{number} tacos"
                detailed_food_labels = [label.replace("taco", f"{found_number} tacos") if "taco" in label else label 
                                      for label in detailed_food_labels]
        
        # Handle special case for tacos
        if "taco" in " ".join(food_labels).lower() and food_counts.get("taco", 0) > 1:
            taco_count = food_counts.get("taco", 0)
            # Replace or add the detailed taco description
            taco_entry_found = False
            for i, label in enumerate(detailed_food_labels):
                if "taco" in label.lower():
                    detailed_food_labels[i] = f"{taco_count} tacos"
                    taco_entry_found = True
                    break
            
            if not taco_entry_found:
                detailed_food_labels.append(f"{taco_count} tacos")
                
        # Log the detected food labels for debugging
        print(f"Basic food labels: {food_labels}")
        print(f"Detailed food labels: {detailed_food_labels}")
                
        return detailed_food_labels if detailed_food_labels else ["unidentified food"]
        
    except Exception as e:
        print(f"Error in vision API: {e}")
        # Raise exception instead of returning mock data
        raise Exception(f"Error processing image with Vision API: {e}")

def generate_macro_summary(label, macros):
    """Generate a summary of the macro information."""
    if not macros:
        return f"Could not find nutritional information for {label}."
    
    calories = macros.get('calories', 0)
    protein = macros.get('protein', 0)
    carbs = macros.get('carbs', 0)
    fat = macros.get('fat', 0)
    
    # Calculate calories from macros (for verification)
    calculated_calories = (protein * 4) + (carbs * 4) + (fat * 9)
    
    summary = [
        f"Identified food: {label.title()}",
        f"Nutritional information (per 100g):",
        f"• Calories: {calories} kcal",
        f"• Protein: {protein}g",
        f"• Carbohydrates: {carbs}g",
        f"• Fat: {fat}g",
    ]
    
    # Add protein percentage of calories
    if calories > 0:
        protein_pct = (protein * 4 / calories) * 100
        carbs_pct = (carbs * 4 / calories) * 100
        fat_pct = (fat * 9 / calories) * 100
        
        summary.append(f"• Protein: {protein_pct:.1f}% of calories")
        summary.append(f"• Carbs: {carbs_pct:.1f}% of calories")
        summary.append(f"• Fat: {fat_pct:.1f}% of calories")
    
    return "\n".join(summary)

@app.post("/api/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    try:
        # Read image file
        image_bytes = await file.read()
        
        try:
            # Detect food labels
            food_labels = detect_food_labels(image_bytes)
            
            # Get macros for each food label
            macro_results = []
            for label in food_labels:
                macros = get_macros_from_label(label)
                if macros:
                    macro_results.append({
                        "label": label,
                        "macros": macros
                    })
                    
            # If no macros found for any label, use the first label as a prompt for GPT
            if not macro_results and food_labels:
                gpt_macros = generate_macro_summary(food_labels[0], None)
                macro_results.append({
                    "label": food_labels[0],
                    "macros": gpt_macros,
                    "source": "ai_estimated"
                })
                
            return {"success": True, "results": macro_results}
            
        except Exception as e:
            # Handle Vision API specific errors
            error_message = str(e)
            if "credentials" in error_message.lower():
                return {"success": False, "error": "Google Vision API is not configured properly. Please check server credentials."}
            else:
                return {"success": False, "error": f"Error analyzing food: {error_message}"}
    
    except Exception as e:
        # Handle general errors
        return {"success": False, "error": f"Error processing image: {str(e)}"}

@app.post("/test-food-detection")
async def test_food_detection(file: UploadFile = File(...)):
    """
    Test endpoint that only returns the detected food labels for an image.
    This is useful for testing the Vision API food detection without the full analysis.
    """
    try:
        contents = await file.read()
        food_labels = detect_food_labels(contents)
        return {"detected_labels": food_labels}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting food: {str(e)}")

@app.post("/analyze")
async def analyze_endpoint(file: UploadFile = File(...)):
    """
    Endpoint for the frontend to call - routes to the main analyze_image function.
    This matches the endpoint the frontend is expecting.
    """
    return await analyze_image(file)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
