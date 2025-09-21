import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
} from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import ShoppingCart from "./components/Cart";
import Register from "./components/Register";
import Login from "./components/Login";
import AuthLayout from "./components/AuthLayout";
import TermsConditions from "./components/TermsCon";
import ProductDetail from "./components/ProductDetail";

// Mock category and other pages
const CategoryPage = () => {
  const { categoryName } = useParams();

  return (
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
};

const SearchPage = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get("q");

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Hasil Pencarian
          </h1>
          <p className="text-lg text-gray-600 mb-8">Hasil untuk: "{query}"</p>
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

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth routes - these should come first and not be nested under Layout */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="signin" element={<Login />} />
          <Route path="signup" element={<Register />} />
        </Route>

        {/* Main app routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="category/:categoryName" element={<CategoryPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="cart" element={<ShoppingCart />} />
          <Route path="terms-conditions" element={<TermsConditions />} />
          <Route path="p/:productname" element={<ProductDetail />} />
          {/* Catch all route */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-gray-50 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    404 - Page Not Found
                  </h1>
                  <p className="text-lg text-gray-600">
                    The page you're looking for doesn't exist.
                  </p>
                </div>
              </div>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
