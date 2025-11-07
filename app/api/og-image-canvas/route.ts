import { NextRequest, NextResponse } from 'next/server';

// Use nodejs runtime for canvas support
export const runtime = 'nodejs';

/**
 * Adjust color brightness for gradient effect
 */
function adjustColorBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Download file from URL
 */
async function downloadFile(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    import('https').then((https) => {
      https.get(url, (res) => {
        if (res.statusCode !== 200) {
          resolve(null);
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', () => resolve(null));
      }).on('error', () => resolve(null));
    }).catch(() => resolve(null));
  });
}

/**
 * Alternative OG image generator using Canvas API
 * Better Persian text support with proper RTL rendering
 * 
 * GET /api/og-image-canvas?text=Your+Text+Here
 * Optional query params:
 *   - text: The text to display (URL encoded)
 *   - format: 'png' (default) or 'base64'
 *   - width: Image width (default: 1200)
 *   - height: Image height (default: 630)
 *   - bgColor: Background color hex (default: #2563eb - blue)
 *   - textColor: Text color hex (default: #ffffff - white)
 *   - org: Organization name to display at bottom (default: 'نظام')
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const rawText = searchParams.get('text') || 'نظرسنجی';
    const format = searchParams.get('format') || 'png';
    const width = parseInt(searchParams.get('width') || '1200', 10);
    const height = parseInt(searchParams.get('height') || '630', 10);
    const bgColor = searchParams.get('bgColor') || '#2563eb';
    const textColor = searchParams.get('textColor') || '#ffffff';
    const organizationName = searchParams.get('org') || 'سازمان نظام مهندسی ساختمان آذربایجان غربی'; // نام سازمان
    
    const validWidth = width > 0 && width <= 2000 ? width : 1200;
    const validHeight = height > 0 && height <= 2000 ? height : 630;
    
    // Try to use canvas if available, otherwise fallback to ImageResponse
    try {
      // Dynamic import to check if canvas is available
      const { createCanvas, registerFont } = await import('canvas');
      const path = await import('path');
      const fs = await import('fs');
      
      // Create canvas with beautiful design
      const canvas = createCanvas(validWidth, validHeight);
      const ctx = canvas.getContext('2d');
      
      // Create beautiful gradient background
      const gradient = ctx.createLinearGradient(0, 0, validWidth, validHeight);
      gradient.addColorStop(0, bgColor);
      gradient.addColorStop(1, adjustColorBrightness(bgColor, -10));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, validWidth, validHeight);
      
      // Try to load Vazirmatn font from multiple sources
      let fontLoaded = false;
      const fontPaths = [
        path.join(process.cwd(), 'public', 'fonts', 'Vazirmatn-SemiBold.ttf'),
        path.join(process.cwd(), 'node_modules', 'vazirmatn', 'fonts', 'ttf', 'Vazirmatn-SemiBold.ttf'),
      ];
      
      // Try local fonts first
      for (const fontPath of fontPaths) {
        try {
          if (fs.existsSync(fontPath)) {
            registerFont(fontPath, { family: 'Vazirmatn', weight: '600' });
            fontLoaded = true;
            break;
          }
        } catch {
          continue;
        }
      }
      
      // If font not found locally, try to download from CDN
      if (!fontLoaded) {
        try {
          const fontUrl = 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-SemiBold.ttf';
          const fontBuffer = await downloadFile(fontUrl);
          if (fontBuffer) {
            const tempFontPath = path.join(process.cwd(), 'tmp', 'Vazirmatn-SemiBold.ttf');
            // Ensure tmp directory exists
            const tmpDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmpDir)) {
              fs.mkdirSync(tmpDir, { recursive: true });
            }
            fs.writeFileSync(tempFontPath, fontBuffer);
            registerFont(tempFontPath, { family: 'Vazirmatn', weight: '600' });
            fontLoaded = true;
          }
        } catch {
          // Font download failed, will use fallback
        }
      }
      
      // Calculate optimal font size based on text length
      const baseFontSize = rawText.length > 50 ? 48 : rawText.length > 30 ? 56 : 64;
      const fontSize = baseFontSize;
      
      // Set font with Vazirmatn
      ctx.font = `${fontSize}px ${fontLoaded ? 'Vazirmatn' : 'Arial'}`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center'; // Center align for beautiful appearance
      ctx.textBaseline = 'middle';
      ctx.direction = 'rtl'; // RTL for Persian text
      
      // Calculate text wrapping with proper RTL support
      const padding = 120;
      const maxWidth = validWidth - (padding * 2);
      const centerX = validWidth / 2;
      const centerY = validHeight / 2;
      
      // Wrap text properly for RTL
      const words = rawText.split(/\s+/);
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      
      // Calculate total text height for perfect centering
      const lineHeight = fontSize * 1.6;
      const totalTextHeight = (lines.length - 1) * lineHeight;
      const startY = centerY - (totalTextHeight / 2);
      
      // Draw text lines with beautiful shadow effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      lines.forEach((line, index) => {
        const y = startY + (index * lineHeight);
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillText(line, centerX + 3, y + 3);
        // Draw main text
        ctx.fillStyle = textColor;
        ctx.fillText(line, centerX, y);
      });
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Draw decorative line separator above organization name
      const separatorY = validHeight - 100;
      const separatorWidth = 200;
      const separatorX = (validWidth - separatorWidth) / 2;
      
      // Gradient for separator line
      const lineGradient = ctx.createLinearGradient(separatorX, separatorY, separatorX + separatorWidth, separatorY);
      lineGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      lineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
      lineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(separatorX, separatorY);
      ctx.lineTo(separatorX + separatorWidth, separatorY);
      ctx.stroke();
      
      // Draw organization name at the bottom with Vazirmatn font
      // Adjust font size based on organization name length
      const orgFontSize = organizationName.length > 30 ? 22 : 24;
      ctx.font = `${orgFontSize}px ${fontLoaded ? 'Vazirmatn' : 'Arial'}`; // Always use Vazirmatn if loaded
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // Slightly transparent for elegance
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.direction = 'rtl'; // RTL for Persian text
      
      // Organization name with subtle shadow
      const orgY = validHeight - 50;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      // Wrap organization name if too long
      const orgMaxWidth = validWidth - 200; // Leave margins
      const orgMetrics = ctx.measureText(organizationName);
      
      if (orgMetrics.width > orgMaxWidth) {
        // Split into two lines if needed
        const words = organizationName.split(/\s+/);
        const midPoint = Math.ceil(words.length / 2);
        const line1 = words.slice(0, midPoint).join(' ');
        const line2 = words.slice(midPoint).join(' ');
        
        ctx.fillText(line1, centerX, orgY - 15);
        ctx.fillText(line2, centerX, orgY + 15);
      } else {
        ctx.fillText(organizationName, centerX, orgY);
      }
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Add decorative elements (small circles) for visual appeal
      const circleRadius = 3;
      const circleY = separatorY;
      const circleSpacing = 15;
      const totalCirclesWidth = (circleSpacing * 4) + (circleRadius * 2 * 5);
      const circlesStartX = (validWidth - totalCirclesWidth) / 2;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 5; i++) {
        const circleX = circlesStartX + (i * circleSpacing) + (circleRadius * 2 * i);
        ctx.beginPath();
        ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Convert to buffer
      const buffer = canvas.toBuffer('image/png');
      
      // Handle base64 format
      if (format === 'base64') {
        const base64 = buffer.toString('base64');
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
      
      // Return PNG
      return new NextResponse(buffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
      
    } catch {
      // Canvas not available, fallback to ImageResponse approach
      console.warn('[OG Image Canvas] Canvas not available, this route requires canvas package');
      return NextResponse.json(
        {
          success: false,
          error: 'Canvas not available',
          message: 'Please install canvas package: npm install canvas',
          fallback: 'Use /api/og-image instead',
        },
        { status: 503 }
      );
    }
    
  } catch (error) {
    console.error('[OG Image Canvas] Error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
    });
    
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

