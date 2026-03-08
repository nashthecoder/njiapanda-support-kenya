import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ShareStory from "./pages/ShareStory";
import StoryLibrary from "./pages/StoryLibrary";
import Safety from "./pages/Safety";
import Resources from "./pages/Resources";
import Helpline from "./pages/Helpline";
import QuietSignal from "./pages/QuietSignal";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Contribute from "./pages/Contribute";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import EmergencyExitButton from "./components/EmergencyExitButton";
import BottomNav from "./components/BottomNav";
import FeedbackButton from "./components/FeedbackButton";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <EmergencyExitButton />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/share" element={<ShareStory />} />
          <Route path="/stories" element={<StoryLibrary />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/helpline" element={<Helpline />} />
          <Route path="/signal" element={<QuietSignal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/contribute" element={<Contribute />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
        <FeedbackButton />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
