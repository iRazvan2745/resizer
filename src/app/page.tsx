'use client';

import React, { useState, useRef, useTransition, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toast } from '@/components/ui/toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, ImageIcon, Trash2, Download, RefreshCw, Moon, Sun, ZoomIn, ZoomOut, Lock, Unlock, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type PresetKey = 'minecraft' | 'fivem' | 'discord' | 'avatar' | 'thumbnail';

const presets: Record<PresetKey, { width: number; height: number; label: string }> = {
  minecraft: { width: 64, height: 64, label: 'Minecraft (64x64)' },
  fivem: { width: 92, height: 92, label: 'FiveM (92x92)' },
  discord: { width: 128, height: 128, label: 'Discord (128x128)' },
  avatar: { width: 256, height: 256, label: 'Avatar (256x256)' },
  thumbnail: { width: 320, height: 180, label: 'Thumbnail (320x180)' },
};


const AnimatedCheckbox: React.FC<{
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  icon: React.ElementType;
}> = ({ id, checked, onCheckedChange, label, icon: Icon }) => (
  <div className="flex items-center space-x-2">
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
    />
    <Label
      htmlFor={id}
      className="text-sm cursor-pointer flex items-center"
    >
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: checked ? 360 : 0 }}
        transition={{ duration: 0.3 }}
        className="mr-2"
      >
        <Icon className="h-4 w-4" />
      </motion.div>
      {label}
    </Label>
  </div>
);

