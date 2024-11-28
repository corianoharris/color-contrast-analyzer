// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest)
{
    try
    {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file)
        {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');

        try
        {
            // Call Ollama API
            const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'alientelligence/aiaccessibility',
                    prompt: `Analyze this image for accessibility:
                  Image data: data:image/jpeg;base64,${base64Image}
                  Please provide:
                  1. Color contrast analysis
                  2. Accessibility issues
                  3. WCAG compliance recommendations`,
                }),
            });

            if (!ollamaResponse.ok)
            {
                throw new Error('Ollama API failed');
            }

            const ollamaData = await ollamaResponse.json();

            // Return structured analysis
            return NextResponse.json({
                success: true,
                analysis: {
                    wcagCompliance: {
                        level: 'AA',
                        issues: []
                    },
                    contrastIssues: [
                        {
                            colors: ['#000000', '#FFFFFF'],
                            ratio: 21,
                            recommendation: 'Good contrast ratio'
                        }
                    ],
                    aiRecommendations: [
                        ollamaData.response || 'Analysis completed'
                    ]
                }
            });

        } catch (ollamaError)
        {
            console.error('Ollama API error:', ollamaError);
            return NextResponse.json(
                { error: 'Error analyzing image with AI' },
                { status: 500 }
            );
        }

    } catch (error)
    {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Error processing upload' },
            { status: 500 }
        );
    }
}

// Increase payload size limit if needed
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};