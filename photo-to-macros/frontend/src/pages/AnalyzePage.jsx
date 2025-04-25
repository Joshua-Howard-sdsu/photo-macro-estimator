import { useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import MacroResults from '../components/MacroResults';
import { analyzeFoodImage } from '../utils/api';
import { FaSpinner, FaArrowRight, FaCamera, FaChartBar } from 'react-icons/fa';

/**
 * Page for uploading and analyzing food photos
 */
const AnalyzePage = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Handle image selection from the uploader
  const handleImageSelected = (file) => {
    setSelectedImage(file);
    setResults(null);
    setError(null);
  };
  
  // Handle the analyze button click
  const handleAnalyze = async () => {
    if (!selectedImage) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call the API service to analyze the image
      const analysisResults = await analyzeFoodImage(selectedImage);
      
      // Create an image URL to display the uploaded image
      const imageUrl = URL.createObjectURL(selectedImage);
      
      // Add the image URL to the results
      setResults({
        ...analysisResults,
        imageUrl: imageUrl
      });
      
      // If there's an error message in the response, display it
      if (analysisResults && analysisResults.success === false && analysisResults.error) {
        setError(analysisResults.error);
      }
    } catch (err) {
      console.error('Error analyzing image:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        // Handle FastAPI detailed errors
        setError(`Error: ${err.response.data.detail}`);
      } else if (err.message) {
        setError(`Error: ${err.message}`);
      } else {
        setError('Failed to analyze the image. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl font-display font-light tracking-tight mb-4 gradient-text">
          Analyze Your Food
        </h1>
        <p className="text-gray-600 max-w-lg mx-auto text-lg mb-10 leading-relaxed">
          Upload a photo of your meal to get instant nutritional information
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-12">
        {/* Image uploader section */}
        <div className="bg-white p-8 rounded-md border border-gray-100 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="mr-3 text-primary-500">
              <FaCamera size={20} />
            </div>
            <p className="font-display text-lg text-gray-800">
              Step 1: Upload a food photo
            </p>
          </div>
          
          <ImageUploader onImageSelected={handleImageSelected} />
          
          {/* Analyze button */}
          {selectedImage && !results && (
            <div className="mt-8 text-center animate-fade-in">
              <button 
                className="btn btn-primary px-10 py-3 shadow-md text-base"
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" /> 
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Food <FaArrowRight className="ml-2 text-sm" />
                  </>
                )}
              </button>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="mt-6 p-5 bg-red-50 border border-red-100 text-red-600 rounded-md text-sm animate-fade-in">
              {error}
            </div>
          )}
        </div>
        
        {/* Results section */}
        {results && (
          <div className="animate-fade-in">
            <div className="flex items-center mb-6">
              <div className="mr-3 text-primary-500">
                <FaChartBar size={20} />
              </div>
              <p className="font-display text-lg text-gray-800">
                Step 2: Nutritional Analysis
              </p>
            </div>
            <MacroResults results={results} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyzePage; 