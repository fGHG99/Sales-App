// src/components/cart/Cart.js
import { useState, useEffect } from "react";
import { AlertOctagon } from "lucide-react"; // ⬅️ Import the icon
import api from "../../../utils/api";
import DeliveryOptionsModal from "../../modal/delivery-option";
import { PaymentOptionsModal } from "../../modal/payment-option";
import DeleteConfirmationModal from "../../modal/delete-confirmation-cart";

// Sections
import DeliverySection from "./DeliverySection";
import PaymentSection from "./PaymentSection";
import AddressSection from "./AddressSection";
import StoreSection from "./StoreSection";
import OrderItemsSection from "./OrderItem";
import OrderSummary from "./OrderSummary";

const BE_URL =
  import.meta.env.VITE_BE_API_URL?.replace("/api", "") ||
  "http://localhost:3000";

export default function Cart() {
  const [deliveryOption, setDeliveryOption] = useState({
    type: "courier",
    cost: 12000,
  });

  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState({
    type: "method",
    methodId: "card-1",
  });
  const [selectedAddress, setSelectedAddress] = useState("1");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Cart state from API
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedItems, setSelectedItems] = useState(new Set());

  // Address state from API
  const [deliveryAddresses, setDeliveryAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  // Fetch cart data and addresses on component mount
  useEffect(() => {
    fetchCartData();
    fetchUserAddresses();
  }, []);

  const fetchCartData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🛒 Fetching cart data from API...");

      const response = await api.get("/cart/get-cart");
      console.log("✅ Cart data fetched:", response.data);

      const { cart } = response.data;

      console.log("📊 Cart data structure:", {
        hasCart: !!cart,
        hasCartItems: !!cart?.cartItems,
        isArray: Array.isArray(cart?.cartItems),
        itemsLength: cart?.cartItems?.length,
        fullCart: cart,
      });

      if (cart && cart.cartItems && Array.isArray(cart.cartItems)) {
        // Transform cart items from API format to component format
        const transformedItems = cart.cartItems.map((item) => ({
          id: item.productId,
          name: item.name,
          price: Number(item.sellingPrice),
          quantity: item.quantity,
          image: item.images?.[0]?.url
            ? `${BE_URL}${item.images[0].url}`
            : "/placeholder-product.png",
        }));

        setCartItems(transformedItems);

        // Select all items by default
        setSelectedItems(new Set(transformedItems.map((item) => item.id)));
      } else {
        setCartItems([]);
        setSelectedItems(new Set());
      }
    } catch (err) {
      console.error("❌ Failed to fetch cart data:", err);
      setError(err.response?.data?.message || "Failed to load cart");
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId) => {
    try {
      console.log(`🗑️ Removing item ${itemId} from cart...`);

      // Call API to remove item from cart
      await api.patch("/cart/remove-item", {
        productId: itemId,
      });

      console.log(`✅ Item ${itemId} removed from cart successfully`);

      // Update local state after successful API call
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });

      // Dispatch event to update cart count in navbar
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (err) {
      console.error("❌ Failed to remove item:", err);
      alert(err.response?.data?.message || "Failed to remove item from cart");
    }
  };

  const removeSelectedItems = async () => {
    if (selectedItems.size === 0) {
      alert("No items selected");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove ${selectedItems.size} selected item(s)?`
    );

    if (!confirmed) return;

    try {
      console.log(`🗑️ Removing ${selectedItems.size} items from cart...`);

      const productIdsArray = Array.from(selectedItems);

      // Call API to remove multiple items from cart
      await api.patch("/cart/remove-item", {
        productIds: productIdsArray,
      });

      console.log(
        `✅ ${selectedItems.size} items removed from cart successfully`
      );

      // Update local state after successful API call
      setCartItems((prev) =>
        prev.filter((item) => !selectedItems.has(item.id))
      );
      setSelectedItems(new Set()); // Clear selection

      // Dispatch event to update cart count in navbar
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (err) {
      console.error("❌ Failed to remove selected items:", err);
      alert(
        err.response?.data?.message ||
          "Failed to remove selected items from cart"
      );
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeItem(itemToDelete);
      setItemToDelete(null);
      setShowDeleteModal(false);
    }
  };

  // Fetch user addresses from API
  const fetchUserAddresses = async () => {
    try {
      setIsLoadingAddresses(true);

      // Get user data to get userId
      const userResponse = await api.get("/users/me");
      const userId = userResponse.data.user.id;

      console.log("📍 Fetching user addresses...");

      // Fetch addresses for the user
      const addressResponse = await api.get(`/address/user/${userId}`);
      console.log("✅ Addresses fetched:", addressResponse.data);

      if (addressResponse.data && Array.isArray(addressResponse.data)) {
        // Transform addresses to match component format
        const transformedAddresses = addressResponse.data.map((addr) => ({
          id: addr.id,
          name: addr.label,
          recipientName: addr.recipientName,
          recipientPhone: addr.recipientPhone,
          address: `${addr.fullAddress}, ${addr.subDistrict || ""} ${
            addr.district || ""
          }, ${addr.city || ""}, ${addr.province}, ${addr.postalCode}`
            .replace(/,\s+,/g, ",")
            .trim(),
          fullAddress: addr.fullAddress,
          subDistrict: addr.subDistrict,
          district: addr.district,
          city: addr.city,
          province: addr.province,
          country: addr.country,
          postalCode: addr.postalCode,
          latitude: addr.latitude,
          longitude: addr.longitude,
          isDefault: false, // You can add logic to determine default address
        }));

        setDeliveryAddresses(transformedAddresses);

        // Set first address as selected by default
        if (transformedAddresses.length > 0) {
          setSelectedAddress(transformedAddresses[0].id);
        }
      } else {
        setDeliveryAddresses([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch addresses:", err);
      // Don't show error, just use empty addresses
      setDeliveryAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  // Handle when a new address is added
  const handleAddressAdded = (newAddress) => {
    console.log("🏠 New address added, refreshing list...");
    fetchUserAddresses(); // Refresh the address list
  };

  const store = {
    id: "1",
    name: "TechStore Manhattan",
    address: "100 Tech Plaza, Manhattan, NY 10003",
    distance: "2.3 miles",
  };

  const mockStores = [
    {
      id: "1",
      name: "TechStore Manhattan",
      address: "100 Tech Plaza, Manhattan, NY 10003",
      openHour: "09:00",
      closeHour: "21:00",
      distance: "2.3 miles",
      distanceValue: 2.3,
      coordinates: { lat: 40.7589, lng: -73.9851 },
    },
    {
      id: "2",
      name: "TechStore Brooklyn",
      address: "456 Brooklyn Ave, Brooklyn, NY 11201",
      openHour: "08:00",
      closeHour: "22:00",
      distance: "4.7 miles",
      distanceValue: 4.7,
      coordinates: { lat: 40.6892, lng: -73.9442 },
    },
    {
      id: "3",
      name: "TechStore Queens",
      address: "789 Queens Blvd, Queens, NY 11373",
      openHour: "10:00",
      closeHour: "20:00",
      distance: "8.1 miles",
      distanceValue: 8.1,
      coordinates: { lat: 40.7282, lng: -73.7949 },
    },
  ];

  const formatIDR = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const selectedCartItems = cartItems.filter((item) =>
    selectedItems.has(item.id)
  );
  const subtotal = selectedCartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryCost = deliveryOption.cost;
  const total = subtotal + deliveryCost;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center py-20 text-red-500">
            <AlertOctagon className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">{error}</p>
            <button
              onClick={fetchCartData}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {cartItems.length > 0 && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Shopping Cart
            </h1>
            <p className="text-muted-foreground">
              Review your order and complete your purchase
            </p>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <AlertOctagon className="w-16 h-16 mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">
              You have nothing yet, try shopping!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DeliverySection
                  deliveryOption={deliveryOption}
                  setDeliveryModalOpen={setDeliveryModalOpen}
                  formatIDR={formatIDR}
                  mockStores={mockStores}
                />

                <PaymentSection
                  selectedPayment={selectedPayment}
                  setPaymentModalOpen={setPaymentModalOpen}
                  formatIDR={formatIDR}
                />
              </div>

              {deliveryOption.type === "courier" && (
                <AddressSection
                  deliveryAddresses={deliveryAddresses}
                  selectedAddress={selectedAddress}
                  setSelectedAddress={setSelectedAddress}
                  isLoadingAddresses={isLoadingAddresses}
                  onAddressAdded={handleAddressAdded}
                />
              )}

              <StoreSection deliveryOption={deliveryOption} store={store} />

              <OrderItemsSection
                cartItems={cartItems}
                setCartItems={setCartItems}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                formatIDR={formatIDR}
                subtotal={subtotal}
                setShowDeleteModal={setShowDeleteModal}
                setItemToDelete={setItemToDelete}
                removeSelectedItems={removeSelectedItems}
              />
            </div>

            {/* Right side */}
            <div className="lg:col-span-1">
              <OrderSummary
                deliveryOption={deliveryOption}
                subtotal={subtotal}
                deliveryCost={deliveryCost}
                total={total}
                formatIDR={formatIDR}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DeliveryOptionsModal
        open={deliveryModalOpen}
        onOpenChange={setDeliveryModalOpen}
        onDeliverySelect={setDeliveryOption}
        currentSelection={deliveryOption}
      />

      <PaymentOptionsModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        onPaymentSelect={setSelectedPayment}
        currentSelection={selectedPayment}
        subtotal={total}
      />

      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
