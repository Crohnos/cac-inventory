// Size types
export interface Size {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

export interface CreateSizeRequest {
  name: string
}

// ItemCategory types
export interface ItemCategory {
  id: number
  name: string
  description: string | null
  lowStockThreshold: number
  qrCodeValue?: string
  qrCodeDataUrl?: string
  totalQuantity?: number
  createdAt: string
  updatedAt: string
}

export interface CreateItemCategoryRequest {
  name: string
  description?: string
  lowStockThreshold?: number
}

export interface UpdateItemCategoryRequest {
  name?: string
  description?: string
  lowStockThreshold?: number
}

export interface CategorySizeRequest {
  sizeId: number
}

// ItemDetail types
export interface ItemDetail {
  id: number
  itemCategoryId: number
  sizeId: number | null
  condition: 'New' | 'Gently Used' | 'Heavily Used'
  location: 'McKinney' | 'Plano'
  receivedDate: string
  donorInfo: string | null
  approxPrice: number | null
  isActive: number // SQLite boolean (0/1)
  createdAt: string
  updatedAt: string
  categoryName?: string
  sizeName?: string | null
}

export interface CreateItemDetailRequest {
  itemCategoryId: number
  sizeId?: number
  condition: 'New' | 'Gently Used' | 'Heavily Used'
  location: 'McKinney' | 'Plano'
  receivedDate: string
  donorInfo?: string
  approxPrice?: number
  isActive?: boolean
}

export interface UpdateItemDetailRequest {
  itemCategoryId?: number
  sizeId?: number | null
  condition?: 'New' | 'Gently Used' | 'Heavily Used'
  location?: 'McKinney' | 'Plano'
  receivedDate?: string
  donorInfo?: string | null
  approxPrice?: number | null
  isActive?: boolean
}

export interface ItemTransferRequest {
  location: 'McKinney' | 'Plano'
}

// ItemPhoto types
export interface ItemPhoto {
  id: number
  itemDetailId: number
  filePath: string
  description: string | null
  url: string
  createdAt: string
  updatedAt: string
}

export interface PhotoDescriptionRequest {
  description?: string
}

// Error types
export interface ApiError {
  status: number
  message: string
  details?: any
  originalError?: any
}