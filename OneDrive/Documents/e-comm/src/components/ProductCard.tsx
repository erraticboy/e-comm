import { useState, useRef } from 'react';
import { type Product, useApp } from '../context/AppContext';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart, toggleWishlist, wishlist, setCurrentPage, setSelectedProductId } = useApp();
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 3D Tilt state
  const [transformStyle, setTransformStyle] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)");
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within element
    const y = e.clientY - rect.top;  // y position within element
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Tilt calculations (max 12 degrees)
    const rotateX = ((centerY - y) / centerY) * 12;
    const rotateY = ((x - centerX) / centerX) * 12;
    
    setTransformStyle(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setTransformStyle("perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)");
  };

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const isStarred = wishlist.includes(product.id);
  const stockRatio = (product.stock / product.maxStock) * 100;
  const lowStock = product.stock <= 5;

  const viewDetails = () => {
    setSelectedProductId(product.id);
    setCurrentPage('detail');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={viewDetails}
      style={{ 
        transform: transformStyle,
        transition: hovered ? 'none' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
      }}
      className={`relative group cursor-pointer glassmorphism-card rounded-xl p-4 flex flex-col justify-between select-none border transition-all duration-300 w-full min-h-[420px] ${
        hovered ? 'border-cyan-400/40 neon-border-cyan' : 'border-white/5'
      }`}
    >
      
      {/* Glow highlight in card background */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-0">
        <div className="absolute -inset-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,rgba(0,245,255,0.06)_0%,transparent_60%)]" />
        {lowStock && (
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Badges / Header overlay */}
      <div className="relative z-10 flex justify-between items-start mb-4">
        {lowStock ? (
          <span className="px-2 py-0.5 text-[9px] font-orbitron bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded uppercase tracking-wider animate-pulse">
            Critical Stock
          </span>
        ) : (
          <span className="px-2 py-0.5 text-[9px] font-orbitron bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 rounded uppercase tracking-wider">
            {product.category}
          </span>
        )}
        
        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`p-2 rounded-full border transition-all duration-300 ${
            isStarred 
              ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-400 neon-border-cyan' 
              : 'bg-[#050505]/60 border-white/5 text-zinc-500 hover:text-white hover:border-white/25'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isStarred ? 'fill-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Cyber 3D Mesh Mock Placement Area */}
      <div className="relative h-44 w-full flex items-center justify-center mb-4 bg-zinc-950/40 border border-white/5 rounded-lg group-hover:border-cyan-400/20 transition-all overflow-hidden">
        {/* Decorative Grid Scanner Line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/40 opacity-0 group-hover:opacity-100 animate-scan-line pointer-events-none" />
        <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

        {/* Dynamic Glowing Sphere Mocking the 3D meshes */}
        <div className="w-16 h-16 rounded-full border border-dashed border-cyan-400/30 flex items-center justify-center animate-spin" style={{ animationDuration: '12s' }}>
          <div className="w-12 h-12 rounded-full border border-dashed border-purple-500/30 flex items-center justify-center animate-spin" style={{ animationDuration: '6s' }}>
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 opacity-60 group-hover:scale-125 transition-transform duration-500" />
          </div>
        </div>

        {/* Action Overlay buttons */}
        <div className="absolute bottom-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              viewDetails();
            }}
            className="p-2 bg-[#050505]/90 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-400 hover:text-[#050505] rounded-md transition-all flex items-center justify-center"
            title="Inspect holographic node"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-400 to-purple-600 hover:brightness-125 text-[#050505] font-orbitron font-extrabold text-[10px] rounded-md transition-all flex items-center justify-center space-x-1 uppercase"
            title="Authorize cart inject"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Inject</span>
          </button>
        </div>
      </div>

      {/* Info Content Area */}
      <div className="relative z-10 text-left flex-1 flex flex-col justify-end">
        <h3 className="font-orbitron font-bold text-sm text-white tracking-wider truncate mb-1 group-hover:text-cyan-400 transition-colors">
          {product.name}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center space-x-1.5 mb-2.5">
          <div className="flex text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`} 
              />
            ))}
          </div>
          <span className="font-orbitron text-[9px] text-zinc-500 tracking-widest">({product.rating.toFixed(1)})</span>
        </div>

        {/* Reactor Fuel-Level Stock Bar */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-[8px] font-orbitron tracking-widest text-zinc-500">
            <span>STOCK CORE</span>
            <span className={lowStock ? 'text-rose-400' : 'text-cyan-400'}>
              {product.stock} / {product.maxStock} UNIT
            </span>
          </div>
          <div className="w-full h-1 bg-zinc-950 border border-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                lowStock 
                  ? 'bg-gradient-to-r from-rose-500 to-orange-600' 
                  : 'bg-gradient-to-r from-cyan-500 to-purple-600'
              }`}
              style={{ width: `${stockRatio}%` }}
            />
          </div>
        </div>

        {/* Footer Area: Price & Action */}
        <div className="border-t border-white/5 pt-3 flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[8px] font-orbitron text-zinc-500 tracking-widest uppercase">Price Index</span>
            <span className="font-orbitron text-sm font-black text-cyan-400 neon-text-cyan flex items-baseline">
              {product.price.toLocaleString()}
              <span className="text-[9px] font-bold text-cyan-300/70 ml-0.5">CR</span>
            </span>
          </div>
          
          <span className="font-orbitron text-[9px] text-zinc-400 group-hover:text-cyan-400 hover:underline transition-colors flex items-center space-x-0.5">
            <span>SYNC NODE</span>
            <span className="font-black">→</span>
          </span>
        </div>

      </div>

    </div>
  );
};
