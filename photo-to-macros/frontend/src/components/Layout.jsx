import { Outlet, NavLink } from 'react-router-dom';
import { FaUtensils, FaInfoCircle, FaCode } from 'react-icons/fa';

// Layout component that wraps all pages with common header and navigation
const Layout = () => {
  // Function to determine if a nav link is active
  const getLinkClass = ({ isActive }) => 
    isActive
      ? 'flex items-center gap-2 px-4 py-2 text-primary-500 border-b-2 border-primary-500 font-medium'
      : 'flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors';
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with logo and nav */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            {/* Logo */}
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="flex items-center gap-2">
                <FaUtensils className="text-primary-500 text-2xl" />
                <h1 className="text-2xl font-display tracking-tight m-0">
                  <span className="gradient-text font-medium">Nom</span>
                  <span className="text-gray-800">Log</span>
                </h1>
              </div>
              <span className="ml-3 text-sm text-gray-500 font-light tracking-wide">Photo-to-Macro Estimator</span>
            </div>
            
            {/* Navigation */}
            <nav className="flex space-x-1">
              <NavLink to="/" className={getLinkClass} end>
                <FaUtensils className="text-primary-400" /> Home
              </NavLink>
              <NavLink to="/analyze" className={getLinkClass}>
                <FaUtensils className="text-primary-400" /> Analyze
              </NavLink>
              <NavLink to="/about" className={getLinkClass}>
                <FaInfoCircle className="text-primary-400" /> About
              </NavLink>
              <NavLink to="/code-explanation" className={getLinkClass}>
                <FaCode className="text-primary-400" /> Docs
              </NavLink>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Main content area */}
      <main className="flex-grow container mx-auto px-4 py-10">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 text-gray-500 text-sm py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="font-light">© {new Date().getFullYear()} NomLog Photo-to-Macro Estimator</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 