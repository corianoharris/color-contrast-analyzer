// src/app/api/analyze/route.ts
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import Color from 'color';

export async function POST(request: Request) {
  console.log('API route hit');

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
    const base64Image = buffer.toString('base64');

    // Local color analysis with Sharp
    const { dominant } = await sharp(buffer).stats();
    const mainColor = Color({
      r: dominant.r,
      g: dominant.g,
      b: dominant.b
    }).hex();

    // Hugging Face API call
    const huggingFaceResponse = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/resnet-50",
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: {
            image: base64Image
          }
        }),
      }
    );

    if (!huggingFaceResponse.ok) {
      throw new Error('Hugging Face API call failed');
    }

    const hfData = await huggingFaceResponse.json();
    console.log('Hugging Face response:', hfData);

    // Calculate contrast ratios
    const whiteColor = '#FFFFFF';
    const blackColor = '#000000';

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

    // Combine local analysis with Hugging Face results
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
      ],
      classifications: Array.isArray(hfData) 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? hfData.slice(0, 5).map((item: any) => ({
            label: item.label,
            confidence: (item.score * 100).toFixed(2) + '%'
          }))
        : []
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}