import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";

import SplashScreen from "./components/SplashScreen";
import HomePage from "./pages/HomePage";
import VillasPage from "./pages/VillasPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import BookingPage from "./pages/BookingPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import PaymentPage from "./pages/PaymentPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReservations from "./pages/admin/AdminReservations";
import AdminIncome from "./pages/admin/AdminIncome";
import AdminExpenses from "./pages/admin/AdminExpenses";
import AdminSummary from "./pages/admin/AdminSummary";
import AdminUsers from "./pages/admin/AdminUsers";
import VillaDetailPage from "./pages/VillaDetailPage";
import InvoicePage from "./pages/InvoicePage";
import AdminInvoices from "./pages/admin/AdminInvoices";
import AdminVillas from "./pages/admin/AdminVillas";
import AdminPromotions from "./pages/admin/AdminPromotions";
import AdminCalendar from "./pages/admin/AdminCalendar";
import AdminSettings from "./pages/admin/AdminSettings";
import ClientAuthPage from "./pages/ClientAuthPage";
import MyReservationsPage from "./pages/MyReservationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/villas" element={<VillasPage />} />
              <Route path="/villa/:id" element={<VillaDetailPage />} />
              <Route path="/disponibilidad" element={<AvailabilityPage />} />
              <Route path="/reservar" element={<BookingPage />} />
              <Route path="/confirmacion" element={<BookingConfirmationPage />} />
              <Route path="/pago" element={<PaymentPage />} />
              <Route path="/factura" element={<InvoicePage />} />
              <Route path="/auth" element={<ClientAuthPage />} />
              <Route path="/mis-reservas" element={<MyReservationsPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/reservas" element={<AdminReservations />} />
              <Route path="/admin/ingresos" element={<AdminIncome />} />
              <Route path="/admin/gastos" element={<AdminExpenses />} />
              <Route path="/admin/resumen" element={<AdminSummary />} />
              <Route path="/admin/usuarios" element={<AdminUsers />} />
              <Route path="/admin/facturas" element={<AdminInvoices />} />
              <Route path="/admin/villas" element={<AdminVillas />} />
              <Route path="/admin/promociones" element={<AdminPromotions />} />
              <Route path="/admin/calendario" element={<AdminCalendar />} />
              <Route path="/admin/configuracion" element={<AdminSettings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
