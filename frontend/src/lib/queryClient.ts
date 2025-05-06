import { QueryClient } from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1, // Only retry once by default
      throwOnError: false,
    },
    mutations: {
      throwOnError: false,
    }
  },
})

export default queryClient