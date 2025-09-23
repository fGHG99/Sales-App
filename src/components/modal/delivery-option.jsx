import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Truck, MapPin, Clock, Navigation } from "lucide-react"

export default function DeliveryOptionsModal({
  open,
  onOpenChange,
  onDeliverySelect,
  currentSelection,
}) {
  const [selectedOption, setSelectedOption] = useState("courier")
  const [selectedStore, setSelectedStore] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(false)
  const [showMap, setShowMap] = useState(null)

  // Mock store data - in real app, this would come from API
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
  ]

  useEffect(() => {
    if (open && selectedOption === "pickup") {
      setLoading(true)
      // Simulate API call
      setTimeout(() => {
        const sortedStores = [...mockStores].sort((a, b) => a.distanceValue - b.distanceValue)
        setStores(sortedStores)
        setLoading(false)
      }, 1000)
    }
  }, [open, selectedOption])

  const generateTimeSlots = (openHour, closeHour) => {
    const slots = []
    const start = parseInt(openHour.split(":")[0])
    const end = parseInt(closeHour.split(":")[0])

    for (let hour = start; hour < end; hour++) {
      const timeString = `${hour.toString().padStart(2, "0")}:00`
      const displayTime =
        hour < 12 ? `${hour}:00 AM` : hour === 12 ? "12:00 PM" : `${hour - 12}:00 PM`
      slots.push({ value: timeString, display: displayTime })
    }
    return slots
  }

  const handleConfirm = () => {
    if (selectedOption === "courier") {
      onDeliverySelect({ type: "courier", cost: 12.99 })
    } else if (selectedOption === "pickup" && selectedStore && selectedTime) {
      onDeliverySelect({
        type: "pickup",
        storeId: selectedStore,
        pickupTime: selectedTime,
        cost: 0,
      })
    }
    onOpenChange(false)
  }

  const MapModal = ({ store }) => (
    <Dialog open={showMap === store.id} onOpenChange={() => setShowMap(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {store.name} Location
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 text-muted-foreground">Store Icon</div>
              <div>
                <p className="font-medium">{store.name}</p>
                <p className="text-sm text-muted-foreground">{store.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  {store.openHour} - {store.closeHour}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Navigation className="w-4 h-4" />
                <span>{store.distance} away</span>
              </div>
            </div>
          </div>

          {/* Mock map placeholder */}
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100 opacity-50"></div>
            <div className="relative z-10 text-center">
              <MapPin className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="font-medium text-foreground">{store.name}</p>
              <p className="text-sm text-muted-foreground">{store.distance} from your location</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Choose Delivery Option
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Option Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer transition-all ${
                  selectedOption === "courier" ? "ring-2 ring-primary bg-accent" : "hover:bg-accent/50"
                }`}
                onClick={() => setSelectedOption("courier")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Truck className="w-6 h-6 text-primary" />
                    <h3 className="font-semibold text-lg">Courier Delivery</h3>
                  </div>
                  <p className="text-muted-foreground mb-2">Fast delivery to your address</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">1-2 business days</span>
                    <Badge variant="secondary">$12.99</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  selectedOption === "pickup" ? "ring-2 ring-primary bg-accent" : "hover:bg-accent/50"
                }`}
                onClick={() => setSelectedOption("pickup")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 text-primary">Store Icon</div>
                    <h3 className="font-semibold text-lg">Store Pickup</h3>
                  </div>
                  <p className="text-muted-foreground mb-2">Pick up from nearest store</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Same day available</span>
                    <Badge variant="secondary">Free</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Store Selection for Pickup */}
            {selectedOption === "pickup" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Select Store & Pickup Time</h3>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <Skeleton className="w-12 h-12 rounded" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-3 w-64" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-9 w-24" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stores.map((store) => (
                      <Card
                        key={store.id}
                        className={`cursor-pointer transition-all ${
                          selectedStore === store.id ? "ring-2 ring-primary bg-accent" : "hover:bg-accent/50"
                        }`}
                        onClick={() => setSelectedStore(store.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                              <div className="w-6 h-6 text-primary">Store Icon</div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{store.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {store.distance}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">{store.address}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {store.openHour} - {store.closeHour}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowMap(store.id)
                              }}
                            >
                              View Map
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Time Selection */}
                {selectedStore && !loading && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Select Pickup Time</h4>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose pickup time" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const selectedStoreData = stores.find((s) => s.id === selectedStore)
                          if (!selectedStoreData) return null

                          return generateTimeSlots(
                            selectedStoreData.openHour,
                            selectedStoreData.closeHour
                          ).map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.display}
                            </SelectItem>
                          ))
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedOption === "pickup" && (!selectedStore || !selectedTime)}
                className="flex-1"
              >
                Confirm Selection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Map Modals */}
      {stores.map((store) => (
        <MapModal key={store.id} store={store} />
      ))}
    </>
  )
}
