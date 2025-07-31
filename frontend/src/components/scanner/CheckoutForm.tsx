import { useState } from 'react'
import { useToastContext } from '../../hooks'
import { ItemCategory } from '../../types/apiTypes'

interface CheckoutFormProps {
  category: ItemCategory
  itemsRemovedCount: number
  onComplete: () => void
  onCancel: () => void
}

interface CheckoutFormData {
  checkoutDate: string
  location: 'CACCC Plano' | 'CACCC McKinney'
  workerFirstName: string
  workerLastName: string
  department: 'CPS/DFPS' | 'CACCC FA/CE' | 'Family Compass' | 'Law Enforcement'
  caseNumber: string
  allegations: string[]
  parentGuardianFirstName: string
  parentGuardianLastName: string
  zipCode: string
  allegedPerpetratorFirstName: string
  allegedPerpetratorLastName: string
  numberOfChildren: number
}

const ALLEGATION_OPTIONS = [
  'Abandonment',
  'Emotional Abuse',
  'Human Trafficking', 
  'Neglectful Supervision',
  'RAPR',
  'Exploitation',
  'Medical Neglect',
  'Physical Neglect',
  'Sexual Abuse',
  'Sex Trafficking',
  'Labor Trafficking',
  'Other'
]

const DEPARTMENTS = [
  'CPS/DFPS',
  'CACCC FA/CE', 
  'Family Compass',
  'Law Enforcement'
]

const CheckoutForm = ({ category, itemsRemovedCount, onComplete, onCancel }: CheckoutFormProps) => {
  const toast = useToastContext()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Initialize form with current date in MM-DD-YYYY format
  const today = new Date()
  const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getFullYear()}`
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    checkoutDate: formattedDate,
    location: 'CACCC McKinney',
    workerFirstName: '',
    workerLastName: '',
    department: 'CPS/DFPS',
    caseNumber: '',
    allegations: [],
    parentGuardianFirstName: '',
    parentGuardianLastName: '',
    zipCode: '',
    allegedPerpetratorFirstName: '',
    allegedPerpetratorLastName: '',
    numberOfChildren: 1
  })
  
  const handleInputChange = (field: keyof CheckoutFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const handleAllegationChange = (allegation: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      allegations: checked
        ? [...prev.allegations, allegation]
        : prev.allegations.filter(a => a !== allegation)
    }))
  }
  
  const validateForm = (): string | null => {
    if (!formData.workerFirstName.trim()) return 'Worker first name is required'
    if (!formData.workerLastName.trim()) return 'Worker last name is required'
    if (!formData.caseNumber.trim()) return 'Case number is required'
    if (formData.allegations.length === 0) return 'At least one allegation must be selected'
    if (formData.numberOfChildren < 1) return 'Number of children must be at least 1'
    
    // Validate date format
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/
    if (!dateRegex.test(formData.checkoutDate)) {
      return 'Date must be in MM-DD-YYYY format'
    }
    
    return null
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/checkouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          itemCategoryId: category.id,
          itemsRemovedCount
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save checkout information')
      }
      
      toast.success('Checkout information saved successfully')
      onComplete()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save checkout information')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--card-background-color)',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <header style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 8px 0' }}>Rainbow Room Checkout Form</h2>
          <p style={{ margin: '0', color: 'var(--text-secondary)' }}>
            Category: <strong>{category.name}</strong> • Items Removed: <strong>{itemsRemovedCount}</strong>
          </p>
        </header>
        
        <form onSubmit={handleSubmit}>
          <div className="grid" style={{ gap: '16px' }}>
            {/* Date and Location */}
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="checkoutDate">Date (MM-DD-YYYY) *</label>
                <input
                  id="checkoutDate"
                  type="text"
                  value={formData.checkoutDate}
                  onChange={(e) => handleInputChange('checkoutDate', e.target.value)}
                  placeholder="MM-DD-YYYY"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="location">Location *</label>
                <select
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                >
                  <option value="CACCC McKinney">CACCC McKinney</option>
                  <option value="CACCC Plano">CACCC Plano</option>
                </select>
              </div>
            </div>
            
            {/* Worker Information */}
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="workerFirstName">Worker First Name *</label>
                <input
                  id="workerFirstName"
                  type="text"
                  value={formData.workerFirstName}
                  onChange={(e) => handleInputChange('workerFirstName', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="workerLastName">Worker Last Name *</label>
                <input
                  id="workerLastName"
                  type="text"
                  value={formData.workerLastName}
                  onChange={(e) => handleInputChange('workerLastName', e.target.value)}
                  required
                />
              </div>
            </div>
            
            {/* Department and Case Number */}
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="department">Department *</label>
                <select
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  required
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="caseNumber">CPS Intake Number / CAC Case Number / LE Case Number *</label>
                <input
                  id="caseNumber"
                  type="text"
                  value={formData.caseNumber}
                  onChange={(e) => handleInputChange('caseNumber', e.target.value)}
                  required
                />
              </div>
            </div>
            
            {/* Allegations */}
            <div>
              <label>Allegations (Select all that apply) *</label>
              <div className="grid" style={{ 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '8px',
                backgroundColor: 'var(--card-sectionning-background-color)',
                padding: '16px',
                borderRadius: '8px',
                marginTop: '8px'
              }}>
                {ALLEGATION_OPTIONS.map(allegation => (
                  <label key={allegation} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={formData.allegations.includes(allegation)}
                      onChange={(e) => handleAllegationChange(allegation, e.target.checked)}
                    />
                    <span style={{ fontSize: '0.9rem' }}>{allegation}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Parent/Guardian Information */}
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="parentGuardianFirstName">Parent/Guardian First Name</label>
                <input
                  id="parentGuardianFirstName"
                  type="text"
                  value={formData.parentGuardianFirstName}
                  onChange={(e) => handleInputChange('parentGuardianFirstName', e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="parentGuardianLastName">Parent/Guardian Last Name</label>
                <input
                  id="parentGuardianLastName"
                  type="text"
                  value={formData.parentGuardianLastName}
                  onChange={(e) => handleInputChange('parentGuardianLastName', e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="zipCode">ZIP Code</label>
                <input
                  id="zipCode"
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  maxLength={10}
                />
              </div>
            </div>
            
            {/* Alleged Perpetrator Information */}
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="allegedPerpetratorFirstName">Alleged Perpetrator First Name (if other than Parent)</label>
                <input
                  id="allegedPerpetratorFirstName"
                  type="text"
                  value={formData.allegedPerpetratorFirstName}
                  onChange={(e) => handleInputChange('allegedPerpetratorFirstName', e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="allegedPerpetratorLastName">Alleged Perpetrator Last Name (if other than Parent)</label>
                <input
                  id="allegedPerpetratorLastName"
                  type="text"
                  value={formData.allegedPerpetratorLastName}
                  onChange={(e) => handleInputChange('allegedPerpetratorLastName', e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="numberOfChildren">Number of Children Receiving Rainbow Room Services *</label>
                <input
                  id="numberOfChildren"
                  type="number"
                  min="1"
                  value={formData.numberOfChildren}
                  onChange={(e) => handleInputChange('numberOfChildren', parseInt(e.target.value) || 1)}
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-1" style={{ marginTop: '24px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{ flex: '0 0 auto' }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="primary"
              disabled={isSubmitting}
              style={{ 
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  Save Checkout Information
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CheckoutForm