import { useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import MacroResults from '../components/MacroResults';
import { analyzeFoodImage } from '../utils/api';
import { FaSpinner, FaArrowRight, FaCamera, FaChartBar, FaUtensils, FaLightbulb } from 'react-icons/fa';

/**
 * Page for uploading and analyzing food photos
 */
const AnalyzePage = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Meal log state: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] }
  const [mealLog, setMealLog] = useState({
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snacks: []
  });

  // Dietary preferences state
  const [dietPref, setDietPref] = useState('None');
  // Meal suggestion state
  const [suggestMealType, setSuggestMealType] = useState('Breakfast');
  const [mealSuggestion, setMealSuggestion] = useState(null);

  // Macro targets for a balanced diet (example: 2000 kcal, 120g protein, 250g carbs, 70g fat)
  const dailyTargets = {
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 70
  };

  // Example food suggestions by meal and diet
  const foodExamples = {
    Breakfast: {
      None: ['Oatmeal + Eggs', 'Greek Yogurt + Berries', 'Avocado Toast'],
      Vegetarian: ['Oatmeal + Almonds', 'Greek Yogurt + Berries', 'Tofu Scramble'],
      Vegan: ['Oatmeal + Almonds', 'Tofu Scramble', 'Smoothie Bowl'],
      "High Protein": ['Egg White Omelette', 'Protein Pancakes', 'Cottage Cheese + Fruit']
    },
    Lunch: {
      None: ['Grilled Chicken Salad', 'Turkey Sandwich', 'Rice + Beans + Veggies'],
      Vegetarian: ['Chickpea Salad', 'Grilled Cheese + Tomato Soup', 'Rice + Beans + Veggies'],
      Vegan: ['Lentil Soup', 'Quinoa Salad', 'Rice + Beans + Veggies'],
      "High Protein": ['Chicken Breast + Quinoa', 'Tuna Salad', 'Egg Salad Wrap']
    },
    Dinner: {
      None: ['Salmon + Brown Rice', 'Chicken Stir Fry', 'Pasta + Meatballs'],
      Vegetarian: ['Vegetable Stir Fry', 'Pasta Primavera', 'Stuffed Peppers'],
      Vegan: ['Vegan Chili', 'Stuffed Peppers', 'Vegetable Stir Fry'],
      "High Protein": ['Grilled Fish + Veggies', 'Turkey Chili', 'Tofu Stir Fry']
    },
    Snacks: {
      None: ['Apple + Peanut Butter', 'Yogurt', 'Trail Mix'],
      Vegetarian: ['Apple + Peanut Butter', 'Yogurt', 'Trail Mix'],
      Vegan: ['Fruit + Nuts', 'Hummus + Veggies', 'Trail Mix'],
      "High Protein": ['Protein Bar', 'Cottage Cheese', 'Jerky']
    }
  };

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

  // Handler to add a food item to a meal category
  const handleAddToMeal = (meal, foodItem) => {
    setMealLog(prev => ({
      ...prev,
      [meal]: [...prev[meal], foodItem]
    }));
  };

  // Handler to delete a food item from a meal category
  const handleDeleteFromMeal = (meal, idx) => {
    setMealLog(prev => ({
      ...prev,
      [meal]: prev[meal].filter((_, i) => i !== idx)
    }));
  };

  // Calculate total macros for summary box
  const getTotalMacros = () => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    Object.values(mealLog).flat().forEach(item => {
      if (item.macros) {
        totals.calories += Number(item.macros.calories) || 0;
        totals.protein += Number(item.macros.protein) || 0;
        totals.carbs += Number(item.macros.carbs) || 0;
        totals.fat += Number(item.macros.fat) || 0;
      }
    });
    return totals;
  };

  const totalMacros = getTotalMacros();

  // Handler for meal suggestion
  const handleSuggestMeal = () => {
    // Calculate remaining macros for the day
    const totalMacros = getTotalMacros();
    const remaining = {
      calories: Math.max(dailyTargets.calories - totalMacros.calories, 0),
      protein: Math.max(dailyTargets.protein - totalMacros.protein, 0),
      carbs: Math.max(dailyTargets.carbs - totalMacros.carbs, 0),
      fat: Math.max(dailyTargets.fat - totalMacros.fat, 0)
    };
    // Meals left today (including selected)
    const mealOrder = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    const currentIdx = mealOrder.indexOf(suggestMealType);
    const remainingMeals = mealOrder.slice(currentIdx);
    // Divide remaining macros equally among remaining meals
    const macroTarget = {
      calories: Math.round(remaining.calories / remainingMeals.length),
      protein: Math.round(remaining.protein / remainingMeals.length),
      carbs: Math.round(remaining.carbs / remainingMeals.length),
      fat: Math.round(remaining.fat / remainingMeals.length)
    };
    // Suggest foods based on meal and diet
    const examples = foodExamples[suggestMealType][dietPref] || foodExamples[suggestMealType]['None'];
    setMealSuggestion({
      meal: suggestMealType,
      macros: macroTarget,
      foods: examples
    });
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
            <MacroResults 
              results={results} 
              onAddToMeal={handleAddToMeal} 
            />
          </div>
        )}
        {/* Today's Summary Box */}
        <div className="bg-white rounded-md border border-gray-100 shadow-sm p-6 animate-fade-in">
          <h2 className="text-xl font-bold mb-4">Today's Summary</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center"><span role="img" aria-label="Fire" className="mr-1">🔥</span><span className="text-orange-600 font-semibold">Calories</span>:</span>
              <span className="font-bold text-orange-600">{totalMacros.calories}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center"><span role="img" aria-label="Muscle" className="mr-1">💪</span><span className="text-blue-700 font-semibold">Protein</span>:</span>
              <span className="font-bold text-blue-700">{totalMacros.protein}g</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center"><span role="img" aria-label="Bread" className="mr-1">🍞</span><span className="text-yellow-700 font-semibold">Carbs</span>:</span>
              <span className="font-bold text-yellow-700">{totalMacros.carbs}g</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center"><span role="img" aria-label="Drop" className="mr-1">🧈</span><span className="text-pink-700 font-semibold">Fats</span>:</span>
              <span className="font-bold text-pink-700">{totalMacros.fat}g</span>
            </div>
          </div>
          {/* List each meal and its food items */}
          {Object.entries(mealLog).map(([meal, items]) => (
            <div key={meal} className="mb-2">
              <div className="font-semibold text-primary-600 mb-1">{meal}</div>
              {items.length === 0 ? (
                <div className="text-gray-400 text-sm">No items logged</div>
              ) : (
                <ul className="text-sm ml-4 list-disc">
                  {items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      {item.food || item.label || 'Food'}: {item.macros.calories || 0} cal, P: {item.macros.protein || 0}g, C: {item.macros.carbs || 0}g, F: {item.macros.fat || 0}g
                      <button
                        className="ml-2 text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded"
                        onClick={() => handleDeleteFromMeal(meal, idx)}
                        aria-label={`Delete ${item.food || item.label || 'Food'} from ${meal}`}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2">
            <label className="font-medium mr-2">Dietary Preference:</label>
            <select
              className="border border-gray-200 rounded px-2 py-1"
              value={dietPref}
              onChange={e => setDietPref(e.target.value)}
            >
              <option value="None">None</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="High Protein">High Protein</option>
            </select>
            <span className="ml-auto" />
            <label className="font-medium mr-2">Suggest for:</label>
            <select
              className="border border-gray-200 rounded px-2 py-1"
              value={suggestMealType}
              onChange={e => setSuggestMealType(e.target.value)}
            >
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snacks">Snacks</option>
            </select>
            <button
              className="btn btn-secondary flex items-center gap-2 px-4 py-2 ml-2"
              onClick={handleSuggestMeal}
            >
              <FaLightbulb className="text-yellow-400" />
              What should I eat?
            </button>
          </div>
          {/* Meal Suggestion Output */}
          {mealSuggestion && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4 animate-fade-in">
              <div className="font-semibold mb-2 text-blue-700 flex items-center"><FaUtensils className="mr-2" />Suggested for {mealSuggestion.meal} ({dietPref}):</div>
              <div className="mb-2">
                <span className="font-medium text-gray-700">Target Macros:</span>
                <span className="ml-2 text-orange-600">🔥 {mealSuggestion.macros.calories} cal</span>,
                <span className="ml-2 text-blue-700">💪 {mealSuggestion.macros.protein}g protein</span>,
                <span className="ml-2 text-yellow-700">🍞 {mealSuggestion.macros.carbs}g carbs</span>,
                <span className="ml-2 text-pink-700">🧈 {mealSuggestion.macros.fat}g fat</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Example foods:</span>
                <ul className="list-disc ml-6 mt-1">
                  {mealSuggestion.foods.map((food, idx) => (
                    <li key={idx}>{food}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyzePage;