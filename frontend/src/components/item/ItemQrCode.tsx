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
            }
            .qr-container {
              text-align: center;
            }
            .qr-code {
              margin: 0 auto;
              max-width: 80%;
              padding: 20px;
              border: 1px solid #ccc;
              background-color: var(--card-background-color);
            }
            .qr-value {
              margin-top: 10px;
              font-family: monospace;
              word-break: break-all;
            }
            @media print {
              @page {
                size: auto;
                margin: 0mm;
              }
              body {
                margin: 10mm;
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
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }
  
  return (
    <div className="card">
      <h3>QR Code</h3>
      <div className="qr-code-container" ref={qrRef}>
        {qrCodeDataUrl ? (
          <img 
            src={qrCodeDataUrl} 
            alt="QR Code" 
            style={{ maxWidth: '100%', height: 'auto' }} 
          />
        ) : (
          <QRCodeSVG 
            value={qrCodeValue} 
            size={200}
            level="M"
            includeMargin={true}
            style={{ 
              margin: '0 auto', 
              display: 'block',
              backgroundColor: 'var(--card-background-color)',
              padding: '10px',
              borderRadius: '4px',
            }}
          />
        )}
      </div>
      
      <div className="text-center mt-1">
        <p className="qr-value" style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
          {qrCodeValue}
        </p>
        <button onClick={handlePrint} className="mt-1">
          Print QR Code
        </button>
      </div>
    </div>
  )
}

export default ItemQrCode