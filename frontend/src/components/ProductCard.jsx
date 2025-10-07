import { Link } from "react-router-dom";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import api from "../utils/api";

const BE_URL =
  import.meta.env.VITE_BE_API_URL;

const ProductCard = ({ product, loading = false }) => {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(0); // 0 means not in cart
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle Add to Cart
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAddingToCart) return; // Prevent double-click

    try {
      setIsAddingToCart(true);
      console.log("🛒 Adding product to cart:", product.id);

      const response = await api.post("/cart/add", {
        productId: product.id,
        quantity: 1,
      });

      console.log("✅ Product added to cart:", response.data);

      // Set quantity to 1 to show quantity controls
      setQuantity(1);

      // Dispatch custom event to update cart count in navbar
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error) {
      console.error("❌ Failed to add product to cart:", error);

      if (error.response?.status === 401) {
        alert("Please login to add items to cart");
        window.location.href = "/auth/signin";
      } else {
        alert(error.response?.data?.message || "Failed to add product to cart");
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle Increase Quantity
  const handleIncreaseQuantity = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isUpdating) return;

    try {
      setIsUpdating(true);
      const newQuantity = quantity + 1;

      await api.post("/cart/add", {
        productId: product.id,
        quantity: 1, // Add 1 more
      });

      setQuantity(newQuantity);
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error) {
      console.error("❌ Failed to increase quantity:", error);
      alert(error.response?.data?.message || "Failed to update quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Decrease Quantity
  const handleDecreaseQuantity = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isUpdating || quantity <= 0) return;

    try {
      setIsUpdating(true);
      const newQuantity = quantity - 1;

      if (newQuantity === 0) {
        // Remove from cart by setting quantity to 0
        await api.post("/cart/add", {
          productId: product.id,
          quantity: -quantity, // Subtract all
        });
        setQuantity(0);
      } else {
        await api.post("/cart/add", {
          productId: product.id,
          quantity: -1, // Subtract 1
        });
        setQuantity(newQuantity);
      }

      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error) {
      console.error("❌ Failed to decrease quantity:", error);
      alert(error.response?.data?.message || "Failed to update quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    // Skeleton Loader
    return (
      <div className="bg-white rounded-2xl shadow-md flex-shrink-0 w-[170px] h-[420px] animate-pulse flex flex-col">
        {/* Skeleton Image */}
        <div className="aspect-square bg-gray-200"></div>
        {/* Skeleton Content */}
        <div className="p-4 flex flex-col flex-grow">
          <div className="h-5 bg-gray-200 rounded mb-3"></div>
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-5"></div>
          <div className="h-10 bg-gray-200 rounded-md mt-auto"></div>
        </div>
      </div>
    );
  }

  // Handle product data from Prisma schema
  // Product model fields: id, name, barcode, description, unit, sellingPrice, isPerishable, isActive, isDeleted, createdAt, updatedAt, categoryId, category, images
  const productImage = product.images?.[0]?.url
    ? `${BE_URL}${product.images[0].url}`
    : product.img || "/placeholder-product.png";

  // Handle Decimal type from Prisma - sellingPrice is Decimal @db.Decimal(10, 0)
  // Prisma Decimal JSON format: { s: sign, e: exponent, d: [digits] }
  // Example: { s: 1, e: 3, d: [5000] } = 5000 × 10^(3-3) = 5000
  const parsePrismaDecimal = (val) => {
    if (!val) return 0;

    // Case 1: Already a number
    if (typeof val === "number") return val;

    // Case 2: String number
    if (typeof val === "string") {
      const n = parseFloat(val);
      return isNaN(n) ? 0 : n;
    }

    // Case 3: Prisma Decimal JSON object (has s, e, d)
    // Format: { s: sign (1 or -1), e: exponent, d: [digit array] }
    if (typeof val === "object" && "d" in val && Array.isArray(val.d)) {
      try {
        const sign = val.s || 1;
        const exponent = val.e || 0;
        const digits = val.d;

        // Join all digit array elements
        const digitString = digits.join("");

        // Calculate the actual number
        // Formula: sign × digits × 10^(exponent - (digitString.length - 1))
        const digitsLength = digitString.length;
        const power = exponent - (digitsLength - 1);

        const result = parseFloat(digitString) * Math.pow(10, power);

        return sign < 0 ? -result : result;
      } catch (error) {
        console.error("Error parsing Prisma Decimal:", error, val);
        return 0;
      }
    }

    // Fallback
    return 0;
  };

  const productPrice = parsePrismaDecimal(product.sellingPrice);

  // Debug logging
  if (productPrice === 0) {
    console.log("⚠️ Product price is 0. Full product data:", product);
    console.log("sellingPrice value:", product.sellingPrice);
    console.log("sellingPrice type:", typeof product.sellingPrice);
  }

  const productName = product.name || "Unnamed Product";

  return (
    <div
      key={product.id}
      className="w-[200px] h-[200px] bg-white rounded-2xl shadow-lg cursor-pointer flex-shrink-0 w-[170px] h-[420px] flex flex-col hover:shadow-xl transition-shadow select-none"
    >
      {/* Product Image */}
      <div className="w-full h-[200px]">
        <Link
          to={`/p/${productName.replace(/\s+/g, "-").toLowerCase()}`}
          onMouseDown={(e) => e.preventDefault()} // prevent drag highlighting
        >
          <img
            src={productImage}
            alt={product.images?.[0]?.altText || productName}
            className="w-full h-full object-cover rounded-t-2xl pointer-events-none select-none"
            draggable={false} // prevent image dragging
          />
        </Link>
      </div>

      {/* Add to Cart Button or Quantity Controls */}
      <div className="px-2 pt-5">
        {quantity === 0 ? (
          // Show "Tambah" button when not in cart
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className={`w-full text-white text-sm font-medium py-1.5 transition-colors flex items-center justify-center gap-1 select-none ${
              isAddingToCart
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            style={{ borderRadius: "25px" }}
          >
            {isAddingToCart ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <span className="text-lg">＋</span>
                Tambah
              </>
            )}
          </button>
        ) : (
          // Show quantity controls when in cart
          <div className="w-full flex items-center justify-between bg-blue-600 text-white px-3 py-1.5 rounded-full">
            <button
              onClick={handleDecreaseQuantity}
              disabled={isUpdating}
              className="hover:bg-blue-700 rounded-full p-1 transition-colors disabled:opacity-50"
            >
              <Minus size={16} />
            </button>
            <span className="font-medium text-sm min-w-[30px] text-center">
              {isUpdating ? "..." : quantity}
            </span>
            <button
              onClick={handleIncreaseQuantity}
              disabled={isUpdating}
              className="hover:bg-blue-700 rounded-full p-1 transition-colors disabled:opacity-50"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col gap-2 px-2 pt-2 pb-2 flex-grow">
        <Link
          to={`/p/${productName.replace(/\s+/g, "-").toLowerCase()}`}
          onMouseDown={(e) => e.preventDefault()}
        >
          <h3
            className="text-m font-regular select-none line-clamp-2 min-h-[48px]"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            title={productName}
          >
            {productName}
          </h3>
        </Link>

        {/* Price now right under product name */}
        <p className="text-base font-semibold select-none">
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(productPrice)}
        </p>

        {/* Spacer ensures button stays at the bottom */}
        <div className="flex-grow"></div>
      </div>
    </div>
  );
};

export default ProductCard;
