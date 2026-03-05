import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import BottomNav from './components/BottomNav';

// Pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Diagnose from './pages/Diagnose';
import Shop from './pages/Shop';
import Timeline from './pages/Timeline';
import Profile from './pages/Profile';
import Treatment from './pages/Treatment';
import SavedTreatments from './pages/SavedTreatments';
import Fields from './pages/Fields';
import FieldDetails from './pages/FieldDetails';
import AddField from './pages/AddField';
import Settings from './pages/Settings';
import Help from './pages/Help';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="pb-16">
      {children}
      <BottomNav />
    </div>
  );
};

function App() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      {/* Mobile App Container */}
      <div className="w-full max-w-mobile bg-white min-h-screen relative shadow-2xl">
        <Router>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/diagnose" element={
            <ProtectedRoute>
              <Diagnose />
            </ProtectedRoute>
          } />
          <Route path="/shop" element={
            <ProtectedRoute>
              <Shop />
            </ProtectedRoute>
          } />
          <Route path="/timeline" element={
            <ProtectedRoute>
              <Timeline />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/treatment" element={
            <ProtectedRoute>
              <Treatment />
            </ProtectedRoute>
          } />
          <Route path="/saved-treatments" element={
            <ProtectedRoute>
              <SavedTreatments />
            </ProtectedRoute>
          } />
          <Route path="/fields" element={
            <ProtectedRoute>
              <Fields />
            </ProtectedRoute>
          } />
          <Route path="/field-details/:id" element={
            <ProtectedRoute>
              <FieldDetails />
            </ProtectedRoute>
          } />
          <Route path="/add-field" element={
            <ProtectedRoute>
              <AddField />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/help" element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Page not found</p>
                <a href="/" className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Go Home
                </a>
              </div>
            </div>
          } />
          </Routes>
        </Router>

        {/* Toast Notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#059669',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </div>
  );
}

export default App;
