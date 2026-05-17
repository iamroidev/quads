import React, { useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { saveAs } from 'file-saver';

interface QRCodeGeneratorProps {
  productUrl: string;
  productTitle: string;
  onGenerate?: () => void;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  productUrl, 
  productTitle,
  onGenerate 
}) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQRCode = async () => {
    if (!productUrl) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      const qrCodeInstance = new QRCodeStyling({
        width: 300,
        height: 300,
        data: productUrl,
        image: '',
        dotsOptions: {
          color: "#000000",
          type: 'rounded'
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        cornersSquareOptions: {
          color: "#000000",
        },
        cornersDotOptions: {
          color: "#000000",
        }
      });
      
      const blob = (await qrCodeInstance.getRawData('png')) as Blob;
      if (!blob) throw new Error('Failed to generate raw QR code data');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCode(reader.result as string);
        onGenerate?.();
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('QR Code generation error:', err);
      setError('Failed to generate QR code');
    } finally {
      setGenerating(false);
    }
  };

  const downloadFlyer = async () => {
    if (!qrCode) return;
    
    try {
      // Create a canvas for the flyer
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Set flyer dimensions (4x6 inches at 300 DPI for print quality)
      canvas.width = 1200; // 4 inches * 300 DPI
      canvas.height = 1800; // 6 inches * 300 DPI
      
      // Background - bulletin board cream
      ctx.fillStyle = '#faf8f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Border - black thick border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 20;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      
      // Add decorative tape effect at top
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(0, 0, canvas.width, 40);
      
      // Add QUADS header
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 48px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('QUADS', canvas.width / 2, 80);
      
      // Add product title
      ctx.font = 'bold 36px "Courier New", monospace';
      ctx.textAlign = 'center';
      // Wrap long titles
      const words = productTitle.split(' ');
      let line = '';
      let lines: string[] = [];
      let yPosition = 140;
      
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > canvas.width - 100) {
          lines.push(line);
          line = word + ' ';
          yPosition += 40;
        } else {
          line = testLine;
        }
      }
      lines.push(line);
      
      for (const textLine of lines) {
        ctx.fillText(textLine.trim(), canvas.width / 2, yPosition);
        yPosition += 40;
      }
      
      // Add QR code (centered)
      const qrSize = 400;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = yPosition + 20;
      
      const img = new Image();
      img.src = qrCode;
      
      // Wait for image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = qrCode;
      });
      
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
      
      // Add price below QR code
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 32px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Price: GHS ${parseFloat(productUrl.split('price=')[1]?.split('&')[0] || '0')}`, 
                  canvas.width / 2, qrY + qrSize + 40);
      
      // Add footer
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 24px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Scan to view on QUADS Marketplace', canvas.width / 2, canvas.height - 60);
      
      // Add thumbtack decoration
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(canvas.width - 60, 60, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const filename = `QUADS_${productTitle.replace(/\s+/g, '_')}_flyer.png`;
          saveAs(blob, filename);
        }
      }, 'image/png');
      
    } catch (err) {
      console.error('Flyer generation error:', err);
      setError('Failed to generate flyer');
    }
  };

  return (
    <div className="border-4 border-black dark:border-white bg-[var(--bulletin-card)] p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
      <div className="mb-4">
        <h3 className="text-[18px] font-black uppercase tracking-tight text-[var(--bulletin-text)]">
          Polaroid Flyer Generator
        </h3>
        <p className="text-[12px] text-[var(--bulletin-text)] opacity-60">
          Create printable flyers with QR codes for physical bulletin boards
        </p>
      </div>
      
      {error && (
        <div className="mb-3 p-3 bg-[#ffebee] border-2 border-[var(--bulletin-border)] rounded">
          <p className="text-[12px] font-black text-red-600">{error}</p>
        </div>
      )}
      
      <div className="flex flex-col items-center">
        {qrCode ? (
          <>
            <div className="mb-4">
              <img 
                src={qrCode} 
                alt="QR Code" 
                className="border-2 border-[var(--bulletin-border)] bg-white p-2"
                width="150"
                height="150"
              />
            </div>
            <button
              onClick={downloadFlyer}
              disabled={generating}
              className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-2 text-[12px] font-black uppercase tracking-widest transition-all hover:bg-[var(--bulletin-text)] hover:text-[var(--bulletin-bg)] disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Download Flyer (PNG)'}
            </button>
          </>
        ) : (
          <button
            onClick={generateQRCode}
            disabled={generating}
            className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-2 text-[12px] font-black uppercase tracking-widest transition-all hover:bg-[var(--bulletin-text)] hover:text-[var(--bulletin-bg)] disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate QR Code'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QRCodeGenerator;