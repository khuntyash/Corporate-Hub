import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Products from "@/pages/products";
import Team from "@/pages/team";
import ProductDetail from "@/pages/product-detail";
import AuthPage from "@/pages/auth";
import Cart from "@/pages/cart";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin";
import ContentPage from "@/pages/content";
import Contact from "@/pages/contact";
import { ContentProvider } from "@/lib/content";
import { AppProvider } from "@/lib/store";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/team" component={Team} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/cart" component={Cart} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminDashboard} />

      {/* Content Pages */}
      <Route path="/about" component={ContentPage} />
      <Route path="/infrastructure" component={ContentPage} />
      <Route path="/global-presence" component={ContentPage} />
      <Route path="/contact" component={Contact} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ContentProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ContentProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
