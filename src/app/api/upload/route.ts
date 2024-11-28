// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/microsoft/resnet-50";

export async function POST(request: NextRequest) {
  console.log('Starting image analysis...');

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('No file provided');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('File received:', file.name, file.type);

    // Convert file to bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine the file type and set the appropriate Content-Type
    let contentType: string;
    switch (file.type) {
      case 'image/jpeg':
      case 'image/jpg':
        contentType = 'image/jpeg';
        break;
      case 'image/png':
        contentType = 'image/png';
        break;
      case 'image/bmp':
        contentType = 'image/bmp';
        break;
      case 'image/gif':
        contentType = 'image/gif';
        break;
      case 'image/svg+xml':
        contentType = 'image/svg+xml';
        break;
      default:
        console.error('Unsupported file type:', file.type);
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    console.log('Calling Hugging Face API...');
    console.log('API Key present:', !!HUGGING_FACE_API_KEY);

    try {
      const response = await fetch(HUGGING_FACE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
          'Content-Type': contentType,
        },
        body: buffer,
      });

      console.log('HF Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HF API Error:', errorText);
        throw new Error(`Hugging Face API error: ${errorText}`);
      }

      const aiAnalysis = await response.json();
      console.log('Analysis received:', aiAnalysis);

      return NextResponse.json({
        success: true,
        analysis: {
          wcagCompliance: {
            level: 'AA',
            issues: [], // Assuming no WCAG compliance issues for now
          },
          contrastIssues: [], // Assuming no contrast issues for now
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recommendations: aiAnalysis.map((item: any) => item.label), // Use the labels from the API response as recommendations
        },
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (apiError: any) {
      console.error('API call failed:', apiError);
      throw new Error(`API call failed: ${apiError?.message}`);
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error in route handler:', error);
    return NextResponse.json(
      { error: error?.message || 'Error analyzing image' },
      { status: 500 }
    );
  }
}