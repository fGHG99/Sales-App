import React, { useState, useRef, useCallback } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Crop, RotateCcw, Check, X, Info } from "lucide-react";

const ImageCropModal = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const [crop, setCrop] = useState({
    unit: "%",
    width: 60,
    height: 60,
    x: 20,
    y: 20,
    aspect: 1,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const mobilePreviewCanvasRef = useRef(null);
  const desktopPreviewCanvasRef = useRef(null);

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    const size = Math.min(width, height) * 0.6;
    const x = (width - size) / 2;
    const y = (height - size) / 2;

    setCrop({
      unit: "px",
      width: size,
      height: size,
      x: x,
      y: y,
      aspect: 1,
    });
  }, []);

  const generateCroppedImage = useCallback(() => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const size = 300; // canvas output size (CSS mengatur tampilan)

    const drawTo = (canvas) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      canvas.width = size;
      canvas.height = size;

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        size,
        size
      );

      ctx.restore();
    };

    // gambar ke kedua canvas (desktop + mobile) jika ada
    drawTo(desktopPreviewCanvasRef.current);
    drawTo(mobilePreviewCanvasRef.current);

    // gunakan salah satu canvas untuk menghasilkan dataURL (prioritaskan desktop)
    const outCanvas =
      desktopPreviewCanvasRef.current || mobilePreviewCanvasRef.current;
    return new Promise((resolve) => {
      if (!outCanvas) return resolve(null);
      outCanvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.95
      );
    });
  }, [completedCrop]);

  const handleSaveCrop = async () => {
    const croppedImageDataUrl = await generateCroppedImage();
    onCropComplete(croppedImageDataUrl);
    onClose();
  };

  const resetCrop = () => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const size = Math.min(width, height) * 0.6;
      const x = (width - size) / 2;
      const y = (height - size) / 2;

      setCrop({
        unit: "px",
        width: size,
        height: size,
        x: x,
        y: y,
        aspect: 1,
      });
    }
  };

  // Update the cropped canvas whenever crop changes
  React.useEffect(() => {
    if (completedCrop) {
      generateCroppedImage();
    }
  }, [completedCrop, generateCroppedImage]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
    w-2xl
    sm:max-w-2xl
    lg:max-w-5xl
    xl:max-w-6xl
    max-h-[95vh]
    overflow-hidden
    bg-white
    border border-gray-200
    shadow-xl"
      >
        <DialogHeader className="pb-6 border-b border-gray-100">
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Crop className="h-5 w-5 text-gray-600" />
            </div>
            Crop Profile Picture
          </DialogTitle>
          <p className="text-gray-600 text-sm mt-2">
            Position and resize the crop area to frame your profile picture. The
            circular preview shows the final result.
          </p>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-1 py-6">
          {/* Main Crop Area */}
          <div className="flex-1 min-w-0 flex justify-center">
            <div className="relative w-full max-w-2xl ml-6 md:ml-7">
              {/* Crop Area */}
              <div className="aspect-square max-h-[300px] sm:max-h-[400px] lg:max-h-[500px] overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
                {imageSrc && (
                  <ReactCrop
                    crop={crop}
                    onChange={(newCrop) => setCrop(newCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    circularCrop={true}
                    className="w-full h-full"
                  >
                    <img
                      ref={imgRef}
                      src={imageSrc}
                      onLoad={onImageLoad}
                      alt="Crop preview"
                      className="w-full h-full object-contain"
                    />
                  </ReactCrop>
                )}
              </div>

              {/* Mobile preview: tampil hanya di mobile (md:hidden) */}
              <div className="absolute bottom-4 left-3 md:hidden">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-2 border-gray-200 shadow-sm overflow-hidden bg-gray-100">
                    {/* canvas khusus mobile */}
                    <canvas
                      ref={mobilePreviewCanvasRef}
                      className="w-full h-full object-cover"
                      width={300}
                      height={300}
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-600 rounded-full border-2 border-white flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Preview (terpisah) - tampil hanya di md+ */}
          <div className="hidden md:flex flex-col w-56 flex-shrink-0 items-start gap-3">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">
                Preview
              </h3>

              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-gray-200 shadow-sm overflow-hidden bg-gray-100">
                    {/* canvas khusus desktop */}
                    <canvas
                      ref={desktopPreviewCanvasRef}
                      className="w-full h-full object-cover"
                      width={300}
                      height={300}
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-600 rounded-full border-2 border-white flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center mt-3">
                Final profile picture appearance
              </p>
            </div>

            {/* Reset button di bawah preview (desktop) */}
            <Button
              variant="outline"
              onClick={resetCrop}
              className="w-full gap-2 border-gray-300 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Position
            </Button>
          </div>

          {/* Reset button untuk mobile (tetap di bawah crop area) */}
          <div className="md:hidden flex justify-center mt-2">
            <Button
              variant="outline"
              onClick={resetCrop}
              className="gap-2 border-gray-300 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Position
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-6 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onClose}
            className="gap-2 border-gray-300 hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSaveCrop}
            className="gap-2 bg-gray-900 hover:bg-gray-800 text-white"
            disabled={!completedCrop}
          >
            <Check className="h-4 w-4" />
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropModal;
