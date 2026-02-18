import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// --- Types ---

export type UserRole = "guest" | "unverified" | "verified" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number; // Mock price for display
  image: string;
  technicalSpecs: Record<string, string>;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface AppState {
  user: User | null;
  cart: CartItem[];
  products: Product[];
  isLoading: boolean;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  placeOrder: () => void;
}

// --- Mock Data ---

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Industrial Sulphuric Acid 98%",
    category: "Industrial Acids",
    description: "High-grade sulphuric acid for industrial applications. Used in fertilizer production, chemical synthesis, and wastewater treatment.",
    price: 450,
    image: "/images/product-barrels.png",
    technicalSpecs: {
      "Purity": "98% Min",
      "Appearance": "Clear, oily liquid",
      "Density": "1.84 g/cm³",
      "CAS No": "7664-93-9"
    }
  },
  {
    id: "2",
    name: "Caustic Soda Flakes",
    category: "Alkalis",
    description: "Premium sodium hydroxide flakes. Essential for soap making, paper manufacturing, and aluminum etching.",
    price: 600,
    image: "/images/lab-glassware.png", // Fallback for now
    technicalSpecs: {
      "Purity": "99% Min",
      "Appearance": "White flakes",
      "Solubility": "Highly soluble in water",
      "CAS No": "1310-73-2"
    }
  },
  {
    id: "3",
    name: "Methanol Industrial Grade",
    category: "Solvents",
    description: "Pure methanol solvent for chemical processing and fuel applications.",
    price: 380,
    image: "/images/product-barrels.png",
    technicalSpecs: {
      "Purity": "99.85% Min",
      "Water Content": "0.1% Max",
      "Boiling Point": "64.7°C",
      "CAS No": "67-56-1"
    }
  },
  {
    id: "4",
    name: "Titanium Dioxide Rutile",
    category: "Pigments",
    description: "High-performance white pigment for paints, coatings, and plastics.",
    price: 2800,
    image: "/images/lab-glassware.png",
    technicalSpecs: {
      "TiO2 Content": "93% Min",
      "Brightness": "95%",
      "Oil Absorption": "20g/100g",
      "Form": "White Powder"
    }
  }
];

// --- Context ---

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const login = (email: string, role: UserRole) => {
    // Mock login
    const mockUser: User = {
      id: "u1",
      name: email.split("@")[0],
      email,
      role,
      companyName: "Acme Global Trade",
    };
    setUser(mockUser);
    toast({
      title: "Welcome back",
      description: `Logged in as ${role.toUpperCase()} user.`,
    });
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const addToCart = (product: Product, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    toast({
      title: "Added to Cart",
      description: `${quantity}x ${product.name} added.`,
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const placeOrder = () => {
    toast({
      title: "Order Placed Successfully",
      description: "Your order has been sent to our sales team for processing.",
    });
    clearCart();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        cart,
        products: MOCK_PRODUCTS,
        isLoading: false,
        login,
        logout,
        addToCart,
        removeFromCart,
        clearCart,
        placeOrder,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
