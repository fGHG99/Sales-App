import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Camera,
  Upload,
  QrCode,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

/**
 * QR Code Scanner Component
 *
 * Features:
 * - Camera scanning with permission request
 * - File upload scanning
 * - Integration with verify-qr API
 */
const QrCodeScanner = ({ onScanSuccess, onScanError }) => {
  const [scanMode, setScanMode] = useState(null); // null | 'camera' | 'file'
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Detect if device is mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.warn("Error stopping scanner:", err);
    }
    setIsScanning(false);
    setScanMode(null);
  };

  const handleScanSuccess = (decodedText) => {
    console.log("✅ QR Code scanned:", decodedText);
    setScanResult(decodedText);
    toast.success("QR Code berhasil di-scan!");

    // Stop scanner after successful scan
    stopScanner();

    // Call parent callback
    if (onScanSuccess) {
      onScanSuccess(decodedText);
    }
  };

  const handleScanError = (err) => {
    // Don't show error for every frame, only actual errors
    if (err && !err.includes("NotFoundException")) {
      console.warn("Scan error:", err);
    }
  };

  const startCameraScanning = async () => {
    try {
      setError(null);
      setScanResult(null);
      setScanMode("camera");
      setIsScanning(true);

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      // Stop the test stream
      stream.getTracks().forEach((track) => track.stop());

      // Initialize Html5Qrcode
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        handleScanSuccess,
        handleScanError
      );

      toast.info("Arahkan kamera ke QR code");
    } catch (err) {
      console.error("❌ Error starting camera:", err);
      setError(
        "Gagal mengakses kamera. Pastikan Anda memberikan izin akses kamera."
      );
      setIsScanning(false);
      setScanMode(null);
      toast.error("Gagal mengakses kamera");

      if (onScanError) {
        onScanError(err);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setScanResult(null);
      setScanMode("file");
      setIsScanning(true);

      // Initialize Html5Qrcode if not already initialized
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      }

      // Scan file
      const decodedText = await html5QrCodeRef.current.scanFile(file, true);
      handleScanSuccess(decodedText);
    } catch (err) {
      console.error("❌ Error scanning file:", err);
      setError(
        "Gagal membaca QR code dari file. Pastikan file berisi QR code yang valid."
      );
      setIsScanning(false);
      setScanMode(null);
      toast.error("Gagal membaca QR code dari file");

      if (onScanError) {
        onScanError(err);
      }
    }
  };

  const handleReset = () => {
    stopScanner();
    setScanResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and Drop handlers (Desktop only)
  const handleDragOver = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();

    // Only set to false if leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fakeEvent = {
        target: { files: [files[0]] },
      };
      handleFileUpload(fakeEvent);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <QrCode className="h-5 w-5 text-blue-600 mr-2" />
          Scan QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scanner placeholder/container */}
        {!scanResult && (
          <div
            id="qr-reader"
            className={`${
              isScanning && scanMode === "camera"
                ? "border-2 border-blue-500 rounded-lg overflow-hidden"
                : "hidden"
            }`}
          />
        )}

        {/* Placeholder when not scanning */}
        {!isScanning && !scanResult && (
          <div
            className={`rounded-lg text-center transition-all ${
              !isMobile && isDragging
                ? "border-2 border-blue-500 bg-blue-100 p-10"
                : !isMobile
                ? "border-2 border-dashed border-gray-300 bg-white p-8 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
                : "border-2 border-dashed border-gray-300 p-8"
            }`}
            onDragOver={!isMobile ? handleDragOver : undefined}
            onDragEnter={!isMobile ? handleDragEnter : undefined}
            onDragLeave={!isMobile ? handleDragLeave : undefined}
            onDrop={!isMobile ? handleDrop : undefined}
            onClick={
              !isMobile ? () => fileInputRef.current?.click() : undefined
            }
          >
            <QrCode
              className={`mx-auto mb-4 ${
                !isMobile && isDragging
                  ? "h-20 w-20 text-blue-600 animate-bounce"
                  : !isMobile
                  ? "h-16 w-16 text-blue-500"
                  : "h-16 w-16 text-gray-400"
              }`}
            />
            {!isMobile && isDragging ? (
              <div>
                <p className="text-blue-700 font-semibold text-lg mb-2">
                  Drop QR code image here
                </p>
                <p className="text-blue-600 text-sm">
                  We'll scan it automatically
                </p>
              </div>
            ) : !isMobile ? (
              <div>
                <p className="text-gray-700 font-medium mb-2">
                  Drag & drop QR code image or click to browse
                </p>
                <p className="text-gray-500 text-sm">
                  Supports: JPG, PNG, JPEG
                </p>
              </div>
            ) : (
              <p className="text-gray-600 mb-4">
                Scan QR code untuk pick up order
              </p>
            )}
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

        {/* Success result */}
        {scanResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-green-800 font-semibold mb-1">
                  QR Code berhasil di-scan!
                </p>
                <p className="text-green-700 text-sm break-all">
                  {scanResult.substring(0, 100)}...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!isScanning && !scanResult && (
          <div className="space-y-2">
            <Button
              onClick={startCameraScanning}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="h-4 w-4 mr-2" />
              Scan dengan Kamera
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Gambar QR Code
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Stop/Reset buttons */}
        {(isScanning || scanResult) && (
          <div className="space-y-2">
            {isScanning && scanMode === "camera" && (
              <Button
                onClick={stopScanner}
                variant="outline"
                className="w-full border-red-600 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Stop Scanning
              </Button>
            )}

            {scanResult && (
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Scan Lagi
              </Button>
            )}
          </div>
        )}

        {/* Status badge */}
        {isScanning && (
          <div className="flex items-center justify-center">
            <Badge className="bg-blue-100 text-blue-800">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              {scanMode === "camera" ? "Scanning..." : "Processing file..."}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QrCodeScanner;
