import { Link } from 'react-router-dom';
import { FaCamera, FaChartBar, FaBrain, FaArrowRight } from 'react-icons/fa';

/**
 * Home page component with app introduction and links
 */
const HomePage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero section */}
      <div className="text-center mb-20 animate-fade-in">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-light tracking-tight mb-8">
          <span className="text-primary-500">Food Photos</span> to 
          <span className="gradient-text"> Nutrition</span>
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-xl mx-auto font-light leading-relaxed">
          Instant nutritional insights from your meal photos powered by AI
        </p>
        <Link 
          to="/analyze" 
          className="btn btn-primary px-10 py-3 text-base shadow-md"
        >
          Try Now <FaArrowRight className="ml-2 opacity-70" />
        </Link>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        <div className="minimal-card hover:shadow-md animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="mb-5 text-primary-500">
            <FaCamera className="text-3xl" />
          </div>
          <h3 className="text-xl font-display font-light mb-3">Upload Photo</h3>
          <p className="text-gray-600 leading-relaxed">
            Simply take a photo of your meal or upload from your gallery.
          </p>
        </div>
        
        <div className="minimal-card hover:shadow-md animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="mb-5 text-primary-500">
            <FaBrain className="text-3xl" />
          </div>
          <h3 className="text-xl font-display font-light mb-3">AI Analysis</h3>
          <p className="text-gray-600 leading-relaxed">
            Our AI identifies food with precision and calculates nutritional content.
          </p>
        </div>
        
        <div className="minimal-card hover:shadow-md animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="mb-5 text-primary-500">
            <FaChartBar className="text-3xl" />
          </div>
          <h3 className="text-xl font-display font-light mb-3">Get Nutrition Data</h3>
          <p className="text-gray-600 leading-relaxed">
            View calories, protein, carbs, and fat in a clean, easy-to-read format.
          </p>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-white border border-gray-100 rounded-md p-10 text-center shadow-sm animate-fade-in mb-10">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-display font-light mb-5 heading-underline pb-4 inline-block">Ready to analyze?</h2>
          <p className="text-gray-600 mb-10 prose mx-auto">
            Get instant nutritional information with a single photo
          </p>
          <Link 
            to="/analyze" 
            className="btn btn-primary px-8 py-3 shadow-md"
          >
            Analyze Food <FaArrowRight className="ml-2 text-sm" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 