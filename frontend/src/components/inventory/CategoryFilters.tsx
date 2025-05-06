import { useState } from 'react'

interface CategoryFiltersProps {
  onFilterChange: (filters: {
    name?: string;
    lowStockOnly?: boolean;
  }) => void;
}

const CategoryFilters = ({ onFilterChange }: CategoryFiltersProps) => {
  const [name, setName] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    onFilterChange({ name: e.target.value, lowStockOnly })
  }
  
  const handleLowStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLowStockOnly(e.target.checked)
    onFilterChange({ name, lowStockOnly: e.target.checked })
  }
  
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <div style={{ flexGrow: 1, maxWidth: '300px' }}>
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Search by name..."
        />
      </div>
      
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={lowStockOnly}
          onChange={handleLowStockChange}
        />
        Show low stock only
      </label>
    </div>
  )
}

export default CategoryFilters