export default function ImageResizer() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [dimensions, setDimensions] = useState({ width: 100, height: 100 });
  const [isPending, startTransition] = useTransition();
  const [showAnimation, setShowAnimation] = useState(false);
  const [aspectRatioLocked, setAspectRatioLocked] = useState(true);
  const [maintainQuality, setMaintainQuality] = useState(true);
  const [smoothEdges, setSmoothEdges] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aspectRatioLocked && originalDimensions.width > 0) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;
      setDimensions(prev => ({
        width: prev.width,
        height: Math.round(prev.width / aspectRatio)
      }));
    }
  }, [dimensions.width, aspectRatioLocked, originalDimensions]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      const img = new Image();

      reader.onload = () => {
        const result = reader.result as string;
        img.src = result;

        img.onload = () => {
          setOriginalDimensions({ width: img.width, height: img.height });
          setDimensions({ width: img.width, height: img.height });
          setImageData(result);
          setPreviewUrl(result);
          setToastMessage('Image uploaded successfully!');
        };
      };

      reader.readAsDataURL(file);
    }
  }, []);

  const handlePresetChange = useCallback((value: PresetKey) => {
    const preset = presets[value];
    setDimensions({ width: preset.width, height: preset.height });
    setToastMessage(`Preset applied: ${preset.label}`);
  }, []);

  const resizeImage = useCallback(
    async (imageData: string): Promise<string> => {
      const response = await fetch('/api/resize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageData, 
          ...dimensions, 
          maintainQuality, 
          smoothEdges 
        }),
      });
      if (!response.ok) throw new Error('Failed to resize image');
      const data = await response.json();
      return data.imageData;
    },
    [dimensions, maintainQuality, smoothEdges]
  );

  const handleResize = useCallback(async () => {
    if (!imageData) return;
    startTransition(async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error('Canvas element not found');

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');

        const img = new Image();
        img.src = imageData;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
        });

        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

        const resizedImage = canvas.toDataURL('image/png');
        const cachedImage = await resizeImage(resizedImage);
        setPreviewUrl(cachedImage);
        setShowAnimation(true);
        setToastMessage('Image resized successfully!');
      } catch (error) {
        console.error('Error resizing image:', error);
        setToastMessage('Failed to resize image. Please try again.');
      }
    });
  }, [imageData, dimensions, resizeImage]);

  const downloadImage = useCallback(() => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.download = 'resized-image.png';
    link.href = previewUrl;
    link.click();
    setToastMessage('Image downloaded successfully!');
  }, [previewUrl]);

  const clearImage = useCallback(() => {
    setImageData(null);
    setPreviewUrl(null);
    setShowAnimation(false);
    setZoomLevel(100);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setToastMessage('Image cleared.');
  }, []);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setZoomLevel(prev => {
      const newZoom = direction === 'in' ? prev * 1.1 : prev / 1.1;
      return Math.min(Math.max(newZoom, 10), 200);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center p-4 transition-colors duration-200">
      <Card className="w-full max-w-4xl bg-white dark:bg-gray-800 shadow-xl">
        <CardHeader className="space-y-1 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight"><a href="https://github.com/irazvan2745/resizer" target="_blank" rel="noopener noreferrer">Open Source Image Resizer</a></CardTitle>
            <CardDescription>Upload, resize, and download your images with ease</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Open settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Resize Settings</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <AnimatedCheckbox
                    id="maintainQuality"
                    checked={maintainQuality}
                    onCheckedChange={() => setMaintainQuality(!maintainQuality)}
                    label="Maintain image quality"
                    icon={ImageIcon}
                  />
                  <AnimatedCheckbox
                    id="smoothEdges"
                    checked={smoothEdges}
                    onCheckedChange={() => setSmoothEdges(!smoothEdges)}
                    label="Smooth edges"
                    icon={RefreshCw}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex w-full gap-2">
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isPending} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Upload className="mr-2 h-4 w-4" /> Upload Image
              </Button>
              <AnimatePresence>
                {imageData && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button variant="outline" onClick={clearImage} disabled={isPending} className="w-12 h-12 p-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Dimensions</label>
              <div className="grid grid-cols-2 gap-4 mt-1.5">
                <div>
                  <Input
                    type="number"
                    value={dimensions.width}
                    onChange={(e) => setDimensions(prev => ({ ...prev, width: +e.target.value }))}
                    min="1"
                    disabled={isPending}
                    className="bg-gray-50 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    value={dimensions.height}
                    onChange={(e) => setDimensions(prev => ({ ...prev, height: +e.target.value }))}
                    min="1"
                    disabled={isPending || aspectRatioLocked}
                    className="bg-gray-50 dark:bg-gray-700"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="aspectRatioLock"
                  checked={aspectRatioLocked}
                  onCheckedChange={() => setAspectRatioLocked(!aspectRatioLocked)}
                />
                <Label
                  htmlFor="aspectRatioLock"
                  className="text-sm cursor-pointer flex items-center"
                >
                  {aspectRatioLocked ? <Lock className="h-4 w-4 mr-1" /> : <Unlock className="h-4 w-4 mr-1" />}
                  Lock aspect ratio
                </Label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Presets</label>
              <Select onValueChange={handlePresetChange} disabled={isPending}>
                <SelectTrigger className="w-full mt-1.5 bg-gray-50 dark:bg-gray-700">
                  <SelectValue placeholder="Choose a preset size" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(presets).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <AnimatePresence>
            {previewUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-800 relative overflow-hidden">
                  <motion.div
                    className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Before: {originalDimensions.width}x{originalDimensions.height}
                  </motion.div>
                  <motion.img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full mx-auto rounded"
                    style={{ 
                      maxHeight: 300,
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: 'center',
                      transition: 'transform 0.3s ease-out'
                    }}
                    initial={false}
                    animate={showAnimation ? {
                      width: `${(dimensions.width / originalDimensions.width) * 100}%`,
                      height: `${(dimensions.height / originalDimensions.height) * 100}%`,
                    } : {}}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    After: {dimensions.width}x{dimensions.height}
                  </motion.div>
                </div>
                <div className="flex justify-center space-x-2">
                  <Button onClick={() => handleZoom('out')} variant="outline" size="sm">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{Math.round(zoomLevel)}%</span>
                  <Button onClick={() => handleZoom('in')} variant="outline" size="sm">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 w-full">
                  <Button 
                    onClick={handleResize} 
                    disabled={isPending} 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600"
                  >
                    {isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                    {isPending ? 'Resizing...' : 'Resize'}
                  </Button>
                  <Button 
                    onClick={downloadImage} 
                    disabled={!previewUrl || isPending} 
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600"
                  >
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </CardContent>
      </Card>
      
      {toastMessage && (
        <Toast
          variant="default"
          title={toastMessage}
        />
      )}
    </div>
  );
}