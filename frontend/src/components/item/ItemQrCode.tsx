import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useToastContext } from '../../hooks'

interface ItemQrCodeProps {
  qrCodeValue: string
  qrCodeDataUrl?: string
}

const ItemQrCode = ({ qrCodeValue, qrCodeDataUrl }: ItemQrCodeProps) => {
  const qrRef = useRef<HTMLDivElement>(null)
  const toast = useToastContext()
  
  // Function to print the QR code
  const handlePrint = () => {
    if (!qrRef.current) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Could not open print window. Please check your popup settings.')
      return
    }
    
    const qrCode = qrRef.current.innerHTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              max-width: 600px;
            }
            .qr-code {
              margin: 0 auto;
              padding: 30px;
              border: 1px solid #e0e0e0;
              background-color: white;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
              border-radius: 8px;
            }
            .qr-code svg {
              max-width: 500px;
              width: 100%;
              height: auto;
              display: block;
              margin: 0 auto;
            }
            .qr-value {
              margin-top: 30px;
              font-family: monospace;
              word-break: break-all;
              font-size: 14px;
              color: #333;
              background-color: #f8f8f8;
              padding: 10px;
              border-radius: 4px;
              border: 1px solid #eee;
            }
            @media print {
              @page {
                size: auto;
                margin: 0mm;
              }
              body {
                margin: 15mm;
              }
              .qr-code {
                border: none;
                box-shadow: none;
                padding: 0;
              }
              .qr-value {
                margin-top: 15px;
                background: none;
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-code">${qrCode}</div>
            <p class="qr-value">${qrCodeValue}</p>
          </div>
          <script>
            window.onload = function() {
              // Make sure all SVG elements have good resolution for printing
              const svgElements = document.querySelectorAll('svg');
              svgElements.forEach(function(svg) {
                svg.setAttribute('width', '500');
                svg.setAttribute('height', '500');
              });
              
              // Delay printing to ensure SVG is fully rendered
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }, 200);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }
  
  return (
    <div className="card qr-code-card">
      <h3>QR Code</h3>
      <div className="qr-code-display" ref={qrRef}>
        <div className="qr-code-container">
          {qrCodeDataUrl ? (
            <img 
              src={qrCodeDataUrl} 
              alt="QR Code" 
              className="qr-code-image"
              style={{
                maxWidth: '100%',
                height: 'auto',
                objectFit: 'contain',
                imageRendering: 'crisp-edges'
              }}
            />
          ) : (
            <QRCodeSVG 
              value={qrCodeValue} 
              size={350}
              level="H"
              includeMargin={true}
              className="qr-code-svg"
              bgColor={"#FFFFFF"}
              fgColor={"#000000"}
            />
          )}
        </div>
      </div>
      
      <div className="qr-code-info">
        <div className="qr-value-container">
          <p className="qr-value-label">Scan with a QR code reader:</p>
          <p className="qr-value">
            {qrCodeValue}
          </p>
        </div>
        
        <button onClick={handlePrint} className="print-qr-button">
          <span className="print-icon">🖨️</span> Print QR Code
        </button>
      </div>
    </div>
  )
}

export default ItemQrCode