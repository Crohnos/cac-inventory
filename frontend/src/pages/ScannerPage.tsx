import React from 'react';
import { Smartphone, QrCode, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ScannerPage: React.FC = () => {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-brand">QR Code Scanning</h1>
        <p className="text-sm md:text-base text-caccc-grey/70 mt-1">Learn how to use QR codes with your phone's camera</p>
      </div>

      {/* Primary Method - Native Camera */}
      <div className="bg-gradient-to-br from-caccc-green/10 to-caccc-green/20 rounded-lg p-4 md:p-8">
        <div className="text-center mb-4 md:mb-6">
          <Smartphone className="h-12 md:h-16 w-12 md:w-16 text-caccc-green mx-auto mb-3 md:mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-brand mb-1 md:mb-2">Recommended Method</h2>
          <p className="text-base md:text-lg text-caccc-grey/80">Use your phone's built-in camera app</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="text-center p-3 md:p-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-caccc-green rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
              <span className="text-white font-bold text-sm md:text-base">1</span>
            </div>
            <h3 className="font-semibold mb-1 md:mb-2 text-sm md:text-base text-brand">Open Camera</h3>
            <p className="text-xs md:text-sm text-caccc-grey/70">Open your iPhone or Android camera app</p>
          </div>

          <div className="text-center p-3 md:p-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-caccc-green rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
              <span className="text-white font-bold text-sm md:text-base">2</span>
            </div>
            <h3 className="font-semibold mb-1 md:mb-2 text-sm md:text-base text-brand">Point & Scan</h3>
            <p className="text-xs md:text-sm text-caccc-grey/70">Point camera at the QR code on bins/shelves</p>
          </div>

          <div className="text-center p-3 md:p-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-caccc-green rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
              <span className="text-white font-bold text-sm md:text-base">3</span>
            </div>
            <h3 className="font-semibold mb-1 md:mb-2 text-sm md:text-base text-brand">Tap Link</h3>
            <p className="text-xs md:text-sm text-caccc-grey/70">Tap the notification to open inventory actions</p>
          </div>
        </div>
      </div>

      {/* QR Code Management */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex items-center space-x-3 mb-6">
          <QrCode className="h-6 w-6 text-caccc-green" />
          <h3 className="text-lg font-semibold text-brand">QR Code Management</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-brand mb-2">View & Print QR Codes</h4>
            <p className="text-sm text-caccc-grey/70 mb-4">
              Go to any item's detail page to see its QR code. You can print or download it to attach to bins and shelves.
            </p>
            <Link to="/" className="btn-primary inline-flex items-center text-sm">
              Browse Inventory <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-brand mb-4">Troubleshooting</h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-gray-900 mb-1 text-sm">QR code won't scan?</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Make sure the QR code is well-lit and in focus</li>
                  <li>• Try moving your phone closer or further away</li>
                  <li>• Ensure you're connected to the company WiFi</li>
                  <li>• Clean your camera lens if it's dirty</li>
                </ul>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-1 text-sm">Link doesn't open?</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Make sure you're connected to the internal network</li>
                  <li>• Try copying the link and pasting in your browser</li>
                  <li>• Contact IT support if the problem persists</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};