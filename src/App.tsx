import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AccessibilityProvider } from "@/hooks/useAccessibility";
import { useAuth } from "@/hooks/useAuth";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import SkipLink from "@/components/SkipLink";
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
import JoinNetwork from "./pages/JoinNetwork";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import WhyNjiapanda from "./pages/WhyNjiapanda";
import Sauti from "./pages/Sauti";
import NotFound from "./pages/NotFound";
import EmergencyExitButton from "./components/EmergencyExitButton";
import BottomNav from "./components/BottomNav";
import FeedbackButton from "./components/FeedbackButton";

const queryClient = new QueryClient();

function AppInner() {
  const { user } = useAuth();
  useIdleTimeout(!!user);

  return (
    <BrowserRouter>
      <SkipLink />
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
        <Route path="/join" element={<JoinNetwork />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/why" element={<WhyNjiapanda />} />
        <Route path="/sauti" element={<Sauti />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
      <FeedbackButton />
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AccessibilityProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppInner />
      </TooltipProvider>
    </AccessibilityProvider>
  </QueryClientProvider>
);

export default App;
