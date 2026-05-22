import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { Heart, Trash2 } from 'lucide-react';

export const Wishlist = () => {
  const { wishlist, products, toggleWishlist, setCurrentPage } = useApp();

  const savedProducts = products.filter(product => wishlist.includes(product.id));

  if (savedProducts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 relative z-10 text-center pb-20">
        <div className="glassmorphism p-16 rounded-2xl border-white/5 max-w-lg mx-auto space-y-6">
          <div className="w-16 h-16 bg-cyan-400/10 border border-cyan-400/20 rounded-full flex items-center justify-center mx-auto text-cyan-400">
            <Heart className="w-8 h-8 animate-float" />
          </div>
          <h2 className="font-orbitron font-black text-xl tracking-wider text-zinc-300 uppercase">Deck Empty</h2>
          <p className="font-inter text-xs text-zinc-500 leading-relaxed">
            No cyberware nodes saved in deck. Browse the store directory and click heart icons to bookmark items.
          </p>
          <button 
            onClick={() => setCurrentPage('shop')}
            className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 hover:brightness-125 text-black font-orbitron font-black text-xs uppercase tracking-widest rounded-xl transition-all"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white select-none pb-20">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
        
        {/* Header */}
        <div className="text-left border-b border-white/5 pb-6 mb-8">
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <Heart className="w-4 h-4" />
            <span className="font-orbitron font-extrabold text-[9px] tracking-[0.3em] uppercase">SYSTEM DECK SAVES</span>
          </div>
          <h1 className="font-orbitron font-black text-3xl sm:text-5xl uppercase tracking-tight">
            Wishlist <span className="text-cyan-400 font-normal">Vault</span>
          </h1>
        </div>

        {/* Saved Grid list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedProducts.map(product => (
            <div key={product.id} className="relative group">
              <ProductCard product={product} />
              
              {/* Extra hover remove action button on top */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product.id);
                }}
                className="absolute top-2 left-2 z-20 p-2 bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                title="Discard node save"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
