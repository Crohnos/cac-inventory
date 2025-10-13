import React, { useState } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { CheckoutForm } from './CheckoutForm';

export const CartModal: React.FC = () => {
  const { items, hideCart, clearCart, removeItem, getTotalItems } = useCartStore();
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  const handleCheckoutClick = () => {
    setShowCheckoutForm(true);
  };

  const handleBackToCart = () => {
    setShowCheckoutForm(false);
  };

  const handleCheckoutSuccess = () => {
    setShowCheckoutForm(false);
    hideCart();
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 backdrop-blur-sm transition-all duration-300" onClick={hideCart} />

      <div className="absolute right-0 top-0 h-full w-full sm:max-w-2xl lg:max-w-4xl bg-white shadow-xl">
        {showCheckoutForm ? (
          <CheckoutForm
            onBack={handleBackToCart}
            onSuccess={handleCheckoutSuccess}
          />
        ) : (
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 md:px-6 py-4 md:py-6">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-6 w-6 text-caccc-green" />
                <h2 className="text-lg font-semibold text-brand">
                  Cart ({getTotalItems()} items)
                </h2>
              </div>
              <button
                onClick={hideCart}
                className="rounded-lg p-2 hover:bg-gray-100 text-brand"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-caccc-grey/40 mx-auto mb-4" />
                  <p className="text-caccc-grey/70">Your cart is empty</p>
                  <p className="text-sm text-caccc-grey/60 mt-1">
                    Add items by scanning QR codes or browsing inventory
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={`${item.item_id}-${item.size_id}`} className="border border-gray-200 rounded-lg p-4 hover:border-caccc-green/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-brand">{item.item_name}</h3>
                          <p className="text-sm text-caccc-grey/70">Size: {item.size_label}</p>
                          <p className="text-sm text-caccc-grey/70">Quantity: {item.quantity}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.item_id, item.size_id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                <button
                  onClick={clearCart}
                  className="btn-secondary w-full"
                >
                  Clear Cart
                </button>
                <button
                  onClick={handleCheckoutClick}
                  className="btn-primary w-full"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};