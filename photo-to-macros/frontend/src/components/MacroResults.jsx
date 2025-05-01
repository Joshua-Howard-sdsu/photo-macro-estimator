import { FaFire, FaLeaf, FaBreadSlice, FaOilCan, FaPlus, FaTrash, FaCamera } from 'react-icons/fa';
import { useState, useEffect } from 'react';

/**
 * Component to display macro nutritional results in a detailed food log format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.results - The macro results from the API
 * @param {Function} props.onNewPhoto - Callback to trigger new photo upload
 */
const MacroResults = ({ results, onNewPhoto }) => {
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
        <div className="mt-4 flex justify-center">
          <button className="btn btn-secondary flex items-center gap-2" onClick={onNewPhoto}>
            <FaCamera /> Add New Photo
          </button>
        </div>
      </div>
    );
  }

  // CANDIDATES: List of possible foods with confidence from API
  const allCandidates = results.candidates || [];
  // Only show top 5 alternatives (excluding the first/best match)
  const candidates = allCandidates.slice(0, 6); // first is main, next 5 are alternatives

  // Extract the first result if we have results array
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [mealLogs, setMealLogs] = useState(() => ({ Breakfast: [], Lunch: [], Dinner: [], Snacks: [] }));

  // When results change (new photo), do NOT reset mealLogs
  // Only reset selectedIdx
  useEffect(() => {
    setSelectedIdx(0);
    // mealLogs persist
  }, [results]);

  const result = results.results && results.results.length > 0 ? results.results[selectedIdx] : null;

  if (!result) {
    return (
      <div className="bg-white border border-gray-100 rounded-md overflow-hidden animate-fade-in shadow-sm p-6">
        <div className="bg-yellow-50 border border-yellow-100 text-yellow-600 rounded-md p-5 animate-fade-in">
          <p>No food detected in the image.</p>
        </div>
        <div className="mt-4 flex justify-center">
          <button className="btn btn-secondary flex items-center gap-2" onClick={onNewPhoto}>
            <FaCamera /> Add New Photo
          </button>
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
        <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-display font-light tracking-tight text-gray-900 m-0">
              {food}
            </h2>
            <div className="badge badge-secondary">AI Estimated</div>
          </div>
          <button className="btn btn-secondary flex items-center gap-2" onClick={onNewPhoto}>
            <FaCamera /> Add New Photo
          </button>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 p-5 rounded-md animate-fade-in">
            <p className="prose text-base">{macros}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!macros || typeof macros !== 'object') {
    return (
      <div className="bg-white border border-gray-100 rounded-md overflow-hidden animate-fade-in shadow-sm p-6">
        <div className="bg-yellow-50 border border-yellow-100 text-yellow-600 rounded-md p-5 animate-fade-in">
          <p>Could not process nutritional information for {food}.</p>
        </div>
        <div className="mt-4 flex justify-center">
          <button className="btn btn-secondary flex items-center gap-2" onClick={onNewPhoto}>
            <FaCamera /> Add New Photo
          </button>
        </div>
      </div>
    );
  }

  // Simulated additional items - in a real app, these would come from the API
  const foodComponents = [];
  if (food === 'hamburger' || food === 'cheeseburger') {
    foodComponents.push({ name: 'Cheeseburger', calories: 550, protein: 25, carbs: 39, fat: 29 });
    foodComponents.push({ name: 'French Fries', calories: 350, protein: 9, carbs: 42, fat: 16 });
  }
  if (macros.quantity && macros.quantity > 1 && macros.base_item) {
    const baseCalories = Math.round(macros.calories / macros.quantity);
    const baseProtein = Math.round((macros.protein / macros.quantity) * 10) / 10;
    const baseCarbs = Math.round((macros.carbs / macros.quantity) * 10) / 10;
    const baseFat = Math.round((macros.fat / macros.quantity) * 10) / 10;
    for (let i = 0; i < macros.quantity; i++) {
      foodComponents.push({
        name: `${macros.base_item.charAt(0).toUpperCase() + macros.base_item.slice(1)} ${i+1}`,
        calories: baseCalories,
        protein: baseProtein,
        carbs: baseCarbs,
        fat: baseFat
      });
    }
  }

  // --- SUMMARY ---
  const mealTotals = Object.values(mealLogs).flat().reduce(
    (totals, item) => {
      totals.calories += Number(item.calories) || 0;
      totals.protein += Number(item.protein) || 0;
      totals.carbs += Number(item.carbs) || 0;
      totals.fat += Number(item.fat) || 0;
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const format1dp = (val) => Number(val).toFixed(1);

  // --- DISPLAY NAME AND MACRO VALUES ---
  const isQuantityDescription = /^\d+\s+\w+s$/.test(food); // matches "3 tacos"
  const getDisplayName = () => {
    if (isQuantityDescription) return formattedFoodName;
    if (food === 'hamburger' || food === 'cheeseburger') return 'Cheeseburger with French Fries';
    return formattedFoodName;
  };
  const formattedFoodName = food.charAt(0).toUpperCase() + food.slice(1);
  const displayName = getDisplayName();
  const caloriesValue = macros.calories;
  const proteinValue = macros.protein;
  const carbsValue = macros.carbs;
  const fatValue = macros.fat;

  // --- MEAL LOGIC ---
  const handleAddToMeal = (meal) => {
    if (!result) return;
    setMealLogs((prev) => ({
      ...prev,
      [meal]: [...prev[meal], {
        label: displayName,
        calories: caloriesValue,
        protein: proteinValue,
        carbs: carbsValue,
        fat: fatValue
      }]
    }));
  };
  const handleRemoveFromMeal = (meal, idx) => {
    setMealLogs((prev) => ({
      ...prev,
      [meal]: prev[meal].filter((_, i) => i !== idx)
    }));
  };

  return (
    <div className="space-y-4">
      {/* Today's Summary Card */}
      <div className="bg-white border border-gray-100 rounded-md overflow-hidden animate-fade-in shadow-sm">
        <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-center">
          <h2 className="text-xl font-bold mb-2">Today's Summary</h2>
          <button className="btn btn-secondary flex items-center gap-2" onClick={onNewPhoto}>
            <FaCamera /> Add New Photo
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4 text-center p-4">
          <div>
            <div className="text-2xl font-bold text-primary-500">{format1dp(mealTotals.calories)}</div>
            <div className="text-gray-500 text-xs uppercase mt-1">Calories</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-pink-500">{format1dp(mealTotals.protein)}g</div>
            <div className="text-gray-500 text-xs uppercase mt-1">Protein</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">{format1dp(mealTotals.carbs)}g</div>
            <div className="text-gray-500 text-xs uppercase mt-1">Carbs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-500">{format1dp(mealTotals.fat)}g</div>
            <div className="text-gray-500 text-xs uppercase mt-1">Fats</div>
          </div>
        </div>
      </div>

      {/* Detected Food Card */}
      <div className="bg-white border border-gray-100 rounded-md overflow-hidden animate-fade-in shadow-sm">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Detected Food</h2>

          {/* Candidates: Show up to 5 alternatives with confidence */}
          {candidates.length > 1 && (
            <div className="mb-4">
              <div className="font-semibold text-gray-700 mb-1">Other possible foods:</div>
              <div className="flex flex-wrap gap-2">
                {candidates.slice(1, 6).map((cand, idx) => (
                  <button
                    key={cand.label + idx}
                    className={`px-3 py-1 rounded-full border text-sm ${(idx+1) === selectedIdx ? 'bg-primary-100 border-primary-500 text-primary-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                    onClick={() => setSelectedIdx(idx+1)}
                  >
                    {cand.label.charAt(0).toUpperCase() + cand.label.slice(1)}
                    {typeof cand.confidence === 'number' && (
                      <span className="ml-2 text-xs text-gray-500">({cand.confidence}%)</span>
                    )}
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
            <button className="btn btn-primary py-2" onClick={() => handleAddToMeal('Breakfast')}>
              Add to Breakfast
            </button>
            <button className="btn btn-primary py-2" onClick={() => handleAddToMeal('Lunch')}>
              Add to Lunch
            </button>
            <button className="btn btn-primary py-2" onClick={() => handleAddToMeal('Dinner')}>
              Add to Dinner
            </button>
            <button className="btn btn-primary py-2" onClick={() => handleAddToMeal('Snacks')}>
              Add to Snacks
            </button>
          </div>
        </div>
      </div>

      {/* Meal sections */}
      {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((meal) => (
        <div key={meal} className="bg-white border border-gray-100 rounded-md overflow-hidden animate-fade-in shadow-sm">
          <div className="p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">{meal}</h2>
              <button className="text-primary-500">
                <FaPlus />
              </button>
            </div>
            <div className="py-4">
              {mealLogs[meal].length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  No items logged yet
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {mealLogs[meal].map((item, idx) => (
                    <li key={idx} className="py-2 flex justify-between items-center">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-gray-500 text-sm mr-2">
                        {item.calories} cal • P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                      </span>
                      <button
                        className="text-red-500 hover:text-red-700 ml-2"
                        title="Remove"
                        onClick={() => handleRemoveFromMeal(meal, idx)}
                      >
                        <FaTrash />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MacroResults;