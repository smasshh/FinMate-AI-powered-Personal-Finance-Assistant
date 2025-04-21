
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Import new pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import Expenses from "./pages/dashboard/Expenses";
import Budget from "./pages/dashboard/Budget";
import StockPredictions from "./pages/dashboard/StockPredictions";
import PortfolioManagement from "./pages/dashboard/PortfolioManagement";
import AiTradingAssistant from "./pages/dashboard/AiTradingAssistant";
import ChatBot from "./pages/dashboard/ChatBot";
import CreditScorePrediction from "./pages/dashboard/CreditScorePrediction";
import NotFound from "./pages/NotFound";
import Profile from "./pages/dashboard/Profile";
import Settings from "./pages/dashboard/Settings";

const queryClient = new QueryClient();

// Wrap the entire application in a function component to ensure hooks are used in a valid context
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Dashboard routes */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="budget" element={<Budget />} />
                <Route path="stock-predictions" element={<StockPredictions />} />
                <Route path="portfolio" element={<PortfolioManagement />} />
                <Route path="ai-trading" element={<AiTradingAssistant />} />
                <Route path="chatbot" element={<ChatBot />} />
                <Route path="credit-score" element={<CreditScorePrediction />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
