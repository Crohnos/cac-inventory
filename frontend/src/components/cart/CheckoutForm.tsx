import React, { useState } from 'react';
import { FileText, User, Calendar, ArrowLeft, ShoppingCart, Users, AlertTriangle } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { useUIStore } from '../../stores/uiStore';
import { useLocationStore } from '../../stores/locationStore';

interface CheckoutData {
  checkout_date: string; // MM-DD-YYYY format
  worker_first_name: string;
  worker_last_name: string;
  department: string;
  case_number: string;
  allegations: string[];
  parent_guardian_first_name: string;
  parent_guardian_last_name: string;
  zip_code: string;
  alleged_perpetrator_first_name?: string;
  alleged_perpetrator_last_name?: string;
  number_of_children: number;
}

interface CheckoutFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

const DEPARTMENTS = [
  'CPS/DFPS',
  'CACCC FA/CE',
  'Family Compass',
  'Law Enforcement'
];

const ALLEGATIONS = [
  'Abandonment',
  'Human Trafficking',
  'Neglectful Supervision',
  'RAPR',
  'Emotional Abuse',
  'Labor Trafficking',
  'Physical Abuse',
  'Sex Trafficking',
  'Exploitation',
  'Medical Neglect',
  'Physical Neglect',
  'Sexual Abuse',
  'Other'
];

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState<CheckoutData>({
    checkout_date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    worker_first_name: '',
    worker_last_name: '',
    department: '',
    case_number: '',
    allegations: [],
    parent_guardian_first_name: '',
    parent_guardian_last_name: '',
    zip_code: '',
    alleged_perpetrator_first_name: '',
    alleged_perpetrator_last_name: '',
    number_of_children: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { items, getTotalItems, clearCart } = useCartStore();
  const { addToast } = useUIStore();
  const { getCurrentLocation } = useLocationStore();
  const currentLocation = getCurrentLocation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'number_of_children') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 1 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAllegationChange = (allegation: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      allegations: checked 
        ? [...prev.allegations, allegation]
        : prev.allegations.filter(a => a !== allegation)
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.worker_first_name.trim()) return 'Worker first name is required';
    if (!formData.worker_last_name.trim()) return 'Worker last name is required';
    if (!formData.department) return 'Department is required';
    if (!formData.case_number.trim()) return 'Case number is required';
    if (formData.allegations.length === 0) return 'At least one allegation must be selected';
    if (!formData.parent_guardian_first_name.trim()) return 'Parent/Guardian first name is required';
    if (!formData.parent_guardian_last_name.trim()) return 'Parent/Guardian last name is required';
    if (!formData.zip_code.trim()) return 'ZIP code is required';
    if (!/^\d{5}(-\d{4})?$/.test(formData.zip_code.trim())) return 'Invalid ZIP code format';
    if (formData.number_of_children < 1 || formData.number_of_children > 5) return 'Number of children must be between 1 and 5';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: validationError
      });
      return;
    }

    if (!currentLocation) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No location selected'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const checkoutData = {
        location_id: currentLocation.location_id,
        checkout_date: formData.checkout_date,
        worker_first_name: formData.worker_first_name,
        worker_last_name: formData.worker_last_name,
        department: formData.department,
        case_number: formData.case_number,
        allegations: JSON.stringify(formData.allegations),
        parent_guardian_first_name: formData.parent_guardian_first_name,
        parent_guardian_last_name: formData.parent_guardian_last_name,
        zip_code: formData.zip_code,
        alleged_perpetrator_first_name: formData.alleged_perpetrator_first_name || null,
        alleged_perpetrator_last_name: formData.alleged_perpetrator_last_name || null,
        number_of_children: formData.number_of_children,
        items: items.map(item => ({
          item_id: item.item_id,
          size_id: item.size_id,
          quantity: item.quantity
        }))
      };

      const response = await fetch('/api/checkouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkoutData)
      });

      if (!response.ok) {
        let errorMessage = 'Failed to complete checkout';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, use default error message
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      await response.json();

      addToast({
        type: 'success',
        title: 'Checkout Complete',
        message: `Successfully checked out ${getTotalItems()} items for ${formData.parent_guardian_first_name} ${formData.parent_guardian_last_name}`
      });

      clearCart();
      onSuccess();
      
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Checkout Failed',
        message: error.message || 'An error occurred during checkout'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalItems = getTotalItems();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Case File Information
            </h2>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Location Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Date & Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkout_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date (MM-DD-YYYY) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="checkout_date"
                  name="checkout_date"
                  value={formData.checkout_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="MM-DD-YYYY"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-900">
                  {currentLocation?.name}
                </div>
              </div>
            </div>
          </div>

          {/* Worker Information Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Worker Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="worker_first_name" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="worker_first_name"
                  name="worker_first_name"
                  value={formData.worker_first_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="worker_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="worker_last_name"
                  name="worker_last_name"
                  value={formData.worker_last_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="case_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Case Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="case_number"
                  name="case_number"
                  value={formData.case_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="CPS Intake / CAC Case / LE Case Number"
                  required
                />
              </div>
            </div>
          </div>

          {/* Allegations Section */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-900 mb-3 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Allegations <span className="text-red-500">*</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ALLEGATIONS.map(allegation => (
                <label key={allegation} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.allegations.includes(allegation)}
                    onChange={(e) => handleAllegationChange(allegation, e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-gray-700">{allegation}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Parent/Guardian Information Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Parent/Guardian Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="parent_guardian_first_name" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="parent_guardian_first_name"
                  name="parent_guardian_first_name"
                  value={formData.parent_guardian_first_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="parent_guardian_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="parent_guardian_last_name"
                  name="parent_guardian_last_name"
                  value={formData.parent_guardian_last_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="zip_code"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="75025 or 75025-1234"
                  required
                />
              </div>
              <div>
                <label htmlFor="number_of_children" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Children (1-5) <span className="text-red-500">*</span>
                </label>
                <select
                  id="number_of_children"
                  name="number_of_children"
                  value={formData.number_of_children}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Alleged Perpetrator Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-3">
              Alleged Perpetrator (if other than parent/guardian)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="alleged_perpetrator_first_name" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="alleged_perpetrator_first_name"
                  name="alleged_perpetrator_first_name"
                  value={formData.alleged_perpetrator_first_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="alleged_perpetrator_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="alleged_perpetrator_last_name"
                  name="alleged_perpetrator_last_name"
                  value={formData.alleged_perpetrator_last_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Order Summary
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-800">Location:</span>
                <span className="font-medium text-blue-900">{currentLocation?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-800">Total Items:</span>
                <span className="font-medium text-blue-900">{totalItems}</span>
              </div>
              <div className="pt-2 border-t border-blue-200">
                <div className="space-y-1">
                  {items.map((item) => (
                    <div key={`${item.item_id}-${item.size_id}`} className="flex justify-between text-xs text-blue-700">
                      <span>{item.item_name} ({item.size_label})</span>
                      <span>×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="w-full px-6 py-4 text-lg font-semibold rounded-lg transition-colors min-h-[48px] bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400"
        >
          Back to Cart
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full px-6 py-4 text-lg font-semibold rounded-lg transition-colors min-h-[48px] bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400"
        >
          {isSubmitting ? 'Processing...' : `Complete Checkout (${totalItems} items)`}
        </button>
      </div>
    </div>
  );
};