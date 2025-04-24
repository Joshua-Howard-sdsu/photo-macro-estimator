import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AnalyzePage from './pages/AnalyzePage';
import AboutPage from './pages/AboutPage';
import CodeExplanationPage from './pages/CodeExplanationPage';

// Main application component with routing
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="analyze" element={<AnalyzePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="code-explanation" element={<CodeExplanationPage />} />
      </Route>
    </Routes>
  );
}

export default App; 