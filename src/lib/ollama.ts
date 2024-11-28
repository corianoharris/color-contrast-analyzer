
import axios from 'axios';

// Function to send image or mockup data to Ollama API for analysis
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function analyzeMockup(imageUrl: string): Promise<any>
{
    const ollamaApiUrl = process.env.NEXT_PUBLIC_OLLAMA_URL ?? '';  // Example URL, change according to Ollama's API docs
    const apiKey = process.env.OLLAMA_API_KEY;  // API Key stored in environment variables

    try
    {
        // Send POST request to Ollama API with imageUrl as a parameter
        const response = await axios.post(
            ollamaApiUrl,
            { imageUrl },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,  // API key authorization
                    'Content-Type': 'application/json',
                }
            }
        );
        return response.data;  // Return the analysis result
    } catch (error)
    {
        console.error('Error analyzing mockup with Ollama:', error);
        throw new Error('Analysis failed');
    }
}