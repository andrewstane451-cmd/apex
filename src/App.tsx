import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DashboardOptions from "./pages/DashboardOptions";
import DashboardBot from "./pages/DashboardBot";
import DashboardCFDs from "./pages/DashboardCFDs";
import DashboardWallets from "./pages/DashboardWallets";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Profile from "./pages/Profile";
import VerifyCountry from "./pages/VerifyCountry";
import VerifyIdentity from "./pages/VerifyIdentity";
import VerifyLocation from "./pages/VerifyLocation";
import VerifyNumber from "./pages/VerifyNumber";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="options" element={<DashboardOptions />} />
              <Route path="cfds" element={<DashboardCFDs />} />
              <Route path="bot" element={<DashboardBot />} />
              <Route path="wallets" element={<DashboardWallets />} />
              <Route path="profile" element={<Profile />} />
              <Route path="verify/country" element={<VerifyCountry />} />
              <Route path="verify/identity" element={<VerifyIdentity />} />
              <Route path="verify/location" element={<VerifyLocation />} />
              <Route path="verify/number" element={<VerifyNumber />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
