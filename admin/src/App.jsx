import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import PublicLayout from "./components/public/PublicLayout";

import AppointmentsPage from "./pages/AppointmentsPage";
import ApprovalHubPage from "./pages/ApprovalHubPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import DashboardPage from "./pages/DashboardPage";
import DoctorRequestsPage from "./pages/DoctorRequestsPage";
import DoctorsPage from "./pages/DoctorsPage";
import EcosystemMetricsPage from "./pages/EcosystemMetricsPage";
import ErrorLogsPage from "./pages/ErrorLogsPage";
import LabTestsPage from "./pages/LabTestsPage";
import LoginPage from "./pages/LoginPage";
import NotificationsPage from "./pages/NotificationsPage";
import OrdersPage from "./pages/OrdersPage";
import PartnersManagementPage from "./pages/PartnersManagementPage";
import PatientsPage from "./pages/PatientsPage";
import PaymentsPage from "./pages/PaymentsPage";
import PharmacyPage from "./pages/PharmacyPage";
import ReviewsPage from "./pages/ReviewsPage";
import SettingsPage from "./pages/SettingsPage";
import SlotsPage from "./pages/SlotsPage";
import LabPortalPage from "./pages/portal/LabPortalPage";
import AboutPage from "./pages/public/AboutPage";
import BusinessRegistrationPage from "./pages/public/BusinessRegistrationPage";
import ContactPage from "./pages/public/ContactPage";
import HomePage from "./pages/public/HomePage";
import HowItWorksPage from "./pages/public/HowItWorksPage";
import LabTestDetailsPage from "./pages/public/LabTestDetailsPage";
import LabTestsCatalogPage from "./pages/public/LabTestsCatalogPage";
import PortalAuthPage from "./pages/public/PortalAuthPage";
import PrivacyPage from "./pages/public/PrivacyPage";
import RegistrationSuccessPage from "./pages/public/RegistrationSuccessPage";
import ServicesPage from "./pages/public/ServicesPage";
import TermsPage from "./pages/public/TermsPage";
import { getPortalUser, isRoleAuthenticated } from "./services/api";

const PharmacyPortalLayout = lazy(
  () => import("./pages/portal/pharmacy/PharmacyPortalLayout"),
);
const PharmacyDashboardRoutePage = lazy(
  () => import("./pages/portal/pharmacy/DashboardPage"),
);
const PharmacyProductsRoutePage = lazy(
  () => import("./pages/portal/pharmacy/ProductsPage"),
);
const PharmacyOrdersRoutePage = lazy(
  () => import("./pages/portal/pharmacy/OrdersPage"),
);
const PharmacyInventoryRoutePage = lazy(
  () => import("./pages/portal/pharmacy/InventoryPage"),
);
const PharmacyEarningsRoutePage = lazy(
  () => import("./pages/portal/pharmacy/EarningsPage"),
);
const PharmacySettingsRoutePage = lazy(
  () => import("./pages/portal/pharmacy/SettingsPage"),
);

function LazyRoute({ children }) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-semibold text-slate-500">
          Loading portal module...
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const AdminRoute = ({ children }) => {
  const isAuthenticated = isRoleAuthenticated("admin");
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <Layout>{children}</Layout>;
};

const RoleRoute = ({ role, children }) => {
  const user = getPortalUser();
  if (!isRoleAuthenticated(role)) return <Navigate to="/login" replace />;
  if (!user || user.role !== role) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PortalAuthPage />} />
        <Route path="/admin/login" element={<LoginPage />} />

        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="lab-tests" element={<LabTestsCatalogPage />} />
          <Route path="lab-tests/:id" element={<LabTestDetailsPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="register" element={<BusinessRegistrationPage />} />
          <Route
            path="register/success"
            element={<RegistrationSuccessPage />}
          />
          <Route
            path="register-business"
            element={<Navigate to="/register" replace />}
          />
          <Route path="privacy-policy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
        </Route>

        <Route
          path="/portal/lab"
          element={
            <RoleRoute role="lab_admin">
              <LabPortalPage />
            </RoleRoute>
          }
        />
        <Route
          path="/portal/pharmacy"
          element={
            <RoleRoute role="pharmacy_admin">
              <LazyRoute>
                <PharmacyPortalLayout />
              </LazyRoute>
            </RoleRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <LazyRoute>
                <PharmacyDashboardRoutePage />
              </LazyRoute>
            }
          />
          <Route
            path="products"
            element={
              <LazyRoute>
                <PharmacyProductsRoutePage />
              </LazyRoute>
            }
          />
          <Route
            path="orders"
            element={
              <LazyRoute>
                <PharmacyOrdersRoutePage />
              </LazyRoute>
            }
          />
          <Route
            path="inventory"
            element={
              <LazyRoute>
                <PharmacyInventoryRoutePage />
              </LazyRoute>
            }
          />
          <Route
            path="earnings"
            element={
              <LazyRoute>
                <PharmacyEarningsRoutePage />
              </LazyRoute>
            }
          />
          <Route
            path="settings"
            element={
              <LazyRoute>
                <PharmacySettingsRoutePage />
              </LazyRoute>
            }
          />
        </Route>

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <DashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/patients"
          element={
            <AdminRoute>
              <PatientsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/doctors/requests"
          element={
            <AdminRoute>
              <DoctorRequestsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/doctors"
          element={
            <AdminRoute>
              <DoctorsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/appointments"
          element={
            <AdminRoute>
              <AppointmentsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/slots"
          element={
            <AdminRoute>
              <SlotsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/lab-tests"
          element={
            <AdminRoute>
              <LabTestsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/partners"
          element={
            <AdminRoute>
              <PartnersManagementPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/pharmacy"
          element={
            <AdminRoute>
              <PharmacyPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <OrdersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <AdminRoute>
              <PaymentsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <AdminRoute>
              <ReviewsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <AdminRoute>
              <NotificationsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <SettingsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/ecosystem"
          element={
            <AdminRoute>
              <EcosystemMetricsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/approvals"
          element={
            <AdminRoute>
              <ApprovalHubPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/errors"
          element={
            <AdminRoute>
              <ErrorLogsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <AdminRoute>
              <AuditLogsPage />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
