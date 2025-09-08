import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { InventoryPage } from './pages/InventoryPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ScannerPage } from './pages/ScannerPage';
import { AddItemPage } from './pages/AddItemPage';
import { ReportsPage } from './pages/ReportsPage';
import { VolunteerHoursPage } from './pages/VolunteerHoursPage';
import { QRActionPage } from './pages/QRActionPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<InventoryPage />} />
            <Route path="items/:itemId" element={<ItemDetailPage />} />
            <Route path="add-item" element={<AddItemPage />} />
            <Route path="scan" element={<ScannerPage />} />
            <Route path="volunteer-hours" element={<VolunteerHoursPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
          {/* Mobile QR Action Route - outside dashboard layout for mobile-first experience */}
          <Route path="mobile/items/:itemId" element={<QRActionPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
