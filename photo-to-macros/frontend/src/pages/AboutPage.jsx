import { FaUtensils, FaBrain, FaDatabase, FaRobot } from 'react-icons/fa';

/**
 * About page with information about the project and technologies used
 */
const AboutPage = () => {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">About NomLog</h1>
        <p className="text-gray-600">
          Learn more about our photo-to-macros estimation system
        </p>
      </div>
      
      {/* Project overview */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-4">Project Overview</h2>
        <p className="mb-4">
          NomLog is a photo-to-meal macro estimation service that uses AI to analyze 
          food images and provide nutritional information. This innovative application 
          transforms how people track their nutritional intake.
        </p>
        <p>
          The system combines computer vision for food recognition, a nutritional 
          database for macro lookup, and natural language generation to provide 
          useful summaries about your food.
        </p>
      </div>
      
      {/* Technology stack */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-4">Technology Stack</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary-100 p-3 flex-shrink-0">
              <FaBrain className="text-xl text-primary-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Computer Vision</h3>
              <p className="text-gray-600">
                Google Cloud Vision API for accurate food identification from photos.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary-100 p-3 flex-shrink-0">
              <FaDatabase className="text-xl text-primary-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Nutrition Database</h3>
              <p className="text-gray-600">
                USDA food database for accurate macro and micronutrient information.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary-100 p-3 flex-shrink-0">
              <FaRobot className="text-xl text-primary-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Natural Language AI</h3>
              <p className="text-gray-600">
                OpenAI's GPT-4 for generating helpful food insights and summaries.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary-100 p-3 flex-shrink-0">
              <FaUtensils className="text-xl text-primary-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Modern Web Stack</h3>
              <p className="text-gray-600">
                React frontend with FastAPI backend for a seamless user experience.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Future improvements */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Future Improvements</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Improved food recognition with larger training datasets</li>
          <li>Portion size estimation using depth perception and reference objects</li>
          <li>User accounts to save and track meal history over time</li>
          <li>Meal recommendations based on nutritional goals</li>
          <li>Integration with fitness trackers and health apps</li>
        </ul>
      </div>
    </div>
  );
};

export default AboutPage; 