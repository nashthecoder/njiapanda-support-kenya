import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ShareStory from "./pages/ShareStory";
import Safety from "./pages/Safety";
import Resources from "./pages/Resources";
import Helpline from "./pages/Helpline";
import NotFound from "./pages/NotFound";
import EmergencyExitButton from "./components/EmergencyExitButton";
import BottomNav from "./components/BottomNav";

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
          <Route path="/safety" element={<Safety />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/helpline" element={<Helpline />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
