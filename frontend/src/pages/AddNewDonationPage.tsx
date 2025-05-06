import { useState } from 'react'
import { useCategories } from '../hooks'
import AddCategoryFormExtended from '../components/donation/AddCategoryFormExtended'
import AddItemForm from '../components/donation/AddItemForm'

const AddNewDonationPage = () => {
  const [activeTab, setActiveTab] = useState<'category' | 'item'>('item')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>()
  
  // Fetch categories to check if empty
  const { data: categories = [] } = useCategories()
  
  const handleCategoryCreated = (categoryId: number) => {
    setSelectedCategoryId(categoryId)
    setActiveTab('item')
  }
  
  return (
    <div>
      <h1>Add New Donation</h1>
      <p>Add new categories and items to the inventory.</p>
      
      {/* Tab selection */}
      <div className="tabs-container mb-1">
        <div role="tablist" className="tabs">
          <button 
            role="tab"
            aria-selected={activeTab === 'item'} 
            onClick={() => setActiveTab('item')}
          >
            Add Item
          </button>
          <button 
            role="tab"
            aria-selected={activeTab === 'category'} 
            onClick={() => setActiveTab('category')}
          >
            Add Category
          </button>
        </div>
      </div>
      
      {/* Show empty state message if no categories and item tab is active */}
      {activeTab === 'item' && categories.length === 0 && (
        <div className="card mb-1">
          <div className="empty-state text-center p-1">
            <h3>No Categories Available</h3>
            <p>You need to create at least one category before adding items.</p>
            <button onClick={() => setActiveTab('category')} className="mt-1">
              Create a Category
            </button>
          </div>
        </div>
      )}
      
      {/* Tab content */}
      <div className="card">
        {activeTab === 'category' ? (
          <div>
            <h2>Add New Category</h2>
            <AddCategoryFormExtended onSuccess={handleCategoryCreated} />
          </div>
        ) : (
          <div>
            <h2>Add New Item</h2>
            {categories.length > 0 ? (
              <AddItemForm initialCategoryId={selectedCategoryId} />
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export default AddNewDonationPage