import React from 'react';
import QRCode from 'react-qr-code';
import { Download, Printer } from 'lucide-react';

interface QRCodeDisplayProps {
  qrCode: string;
  itemName: string;
  size?: 'small' | 'medium' | 'large';
  showActions?: boolean;
  baseUrl?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ 
  qrCode, 
  itemName, 
  size = 'medium',
  showActions = false,
  baseUrl = window.location.origin
}) => {
  const qrUrl = `${baseUrl}/qr/${qrCode}`;
  
  const sizeMap = {
    small: 128,
    medium: 200,
    large: 300
  };
  
  const qrSize = sizeMap[size];
  
  const handlePrint = () => {
    // Create a new window for printing just the QR code
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${itemName}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
              }
              .qr-container {
                text-align: center;
                border: 2px solid #000;
                padding: 20px;
                background: white;
              }
              .item-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 15px;
                max-width: 300px;
                word-wrap: break-word;
              }
              .qr-code {
                margin: 15px 0;
              }
              .qr-text {
                font-size: 12px;
                color: #666;
                margin-top: 10px;
                word-break: break-all;
              }
              @media print {
                body { margin: 0; }
                .qr-container { border: 2px solid #000; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="item-name">${itemName}</div>
              <div class="qr-code">
                ${document.getElementById(`qr-${qrCode}`)?.innerHTML || ''}
              </div>
              <div class="qr-text">${qrCode}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait a bit for the content to load, then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };
  
  const handleDownload = () => {
    // Create SVG data URL for download
    const svg = document.getElementById(`qr-${qrCode}`)?.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = qrSize + 40;
      canvas.height = qrSize + 80;
      
      img.onload = () => {
        if (ctx) {
          // White background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Item name at top
          ctx.fillStyle = 'black';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(itemName, canvas.width / 2, 25);
          
          // QR code
          ctx.drawImage(img, 20, 40);
          
          // QR code text at bottom
          ctx.font = '12px Arial';
          ctx.fillText(qrCode, canvas.width / 2, canvas.height - 10);
          
          // Download
          const link = document.createElement('a');
          link.download = `qr-${itemName.replace(/[^a-zA-Z0-9]/g, '-')}-${qrCode}.png`;
          link.href = canvas.toDataURL();
          link.click();
        }
      };
      
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.src = url;
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div 
        id={`qr-${qrCode}`}
        className="p-4 bg-white rounded-lg shadow-sm border-2 border-gray-200"
      >
        <div className="text-center mb-3">
          <div className="font-semibold text-gray-900 text-sm max-w-48 mx-auto">
            {itemName}
          </div>
        </div>
        
        <QRCode 
          value={qrUrl}
          size={qrSize}
          bgColor="#ffffff"
          fgColor="#000000"
          level="M"
        />
        
        <div className="text-center mt-3">
          <div className="text-xs text-gray-500 font-mono">
            {qrCode}
          </div>
        </div>
      </div>
      
      {showActions && (
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1 px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
          >
            <Printer className="h-3 w-3" />
            <span>Print</span>
          </button>
          
          <button
            onClick={handleDownload}
            className="inline-flex items-center space-x-1 px-3 py-2 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
          >
            <Download className="h-3 w-3" />
            <span>Download</span>
          </button>
        </div>
      )}
      
      <div className="text-center text-xs text-gray-500 max-w-xs">
        <p>Scan with phone camera to manage inventory</p>
      </div>
    </div>
  );
};