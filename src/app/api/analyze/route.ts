// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import Color from 'color';

// const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
// const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/microsoft/resnet-50";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No file or invalid file provided' },
        { status: 400 }
      );
    }

    // Convert File/Blob to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Basic validation
    try {
      // Verify it's a valid image
      const metadata = await sharp(buffer).metadata();
      console.log('Image metadata:', metadata);
    } catch (error) {
      console.error('Sharp error:', error);
      return NextResponse.json(
        { error: 'Invalid image file' },
        { status: 400 }
      );
    }

    // Process with Sharp
    try {
      const { dominant } = await sharp(buffer).stats();
      
      // Convert to hex
      const mainColor = Color({
        r: dominant.r,
        g: dominant.g,
        b: dominant.b
      }).hex();

      // Test colors against white and black
      const whiteColor = '#FFFFFF';
      const blackColor = '#000000';

      // Helper function for contrast ratio
      const getContrastRatio = (color1: string, color2: string) => {
        const c1 = Color(color1);
        const c2 = Color(color2);
        const l1 = c1.luminosity();
        const l2 = c2.luminosity();
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        return Number(ratio.toFixed(2));
      };

      const whiteRatio = getContrastRatio(mainColor, whiteColor);
      const blackRatio = getContrastRatio(mainColor, blackColor);

      const results = {
        contrast_ratio: Math.max(whiteRatio, blackRatio),
        passes_wcag_aa: Math.max(whiteRatio, blackRatio) >= 4.5,
        passes_wcag_aaa: Math.max(whiteRatio, blackRatio) >= 7,
        color_pairs: [
          {
            foreground: mainColor,
            background: whiteColor,
            ratio: whiteRatio
          },
          {
            foreground: mainColor,
            background: blackColor,
            ratio: blackRatio
          }
        ]
      };

      return NextResponse.json(results);
    } catch (error) {
      console.error('Processing error:', error);
      return NextResponse.json(
        { error: 'Failed to process image' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('General error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};