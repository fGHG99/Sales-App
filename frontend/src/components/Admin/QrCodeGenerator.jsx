import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Download,
  QrCode as QrCodeIcon,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Package,
} from "lucide-react";
import { toast } from "sonner";

/**
 * QR Code Generator Component
 *
 * Features:
 * - Generate QR code from order ID
 * - Display QR code image
 * - Download QR code as PNG
 */
const QrCodeGenerator = ({ orderId, onGenerate, onError }) => {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start countdown timer when QR code is generated
  useEffect(() => {
    if (qrCodeData?.qrCodeData?.expiresAt) {
      // Clear existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Update time remaining every second
      timerRef.current = setInterval(() => {
        const expiresAt = new Date(qrCodeData.qrCodeData.expiresAt);
        const now = new Date();
        const diff = expiresAt - now;

        if (diff <= 0) {
          // QR code expired
          setTimeRemaining("Expired");
          clearInterval(timerRef.current);
          toast.error("QR code telah expired. Silakan generate ulang.");
        } else {
          // Calculate minutes and seconds
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`${minutes}m ${seconds}s`);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [qrCodeData]);

  const generateQrCode = async () => {
    if (!orderId) {
      toast.error("Order ID tidak ditemukan");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      // Call parent callback to get QR code data from API
      const qrData = await onGenerate(orderId);

      if (!qrData || !qrData.qrCode) {
        throw new Error("Gagal mendapatkan data QR code dari server");
      }

      setQrCodeData(qrData);

      // Generate QR code image from string
      const qrImageUrl = await QRCode.toDataURL(qrData.qrCode, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setQrCodeImage(qrImageUrl);
      toast.success("QR Code berhasil di-generate!");
    } catch (err) {
      console.error("❌ Error generating QR code:", err);
      setError(err.message || "Gagal generate QR code");
      toast.error("Gagal generate QR code");

      if (onError) {
        onError(err);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQrCode = () => {
    if (!qrCodeImage) {
      toast.error("QR code belum di-generate");
      return;
    }

    try {
      // Create download link
      const link = document.createElement("a");
      link.href = qrCodeImage;
      link.download = `qr-code-order-${orderId.substring(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("QR Code berhasil di-download!");
    } catch (err) {
      console.error("❌ Error downloading QR code:", err);
      toast.error("Gagal download QR code");
    }
  };

  const handleReset = () => {
    setQrCodeData(null);
    setQrCodeImage(null);
    setError(null);
    setTimeRemaining(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <QrCodeIcon className="h-5 w-5 text-purple-600 mr-2" />
          Generate QR Code
          <Badge className="ml-2 bg-orange-100 text-orange-800 text-xs">
            Development
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order ID display */}
        {orderId && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center text-sm">
              <Package className="h-4 w-4 text-gray-600 mr-2 flex-shrink-0" />
              <span className="text-gray-600">Order ID:</span>
              <span className="ml-2 font-mono text-gray-900 break-all">
                {orderId.substring(0, 8)}...
              </span>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <XCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* QR Code display */}
        {qrCodeImage && (
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
              <img
                src={qrCodeImage}
                alt="QR Code"
                className="w-[300px] h-[300px]"
              />
            </div>

            {qrCodeData && (
              <div className="w-full space-y-2">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-sm">
                      <p className="text-green-800 font-semibold mb-1">
                        QR Code berhasil di-generate
                      </p>
                      <p className="text-green-700 text-xs">
                        Generated at:{" "}
                        {new Date(
                          qrCodeData.qrCodeData.generatedAt
                        ).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expiration info with countdown */}
                {qrCodeData.qrCodeData?.expiresAt && (
                  <div
                    className={`p-3 border rounded-lg ${
                      timeRemaining === "Expired"
                        ? "bg-red-50 border-red-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={
                          timeRemaining === "Expired"
                            ? "text-red-700"
                            : "text-blue-700"
                        }
                      >
                        {timeRemaining === "Expired"
                          ? "⏰ QR Code Expired"
                          : "⏳ Valid untuk:"}
                      </span>
                      <Badge
                        className={
                          timeRemaining === "Expired"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }
                      >
                        {timeRemaining === "Expired"
                          ? "Expired"
                          : timeRemaining || "Calculating..."}
                      </Badge>
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        timeRemaining === "Expired"
                          ? "text-red-600"
                          : "text-blue-600"
                      }`}
                    >
                      Expires at:{" "}
                      {new Date(qrCodeData.qrCodeData.expiresAt).toLocaleString(
                        "id-ID"
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Placeholder when no QR code */}
        {!qrCodeImage && !isGenerating && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <QrCodeIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">
              Generate QR code untuk order ini
            </p>
            <p className="text-gray-500 text-sm">
              QR code dapat di-scan oleh kurir untuk pickup
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          {!qrCodeImage && (
            <Button
              onClick={generateQrCode}
              disabled={isGenerating || !orderId}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCodeIcon className="h-4 w-4 mr-2" />
                  Generate QR Code
                </>
              )}
            </Button>
          )}

          {qrCodeImage && (
            <>
              <Button
                onClick={downloadQrCode}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>

              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Ulang
              </Button>
            </>
          )}
        </div>

        {/* Development warning */}
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-orange-800 text-xs">
            ⚠️ <strong>Development Mode:</strong> Fitur ini untuk testing. Di
            production, QR code akan otomatis ter-generate saat order ready for
            pickup.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QrCodeGenerator;
