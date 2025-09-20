import { useState } from "react"

const ShoppingCart = () => {
  // State management
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState("")
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("")
  const [selectedStore, setSelectedStore] = useState(null)
  const [selectedPickupTime, setSelectedPickupTime] = useState("")
  const [customCashAmount, setCustomCashAmount] = useState("")
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [shakeError, setShakeError] = useState(false)

  // Mock data
  const subtotal = 125000
  const stores = [
    {
      id: "ST001",
      name: "Toko Elektronik Jakarta",
      address: "Jl. PEJAMBON GAMBIR GAMBIR JAKARTA PUSAT",
      roadAddress: "Jl. Pejambon No. 15",
      distance: "2.5 km",
      status: "open",
      openHours: "08:00",
      closeHours: "20:00",
    },
    {
      id: "ST002",
      name: "Toko Elektronik Pusat",
      address: "Jl. KEBON SIRIH MENTENG JAKARTA PUSAT",
      roadAddress: "Jl. Kebon Sirih No. 22",
      distance: "3.2 km",
      status: "open",
      openHours: "09:00",
      closeHours: "21:00",
    },
  ]

  const cashOptions = [150000, 200000, 250000, 300000, 500000]

  const cartItems = [
    {
      id: 1,
      name: "Smartphone Samsung Galaxy A54",
      price: 75000,
      quantity: 1,
      image: "/modern-smartphone.png",
    },
    {
      id: 2,
      name: "Earphone Wireless",
      price: 50000,
      quantity: 1,
      image: "/wireless-earphone.jpg",
    },
  ]

  const selectedAddress = {
    label: "Rumah",
    fullAddress: "Jl. Sudirman No. 123, Menteng, Jakarta Pusat",
    recipient: "John Doe",
    phone: "+62 812-3456-7890",
  }

  // Helper functions
  const generateTimeSlots = (openHour, closeHour) => {
    const slots = []
    const start = Number.parseInt(openHour.split(":")[0])
    const end = Number.parseInt(closeHour.split(":")[0])

    for (let i = start; i < end; i++) {
      slots.push(`${i.toString().padStart(2, "0")}:00 - ${(i + 1).toString().padStart(2, "0")}:00`)
    }
    return slots
  }

  const handleCustomCashInput = (value) => {
    setCustomCashAmount(value)
    if (Number.parseInt(value) < subtotal && value !== "") {
      setShakeError(true)
      setTimeout(() => setShakeError(false), 500)
    }
  }

  const isConfirmButtonEnabled = () => {
    return selectedDeliveryOption && selectedPaymentOption
  }

  // Modal Components
  const DeliveryModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-popover rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-popover-foreground">Opsi Pengiriman</h3>
          <button onClick={() => setShowDeliveryModal(false)} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setSelectedDeliveryOption("kurir")}
            className={`w-full p-4 rounded-lg border text-left transition-colors ${
              selectedDeliveryOption === "kurir"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🚚</span>
              <span className="font-medium">Kurir</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedDeliveryOption("ambil_ke_toko")}
            className={`w-full p-4 rounded-lg border text-left transition-colors ${
              selectedDeliveryOption === "ambil_ke_toko"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🏪</span>
              <span className="font-medium">Ambil ke Toko</span>
            </div>
          </button>
        </div>

        {selectedDeliveryOption === "ambil_ke_toko" && (
          <div className="mt-4 space-y-3">
            <h4 className="font-medium text-popover-foreground">Pilih Toko:</h4>
            {stores.map((store) => (
              <div key={store.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setSelectedStore(store)}
                  className={`w-full p-4 text-left transition-colors ${
                    selectedStore?.id === store.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-card-foreground">{store.roadAddress}</h5>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        store.status === "open" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {store.status === "open" ? "Buka" : "Tutup"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {store.openHours} - {store.closeHours} • {store.distance}
                  </p>
                  <p className="text-xs text-muted-foreground">{store.address}</p>
                </button>

                {selectedStore?.id === store.id && (
                  <div className="p-4 bg-muted border-t">
                    <h6 className="font-medium mb-2 text-card-foreground">Pilih Waktu Pengambilan:</h6>
                    <div className="grid grid-cols-2 gap-2">
                      {generateTimeSlots(store.openHours, store.closeHours).map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedPickupTime(slot)}
                          className={`p-2 rounded text-sm transition-colors ${
                            selectedPickupTime === slot
                              ? "bg-primary text-primary-foreground"
                              : "bg-background border border-border hover:border-primary/50"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setShowDeliveryModal(false)}
          disabled={selectedDeliveryOption === "ambil_ke_toko" && (!selectedStore || !selectedPickupTime)}
          className={`w-full mt-4 py-3 rounded-lg font-medium transition-colors ${
            selectedDeliveryOption === "kurir" ||
            (selectedDeliveryOption === "ambil_ke_toko" && selectedStore && selectedPickupTime)
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          Konfirmasi
        </button>
      </div>
    </div>
  )

  const PaymentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-popover rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-popover-foreground">Opsi Pembayaran</h3>
          <button onClick={() => setShowPaymentModal(false)} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <button
              onClick={() => setSelectedPaymentOption("cash")}
              className={`w-full p-4 rounded-lg border text-left transition-colors ${
                selectedPaymentOption === "cash"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">💵</span>
                <span className="font-medium">Tunai</span>
              </div>
            </button>

            {selectedPaymentOption === "cash" && (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-muted-foreground">Subtotal: Rp {subtotal.toLocaleString("id-ID")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {cashOptions.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setCustomCashAmount(amount.toString())}
                      className={`p-2 rounded text-sm transition-colors ${
                        customCashAmount === amount.toString()
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border border-border hover:border-primary/50"
                      }`}
                    >
                      Rp {amount.toLocaleString("id-ID")}
                    </button>
                  ))}
                </div>
                <div className={`${shakeError ? "shake" : ""}`}>
                  <input
                    type="number"
                    placeholder="Nominal custom"
                    value={customCashAmount}
                    onChange={(e) => handleCustomCashInput(e.target.value)}
                    className={`w-full p-3 border rounded-lg bg-input ${
                      Number.parseInt(customCashAmount) < subtotal && customCashAmount !== ""
                        ? "border-destructive"
                        : "border-border"
                    }`}
                  />
                  {Number.parseInt(customCashAmount) < subtotal && customCashAmount !== "" && (
                    <p className="text-destructive text-sm mt-1">Nominal harus lebih besar dari subtotal</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSelectedPaymentOption("ewallet")}
            className={`w-full p-4 rounded-lg border text-left transition-colors ${
              selectedPaymentOption === "ewallet"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📱</span>
              <span className="font-medium">E-Wallet & Kartu</span>
            </div>
          </button>

          {selectedPaymentOption === "ewallet" && (
            <div className="mt-3 space-y-2">
              {["GoPay", "OVO", "DANA", "ShopeePay", "Visa/Mastercard", "Debit"].map((method) => (
                <div key={method} className="flex items-center gap-3 p-2 border rounded hover:bg-muted">
                  <span className="text-sm">{method}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowPaymentModal(false)}
          disabled={
            !selectedPaymentOption ||
            (selectedPaymentOption === "cash" && (!customCashAmount || Number.parseInt(customCashAmount) < subtotal))
          }
          className={`w-full mt-4 py-3 rounded-lg font-medium transition-colors ${
            selectedPaymentOption &&
            (selectedPaymentOption !== "cash" || (customCashAmount && Number.parseInt(customCashAmount) >= subtotal))
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          Konfirmasi
        </button>
      </div>
    </div>
  )

  const AddressModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-popover rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-popover-foreground">Pilih Alamat</h3>
          <button onClick={() => setShowAddressModal(false)} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-primary/5 border-primary">
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                  {selectedAddress.label}
                </span>
                <p className="font-medium mt-2 text-card-foreground">{selectedAddress.recipient}</p>
                <p className="text-sm text-muted-foreground">{selectedAddress.phone}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedAddress.fullAddress}</p>
              </div>
              <span className="text-primary">✓</span>
            </div>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">📍</div>
            <p className="text-muted-foreground mb-3">Tambah alamat baru</p>
            <div className="bg-muted rounded-lg p-4 mb-3">
              <p className="text-sm text-muted-foreground">🗺️ LocationIQ Map akan muncul di sini</p>
            </div>
            <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors">
              Pilih di Peta
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowAddressModal(false)}
          className="w-full mt-4 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Konfirmasi Alamat
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto p-4 bg-background">
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4">
          <h1 className="text-xl font-bold">Keranjang Belanja</h1>
        </div>

        {/* Options Section */}
        <div className="p-4 border-b border-border">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setShowDeliveryModal(true)}
              className={`p-3 rounded-lg border text-center transition-colors ${
                selectedDeliveryOption
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-2xl mb-1">🚚</div>
              <div className="text-xs font-medium">Opsi Pengiriman</div>
            </button>

            <button
              onClick={() => setShowPaymentModal(true)}
              className={`p-3 rounded-lg border text-center transition-colors ${
                selectedPaymentOption
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-2xl mb-1">💳</div>
              <div className="text-xs font-medium">Opsi Pembayaran</div>
            </button>

            <button className="p-3 rounded-lg border border-border hover:border-primary/50 text-center transition-colors">
              <div className="text-2xl mb-1">⚙️</div>
              <div className="text-xs font-medium">Lainnya</div>
            </button>
          </div>
        </div>

        {/* Address Section */}
        <div className="p-4 border-b border-border">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold mb-2 text-card-foreground">Alamat Pengiriman</h3>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl">📍</span>
                  <div className="flex-1">
                    <span className="bg-accent text-accent-foreground px-2 py-1 rounded text-xs font-medium">
                      {selectedAddress.label}
                    </span>
                    <p className="font-medium mt-1 text-card-foreground">{selectedAddress.recipient}</p>
                    <p className="text-sm text-muted-foreground">{selectedAddress.phone}</p>
                    <p className="text-sm text-muted-foreground">{selectedAddress.fullAddress}</p>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAddressModal(true)}
              className="ml-3 px-3 py-1 text-sm border border-border rounded hover:border-primary/50 transition-colors"
            >
              Ubah
            </button>
          </div>
        </div>

        {/* Order Section */}
        <div className="p-4">
          <h3 className="font-semibold mb-3 text-card-foreground">Pesanan Anda</h3>

          {/* Store Info */}
          <div className="bg-muted rounded-lg p-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">🏪</span>
              <div>
                <p className="font-medium text-card-foreground">Toko Elektronik Jakarta (ST001)</p>
                <p className="text-sm text-muted-foreground">2.5 km dari lokasi Anda</p>
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="space-y-3 mb-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-15 h-15 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-card-foreground">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-card-foreground">Rp {item.price.toLocaleString("id-ID")}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-card-foreground">Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Ongkos Kirim</span>
              <span className="font-medium text-card-foreground">Rp 10.000</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold border-t border-border pt-2">
              <span className="text-card-foreground">Total</span>
              <span className="text-primary">Rp {(subtotal + 10000).toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            disabled={!isConfirmButtonEnabled()}
            className={`w-full mt-4 py-4 rounded-lg font-semibold text-lg transition-colors ${
              isConfirmButtonEnabled()
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {isConfirmButtonEnabled() ? "Checkout Sekarang" : "Lengkapi Opsi Pengiriman & Pembayaran"}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showDeliveryModal && <DeliveryModal />}
      {showPaymentModal && <PaymentModal />}
      {showAddressModal && <AddressModal />}
    </div>
  )
}

export default ShoppingCart
