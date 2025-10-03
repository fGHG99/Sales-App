import React, { useState } from "react";
import {
  AlertTriangle,
  MessageCircle,
  Clock,
  CheckCircle,
  ExternalLink,
  User,
  Package,
  Calendar,
  Flag,
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
import {
  disputes as initialDisputes,
  orders,
  formatDate,
  formatCurrency,
} from "../../../utils/mockDataAdmin";
import Pagination from "../../Pagination";

const DisputesManagement = () => {
  const [disputes, setDisputes] = useState(initialDisputes);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const updateDisputeStatus = (disputeId, newStatus, notes = "") => {
    setDisputes((prevDisputes) =>
      prevDisputes.map((dispute) => {
        if (dispute.id === disputeId) {
          const updatedDispute = {
            ...dispute,
            status: newStatus,
            adminNotes: notes || dispute.adminNotes,
          };

          if (newStatus === "selesai") {
            updatedDispute.resolvedAt = new Date();
          }

          return updatedDispute;
        }
        return dispute;
      })
    );
  };

  const handleWhatsAppContact = (customerName, orderId, issue) => {
    const message = encodeURIComponent(
      `Halo ${customerName}, saya dari Tim Support Geek Sales terkait keluhan order ${orderId}: "${issue}". Mohon info lebih lanjut untuk kami bantu selesaikan masalah ini.`
    );
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const filteredDisputes = disputes.filter((dispute) => {
    if (filter === "all") return true;
    if (filter === "open") return dispute.status === "dalam proses";
    if (filter === "resolved") return dispute.status === "selesai";
    if (filter === "high-priority") return dispute.priority === "tinggi";
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredDisputes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDisputes = filteredDisputes.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getStatusColor = (status) => {
    const colors = {
      "dalam proses": "bg-yellow-100 text-yellow-800",
      selesai: "bg-green-100 text-green-800",
      ditutup: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      tinggi: "bg-red-100 text-red-800",
      sedang: "bg-yellow-100 text-yellow-800",
      rendah: "bg-green-100 text-green-800",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const getDisputeOrder = (orderId) => {
    return orders.find((order) => order.id === orderId);
  };

  const DisputeDetailsModal = ({ dispute, onClose }) => {
    const order = getDisputeOrder(dispute.orderId);
    const [localNotes, setLocalNotes] = useState(dispute.adminNotes || "");

    const handleSaveNotes = () => {
      updateDisputeStatus(dispute.id, dispute.status, localNotes);
      setAdminNotes("");
      onClose();
    };

    return (
      <DialogContent className="max-w-3xl" data-testid="dispute-details-modal">
        <DialogHeader>
          <DialogTitle>Dispute Details - {dispute.id}</DialogTitle>
          <DialogDescription>
            Complete information about this customer dispute
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Dispute Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Dispute Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Flag className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">Priority:</span>
                  <Badge
                    className={`ml-2 ${getPriorityColor(dispute.priority)}`}
                  >
                    {dispute.priority}
                  </Badge>
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
                  <span>{dispute.customerName}</span>
                </div>
                <div className="flex items-center">
                  <Package className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Order: {dispute.orderId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Issue Description */}
          <div>
            <h3 className="font-semibold mb-3">Issue Description</h3>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{dispute.issue}</p>
            </div>
          </div>

          {/* Order Details */}
          {order && (
            <div>
              <h3 className="font-semibold mb-3">Related Order Details</h3>
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Order Total:</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Order Date:</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Items:</span>
                  <span>{order.items.length} items</span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="font-medium mb-2">Order Items:</p>
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div>
            <h3 className="font-semibold mb-3">Admin Notes & Actions</h3>
            <div className="space-y-4">
              <Textarea
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                placeholder="Add notes about this dispute, actions taken, or follow-up required..."
                rows={4}
                data-testid="admin-notes-textarea"
              />

              <div className="flex items-center space-x-3">
                <Button
                  onClick={() =>
                    handleWhatsAppContact(
                      dispute.customerName,
                      dispute.orderId,
                      dispute.issue
                    )
                  }
                  variant="outline"
                  size="sm"
                  data-testid="whatsapp-contact-button"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact via WhatsApp
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>

                <Button
                  onClick={handleSaveNotes}
                  size="sm"
                  data-testid="save-notes-button"
                >
                  Save Notes
                </Button>
              </div>
            </div>
          </div>

          {/* Status Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Badge
                className={getStatusColor(dispute.status)}
                data-testid={`dispute-status-${dispute.id}`}
              >
                {dispute.status}
              </Badge>
            </div>

            <div className="space-x-2">
              {dispute.status === "dalam proses" && (
                <Button
                  onClick={() => {
                    updateDisputeStatus(dispute.id, "selesai", localNotes);
                    onClose();
                  }}
                  size="sm"
                  data-testid="resolve-dispute-button"
                >
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
          { key: "high-priority", label: "High Priority" },
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="total-disputes-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{disputes.length}</p>
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
                  {disputes.filter((d) => d.status === "dalam proses").length}
                </p>
                <p className="text-sm text-gray-600">Open Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="high-priority-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Flag className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {
                    disputes.filter(
                      (d) =>
                        d.priority === "tinggi" && d.status === "dalam proses"
                    ).length
                  }
                </p>
                <p className="text-sm text-gray-600">High Priority</p>
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
                  {disputes.filter((d) => d.status === "selesai").length}
                </p>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* High priority alerts */}
      {disputes.filter(
        (d) => d.priority === "tinggi" && d.status === "dalam proses"
      ).length > 0 && (
        <Card
          className="border-red-200 bg-red-50"
          data-testid="high-priority-alert"
        >
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="mr-2 h-5 w-5" />
              High Priority Disputes Require Attention
            </CardTitle>
            <CardDescription className="text-red-700">
              {
                disputes.filter(
                  (d) => d.priority === "tinggi" && d.status === "dalam proses"
                ).length
              }{" "}
              high-priority cases need immediate resolution
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Disputes list */}
      <div className="space-y-4">
        {paginatedDisputes.length === 0 ? (
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
        ) : (
          paginatedDisputes.map((dispute) => {
            const order = getDisputeOrder(dispute.orderId);
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
                        <div className="flex-shrink-0">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              dispute.priority === "tinggi"
                                ? "bg-red-500"
                                : dispute.priority === "sedang"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                          ></div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-lg">
                              {dispute.id}
                            </h3>
                            <Badge
                              className={getPriorityColor(dispute.priority)}
                              data-testid={`priority-badge-${dispute.id}`}
                            >
                              {dispute.priority} priority
                            </Badge>
                            <Badge
                              className={getStatusColor(dispute.status)}
                              data-testid={`status-badge-${dispute.id}`}
                            >
                              {dispute.status}
                            </Badge>
                          </div>

                          <p className="text-gray-600 mt-1">
                            Customer: {dispute.customerName} • Order:{" "}
                            {dispute.orderId}
                          </p>

                          <div className="mt-2">
                            <p className="font-medium text-red-700">Issue:</p>
                            <p className="text-sm text-gray-700">
                              {dispute.issue}
                            </p>
                          </div>

                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <span>
                              Created: {formatDate(dispute.createdAt)}
                            </span>
                            {order && (
                              <span>
                                Order Value: {formatCurrency(order.totalAmount)}
                              </span>
                            )}
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
                            dispute.customerName,
                            dispute.orderId,
                            dispute.issue
                          )
                        }
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
          })
        )}
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
              • <strong>High Priority:</strong> Customer complaints about
              damaged/missing items, refund requests
            </p>
            <p>
              • <strong>WhatsApp Contact:</strong> Click to open pre-filled
              message for direct customer communication
            </p>
            <p>
              • <strong>Resolution Process:</strong> 1) Contact customer 2)
              Investigate issue 3) Provide solution 4) Mark as resolved
            </p>
            <p>
              • <strong>Admin Notes:</strong> Document all actions taken and
              customer communications for future reference
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DisputesManagement;
