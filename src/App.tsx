import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { OrdersPage } from './pages/OrdersPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { CalendarPage } from './pages/CalendarPage'
import { CatalogPage } from './pages/CatalogPage'
import { ClientsPage } from './pages/ClientsPage'
import { PurchasesPage } from './pages/PurchasesPage'
import { KitchenPage } from './pages/KitchenPage'
import { KitchenBoardPage } from './pages/KitchenBoardPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ProposalPage } from './pages/ProposalPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/p/:id" element={<ProposalPage />} />
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="orders/:id/kitchen" element={<KitchenPage />} />
          <Route path="kitchen" element={<KitchenBoardPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
