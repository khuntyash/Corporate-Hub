import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// --- Types ---

export type UserRole = "guest" | "unverified" | "verified" | "admin";

export interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  companyName?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  images: string[];
  image: string; // Singular image for easy access in components
  properties: Record<string, string>;
  sellerCompanyId?: string | null;
  subCategory?: string | null;
  casNumber?: string | null;
  synonyms?: string | null;
  molFormula?: string | null;
  molWeight?: string | null;
  hsnCode?: string | null;
  packingType?: string | null;
  gstTaxRate?: string | null;
  productPackings?: any | null;
}

/** Barrel PNG — kept only for reference, not used as a fallback anymore */
export const FALLBACK_IMAGE = "/images/product-barrels.png";

export const proxyImg = (url: string | null | undefined): string => {
  if (!url) return ""; // Let ChemicalImage handle via SVG placeholder
  if (url === FALLBACK_IMAGE) return ""; // Replace legacy barrel references
  if (url.startsWith("https://www.ottokemi.com/")) {
    return `/api/img-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

export interface CartItem {
  product: Product;
  quantity: number;
}

interface AppState {
  user: User | null;
  cart: CartItem[];
  products: Product[];
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  logout: () => void;
  initiateRegister: (data: RegisterData) => Promise<{ success: boolean; email?: string }>;
  verifyRegister: (email: string, otp: string) => Promise<boolean>;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  placeOrder: (data: CheckoutData) => Promise<string[]>;
  fetchProducts: () => Promise<void>;
}

// B2C Registration - no company details needed
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface CheckoutData {
  address: string;
  city: string;
  postalCode: string;
}

// --- Mock Data for Products (fallback when no server) ---

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Industrial Sulphuric Acid 98%",
    sku: "MOCK-1",
    category: "Industrial Acids",
    description: "High-grade sulphuric acid for industrial applications. Used in fertilizer production, chemical synthesis, and wastewater treatment.",
    price: 35000,
    images: ["/images/product-barrels.png"],
    image: "/images/product-barrels.png",
    properties: {
      "Purity": "98% Min",
      "Appearance": "Clear, oily liquid",
      "Density": "1.84 g/cm³",
      "CAS No": "7664-93-9"
    }
  },
  {
    id: "2",
    name: "Caustic Soda Flakes",
    sku: "MOCK-2",
    category: "Alkalis",
    description: "Premium sodium hydroxide flakes. Essential for soap making, paper manufacturing, and aluminum etching.",
    price: 48000,
    images: ["/images/lab-glassware.png"],
    image: "/images/lab-glassware.png",
    properties: {
      "Purity": "99% Min",
      "Appearance": "White flakes",
      "Solubility": "Highly soluble in water",
      "CAS No": "1310-73-2"
    }
  },
  {
    id: "3",
    name: "Methanol Industrial Grade",
    sku: "MOCK-3",
    category: "Solvents",
    description: "Pure methanol solvent for chemical processing and fuel applications.",
    price: 32000,
    images: ["/images/product-barrels.png"],
    image: "/images/product-barrels.png",
    properties: {
      "Purity": "99.85% Min",
      "Water Content": "0.1% Max",
      "Boiling Point": "64.7°C",
      "CAS No": "67-56-1"
    }
  },
  {
    id: "4",
    name: "Titanium Dioxide Rutile",
    sku: "MOCK-4",
    category: "Pigments",
    description: "High-performance white pigment for paints, coatings, and plastics.",
    price: 225000,
    images: ["/images/lab-glassware.png"],
    image: "/images/lab-glassware.png",
    properties: {
      "TiO2 Content": "93% Min",
      "Brightness": "95%",
      "Oil Absorption": "20g/100g",
      "Form": "White Powder"
    }
  }
];

// --- Context ---

const AppContext = createContext<AppState | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  // Start with an empty array to avoid flashing mock data before the API loads
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load user from localStorage on mount and verify with server
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        // Optimistically set user to avoid flash of login screen
        setUser(parsedUser);

        // Verify token validity with server
        fetch("/api/auth/verify", {
          headers: { "Authorization": `Bearer ${storedToken}` }
        })
          .then(res => {
            if (!res.ok) {
              console.log("[Auth] Session verification failed (likely expired or server restart)");
              throw new Error("Session invalid");
            }
            return res.json();
          })
          .then(data => {
            console.log("[Auth] Session verified");
            // Optionally update user data from server response if needed
          })
          .catch(() => {
            // Token invalid - clear session
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setUser(null);
            toast({
              title: "Session Expired",
              description: "Please log in again.",
              variant: "destructive"
            });
          })
          .finally(() => {
            setIsLoading(false);
          });

      } catch (e) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        console.log("[Store] Fetched products from API:", data.length, "products");

        // Transform API products to local format
        const transformedProducts: Product[] = data.map((p: any) => {
          // Parse properties if it's a string
          let properties: Record<string, string> = {};
          if (p.properties) {
            try {
              // Try to parse as JSON first
              properties = JSON.parse(p.properties);
            } catch {
              // If not JSON, use as a single property
              properties = { "Properties": p.properties };
            }
          }

          const images = Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []);

          return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category || "Uncategorized",
            subCategory: p.subCategory,
            description: p.description || "",
            price: parseFloat(p.price) || 0,
            images: images,
            image: proxyImg(images[0]),
            properties: properties,
            sellerCompanyId: p.sellerCompanyId,
            casNumber: p.casNumber,
            synonyms: p.synonyms,
            molFormula: p.molFormula,
            molWeight: p.molWeight,
            hsnCode: p.hsnCode,
            packingType: p.packingType,
            gstTaxRate: p.gstTaxRate,
            productPackings: p.productPackings
          };
        });

        console.log("[Store] Transformed products:", transformedProducts);

        // Only update if we have actual products from API
        if (transformedProducts.length > 0) {
          setProducts(transformedProducts);
        } else {
          console.log("[Store] No products from API, keeping fallback");
        }
      } else {
        console.error("[Store] API response not ok:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      // Keep using mock products as fallback
    }
  };

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Login with email or username (B2C)
  const login = async (emailOrUsername: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailOrUsername, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
        return false;
      }

      // Store token and user
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      // Set user in state
      const loggedInUser: User = {
        id: data.user.id,
        name: `${data.user.firstName} ${data.user.lastName}`,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role === "admin" ? "admin" : "verified",
      };
      setUser(loggedInUser);

      toast({
        title: "Welcome back!",
        description: `Logged in as ${loggedInUser.name}`,
      });

      return true;
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setCart([]);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const initiateRegister = async (data: RegisterData): Promise<{ success: boolean; email?: string }> => {
    try {
      const response = await fetch("/api/auth/register/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Registration Failed",
          description: result.message || "Unable to initiate registration",
          variant: "destructive",
        });
        return { success: false };
      }

      toast({
        title: "OTP Sent!",
        description: "Please check your email for the verification code.",
      });

      return { success: true, email: data.email };
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const verifyRegister = async (email: string, otp: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid OTP",
          variant: "destructive",
        });
        return false;
      }

      // Store token and user
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      // Set user in state
      const loggedInUser: User = {
        id: data.user.id,
        name: `${data.user.firstName} ${data.user.lastName}`,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role === "admin" ? "admin" : "verified",
      };
      setUser(loggedInUser);

      toast({
        title: "Account Verified!",
        description: `Welcome, ${loggedInUser.name}!`,
      });

      return true;
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive",
      });
      return false;
    }
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

  const placeOrder = async (checkoutData: CheckoutData): Promise<string[]> => {
    setIsLoading(true);
    try {
      if (!user) {
        throw new Error("User not logged in");
      }

      // Group items by seller
      const ordersBySeller = new Map<string, CartItem[]>();

      cart.forEach(item => {
        const sellerId = item.product.sellerCompanyId;
        // If sellerId is missing (should be fixed by script, but just in case), 
        // we can't process it easily. ideally we skip or warn. 
        // For now, let's assume valid data due to repair script.
        if (sellerId) {
          const group = ordersBySeller.get(sellerId) || [];
          group.push(item);
          ordersBySeller.set(sellerId, group);
        } else {
          console.error("Product missing sellerCompanyId:", item.product.name);
          // Fallback: This might fail if backend enforces foreign key.
          // But we will try to proceed or skip. 
          // Better to show error.
          throw new Error(`Product '${item.product.name}' has invalid data (missing seller). Please remove it.`);
        }
      });

      const createdOrderNumbers: string[] = [];

      // Create an order for each seller group
      for (const [sellerId, items] of Array.from(ordersBySeller.entries())) {
        const orderPayload = {
          sellerCompanyId: sellerId,
          items: items.map((i: CartItem) => ({
            productId: i.product.id,
            quantity: i.quantity,
            unitPrice: i.product.price.toString()
          })),
          shippingAddress: `${checkoutData.address}, ${checkoutData.city}, ${checkoutData.postalCode}`,
          billingAddress: `${checkoutData.address}, ${checkoutData.city}, ${checkoutData.postalCode}`, // Assuming same for now
        };

        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem(TOKEN_KEY)}`
          },
          body: JSON.stringify(orderPayload)
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || "Failed to create order");
        }

        const createdOrder = await response.json();
        createdOrderNumbers.push(createdOrder.orderNumber);
      }

      toast({
        title: "Order Placed Successfully",
        description: `Created ${createdOrderNumbers.length} order(s): ${createdOrderNumbers.join(", ")}`,
      });

      clearCart();
      return createdOrderNumbers;

    } catch (error: any) {
      toast({
        title: "Checkout Failed",
        description: error.message || "An error occurred during checkout.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        cart,
        products,
        isLoading,
        login,
        logout,
        initiateRegister,
        verifyRegister,
        addToCart,
        removeFromCart,
        clearCart,
        placeOrder,
        fetchProducts,
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
