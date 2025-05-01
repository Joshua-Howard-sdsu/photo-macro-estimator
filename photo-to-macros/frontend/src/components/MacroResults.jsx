import { FaFire, FaLeaf, FaBreadSlice, FaOilCan, FaPlus } from 'react-icons/fa';
import { useState } from 'react';

/**
 * Component to display macro nutritional results in a detailed food log format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.results - The macro results from the API
 * @param {Function} props.onAddToMeal - Handler to add food to a meal (meal, foodItem)
 */
const MacroResults = ({ results, onAddToMeal }) => {
  // If no results, return nothing
  if (!results) return null;
  
  // Handle error case
  if (!results.success && results.error) {
    return (
      <div className="bg-white border border-gray-100 rounded-md overflow-hidden animate-fade-in shadow-sm p-6">
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-md p-5 animate-fade-in">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p>{results.error}</p>
        </div>
      </div>
    );
  }

  // Support top 5 food options if present
  const foodOptions = results.results && results.results.length > 0 ? results.results.slice(0, 5) : [];
  const [selectedIdx, setSelectedIdx] = useState(0);
  const result = foodOptions[selectedIdx] || null;

  if (!result) {
    return (
      <div className="bg-white border border-gray-100 rounded-md overflow-hidden animate-fade-in shadow-sm p-6">
        <div className="bg-yellow-50 border border-yellow-100 text-yellow-600 rounded-md p-5 animate-fade-in">
          <p>No food detected in the image.</p>
        </div>
      </div>
    );
  }

  const { label: food, macros, source } = result;

  // Check if macros is a string (from AI estimation) or an object (from database)
  if (typeof macros === 'string') {
    // Handle the case where macros is a string (AI generated summary)
    return (
      <div className="bg-white border border-gray-100 rounded-md overflow-hidden animate-fade-in shadow-sm">
        <div className="p-5 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-light tracking-tight text-gray-900 m-0">
              {food}
            </h2>
            <div className="badge badge-secondary">
              AI Estimated
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 p-5 rounded-md animate-fade-in">
            <p className="prose text-base">{macros}</p>
          </div>
        </div>
      </div>
    );
  }

  // If macros is not defined properly, show error
  if (!macros || typeof macros !== 'object') {
    return (
      <div className="bg-white border border-gray-100 rounded-md overflow-hidden animate-fade-in shadow-sm p-6">
        <div className="bg-yellow-50 border border-yellow-100 text-yellow-600 rounded-md p-5 animate-fade-in">
          <p>Could not process nutritional information for {food}.</p>
        </div>
      </div>
    );
  }

  // Initialize food components array
  let foodComponents = [];

  // Check if using the new OpenAI component-based format
  if (macros.components && Array.isArray(macros.components) && macros.components.length > 0) {
    // Use the components directly from OpenAI response
    foodComponents = macros.components;
  } else {
    // Legacy handling for simulated components or quantity-based items
    // If the food is a compound food (like in the mockup), add components
    if (food === 'hamburger' || food === 'cheeseburger') {
      foodComponents.push({
        name: 'Cheeseburger',
        calories: 550,
        protein: 25,
        carbs: 39,
        fat: 29
      });
      foodComponents.push({
        name: 'French Fries',
        calories: 350,
        protein: 9,
        carbs: 42,
        fat: 16
      });
    }
    // Handle quantity-based items (like "3 tacos")
    if (macros.quantity && macros.quantity > 1 && macros.base_item) {
      const baseCalories = Math.round(macros.calories / macros.quantity);
      const baseProtein = Math.round((macros.protein / macros.quantity) * 10) / 10;
      const baseCarbs = Math.round((macros.carbs / macros.quantity) * 10) / 10;
      const baseFat = Math.round((macros.fat / macros.quantity) * 10) / 10;
      for (let i = 0; i < macros.quantity; i++) {
        foodComponents.push({
          name: macros.base_item,
          calories: baseCalories,
          protein: baseProtein,
          carbs: baseCarbs,
          fat: baseFat
        });
      }
    }
  }

  // For displaying the macros summary - use total from components-based format if available
  let caloriesValue, proteinValue, carbsValue, fatValue;
  if (macros.total) {
    // Use the pre-calculated total
    caloriesValue = macros.total.calories || 0;
    proteinValue = macros.total.protein || 0;
    carbsValue = macros.total.carbs || 0;
    fatValue = macros.total.fat || 0;
  } else {
    // Use direct values from the legacy format
    caloriesValue = macros.calories || 0;
    proteinValue = macros.protein || 0;
    carbsValue = macros.carbs || 0;
    fatValue = macros.fat || 0;
  }

  // Display name logic
  const displayName = food;
  const formattedFoodName = food;

  // Handler for meal logging buttons
  const handleAdd = (meal) => {
    if (onAddToMeal) {
      // Ensure macros always has direct calories, protein, carbs, fat fields
      let flatMacros = { ...macros };
      if (macros && macros.total) {
        flatMacros = {
          ...macros,
          calories: macros.total.calories ?? macros.calories ?? 0,
          protein: macros.total.protein ?? macros.protein ?? 0,
          carbs: macros.total.carbs ?? macros.carbs ?? 0,
          fat: macros.total.fat ?? macros.fat ?? 0,
        };
      }
      onAddToMeal(meal, { ...result, food, macros: flatMacros });
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-md overflow-hidden animate-fade-in shadow-sm p-6">
      {/* Top 5 food options selector */}
      {foodOptions.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Detected Food:</label>
          <div className="flex flex-wrap gap-2">
            {foodOptions.map((opt, idx) => (
              <button
                key={idx}
                className={`px-3 py-1 rounded-md border ${selectedIdx === idx ? 'bg-primary-500 text-white border-primary-500' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                onClick={() => setSelectedIdx(idx)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-4">
        <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden">
          {/* Display the uploaded image if available */}
          {results.imageUrl ? (
            <img 
              src={results.imageUrl} 
              alt={formattedFoodName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <FaFire className="text-gray-400 text-3xl" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold">{displayName}</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Calories:</span>
              <span className="font-medium">{caloriesValue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Protein:</span>
              <span className="font-medium">{proteinValue}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Carbs:</span>
              <span className="font-medium">{carbsValue}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fats:</span>
              <span className="font-medium">{fatValue}g</span>
            </div>
          </div>
          {foodComponents.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-semibold mb-2">Breakdown:</h4>
              {foodComponents.map((item, index) => (
                <div key={index} className="mb-2">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    {item.calories} cal • P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Meal logging buttons */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button className="btn btn-primary py-2" onClick={() => handleAdd('Breakfast')}>
          Add to Breakfast
        </button>
        <button className="btn btn-primary py-2" onClick={() => handleAdd('Lunch')}>
          Add to Lunch
        </button>
        <button className="btn btn-primary py-2" onClick={() => handleAdd('Dinner')}>
          Add to Dinner
        </button>
        <button className="btn btn-primary py-2" onClick={() => handleAdd('Snacks')}>
          Add to Snacks
        </button>
      </div>
    </div>
  );
};

export default MacroResults;