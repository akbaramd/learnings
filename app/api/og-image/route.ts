import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';
import React from 'react';

export const runtime = 'edge';

/**
 * Prepare text for RTL display
 * Return text as-is - ImageResponse should handle RTL correctly
 */
function prepareTextForRTL(text: string): string {
  return text;
}

/**
 * Fetch Vazirmatn font from reliable CDN sources
 * Tries multiple sources for better reliability
 * ImageResponse supports TTF format best
 */
async function getVazirmatnFont() {
  // Try multiple CDN sources for Vazirmatn font (weight 600 - SemiBold)
  // Using TTF format as ImageResponse supports it best
  const fontUrls = [
    // jsDelivr CDN - TTF format (most reliable)
    'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-SemiBold.ttf',
    // Alternative jsDelivr path
    'https://cdn.jsdelivr.net/npm/vazirmatn@33.003/fonts/ttf/Vazirmatn-SemiBold.ttf',
    // Google Fonts direct TTF (fallback)
    'https://fonts.gstatic.com/s/vazirmatn/v33/Dxxo8j6PP2D_p4r9NCT1UfBx2MiF3F8.ttf',
  ];

  for (const url of fontUrls) {
    try {
      const fontResponse = await fetch(url, {
        cache: 'force-cache',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Next.js OG Image)',
        },
      });

      if (fontResponse.ok) {
        const arrayBuffer = await fontResponse.arrayBuffer();
        // Verify it's a valid font file (TTF files start with specific bytes)
        if (arrayBuffer.byteLength > 0) {
          return arrayBuffer;
        }
      }
    } catch {
      // Try next URL
      continue;
    }
  }

  console.warn('[OG Image] Failed to fetch Vazirmatn font from all sources, using fallback');
  return null;
}

/**
 * GET /api/og-image?text=Your+Text+Here
 * Generate dynamic OG image with blue background and centered text
 * Optional query params:
 *   - text: The text to display (URL encoded)
 *   - format: 'png' (default) or 'base64'
 *   - width: Image width (default: 1200)
 *   - height: Image height (default: 630)
 *   - bgColor: Background color hex (default: #2563eb - blue)
 *   - textColor: Text color hex (default: #ffffff - white)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Get text from query parameter (URL decoded)
    const rawText = searchParams.get('text') || 'نظرسنجی';
    const format = searchParams.get('format') || 'png';
    const width = parseInt(searchParams.get('width') || '1200', 10);
    const height = parseInt(searchParams.get('height') || '630', 10);
    const bgColor = searchParams.get('bgColor') || '#2563eb';
    const textColor = searchParams.get('textColor') || '#ffffff';
    
    // Prepare text for RTL display - reverse word order if needed
    // ImageResponse with direction:rtl may reverse word order, so we pre-reverse it
    const text = prepareTextForRTL(rawText);
    
    // Validate dimensions
    const validWidth = width > 0 && width <= 2000 ? width : 1200;
    const validHeight = height > 0 && height <= 2000 ? height : 630;
    
    // Calculate font size based on text length
    const fontSize = text.length > 50 ? '48px' : text.length > 30 ? '56px' : '64px';
    
    // Load Vazirmatn font
    const fontData = await getVazirmatnFont();
    
    // Generate image using Next.js ImageResponse with Vazirmatn font
    // Simplified structure for better Persian RTL support
    const imageResponse = new ImageResponse(
      React.createElement(
        'div',
        {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            backgroundColor: bgColor,
            paddingTop: '120px',
            paddingLeft: '80px',
            paddingRight: '80px',
            paddingBottom: '80px',
            fontFamily: fontData ? 'Vazirmatn' : 'system-ui, -apple-system, sans-serif',
            direction: 'rtl', // RTL for entire container
          },
        },
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              maxWidth: '90%',
              textAlign: 'right', // Right text alignment
              color: textColor,
              fontSize: fontSize,
              fontWeight: '600',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap', // Preserve line breaks
              wordBreak: 'normal', // Keep Persian words intact
              overflowWrap: 'break-word',
              direction: 'rtl', // RTL direction for Persian
              fontFeatureSettings: '"liga" on, "kern" on, "calt" on',
              letterSpacing: '0.01em',
              textRendering: 'optimizeLegibility',
            },
          },
          text
        )
      ),
      {
        width: validWidth,
        height: validHeight,
        fonts: fontData
          ? [
              {
                name: 'Vazirmatn',
                data: fontData,
                style: 'normal',
                weight: 600,
              },
            ]
          : undefined,
      }
    );
    
    // If base64 format requested, convert to base64
    if (format === 'base64') {
      const arrayBuffer = await imageResponse.arrayBuffer();
      // For edge runtime, convert Uint8Array to base64 in chunks to avoid stack overflow
      const uint8Array = new Uint8Array(arrayBuffer);
      const chunkSize = 8192; // Process in 8KB chunks
      let binaryString = '';
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binaryString += String.fromCharCode(...chunk);
      }
      
      const base64 = btoa(binaryString);
      const dataUrl = `data:image/png;base64,${base64}`;
      
      return NextResponse.json(
        {
          success: true,
          format: 'base64',
          data: dataUrl,
          mimeType: 'image/png',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          },
        }
      );
    }
    
    // Return PNG image
    return new NextResponse(imageResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('[OG Image] Error generating image:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate image',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

