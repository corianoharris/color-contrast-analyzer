// src/components/analyzer/ColorContrastAnalyzer.tsx

import React, { useState } from 'react';
import Image from 'next/image';
import Color from 'color';
import { Upload, RefreshCw, AlertTriangle, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { useRasterizeSVG } from '@/hooks/useRasterizeSVG';

interface ColorPair
{
  foreground: string;
  background: string;
  ratio: number;
}

interface Classification
{
  label: string;
  confidence: string;
}

interface AnalysisResults
{
  contrast_ratio: number;
  passes_wcag_aa: boolean;
  passes_wcag_aaa: boolean;
  color_pairs: ColorPair[];
  classifications?: Classification[];
}

export default function ColorContrastAnalyzer()
{
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const rasterizeSVG = useRasterizeSVG();

  const resetAnalyzer = () =>
  {
    setFile(null);
    setResults(null);
    setError(null);
    setPreview(null);
    setImageUrl(null);
    setImageDimensions({ width: 0, height: 0 });
    if (preview)
    {
      URL.revokeObjectURL(preview);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) =>
  {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    // Prepare form data
    const formData = new FormData();
    formData.append('file', uploadedFile);

    try
    {
      setAnalyzing(true);
      setError(null);
      setFile(uploadedFile);

      // Validate file type
      if (!uploadedFile.type.startsWith('image/'))
      {
        throw new Error('Please upload an image file');
      }

      // Validate file size (4MB limit)
      if (uploadedFile.size > 4 * 1024 * 1024)
      {
        throw new Error('File size must be less than 4MB');
      }

      if (uploadedFile.type === 'image/svg+xml')
      {
        // Handle SVG
        const svgText = await uploadedFile.text();
        const rasterizedSVG = await rasterizeSVG(svgText, {
          width: 800,
          height: 600,
          scale: 2
        });
        formData.append('svgBase64', rasterizedSVG);
      } else
      {
        // Handle regular images
        formData.append('file', uploadedFile);
      }

      // Create preview and get image dimensions
      const previewUrl = URL.createObjectURL(uploadedFile);
      setPreview(previewUrl);
      setImageUrl(previewUrl);

      // Get image dimensions
      const img = document.createElement('img');
      img.onload = () =>
      {
        setImageDimensions({
          width: img.width,
          height: img.height
        });
      };
      img.src = previewUrl;



      // Call our API endpoint
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok)
      {
        throw new Error(data.error || 'Failed to analyze image');
      }

      setResults(data);
    } catch (err)
    {
      const errorMessage = err instanceof Error ? err.message : 'Error analyzing colors. Please try again.';
      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally
    {
      setAnalyzing(false);
    }
  };

  const getContrastStyle = (ratio: number) =>
  {
    if (ratio >= 7) return 'text-green-600 font-bold';
    if (ratio >= 4.5) return 'text-yellow-600 font-semibold';
    return 'text-red-600';
  };

  const getTextColor = (backgroundColor: string) =>
  {
    try
    {
      const bgColor = Color(backgroundColor);
      return bgColor.isDark() ? 'white' : 'black';
    } catch
    {
      return 'black';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Button
        onClick={resetAnalyzer}
        className="absolute top-4 right-4 bg-white/90 text-black hover:bg-black/100 hover:text-white"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Upload New File
      </Button>
      <Card className="bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-6">
          {/* Upload Section */}
          {!preview && (
            <div className="mb-8">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF or SVG (MAX. 4MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.svg"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Preview Section with Dimensions */}
          {preview && (
            <div className="mb-8">
              <div className="relative w-full aspect-video">
                <Image
                  src={preview}
                  alt="Uploaded image preview"
                  fill
                  className="rounded-lg shadow-md object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                />
                <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  {imageDimensions.width} × {imageDimensions.height}px
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {analyzing && (
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Analyzing image...</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Section */}
          {results && (
            <div className="space-y-6">
              {/* Color Analysis Results */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Color Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded shadow">
                    <p className="text-sm text-gray-600">Best Contrast Ratio</p>
                    <p className={`text-2xl ${getContrastStyle(results.contrast_ratio)}`}>
                      {results.contrast_ratio}:1
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded shadow">
                    <p className="text-sm text-gray-600">WCAG Compliance</p>
                    <div className="space-y-1">
                      <p className={`text-sm ${results.passes_wcag_aa ? 'text-green-600' : 'text-red-600'}`}>
                        AA: {results.passes_wcag_aa ? '✓ Pass' : '✗ Fail'}
                      </p>
                      <p className={`text-sm ${results.passes_wcag_aaa ? 'text-green-600' : 'text-red-600'}`}>
                        AAA: {results.passes_wcag_aaa ? '✓ Pass' : '✗ Fail'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Info */}
              {imageUrl && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Image Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Dimensions:</span>{' '}
                      {imageDimensions.width} × {imageDimensions.height} pixels
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">File type:</span>{' '}
                      {file?.type || 'Unknown'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">File size:</span>{' '}
                      {file ? `${(file.size / 1024).toFixed(2)} KB` : 'Unknown'}
                    </p>
                  </div>
                </div>
              )}

              {/* Color Pairs */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Color Pairs</h3>
                <div className="space-y-4">
                  {results.color_pairs.map((pair, index) => (
                    <div key={index} className="p-4 bg-white rounded shadow">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-12 h-12 rounded-lg shadow-inner flex items-center justify-center text-sm"
                              style={{
                                backgroundColor: pair.foreground,
                                color: getTextColor(pair.foreground)
                              }}
                            >
                              Text
                            </div>
                            <div>
                              <p className="font-mono text-sm">{pair.foreground}</p>
                              <p className="text-xs text-gray-500">Foreground</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-12 h-12 rounded-lg shadow-inner"
                              style={{ backgroundColor: pair.background }}
                            />
                            <div>
                              <p className="font-mono text-sm">{pair.background}</p>
                              <p className="text-xs text-gray-500">Background</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Contrast Ratio</p>
                          <p className={`text-xl ${getContrastStyle(pair.ratio)}`}>
                            {pair.ratio}:1
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Classifications */}
              {results.classifications && results.classifications.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Image Analysis</h3>
                  <div className="space-y-2">
                    {results.classifications.map((classification, index) => (
                      <div key={index} className="flex justify-between p-2 bg-white rounded">
                        <span className="font-medium">{classification.label}</span>
                        <span className="text-gray-600">{classification.confidence}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}