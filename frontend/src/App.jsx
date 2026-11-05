import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContratsPage from './pages/ContratsPage';
import ReceptionPage from './pages/ReceptionPage';
import ExpeditionsPage from './pages/ExpeditionsPage';
import StockPage from './pages/StockPage';
import TiersPage from './pages/TiersPage';
import ComptesUtilisateursPage from './pages/ComptesUtilisateursPage';
import NotificationsPage from './pages/NotificationsPage';
import PlaceholderPage from './pages/PlaceholderPage';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="contrats" element={<ContratsPage />} />
        <Route path="reception" element={<ReceptionPage />} />
        <Route path="expeditions" element={<ExpeditionsPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="tiers" element={<TiersPage />} />
        <Route path="comptes-utilisateurs" element={<ComptesUtilisateursPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="rapports" element={<PlaceholderPage title="Rapports" />} />
      </Route>
    </Routes>
  );
}
