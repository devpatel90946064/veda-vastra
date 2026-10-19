import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { CartItem, IntegrationStatus, Product, ServiceabilityResult } from '../types';

interface StoreContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  
  // UI Drawers & Modals
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isTrackingOpen: boolean;
  setIsTrackingOpen: (open: boolean) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  
  // Pincode & Serviceability
  currentPincode: string;
  setCurrentPincode: (pin: string) => void;
  serviceability: ServiceabilityResult | null;
  checkingServiceability: boolean;
  checkPincode: (pin: string) => Promise<ServiceabilityResult | null>;
  
  // Auth & Admin
  currentUser: User | null;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  
  // System Status
  integrationStatus: IntegrationStatus | null;
  refreshStatus: () => Promise<void>;
  
  // Currency Utility
  formatINR: (amount: number) => string;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('vv_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [currentPincode, setCurrentPincode] = useState(() => {
    return localStorage.getItem('vv_pincode') || '110001';
  });
  const [serviceability, setServiceability] = useState<ServiceabilityResult | null>(null);
  const [checkingServiceability, setCheckingServiceability] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);

  // Persist cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('vv_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Cart storage error:', e);
    }
  }, [cart]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email) {
        const emailLower = user.email.toLowerCase();
        setIsAdmin(emailLower === 'dev90946064@gmail.com');
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch integration diagnostics status
  const refreshStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setIntegrationStatus(data);
      }
    } catch (err) {
      console.warn('Could not fetch integration status:', err);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  // Check pincode serviceability
  const checkPincode = async (pincode: string): Promise<ServiceabilityResult | null> => {
    const clean = pincode.trim().replace(/\D/g, '');
    if (clean.length !== 6) return null;

    setCheckingServiceability(true);
    try {
      const res = await fetch('/api/shipping/serviceability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: clean, weightKg: 0.5, isCod: true }),
      });
      if (res.ok) {
        const data: ServiceabilityResult = await res.json();
        setServiceability(data);
        setCurrentPincode(clean);
        localStorage.setItem('vv_pincode', clean);
        return data;
      }
      return null;
    } catch (err) {
      console.error('Pincode check error:', err);
      return null;
    } finally {
      setCheckingServiceability(false);
    }
  };

  // Run initial pincode check
  useEffect(() => {
    if (currentPincode) {
      checkPincode(currentPincode);
    }
  }, []);

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const clamped = Math.min(item.product.stock, quantity);
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Currency formatting in INR (₹)
  const formatINR = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Google Login
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Google Sign-In failed:', err);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isTrackingOpen,
        setIsTrackingOpen,
        isAdminOpen,
        setIsAdminOpen,
        selectedProduct,
        setSelectedProduct,
        currentPincode,
        setCurrentPincode,
        serviceability,
        checkingServiceability,
        checkPincode,
        currentUser,
        isAdmin,
        loginWithGoogle,
        logout,
        integrationStatus,
        refreshStatus,
        formatINR,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
