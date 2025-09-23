import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Search, ShoppingCart, Menu, X } from "lucide-react";
import SearchBar from "./SearchBar";

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
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Mock authentication check
  const isAuthenticated = () => {
    return document.cookie.includes("refresh_token");
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
    // if (!isAuthenticated()) {
    //   setShowLoginModal(true);
    // } else {
    //   navigate("/cart");
    // }
    navigate("/cart");
  };

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
                onSelect={(product) => navigate(`/p/${product.name.replace(/\s+/g, "-").toLowerCase()}`)}
              />
            </div>

            <div className="hidden lg:flex items-center">
              {/* Cart Section */}
              <button
                onClick={handleCartClick}
                className="p-2 mr-6 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="w-6 h-6" />
              </button>

              {/* Auth Section */}
              <div className="flex items-center space-x-3">
                <Link
                  to="/auth/signin"
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-inter font-medium"
                >
                  Masuk
                </Link>

                <Link
                  to="/auth/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-inter font-medium"
                >
                  Daftar
                </Link>
              </div>
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
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  <ShoppingCart className="w-6 h-6" />
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

      {/* Login Modal Trigger */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 font-inter">
              Masuk Diperlukan
            </h2>
            <p className="text-gray-600 mb-6 font-inter">
              Anda perlu masuk untuk mengakses keranjang belanja.
            </p>
            <div className="flex space-x-4">
              <Link
                to="/auth/signin"
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors duration-200 font-inter font-medium"
                onClick={() => setShowLoginModal(false)}
              >
                Masuk
              </Link>
              <button
                onClick={() => setShowLoginModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-inter"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
