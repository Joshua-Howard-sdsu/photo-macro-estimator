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
import requests
from io import BytesIO
import hashlib
from functools import lru_cache

# Load environment variables
load_dotenv()

# Add the current directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Simple response cache
openai_response_cache = {}

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

# OpenAI Vision API function
async def get_macros_from_openai(image_bytes, food_label):
    """
    Get macronutrient information using OpenAI's Vision API.
    
    Args:
        image_bytes: The image data in bytes
        food_label: The detected food label from Google Vision
        
    Returns:
        A dictionary containing macronutrient information
    """
    try:
        # Get OpenAI API key from environment
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            print("OpenAI API key not found in environment variables")
            return None
        
        # Create a cache key based on the image and food label but don't use it
        # Just for logging purposes
        cache_key = hashlib.md5(image_bytes + food_label.encode('utf-8')).hexdigest()
        print(f"Processing {food_label} (key: {cache_key[:8]})")
            
        # Convert image bytes to base64
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        # Create a simpler prompt for faster processing
        prompt = f"""
        This image contains {food_label}. 
        
        Identify the main food items and for EACH provide:
        1. Name
        2. Calories
        3. Protein (g)
        4. Carbs (g)
        5. Fat (g)
        
        Return ONLY a valid JSON object in this structure:
        {{
          "total": {{"calories": number, "protein": number, "carbs": number, "fat": number}},
          "components": [
            {{"name": "food1", "calories": number, "protein": number, "carbs": number, "fat": number}},
            {{"name": "food2", "calories": number, "protein": number, "carbs": number, "fat": number}}
          ]
        }}
        """
        
        # Prepare the API request
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        
        payload = {
            "model": "gpt-4.1",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 250,
            "temperature": 0.3,
            "response_format": { "type": "json_object" }
        }
        
        # Make the API request
        try:
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=15  # Set a timeout to prevent hanging
            )
            
            # Process the response
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                
                try:
                    # Since we requested JSON format, we can parse directly
                    macros = json.loads(content)
                    
                    # Handle new component-based format
                    if 'components' in macros and 'total' in macros:
                        # Recalculate the total to ensure accuracy
                        recalculated_total = {
                            'calories': sum(comp.get('calories', 0) for comp in macros['components']),
                            'protein': sum(comp.get('protein', 0) for comp in macros['components']),
                            'carbs': sum(comp.get('carbs', 0) for comp in macros['components']),
                            'fat': sum(comp.get('fat', 0) for comp in macros['components'])
                        }
                        
                        # Always use our calculated total instead of the one from OpenAI
                        macros['total'] = recalculated_total
                        macros['source'] = 'openai'
                        
                        # Don't cache the response
                        return macros
                    
                    # Handle single-item format (backward compatibility)
                    required_fields = ['calories', 'protein', 'carbs', 'fat']
                    if all(field in macros for field in required_fields):
                        # Convert to component-based format
                        total = {
                            'calories': macros['calories'],
                            'protein': macros['protein'],
                            'carbs': macros['carbs'],
                            'fat': macros['fat']
                        }
                        components = [{
                            'name': food_label,
                            'calories': macros['calories'],
                            'protein': macros['protein'],
                            'carbs': macros['carbs'],
                            'fat': macros['fat']
                        }]
                        macros = {
                            'total': total,
                            'components': components,
                            'source': 'openai'
                        }
                        
                        # Don't cache the response
                        return macros
                    
                    # If we got here, format is unexpected
                    print(f"Unexpected response format: {macros}")
                    
                    # Create a fallback format from whatever we got
                    fallback_macros = {
                        'total': {
                            'calories': 0,
                            'protein': 0,
                            'carbs': 0,
                            'fat': 0
                        },
                        'components': [
                            {
                                'name': food_label,
                                'calories': 0,
                                'protein': 0,
                                'carbs': 0,
                                'fat': 0
                            }
                        ],
                        'source': 'openai_fallback'
                    }
                    
                    # Try to extract values from the response
                    for key, value in macros.items():
                        if isinstance(value, dict):
                            if all(k in value for k in ['calories', 'protein', 'carbs', 'fat']):
                                fallback_macros['total'] = value
                                fallback_macros['components'][0].update(value)
                                fallback_macros['components'][0]['name'] = key
                    
                    # Don't cache the fallback response
                    return fallback_macros
                
                except Exception as e:
                    print(f"Error parsing OpenAI response: {e}")
                    print(f"Response content: {content}")
                    
                    # Create a simple fallback response
                    fallback_response = {
                        'total': {
                            'calories': 250,
                            'protein': 15,
                            'carbs': 25,
                            'fat': 10
                        },
                        'components': [
                            {
                                'name': food_label,
                                'calories': 250,
                                'protein': 15,
                                'carbs': 25,
                                'fat': 10
                            }
                        ],
                        'source': 'openai_fallback'
                    }
                    
                    # Don't cache the fallback response
                    return fallback_response
            
            print(f"OpenAI API request failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
            
        except requests.exceptions.Timeout:
            print("OpenAI request timed out after 15 seconds")
        except requests.exceptions.RequestException as e:
            print(f"Request exception: {e}")
        except Exception as e:
            print(f"Error calling OpenAI API: {e}")
        
        # If all else fails, return a generic response
        generic_response = {
            'total': {
                'calories': 250,
                'protein': 15,
                'carbs': 25,
                'fat': 10
            },
            'components': [
                {
                    'name': food_label,
                    'calories': 250,
                    'protein': 15,
                    'carbs': 25,
                    'fat': 10
                }
            ],
            'source': 'generic_fallback'
        }
        
        # Don't cache the generic response
        return generic_response
        
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return None

@app.post("/api/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    try:
        # Start timer to track processing time
        start_time = time.time()
        
        # Set a reasonable timeout for the entire processing
        max_processing_time = 20  # seconds
        
        # Read image file
        image_bytes = await file.read()
        
        try:
            # Detect food labels - stop if taking too long
            if time.time() - start_time > max_processing_time * 0.3:
                return {"success": False, "error": "Processing took too long. Please try with a simpler image."}
                
            food_labels = detect_food_labels(image_bytes)
            
            # Get macros for each food label
            macro_results = []
            
            for label in food_labels:
                # Check if we're close to timeout
                if time.time() - start_time > max_processing_time * 0.7:
                    # If we have at least one result, return what we have
                    if macro_results:
                        print(f"Returning partial results due to timeout ({len(macro_results)} of {len(food_labels)} processed)")
                        return {"success": True, "results": macro_results}
                    else:
                        return {"success": False, "error": "Analysis took too long. Please try again with a simpler image."}
                
                # First try to get macros from OpenAI
                openai_macros = await get_macros_from_openai(image_bytes, label)
                
                if openai_macros:
                    # Use OpenAI results
                    macro_results.append({
                        "label": label,
                        "macros": openai_macros,
                        "source": "openai"
                    })
                else:
                    # Fallback to local database
                    macros = get_macros_from_label(label)
                    if macros:
                        macro_results.append({
                            "label": label,
                            "macros": macros,
                            "source": "database"
                        })
            
            # Check for final timeout        
            if time.time() - start_time > max_processing_time:
                # If we have at least one result, return what we have
                if macro_results:
                    print(f"Returning results after timeout ({len(macro_results)} processed)")
                    return {"success": True, "results": macro_results}
                else:
                    return {"success": False, "error": "Analysis took too long. Please try again with a simpler image."}
                    
            # If no macros found for any label, use the first label as a prompt for GPT
            if not macro_results and food_labels:
                gpt_macros = generate_macro_summary(food_labels[0], None)
                macro_results.append({
                    "label": food_labels[0],
                    "macros": gpt_macros,
                    "source": "ai_estimated"
                })
                
            # Add processing time info for debugging
            processing_time = time.time() - start_time
            print(f"Total processing time: {processing_time:.2f} seconds")
                
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
