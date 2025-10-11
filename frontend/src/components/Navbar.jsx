import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Search, ShoppingCart, Menu, X } from "lucide-react";
import SearchBar from "./SearchBar";
import AuthSection from "./AuthSection";
import LoginRequiredModal from "./modal/LoginRequiredModal";
import api from "../utils/api";

const categories = [
  "Elektronik",
  "Fashion",
  "Rumah & Taman",
  "Olahraga",
  "Kecantikan",
];

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Get user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUserData(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Check authentication using accessToken from localStorage
  const isAuthenticated = () => {
    const accessToken = localStorage.getItem("accessToken");
    return !!accessToken; // true if exists, false otherwise
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCartClick = () => {
    if (!isAuthenticated()) {
      setShowLoginModal(true);
    } else {
      navigate("/cart");
    }
  };

  // Fetch cart count for mobile icon and listen for updates
  useEffect(() => {
    const fetchCartCount = async () => {
      if (!isAuthenticated()) {
        setCartCount(0);
        return;
      }
      try {
        const res = await api.get("/cart/get-cart");
        const items = res.data?.cart?.cartItems || [];
        setCartCount(Array.isArray(items) ? items.length : 0);
      } catch (err) {
        setCartCount(0);
      }
    };

    fetchCartCount();
    const onCartUpdated = () => fetchCartCount();
    window.addEventListener("cartUpdated", onCartUpdated);
    return () => window.removeEventListener("cartUpdated", onCartUpdated);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (category) => {
    navigate(`/category/${category.toLowerCase()}`);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40 font-inter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              {/* !IMPORANT! ganti logo untuk mobile  */}
              <img
                src="/image/logo.png"
                alt="Geek Sales"
                className="w-40 h-40"
              />
            </Link>

            {/* !IMPORTANT! buat agar kategori tersebut menggunakan on hover bukan on click dan buat agar dropdown menjadi lebih baik */}
            <div className="hidden lg:flex items-center flex-1 mx-2">
              {/* Categories Dropdown - moved closer to logo */}
              <div className="relative mr-2" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-inter font-medium"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  <span>Kategori</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isDropdownOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 font-inter"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelect={(product) =>
                  navigate(
                    `/p/${product.name.replace(/\s+/g, "-").toLowerCase()}`
                  )
                }
              />
            </div>

            <div className="hidden lg:flex items-center space-x-6">
              <AuthSection
                isAuthenticated={isAuthenticated()}
                user={userData || { name: "User" }}
                handleCartClick={handleCartClick}
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari Barang"
                    className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-inter"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {/* Mobile Categories */}
              <div className="space-y-2">
                <p className="font-medium text-gray-900 font-inter">Kategori</p>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className="block w-full text-left px-2 py-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 font-inter"
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCartClick}
                  className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full ring-2 ring-white">
                      {cartCount}
                    </span>
                  )}
                </button>

                <Link
                  to="/auth/signin"
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-inter font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Masuk
                </Link>

                <Link
                  to="/auth/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-inter font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Daftar
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Login Required Modal */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Masuk Diperlukan"
        message="Anda perlu masuk untuk mengakses keranjang belanja."
        loginButtonText="Masuk"
        cancelButtonText="Batal"
      />
    </>
  );
};

export default Navbar;
