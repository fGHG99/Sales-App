import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  MessageCircle,
  Clock,
  CheckCircle,
  ExternalLink,
  User,
  Package,
  Calendar,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Textarea } from "../../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { formatDate, formatCurrency } from "../../../utils/mockDataAdmin";
import Pagination from "../../Pagination";
import {
  getAllDisputes,
  updateDisputeStatus as apiUpdateDisputeStatus,
  resolveDispute as apiResolveDispute,
  getDisputeStatusBadgeColor,
  formatDisputeStatus,
  formatDisputeReason,
} from "../../../services/adminService";

const DisputesManagement = () => {
  const [disputes, setDisputes] = useState([]);
  const [counts, setCounts] = useState({ total: 0, openCases: 0, resolved: 0 });
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const itemsPerPage = 5;

  // Fetch disputes from API
  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine status filter based on tab
      let statusParam = null;
      if (filter === "open") {
        statusParam = "IN_PROGRESS"; // Show IN_PROGRESS disputes for open tab
      } else if (filter === "resolved") {
        statusParam = "RESOLVED";
      }
      // filter === "all" → no status param

      const response = await getAllDisputes({
        page: currentPage,
        limit: itemsPerPage,
        status: statusParam,
      });

      if (response.success) {
        setDisputes(response.data.disputes);
        setCounts(response.data.counts);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (err) {
      console.error("Error fetching disputes:", err);
      setError("Gagal mengambil data disputes. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch disputes when filter or page changes
  useEffect(() => {
    fetchDisputes();
  }, [filter, currentPage]);

  const updateDisputeStatus = async (disputeId, newStatus, response = "") => {
    try {
      setUpdating(true);

      if (newStatus === "RESOLVED" && response) {
        // Use resolve endpoint for resolved status with response
        await apiResolveDispute(disputeId, response);
      } else {
        // Use update status endpoint for other status changes
        await apiUpdateDisputeStatus(disputeId, newStatus);
      }

      // Refresh disputes after update
      await fetchDisputes();
    } catch (err) {
      console.error("Error updating dispute status:", err);
      alert("Gagal mengupdate status dispute. Silakan coba lagi.");
    } finally {
      setUpdating(false);
    }
  };

  const handleWhatsAppContact = (customerName, orderId, issue) => {
    const message = encodeURIComponent(
      `Halo ${customerName}, saya dari Tim Support Geek Sales terkait keluhan order ${orderId}: "${issue}". Mohon info lebih lanjut untuk kami bantu selesaikan masalah ini.`
    );
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const DisputeDetailsModal = ({ dispute, onClose }) => {
    const [localResponse, setLocalResponse] = useState(dispute.response || "");

    const handleSaveResponse = async () => {
      await updateDisputeStatus(dispute.id, "RESOLVED", localResponse);
      setAdminResponse("");
      onClose();
    };

    const calculateTotal = (subtotal, deliveryFee) => {
      return parseInt(subtotal) + parseInt(deliveryFee);
    };

    return (
      <DialogContent
        className="max-w-3xl max-h-[90vh]"
        data-testid="dispute-details-modal"
      >
        <DialogHeader>
          <DialogTitle>
            Dispute Details - {dispute.id.substring(0, 8)}
          </DialogTitle>
          <DialogDescription>
            Complete information about this customer dispute
          </DialogDescription>
        </DialogHeader>

        <div
          className="space-y-6 pr-2 overflow-y-auto"
          style={{ 
            maxHeight: "calc(95vh - 120px)",
            scrollbarWidth: "none",
            msOverflowStyle: "none"
          }}
        >
          {/* Dispute Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Dispute Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                  <span>Reason: {formatDisputeReason(dispute.reason)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Created: {formatDate(dispute.createdAt)}</span>
                </div>
                {dispute.resolvedAt && (
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    <span>Resolved: {formatDate(dispute.resolvedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Customer Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{dispute.user.name}</span>
                </div>
                <div className="flex items-center">
                  <Package className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Order: {dispute.order.id.substring(0, 8)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Issue Description */}
          <div>
            <h3 className="font-semibold mb-3">Issue Description</h3>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{dispute.description}</p>
            </div>
          </div>

          {/* Dispute Evidence */}
          {dispute.imageUrl && dispute.imageUrl.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" />
                Bukti Dispute
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {dispute.imageUrl.map((url, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <img
                      src={url}
                      alt={`Dispute evidence ${index + 1}`}
                      className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(url, "_blank")}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Klik gambar untuk melihat ukuran penuh
              </p>
            </div>
          )}

          {/* Order Details */}
          <div>
            <h3 className="font-semibold mb-3">Related Order Details</h3>
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Order Total:</span>
                <span>
                  {formatCurrency(
                    calculateTotal(
                      dispute.order.subtotal,
                      dispute.order.deliveryFee
                    )
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>{formatCurrency(parseInt(dispute.order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Delivery Fee:</span>
                <span>
                  {formatCurrency(parseInt(dispute.order.deliveryFee))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Items:</span>
                <span>{dispute.order.orderItems.length} items</span>
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="font-medium mb-2">Order Items:</p>
                {dispute.order.orderItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.productName}
                    </span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Admin Response */}
          <div>
            <h3 className="font-semibold mb-3">Admin Response</h3>
            <div className="space-y-4">
              <Textarea
                value={localResponse}
                onChange={(e) => setLocalResponse(e.target.value)}
                placeholder={
                  dispute.status === "RESOLVED"
                    ? "Response telah disimpan dan tidak dapat diubah"
                    : "Masukkan response admin terhadap dispute ini..."
                }
                rows={4}
                disabled={dispute.status === "RESOLVED"}
                readOnly={dispute.status === "RESOLVED"}
                className={
                  dispute.status === "RESOLVED"
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }
                data-testid="admin-response-textarea"
              />

              <div className="flex items-center space-x-3">
                <Button
                  onClick={() =>
                    handleWhatsAppContact(
                      dispute.user.name,
                      dispute.order.id,
                      dispute.description
                    )
                  }
                  variant="outline"
                  size="sm"
                  disabled={dispute.status === "RESOLVED"}
                  data-testid="whatsapp-contact-button"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact via WhatsApp
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Status Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Badge
                className={getDisputeStatusBadgeColor(dispute.status)}
                data-testid={`dispute-status-${dispute.id}`}
              >
                {formatDisputeStatus(dispute.status)}
              </Badge>
            </div>

            <div className="space-x-2">
              {dispute.status === "PENDING" && (
                <Button
                  onClick={async () => {
                    await updateDisputeStatus(dispute.id, "IN_PROGRESS");
                    onClose();
                  }}
                  size="sm"
                  disabled={updating}
                  data-testid="start-progress-button"
                >
                  {updating && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  <Clock className="w-4 h-4 mr-2" />
                  Start Processing
                </Button>
              )}
              {dispute.status === "IN_PROGRESS" && (
                <Button
                  onClick={async () => {
                    await updateDisputeStatus(
                      dispute.id,
                      "RESOLVED",
                      localResponse
                    );
                    onClose();
                  }}
                  size="sm"
                  disabled={updating}
                  data-testid="resolve-dispute-button"
                >
                  {updating && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Resolved
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    );
  };

  return (
    <div className="space-y-6" data-testid="disputes-management">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Disputes Management
        </h1>
        <p className="text-gray-600">
          Handle customer complaints and order issues
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: "all", label: "All Disputes" },
          { key: "open", label: "Open Cases" },
          { key: "resolved", label: "Resolved" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            data-testid={`filter-${tab.key}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="total-disputes-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {loading ? "..." : counts.total}
                </p>
                <p className="text-sm text-gray-600">Total Disputes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="open-disputes-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {loading ? "..." : counts.openCases}
                </p>
                <p className="text-sm text-gray-600">Open Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="resolved-disputes-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {loading ? "..." : counts.resolved}
                </p>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disputes list */}
      <div className="space-y-4">
        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="mx-auto h-12 w-12 text-gray-400 mb-4 animate-spin" />
              <p className="text-gray-500">Loading disputes...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error Loading Disputes
              </h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={fetchDisputes} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && disputes.length === 0 && (
          <Card data-testid="no-disputes-message">
            <CardContent className="p-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No disputes found
              </h3>
              <p className="text-gray-500">
                {filter === "all"
                  ? "No active disputes at the moment."
                  : `No disputes match the "${filter}" filter.`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Disputes List */}
        {!loading &&
          !error &&
          disputes.length > 0 &&
          disputes.map((dispute) => {
            const orderTotal =
              parseInt(dispute.order.subtotal) +
              parseInt(dispute.order.deliveryFee);
            return (
              <Card
                key={dispute.id}
                className="hover:shadow-md transition-shadow"
                data-testid={`dispute-card-${dispute.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-lg">
                              #{dispute.id.substring(0, 8)}
                            </h3>
                            <Badge
                              className={getDisputeStatusBadgeColor(
                                dispute.status
                              )}
                              data-testid={`status-badge-${dispute.id}`}
                            >
                              {formatDisputeStatus(dispute.status)}
                            </Badge>
                          </div>

                          <p className="text-gray-600 mt-1">
                            Customer: {dispute.user.name} • Order: #
                            {dispute.order.id.substring(0, 8)}
                          </p>

                          <div className="mt-2">
                            <p className="font-medium text-red-700">
                              {formatDisputeReason(dispute.reason)}:
                            </p>
                            <p className="text-sm text-gray-700">
                              {dispute.description}
                            </p>
                          </div>

                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <span>
                              Created: {formatDate(dispute.createdAt)}
                            </span>
                            <span>
                              Order Value: {formatCurrency(orderTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleWhatsAppContact(
                            dispute.user.name,
                            dispute.order.id,
                            dispute.description
                          )
                        }
                        disabled={dispute.status === "RESOLVED"}
                        data-testid={`whatsapp-${dispute.id}`}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setSelectedDispute(dispute)}
                            data-testid={`manage-dispute-${dispute.id}`}
                          >
                            Manage Case
                          </Button>
                        </DialogTrigger>
                        <DisputeDetailsModal dispute={dispute} />
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination totalPages={totalPages} onPageChange={handlePageChange} />
      )}

      {/* Instructions */}
      <Card
        className="bg-blue-50 border-blue-200"
        data-testid="dispute-instructions"
      >
        <CardHeader>
          <CardTitle className="text-blue-800">
            Dispute Management Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p>
              • <strong>WhatsApp Contact:</strong> Klik untuk membuka pre-filled
              message untuk komunikasi langsung dengan customer
            </p>
            <p>
              • <strong>Resolution Process:</strong> 1) Contact customer 2)
              Investigate issue 3) Provide solution 4) Mark as resolved
            </p>
            <p>
              • <strong>Admin Response:</strong> Berikan response terhadap
              dispute dan dokumentasikan semua aksi yang diambil untuk referensi
            </p>
            <p>
              • <strong>Bukti Dispute:</strong> Review bukti gambar yang dikirim
              customer untuk memvalidasi komplain mereka
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DisputesManagement;
