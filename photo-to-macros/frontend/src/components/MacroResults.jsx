import { FaFire, FaLeaf, FaBreadSlice, FaOilCan, FaPlus } from 'react-icons/fa';
import { useState } from 'react';

/**
 * Component to display macro nutritional results in a detailed food log format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.results - The macro results from the API
 */
const MacroResults = ({ results }) => {
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
  
  // Extract the first result if we have results array
  const result = results.results && results.results.length > 0 ? results.results[0] : null;
  
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
      
      // Add each individual item to the breakdown
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
  
  // Format the food name for display
  const formattedFoodName = food.charAt(0).toUpperCase() + food.slice(1);
  
  // Check if we have a detailed food name with quantity
  const isQuantityDescription = /^\d+\s+\w+s$/.test(food); // matches "3 tacos"
  const getDisplayName = () => {
    // If using component-based format and have multiple components
    if (foodComponents.length > 1) {
      // Create a name from the components (e.g., "Cheeseburger with French Fries")
      const mainItem = foodComponents[0].name;
      return `${mainItem} with ${foodComponents.slice(1).map(item => item.name).join(', ')}`;
    }
    
    // Special case for multiple items
    if (isQuantityDescription) {
      return formattedFoodName; // Already properly formatted like "3 tacos"
    }
    
    // For compound foods
    if (food === 'hamburger' || food === 'cheeseburger') {
      return 'Cheeseburger with French Fries';
    }
    
    // For all other foods
    return formattedFoodName;
  };
  
  const displayName = getDisplayName();
  
  // Get source badge text and color
  const getSourceBadge = () => {
    const sourceText = macros.source || source || 'database';
    let badgeClass = 'badge ';
    let badgeText = '';
    
    switch(sourceText) {
      case 'openai':
        badgeClass += 'bg-green-100 text-green-800';
        badgeText = 'OpenAI Analysis';
        break;
      case 'database':
        badgeClass += 'bg-blue-100 text-blue-800';
        badgeText = 'From Database';
        break;
      case 'ai_estimated':
        badgeClass += 'bg-purple-100 text-purple-800';
        badgeText = 'AI Estimated';
        break;
      default:
        badgeClass += 'bg-gray-100 text-gray-800';
        badgeText = 'Unknown Source';
    }
    
    return <span className={badgeClass}>{badgeText}</span>;
  };

  // Determine the data source
  const sourceText = macros.source || source || 'database';
  const isOpenAI = sourceText === 'openai';
  const isDatabase = sourceText === 'database' || !sourceText;
  
  return (
    <div className="space-y-4">
      {/* Today's Summary Card */}
      <div className="bg-white border border-gray-100 rounded-md overflow-hidden animate-fade-in shadow-sm">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Today's Summary</h2>
          
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-500">{caloriesValue}</div>
              <div className="text-sm text-gray-500">Calories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">{proteinValue}g</div>
              <div className="text-sm text-gray-500">Protein</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">{carbsValue}g</div>
              <div className="text-sm text-gray-500">Carbs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">{fatValue}g</div>
              <div className="text-sm text-gray-500">Fats</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Database Food Card - Show only if data is from database */}
      {isDatabase && (
        <div className="bg-white border border-gray-100 rounded-md overflow-hidden animate-fade-in shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Detected Food</h2>
              <span className="badge bg-blue-100 text-blue-800">From Database</span>
            </div>
            
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
              <button className="btn btn-primary py-2">
                Add to Breakfast
              </button>
              <button className="btn btn-primary py-2">
                Add to Lunch
              </button>
              <button className="btn btn-primary py-2">
                Add to Dinner
              </button>
              <button className="btn btn-primary py-2">
                Add to Snacks
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* OpenAI Food Card - Show only if data is from OpenAI */}
      {isOpenAI && (
        <div className="bg-white border border-gray-100 rounded-md overflow-hidden animate-fade-in shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Detected Food</h2>
              <span className="badge bg-green-100 text-green-800">From OpenAI</span>
            </div>
            
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
              <button className="btn btn-primary py-2">
                Add to Breakfast
              </button>
              <button className="btn btn-primary py-2">
                Add to Lunch
              </button>
              <button className="btn btn-primary py-2">
                Add to Dinner
              </button>
              <button className="btn btn-primary py-2">
                Add to Snacks
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Original Detected Food Card (removed) */}
      
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
            
            <div className="py-8 text-center text-gray-400">
              No items logged yet
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MacroResults; 