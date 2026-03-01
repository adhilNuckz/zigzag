import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuthStore } from "@/stores/authStore";
import { authAPI } from "@/lib/api";

import Index from "./pages/Index";
import ChatPage from "./pages/ChatPage";
import ResourcesPage from "./pages/ResourcesPage";
import ResourceDetailPage from "./pages/ResourceDetailPage";
import TorTalksPage from "./pages/TorTalksPage";
import BlogPostPage from "./pages/BlogPostPage";
import BlogCreatePage from "./pages/BlogCreatePage";
import IdeasPage from "./pages/IdeasPage";
import ToolsPage from "./pages/ToolsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function AutoRegister() {
  const { isAuthenticated, login, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      authAPI
        .register()
        .then((data) => login(data))
        .catch((err) => console.error("[Auth] Auto-register failed:", err));
    }
  }, [isAuthenticated]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AutoRegister />
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/resources/:id" element={<ResourceDetailPage />} />
          <Route path="/tor-talks" element={<TorTalksPage />} />
          <Route path="/tor-talks/:id" element={<BlogPostPage />} />
          <Route path="/tor-talks/new" element={<BlogCreatePage />} />
          <Route path="/ideas" element={<IdeasPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
