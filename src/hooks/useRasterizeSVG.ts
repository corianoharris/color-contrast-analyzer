// src/hooks/useRasterizeSVG.ts

import { useCallback } from 'react';

interface RasterizeOptions
{
    width?: number;
    height?: number;
    scale?: number;
}

export const useRasterizeSVG = () =>
{
    const rasterizeSVG = useCallback(async (
        svgString: string,
        options: RasterizeOptions = {}
    ): Promise<string> =>
    {
        const {
            width = 800,
            height = 600,
            scale = 2 // for better quality
        } = options;

        return new Promise((resolve, reject) =>
        {
            try
            {
                // Create a temporary canvas
                const canvas = document.createElement('canvas');
                canvas.width = width * scale;
                canvas.height = height * scale;
                const ctx = canvas.getContext('2d');

                if (!ctx)
                {
                    throw new Error('Could not get canvas context');
                }

                // Create an SVG blob
                const blob = new Blob([svgString], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);

                // Create an image to draw the SVG
                const img = new Image();
                img.onload = () =>
                {
                    try
                    {
                        // Clear canvas
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // Scale canvas for higher resolution
                        ctx.scale(scale, scale);

                        // Draw white background
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, width, height);

                        // Draw SVG
                        ctx.drawImage(img, 0, 0, width, height);

                        // Convert to base64
                        const base64 = canvas.toDataURL('image/jpeg', 0.95);

                        // Clean up
                        URL.revokeObjectURL(url);

                        resolve(base64);
                    } catch (error)
                    {
                        reject(error);
                    }
                };

                img.onerror = (error) =>
                {
                    URL.revokeObjectURL(url);
                    reject(error);
                };

                img.src = url;
            } catch (error)
            {
                reject(error);
            }
        });
    }, []);

    return rasterizeSVG;
};