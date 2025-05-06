import axios from 'axios'

// Create a base Axios instance with default config
const api = axios.create({
  baseURL: '/api', // Will be proxied to http://localhost:3001/api via Vite
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