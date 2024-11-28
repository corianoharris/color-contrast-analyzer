/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import Image from 'next/image';
import { AlertCircle, CheckCircle, AlertTriangle, Upload, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ContrastValidator = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const isSingleColorImage = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(false);

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const colors = new Set();
        for (let i = 0; i < imageData.data.length; i += 4) {
          const rgba = `${imageData.data[i]},${imageData.data[i + 1]},${imageData.data[i + 2]},${imageData.data[i + 3]}`;
          colors.add(rgba);
          if (colors.size > 1) return resolve(false); // Multiple colors found
        }
        resolve(true); // Single color detected
      };
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFile(file ?? null);
    if (!file) return;

    try {
      console.log('Starting upload:', file.name);
      setIsAnalyzing(true);
      setError(null);

      // Check if the image is a single color
      const singleColor = await isSingleColorImage(file);
      if (singleColor) {
        setError('The uploaded image is a single color and cannot be analyzed for contrast.');
        setIsAnalyzing(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      console.log('Sending request to API...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      console.log('Analysis data:', data);

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      // Update the imageUrl state with the uploaded image
      const imageUrl = URL.createObjectURL(file);
      setImageUrl(imageUrl);

      // Load the image to get the dimensions
      const img = document.createElement('img');
      img.src = imageUrl;
      img.onload = () => {
        setImageDimensions({
          width: img.width,
          height: img.height,
        });
      };

      // Update the analysis state with the data received from the API
      setAnalysis(data.analysis);
    } catch (err) {
      console.error('Error details:', err);
      setError(err instanceof Error ? err.message : 'Error processing image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle>AI-Powered Accessibility Analyzer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-2">
            Upload Image for AI Accessibility Analysis
          </label>
          <div className="mt-2">
            <div className="flex items-center justify-center w-full">
              <label className="w-full flex flex-col items-center px-4 py-6 bg-white border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                <Upload className="h-12 w-12 text-gray-400" />
                <span className="mt-2 text-sm text-gray-500">Click to upload image</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {imageUrl && (
          <div className="space-y-4">
            <div className="relative w-full h-[400px]">
              <Image
                src={imageUrl}
                alt="Uploaded image for analysis"
                width={imageDimensions.width}
                height={imageDimensions.height}
                className="object-contain rounded"
                style={{
                  width: '100%',
                  height: '300px',
                }}
                unoptimized
              />
            </div>

            {isAnalyzing ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2">Analyzing with AI...</p>
              </div>
            ) : analysis && (
              <div className="space-y-4">
                {analysis.wcagCompliance?.level ? (
                  <Alert
                    className={`${
                      analysis.wcagCompliance.level === 'AAA'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-yellow-50 border-yellow-200'
                    } border`}
                  >
                    <div className="flex items-center gap-2">
                      {analysis.wcagCompliance.level === 'AAA' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                      <AlertDescription>
                        WCAG Compliance Level: {analysis.wcagCompliance.level}
                      </AlertDescription>
                    </div>
                  </Alert>
                ) : (
                  <Alert className="bg-red-50 border-red-200 border">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <AlertDescription>No valid WCAG compliance data available.</AlertDescription>
                    </div>
                  </Alert>
                )}

                {analysis.contrastIssues?.length > 0 && (
                  <div className="space-y-2">
                    <AlertTitle className="font-medium">Contrast Issues:</AlertTitle>
                    {analysis.contrastIssues.map((issue: any, index: number) => (
                      <Alert key={index} className="bg-white border">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            {issue.colors.map((color: string, i: number) => (
                              <React.Fragment key={i}>
                                <div
                                  className="w-6 h-6 rounded border border-gray-200"
                                  style={{ backgroundColor: color }}
                                />
                                {i < issue.colors.length - 1 && <span>+</span>}
                              </React.Fragment>
                            ))}
                          </div>
                          <AlertDescription>
                            Ratio: {issue.ratio}:1
                            <br />
                            {issue.description}
                          </AlertDescription>
                        </div>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContrastValidator;
