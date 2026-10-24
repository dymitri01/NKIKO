import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContratsPage from './pages/ContratsPage';
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
        <Route path="reception" element={<PlaceholderPage title="Réception" />} />
        <Route path="expeditions" element={<PlaceholderPage title="Expéditions" />} />
        <Route path="stock" element={<PlaceholderPage title="Stock" />} />
        <Route path="tiers" element={<PlaceholderPage title="Tiers" />} />
        <Route
          path="comptes-utilisateurs"
          element={<PlaceholderPage title="Comptes utilisateurs" />}
        />
        <Route path="notifications" element={<PlaceholderPage title="Notifications" />} />
        <Route path="rapports" element={<PlaceholderPage title="Rapports" />} />
      </Route>
    </Routes>
  );
}
