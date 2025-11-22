import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';
import { Settings } from './pages/Settings';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/collections" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/editor/:id" element={<Editor />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
