import React from 'react';
import { Smartphone, QrCode, Camera, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ScannerPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand">QR Code Scanning</h1>
        <p className="text-caccc-grey/70">Learn how to use QR codes with your phone's camera</p>
      </div>
      
      {/* Primary Method - Native Camera */}
      <div className="bg-gradient-to-br from-caccc-green/10 to-caccc-green/20 rounded-lg p-8">
        <div className="text-center mb-6">
          <Smartphone className="h-16 w-16 text-caccc-green mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-brand mb-2">Recommended Method</h2>
          <p className="text-lg text-caccc-grey/80">Use your phone's built-in camera app</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-caccc-green rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2 text-brand">Open Camera</h3>
            <p className="text-sm text-caccc-grey/70">Open your iPhone or Android camera app</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-caccc-green rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2 text-brand">Point & Scan</h3>
            <p className="text-sm text-caccc-grey/70">Point camera at the QR code on bins/shelves</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-caccc-green rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2 text-brand">Tap Link</h3>
            <p className="text-sm text-caccc-grey/70">Tap the notification to open inventory actions</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-caccc-green/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-caccc-green-dark mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-caccc-green-dark mb-1">Why this works best:</p>
              <ul className="text-caccc-green-dark space-y-1">
                <li>• No app download required</li>
                <li>• Works instantly with any phone</li>
                <li>• Faster than opening apps first</li>
                <li>• Perfect for volunteers and staff</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Management */}
      <div className="bg-white rounded-lg shadow p-6">
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
            <h4 className="font-medium text-gray-900 mb-2">Test QR Scanning</h4>
            <p className="text-sm text-gray-600 mb-4">
              Try scanning a QR code from an item detail page with your phone to see how it works.
            </p>
            <div className="text-sm text-gray-500">
              Example: <code className="bg-gray-100 px-2 py-1 rounded">/{window.location.host}/qr/RR-12345678</code>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Troubleshooting</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">QR code won't scan?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Make sure the QR code is well-lit and in focus</li>
              <li>• Try moving your phone closer or further away</li>
              <li>• Ensure you're connected to the company WiFi</li>
              <li>• Clean your camera lens if it's dirty</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Link doesn't open?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Make sure you're connected to the internal network</li>
              <li>• Try copying the link and pasting in your browser</li>
              <li>• Contact IT support if the problem persists</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Alternative - In App Scanner */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Camera className="h-6 w-6 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Alternative: In-App Scanner</h3>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Coming Soon</span>
        </div>
        <p className="text-gray-600 mb-4">
          If you can't use your phone's camera app, we're working on an in-app scanner as a backup option. 
          This will allow you to scan QR codes directly within this app.
        </p>
        <div className="text-sm text-gray-500">
          For now, the native camera method works best for all users.
        </div>
      </div>
    </div>
  );
};