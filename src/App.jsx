import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ShoppingCart from './components/Cart';

// Mock category and other pages
const CategoryPage = ({ categoryName }) => (
  <div className="min-h-screen bg-gray-50 py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Kategori: {categoryName}
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Explore products in the {categoryName} category
        </p>
        <div className="bg-white rounded-lg shadow-md p-12">
          <p className="text-gray-500 text-xl">
            Coming soon - Products will be displayed here
          </p>
        </div>
      </div>
    </div>
  </div>
);

const SearchPage = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');
  
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Hasil Pencarian
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Hasil untuk: "{query}"
          </p>
          <div className="bg-white rounded-lg shadow-md p-12">
            <p className="text-gray-500 text-xl">
              Coming soon - Search results will be displayed here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => (
  <div className="min-h-screen bg-gray-50 py-16">
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Halaman Login
      </h1>
      <p className="text-gray-600 text-center">
        Login functionality is integrated into the navbar cart modal
      </p>
    </div>
  </div>
);

const RegisterPage = () => (
  <div className="min-h-screen bg-gray-50 py-16">
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Halaman Registrasi
      </h1>
      <p className="text-gray-600 text-center">
        Registration functionality is integrated into the navbar cart modal
      </p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route 
            path="category/:categoryName" 
            element={<CategoryPage categoryName={window.location.pathname.split('/').pop()} />} 
          />
          <Route path="search" element={<SearchPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="cart" element={<ShoppingCart />} />
          {/* Catch all route */}
          <Route path="*" element={
            <div className="min-h-screen bg-gray-50 py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                <p className="text-lg text-gray-600">The page you're looking for doesn't exist.</p>
              </div>
            </div>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;