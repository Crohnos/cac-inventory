import axios from 'axios'

// Set API base URL dynamically based on environment
const API_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL || 'https://cac-inventory-api.onrender.com/api'
  : '/api' // Local development uses Vite proxy

// Create a base Axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for handling errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error
    
    // Always log API errors to the console
    console.error('API Error:', error)
    
    // Return a standardized error object
    return Promise.reject({
      status: response?.status,
      message: response?.data?.error || 'An unknown error occurred',
      details: response?.data?.details,
      originalError: error,
    })
  }
)

export default api