import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TradeProvider } from "./contexts/TradeContext";
import { AccessibilityProvider } from "./components/accessibility/AccessibilityProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import TradeRouteGuard from "./components/routing/TradeRouteGuard";
import Index from "./pages/Index";
import TradeReviewPage from "./pages/TradeReviewPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AccessibilityProvider>
        <AuthProvider>
          <TradeProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/trade/:tradeId" 
                  element={
                    <ProtectedRoute>
                      <TradeRouteGuard>
                        <Index />
                      </TradeRouteGuard>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/trade/:tradeId/review" 
                  element={
                    <ProtectedRoute>
                      <TradeRouteGuard>
                        <Index />
                      </TradeRouteGuard>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/trade/:tradeId/edit" 
                  element={
                    <ProtectedRoute>
                      <TradeRouteGuard>
                        <Index />
                      </TradeRouteGuard>
                    </ProtectedRoute>
                  } 
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TradeProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
