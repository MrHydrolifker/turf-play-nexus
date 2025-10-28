import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PlayerAuth from "./pages/PlayerAuth";
import VendorAuth from "./pages/VendorAuth";
import AdminAuth from "./pages/AdminAuth";
import TurfDetails from "./pages/TurfDetails";
import VendorDashboard from "./pages/VendorDashboard";
import AddTurf from "./pages/AddTurf";
import AdminDashboard from "./pages/AdminDashboard";
import MyBookings from "./pages/MyBookings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/player" element={<PlayerAuth />} />
          <Route path="/auth/vendor" element={<VendorAuth />} />
          <Route path="/auth/admin" element={<AdminAuth />} />
          <Route path="/turf/:id" element={<TurfDetails />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/vendor/add-turf" element={<AddTurf />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
