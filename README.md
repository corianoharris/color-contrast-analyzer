# Color Contrast Analyzer

A Next.js application that analyzes image colors and provides WCAG accessibility compliance information using Sharp, Color library, and Hugging Face's ResNet-50 model.

## Features

- Image upload and analysis
- SVG rasterization support
- Color contrast ratio calculation
- WCAG 2.1 compliance checking (AA and AAA levels)
- Image classification using Hugging Face's ResNet-50 model
- Responsive design with Next.js and Tailwind CSS

## Tech Stack

- **Frontend Framework**: Next.js 14
- **Styling**: Tailwind CSS, shadcn/ui
- **Image Processing**: Sharp
- **Color Analysis**: Color.js
- **AI Model**: Hugging Face ResNet-50
- **Language**: TypeScript

## Prerequisites

Before you begin, ensure you have installed:
- Node.js 18.17 or later
- npm or yarn

## Usage

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Upload an image (supported formats: PNG, JPG, GIF, SVG)

4. View the analysis results:
   - Color contrast ratios
   - WCAG compliance status
   - Color pairs analysis
   - Image classifications

## API Endpoints

### POST /api/analyze
Analyzes an uploaded image for color contrast and classifications.

**Request Body:**
- `file`: Image file (PNG, JPG, GIF)
- `svgBase64`: Base64 encoded SVG data (for SVG uploads)

**Response:**
```json
{
  "contrast_ratio": number,
  "passes_wcag_aa": boolean,
  "passes_wcag_aaa": boolean,
  "color_pairs": [
    {
      "foreground": string,
      "background": string,
      "ratio": number
    }
  ],
  "classifications": [
    {
      "label": string,
      "confidence": string
    }
  ]
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Hugging Face](https://huggingface.co/)
- [Sharp](https://sharp.pixelplumbing.com/)

## Support

For support, please open an issue in the GitHub repository or contact [your contact information].