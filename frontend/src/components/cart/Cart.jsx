// src/components/cart/Cart.js
import { useState } from "react";
import { AlertOctagon } from "lucide-react"; // ⬅️ Import the icon
import DeliveryOptionsModal from "../modal/delivery-option";
import { PaymentOptionsModal } from "../modal/payment-option";
import DeleteConfirmationModal from "../modal/delete-confirmation-cart";

// Sections
import DeliverySection from "./DeliverySection";
import PaymentSection from "./PaymentSection";
import AddressSection from "./AddressSection";
import StoreSection from "./StoreSection";
import OrderItemsSection from "./OrderItem";
import OrderSummary from "./OrderSummary";

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

  const [cartItems, setCartItems] = useState([
    {
      id: "1",
      name: "Premium Wireless Headphones",
      price: 29999,
      quantity: 1,
      image: "/wireless-headphones.png",
    },
    {
      id: "2",
      name: "Smart Fitness Watch",
      price: 19999,
      quantity: 2,
      image: "/fitness-watch.png",
    },
    {
      id: "3",
      name: "Bluetooth Speaker",
      price: 8999,
      quantity: 1,
      image: "/bluetooth-speaker.png",
    },
  ]);

  const [selectedItems, setSelectedItems] = useState(
    new Set(cartItems.map((item) => item.id))
  );

  const removeItem = (itemId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeItem(itemToDelete);
      setItemToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const deliveryAddresses = [
    {
      id: "1",
      name: "Home",
      address: "123 Main Street, New York, NY 10001",
      isDefault: true,
    },
    {
      id: "2",
      name: "Office",
      address: "456 Business Ave, New York, NY 10002",
      isDefault: false,
    },
    {
      id: "3",
      name: "Parents House",
      address: "789 Family Lane, Brooklyn, NY 11201",
      isDefault: false,
    },
  ];

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
            <div className="lg:col-span-2">
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
