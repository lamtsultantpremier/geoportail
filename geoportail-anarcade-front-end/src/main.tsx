import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import './index.css'
// import App from './App.tsx'
import {router} from './app/router.tsx' 


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // les données restent « fraîches » 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
createRoot(document.getElementById('root')!).render(
  <StrictMode>
   <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
