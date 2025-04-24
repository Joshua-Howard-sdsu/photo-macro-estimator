import axios from 'axios';

// Base URL for API requests - direct connection to the FastAPI server
const API_URL = 'http://localhost:8000';

/**
 * Analyzes a food image by sending it to the backend
 * 
 * @param {File} imageFile - The image file to analyze
 * @returns {Promise} - Promise that resolves with the analysis results
 */
export const analyzeFoodImage = async (imageFile) => {
  try {
    // Create a FormData object to send the image
    const formData = new FormData();
    formData.append('file', imageFile);
    
    // Make a POST request to the analyze endpoint
    const response = await axios.post(`${API_URL}/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('API response:', response.data); // For debugging
    return response.data;
  } catch (error) {
    console.error('Error analyzing food image:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    console.error('Status code:', error.response ? error.response.status : 'No status code');
    throw error;
  }
}; 