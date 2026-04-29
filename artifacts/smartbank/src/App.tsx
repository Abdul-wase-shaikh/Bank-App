import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { PinSessionProvider } from "@/hooks/usePinSession";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import PinSetup from "./pages/PinSetup";
import PinUnlock from "./pages/PinUnlock";
import PinReset from "./pages/PinReset";
import BiometricSetup from "./pages/BiometricSetup";
import SecuritySettings from "./pages/SecuritySettings";
import TxnPinSetup from "./pages/TxnPinSetup";
import TxnPinReset from "./pages/TxnPinReset";

import Bills from "./pages/Bills";
import Recharge from "./pages/bills/Recharge";
import ScanPay from "./pages/bills/ScanPay";
import PayBill from "./pages/bills/PayBill";
import Fastag from "./pages/bills/Fastag";
import Subscriptions from "./pages/bills/Subscriptions";
import Billers from "./pages/bills/Billers";
import Reminders from "./pages/bills/Reminders";
import TransactionDetail from "./pages/bills/TransactionDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <PinSessionProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Secure-login flow */}
                <Route path="/pin-setup" element={<ProtectedRoute skipPinGate><PinSetup /></ProtectedRoute>} />
                <Route path="/pin-unlock" element={<ProtectedRoute skipPinGate><PinUnlock /></ProtectedRoute>} />
                <Route path="/pin-reset" element={<ProtectedRoute skipPinGate><PinReset /></ProtectedRoute>} />
                <Route path="/biometric-setup" element={<ProtectedRoute skipPinGate><BiometricSetup /></ProtectedRoute>} />

                {/* PIN-gated app */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/security" element={<ProtectedRoute><SecuritySettings /></ProtectedRoute>} />
                <Route path="/txn-pin-setup" element={<ProtectedRoute><TxnPinSetup /></ProtectedRoute>} />
                <Route path="/txn-pin-reset" element={<ProtectedRoute><TxnPinReset /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />

                {/* Bills & Payments Hub */}
                <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
                <Route path="/bills/recharge" element={<ProtectedRoute><Recharge /></ProtectedRoute>} />
                <Route path="/bills/scan" element={<ProtectedRoute><ScanPay /></ProtectedRoute>} />
                <Route path="/bills/pay/:category" element={<ProtectedRoute><PayBill /></ProtectedRoute>} />
                <Route path="/bills/fastag" element={<ProtectedRoute><Fastag /></ProtectedRoute>} />
                <Route path="/bills/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
                <Route path="/bills/billers" element={<ProtectedRoute><Billers /></ProtectedRoute>} />
                <Route path="/bills/reminders" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
                <Route path="/bills/transaction/:id" element={<ProtectedRoute><TransactionDetail /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </PinSessionProvider>
        </AuthProvider>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;