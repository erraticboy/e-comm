import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Product {
  id: string | number;
  name: string;
  price: number;
  rating: number;
  image: string;
  category: string;
  description: string;
  stock: number;
  maxStock: number;
  specs: { [key: string]: string };
  modelType: 'visor' | 'drone' | 'deck' | 'car' | 'patch' | 'watch';
  sellerId?: string;
  videoUrl?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface UserState {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'seller' | 'admin' | 'user';
  credits: number;
  approved: boolean;
}

interface AppContextType {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string | number) => void;
  updateCartQuantity: (productId: string | number, quantity: number) => void;
  clearCart: () => void;
  wishlist: Array<string | number>;
  toggleWishlist: (productId: string | number) => void;
  selectedProductId: string | number;
  setSelectedProductId: (id: string | number) => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  trackingCode: string;
  setTrackingCode: (code: string) => void;
  
  // Live Auth state
  user: UserState | null;
  setUser: React.Dispatch<React.SetStateAction<UserState | null>>;
  token: string | null;
  login: (token: string, user: UserState) => void;
  logout: () => void;
  
  modelRotationSpeed: number;
  setModelRotationSpeed: (speed: number) => void;
  refreshProducts: () => Promise<void>;
  socket: Socket | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Array<string | number>>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | number>('PROD-1');
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [trackingCode, setTrackingCode] = useState<string>('CYBER-7798-X');
  const [modelRotationSpeed, setModelRotationSpeed] = useState<number>(1);
  
  // Auth state mapping
  const [user, setUser] = useState<UserState | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('cyber_token'));
  
  // Chat socket connection reference
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, []);

  const refreshProducts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        if (data.length > 0) {
          // Default selection to first item if current is empty or unsynced
          const exists = data.some((p: Product) => p.id === selectedProductId);
          if (!exists) setSelectedProductId(data[0].id);
        }
      }
    } catch (err) {
      console.warn("⚠️ Cannot reach backend products directory. Offline mode.", err);
    }
  };

  // Profile restore handshake
  useEffect(() => {
    const restoreSession = async () => {
      if (!token) return;
      try {
        const res = await fetch("http://localhost:5000/api/auth/profile", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.warn("API profile sync offline.");
      }
    };

    restoreSession();
    refreshProducts();
  }, [token]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const login = (newToken: string, newUser: UserState) => {
    localStorage.setItem('cyber_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('cyber_token');
    setToken(null);
    setUser(null);
    setCurrentPage('home');
    setCart([]);
  };

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string | number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateCartQuantity = (productId: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string | number) => {
    setWishlist((prevWishlist) => {
      if (prevWishlist.includes(productId)) {
        return prevWishlist.filter((id) => id !== productId);
      } else {
        return [...prevWishlist, productId];
      }
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        products,
        setProducts,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        wishlist,
        toggleWishlist,
        selectedProductId,
        setSelectedProductId,
        chatOpen,
        setChatOpen,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        priceRange,
        setPriceRange,
        trackingCode,
        setTrackingCode,
        
        user,
        setUser,
        token,
        login,
        logout,
        
        modelRotationSpeed,
        setModelRotationSpeed,
        refreshProducts,
        socket
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
