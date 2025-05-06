import { 
  RootRoute, 
  Route, 
  Router,
  NotFoundRoute 
} from '@tanstack/react-router'
import RootLayout from '../components/RootLayout'
import InventoryTablePage from '../pages/InventoryTablePage'
import ItemCategoryPage from '../pages/ItemCategoryPage'
import ItemDetailPage from '../pages/ItemDetailPage'
import AddNewDonationPage from '../pages/AddNewDonationPage'
import ScannerPage from '../pages/ScannerPage'
import ImportExportPage from '../pages/ImportExportPage'
import NotFoundPage from '../pages/NotFoundPage'
import { CategoryParams, ItemParams } from '../types/routeTypes'

// Create the root route
const rootRoute = new RootRoute({
  component: RootLayout,
})

// Create child routes
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: InventoryTablePage,
})

const categoryRoute = new Route({
  getParentRoute: () => rootRoute,
  path: 'categories/$categoryId',
  component: ItemCategoryPage,
  validateParams: ({ categoryId }: CategoryParams) => {
    // Ensure categoryId is a valid number
    const parsed = parseInt(categoryId, 10)
    return !isNaN(parsed) && String(parsed) === categoryId
      ? { categoryId }
      : null
  },
})

const itemRoute = new Route({
  getParentRoute: () => rootRoute,
  path: 'items/$itemId',
  component: ItemDetailPage,
  validateParams: ({ itemId }: ItemParams) => {
    // Ensure itemId is a valid number
    const parsed = parseInt(itemId, 10)
    return !isNaN(parsed) && String(parsed) === itemId
      ? { itemId }
      : null
  },
})

const addRoute = new Route({
  getParentRoute: () => rootRoute,
  path: 'add',
  component: AddNewDonationPage,
})

const scanRoute = new Route({
  getParentRoute: () => rootRoute,
  path: 'scan',
  component: ScannerPage,
})

const importExportRoute = new Route({
  getParentRoute: () => rootRoute,
  path: 'import-export',
  component: ImportExportPage,
})

// Create a not found route
const notFoundRoute = new NotFoundRoute({
  getParentRoute: () => rootRoute,
  component: NotFoundPage,
})

// Build the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  categoryRoute,
  itemRoute,
  addRoute,
  scanRoute,
  importExportRoute,
  notFoundRoute,
])

// Create and export the router
export const router = new Router({ 
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})