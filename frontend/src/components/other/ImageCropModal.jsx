import React, { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Crop, RotateCcw, Check, X, Info } from 'lucide-react';

const ImageCropModal = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const [crop, setCrop] = useState({
    unit: '%',
    width: 60,
    height: 60,
    x: 20,
    y: 20,
    aspect: 1,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    const size = Math.min(width, height) * 0.6;
    const x = (width - size) / 2;
    const y = (height - size) / 2;
    
    setCrop({
      unit: 'px',
      width: size,
      height: size,
      x: x,
      y: y,
      aspect: 1,
    });
  }, []);

  const generateCroppedImage = useCallback(() => {
    if (!completedCrop || !imgRef.current) return;

    const canvas = canvasRef.current;
    const image = imgRef.current;
    const ctx = canvas.getContext('2d');

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = 300;
    canvas.height = 300;

    // Make canvas circular
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.beginPath();
    ctx.arc(150, 150, 150, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      300,
      300
    );

    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.95);
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
        unit: 'px',
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
      <DialogContent className="max-w-5xl w-full max-h-[95vh] overflow-hidden bg-white border border-gray-200 shadow-xl">
        <DialogHeader className="pb-6 border-b border-gray-100">
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Crop className="h-5 w-5 text-gray-600" />
            </div>
            Crop Profile Picture
          </DialogTitle>
          <p className="text-gray-600 text-sm mt-2">
            Position and resize the crop area to frame your profile picture. The circular preview shows the final result.
          </p>
        </DialogHeader>

        <div className="flex gap-8 py-6">
          {/* Main Crop Area */}
          <div className="flex-1 flex justify-center">
            <div className="relative max-w-lg max-h-96 overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
              {imageSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(newCrop) => setCrop(newCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop={true}
                  className="max-w-full max-h-full"
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    onLoad={onImageLoad}
                    alt="Crop preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </ReactCrop>
              )}
            </div>
          </div>

          {/* Instructions Panel */}
          <div className="w-80 space-y-6">
            {/* Circular Preview */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Preview</h3>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-2 border-gray-200 shadow-sm overflow-hidden bg-gray-100">
                    <canvas
                      ref={canvasRef}
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

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Instructions
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                  <span>Drag the crop area to reposition</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                  <span>Pull corners to resize the selection</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                  <span>Center your face for best results</span>
                </div>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-amber-50 rounded-lg p-6 border border-amber-100">
              <h4 className="font-semibold text-gray-900 text-sm mb-3">Best Practices</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Ensure good lighting and image quality</li>
                <li>• Leave appropriate spacing around face</li>
                <li>• Use a clear, professional appearance</li>
                <li>• Avoid busy or distracting backgrounds</li>
              </ul>
            </div>

            <Button
              variant="outline"
              onClick={resetCrop}
              className="w-full gap-2 border-gray-300 hover:bg-gray-50"
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