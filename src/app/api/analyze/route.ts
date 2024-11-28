// src/app/api/analyze/route.ts
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import Color from 'color';

async function processBase64Image(base64String: string)
{
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  return buffer;
}

export async function POST(request: Request)
{
  try
  {
    const formData = await request.formData();
    const file = formData.get('file');
    const svgBase64 = formData.get('svgBase64');

    if (!file && !svgBase64)
    {
      return NextResponse.json(
        { error: 'No file or SVG data provided' },
        { status: 400 }
      );
    }

    let imageBuffer;
    if (svgBase64 && typeof svgBase64 === 'string')
    {
      // Process SVG
      imageBuffer = await processBase64Image(svgBase64);
    } else if (file instanceof Blob)
    {
      // Process regular image
      imageBuffer = Buffer.from(await file.arrayBuffer());
    } else
    {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    // Get color info using Sharp
    const { dominant } = await sharp(imageBuffer).stats();
    const mainColor = Color({
      r: dominant.r,
      g: dominant.g,
      b: dominant.b
    }).hex();

    // Call Hugging Face API
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
            image: imageBuffer.toString('base64')
          }
        }),
      }
    );

    if (!huggingFaceResponse.ok)
    {
      throw new Error('Hugging Face API call failed');
    }

    const hfData = await huggingFaceResponse.json();

    // Calculate contrast ratios
    const whiteColor = '#FFFFFF';
    const blackColor = '#000000';

    const getContrastRatio = (color1: string, color2: string) =>
    {
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
  } catch (error)
  {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}