import React, { useState } from 'react';
import { Plus, Package, Save, X, Tag, FileText, MapPin } from 'lucide-react';
import { useInventoryStore, type CreateItemData } from '../stores/inventoryStore';
import { useUIStore } from '../stores/uiStore';
import { useNavigate } from 'react-router-dom';

export const AddItemPage: React.FC = () => {
  const [formData, setFormData] = useState<CreateItemData>({
    name: '',
    description: '',
    storage_location: '',
    has_sizes: false,
    sizes: [],
    min_stock_level: 0,
    unit_type: 'pieces'
  });

  const [sizesInput, setSizesInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createItem } = useInventoryStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'min_stock_level') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSizesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSizesInput(value);
    
    // Parse sizes from comma-separated input
    const sizes = value
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    setFormData(prev => ({
      ...prev,
      sizes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Item name is required'
      });
      return;
    }

    if (formData.has_sizes && formData.sizes!.length === 0) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please specify at least one size for sized items'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newItem = await createItem(formData);
      
      addToast({
        type: 'success',
        title: 'Item Created',
        message: `"${formData.name}" has been added to the inventory`
      });

      // Navigate to the new item's detail page
      navigate(`/items/${newItem.item_id}`);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to Create Item',
        message: error.response?.data?.error || 'An error occurred while creating the item'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      storage_location: '',
      has_sizes: false,
      sizes: [],
      min_stock_level: 0,
      unit_type: 'pieces'
    });
    setSizesInput('');
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
          <Plus className="h-6 md:h-8 w-6 md:w-8 mr-2 md:mr-3 text-blue-600 flex-shrink-0" />
          Add New Item
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-1 ml-8 md:ml-11">Create a new inventory item category</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
            <Package className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
            Item Information
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Item Name */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                Item Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 md:py-3.5 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
                  placeholder="e.g., Children's T-Shirts, School Supplies, Toys"
                  required
                />
              </div>
            </div>

            {/* Unit Type */}
            <div>
              <label htmlFor="unit_type" className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                Unit Type
              </label>
              <select
                id="unit_type"
                name="unit_type"
                value={formData.unit_type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 md:py-3.5 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
              >
                <option value="pieces">Pieces</option>
                <option value="sets">Sets</option>
                <option value="pairs">Pairs</option>
                <option value="packages">Packages</option>
                <option value="boxes">Boxes</option>
              </select>
            </div>

            {/* Minimum Stock Level */}
            <div>
              <label htmlFor="min_stock_level" className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                Minimum Stock Level
              </label>
              <input
                type="number"
                id="min_stock_level"
                name="min_stock_level"
                value={formData.min_stock_level}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-3 md:py-3.5 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
                placeholder="0"
              />
            </div>

            {/* Storage Location */}
            <div className="md:col-span-2">
              <label htmlFor="storage_location" className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                Storage Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="storage_location"
                  name="storage_location"
                  value={formData.storage_location}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 md:py-3.5 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
                  placeholder="e.g., Shelf A-3, Storage Room 2, Bin 15"
                />
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 md:py-3.5 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe the item, its purpose, or any special notes..."
                />
              </div>
            </div>
          </div>

          {/* Sizes Section */}
          <div className="border-t pt-4 md:pt-6">
            <div className="flex items-center space-x-3 mb-4 min-h-[44px]">
              <input
                type="checkbox"
                id="has_sizes"
                name="has_sizes"
                checked={formData.has_sizes}
                onChange={handleInputChange}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="has_sizes" className="text-sm md:text-base font-medium text-gray-700 cursor-pointer">
                This item has different sizes
              </label>
            </div>

            {formData.has_sizes && (
              <div>
                <label htmlFor="sizes" className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                  Available Sizes <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="sizes"
                  value={sizesInput}
                  onChange={handleSizesChange}
                  rows={3}
                  className="w-full px-4 py-3 md:py-3.5 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter sizes separated by commas (e.g., XS, Small, Medium, Large, XL)"
                />
                {formData.sizes!.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-2">Parsed sizes:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.sizes!.map((size, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 md:pt-6 border-t">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 md:py-3.5 text-sm md:text-base font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 min-h-[48px] order-2 sm:order-1"
            >
              <X className="h-4 w-4" />
              <span>Reset Form</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 md:py-3.5 text-sm md:text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center space-x-2 min-h-[48px] order-1 sm:order-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Item'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Help Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
        <h3 className="text-sm md:text-base font-semibold text-blue-900 mb-2">Tips for Creating Items</h3>
        <ul className="text-xs md:text-sm text-blue-800 space-y-1">
          <li>• Use clear, descriptive names that volunteers will easily understand</li>
          <li>• Check "Has sizes" for clothing, shoes, or any items with size variations</li>
          <li>• Set minimum stock levels to get low-stock alerts</li>
          <li>• Include storage location to help volunteers find items quickly</li>
          <li>• After creation, you can adjust quantities for each location and size</li>
        </ul>
      </div>
    </div>
  );
};