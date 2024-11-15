'use client';

import React, { useState, useRef, useTransition, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, ImageIcon, Trash2 } from 'lucide-react';

const presets = {
  minecraft: { width: 64, height: 64, label: 'Minecraft (64x64)' },
  fivem: { width: 92, height: 92, label: 'FiveM (92x92)' },
  discord: { width: 128, height: 128, label: 'Discord (128x128)' },
  avatar: { width: 256, height: 256, label: 'Avatar (256x256)' },
  thumbnail: { width: 320, height: 180, label: 'Thumbnail (320x180)' },
};

const ImageResizer = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const [isPending, startTransition] = useTransition();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetChange = (value) => {
    const preset = presets[value];
    setWidth(preset.width);
    setHeight(preset.height);
  };

  const resizeImage = useCallback(async (imageData) => {
    try {
      const response = await fetch('/api/resize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData, width, height }),
      });

      if (!response.ok) {
        throw new Error('Failed to resize image');
      }

      const data = await response.json();
      return data.imageData;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }, [width, height]);

  const handleResize = async () => {
    if (!selectedImage) return;

    startTransition(async () => {
      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = selectedImage;
        });

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const resizedImage = canvas.toDataURL('image/png');

        const cachedImage = await resizeImage(resizedImage);
        setPreviewUrl(cachedImage);
      } catch (error) {
        console.error('Error resizing image:', error);
      }
    });
  };

  const downloadImage = () => {
    if (!previewUrl) return;

    const link = document.createElement('a');
    link.download = 'resized-image.png';
    link.href = previewUrl;
    link.click();
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Image Resizer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex w-full gap-2">
            <Button 
              onClick={() => fileInputRef.current.click()}
              className="flex-1"
              disabled={isPending}
            >
              <Upload className="mr-2" /> Upload Image
            </Button>
            {selectedImage && (
              <Button 
                variant="destructive" 
                onClick={clearImage}
                className="w-12"
                disabled={isPending}
              >
                <Trash2 size={20} />
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        {/* Dimensions Section */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Width (px)</label>
            <Input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              min="1"
              disabled={isPending}
            />
          </div>
          <div>
            <label className="text-sm">Height (px)</label>
            <Input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              min="1"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Presets Section */}
        <div>
          <label className="text-sm">Presets</label>
          <Select onValueChange={handlePresetChange} disabled={isPending}>
            <SelectTrigger>
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

        {/* Preview Section */}
        {previewUrl && (
          <div className="flex flex-col items-center gap-4">
            <div className="border rounded-lg p-2 w-full">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full mx-auto"
                style={{ maxHeight: '300px', objectFit: 'contain' }}
              />
            </div>
            <div className="flex gap-2 w-full">
              <Button 
                onClick={handleResize} 
                className="flex-1"
                disabled={isPending}
              >
                <ImageIcon className="mr-2" /> 
                {isPending ? 'Resizing...' : 'Resize'}
              </Button>
              <Button 
                onClick={downloadImage} 
                className="flex-1"
                disabled={isPending}
              >
                Download
              </Button>
            </div>
          </div>
        )}

        {/* Hidden Canvas for Image Processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </CardContent>
    </Card>
  );
};

export default ImageResizer;