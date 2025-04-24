import { FaFire, FaLeaf, FaBreadSlice, FaOilCan } from 'react-icons/fa';

/**
 * Component to display macro nutritional results
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
  
  // Now we know macros is a valid object
  // Map of macro nutrients to their icons and colors
  const macroDetails = [
    { 
      name: 'Calories', 
      value: macros.calories || 0, 
      unit: 'kcal', 
      icon: FaFire, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    { 
      name: 'Protein', 
      value: macros.protein || 0, 
      unit: 'g', 
      icon: FaLeaf, 
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    { 
      name: 'Carbs', 
      value: macros.carbs || 0, 
      unit: 'g', 
      icon: FaBreadSlice, 
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    { 
      name: 'Fat', 
      value: macros.fat || 0, 
      unit: 'g', 
      icon: FaOilCan, 
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
  ];
  
  return (
    <div className="bg-white border border-gray-100 rounded-md overflow-hidden animate-fade-in shadow-sm">
      {/* Food name header */}
      <div className="p-5 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-light tracking-tight text-gray-900 m-0">
            {food}
          </h2>
          <div className="badge badge-primary">
            Identified
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-8">
        {/* GPT Summary */}
        <div className="bg-gray-50 p-5 rounded-md animate-fade-in">
          <p className="prose text-base italic">
            {food && `${food.charAt(0).toUpperCase() + food.slice(1)} contains approximately ${macros.calories || 0} calories per 100g serving.`}
          </p>
        </div>
        
        {/* Macro grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {macroDetails.map((macro, index) => (
            <div 
              key={macro.name} 
              className={`${macro.bgColor} rounded-md p-4 animate-fade-in`}
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <macro.icon className={`${macro.color}`} />
                <span className="text-gray-700 font-medium text-sm">{macro.name}</span>
              </div>
              <div className="text-3xl font-display font-light tracking-tight">
                {macro.value}
                <span className="text-xs font-sans font-normal text-gray-500 ml-1">{macro.unit}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Footnote */}
        <div className="text-center pt-2">
          <p className="caption">
            Nutritional information is an estimate based on our database.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MacroResults; 