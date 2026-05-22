import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { SlidersHorizontal, Search, RotateCcw, Database } from 'lucide-react';

export const Shop = () => {
  const { 
    products, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory 
  } = useApp();

  const [sortBy, setSortBy] = useState<string>('featured');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number>(90000);

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setMaxPrice(90000);
    setOnlyInStock(false);
    setSortBy('featured');
  };

  // Filter products based on search, category, stock and price range
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesPrice = product.price <= maxPrice;
    const matchesStock = !onlyInStock || product.stock > 0;

    return matchesSearch && matchesCategory && matchesPrice && matchesStock;
  });

  // Sort filtered list
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0; // 'featured' (default)
  });

  const categories = ['All', 'Augmentations', 'Robotics', 'Hacking', 'Vehicles', 'Bio-Tech', 'Wearables'];

  return (
    <div className="relative min-h-screen text-white select-none pb-20">
      
      {/* Glow ambient highlight */}
      <div className="absolute top-[5%] right-[5%] w-[400px] h-[400px] pointer-events-none z-0">
        <div className="w-full h-full rounded-full glow-radial-purple opacity-20" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
        
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-6 mb-8 text-left">
          <div>
            <div className="flex items-center space-x-1.5 text-cyan-400 mb-1">
              <Database className="w-3.5 h-3.5" />
              <span className="font-orbitron font-extrabold text-[9px] tracking-[0.3em] uppercase">SYSTEM GRID INDEX</span>
            </div>
            <h1 className="font-orbitron font-black text-3xl sm:text-5xl uppercase tracking-tight">
              Hardware <span className="text-cyan-400 font-normal">Terminal</span>
            </h1>
          </div>
          <span className="font-orbitron text-xs text-zinc-500 tracking-widest mt-2 md:mt-0">
            LOADED ENTRIES: {sortedProducts.length} NODES
          </span>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex overflow-x-auto whitespace-nowrap space-x-2 pb-4 mb-8 scrollbar-none border-b border-white/5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-lg font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-200 border ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 neon-border-cyan'
                  : 'glassmorphism border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
              }`}
            >
              {cat === 'All' ? 'Full Catalog' : cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Filtering Panel (takes 3 cols) */}
          <div className="lg:col-span-3 space-y-6 text-left">
            <div className="glassmorphism p-5 rounded-xl border-white/5 space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="font-orbitron font-extrabold text-xs tracking-widest text-zinc-300 flex items-center space-x-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
                  <span>FILTER ENGINE</span>
                </span>
                <button 
                  onClick={resetFilters}
                  className="p-1 text-zinc-500 hover:text-cyan-400 transition-colors"
                  title="Recalibrate filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-orbitron tracking-widest text-zinc-400">
                  <span>MAX PRICE LEVEL</span>
                  <span className="text-cyan-400 font-extrabold">{maxPrice.toLocaleString()} CR</span>
                </div>
                <input 
                  type="range" 
                  min="200" 
                  max="100000" 
                  step="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-zinc-900 border border-white/5 h-1.5 rounded-full cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-orbitron text-zinc-600">
                  <span>200 CR</span>
                  <span>100K CR</span>
                </div>
              </div>

              {/* In stock toggle */}
              <div className="flex items-center justify-between py-2 border-y border-white/5">
                <span className="font-rajdhani font-bold text-xs text-zinc-300">Exclude Critical Stock</span>
                <button
                  type="button"
                  onClick={() => setOnlyInStock(!onlyInStock)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    onlyInStock ? 'bg-cyan-500' : 'bg-zinc-800 border border-white/10'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-[#050505] transition-transform duration-200 ${
                    onlyInStock ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Sort By selector */}
              <div className="space-y-2">
                <label className="font-orbitron text-[9px] text-zinc-500 tracking-widest uppercase">Sort Protocol</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2.5 bg-zinc-950/80 border border-white/10 rounded-lg text-xs font-rajdhani font-bold text-zinc-300 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="featured">Directory Default</option>
                  <option value="price-asc">Price Index: Low → High</option>
                  <option value="price-desc">Price Index: High → Low</option>
                  <option value="rating">Runner Feedback Rating</option>
                </select>
              </div>

            </div>
          </div>

          {/* RIGHT: Product Grid (takes 9 cols) */}
          <div className="lg:col-span-9">
            {sortedProducts.length === 0 ? (
              <div className="glassmorphism p-12 rounded-xl border-white/5 text-center flex flex-col items-center space-y-4">
                <Search className="w-10 h-10 text-cyan-400/40 animate-bounce" />
                <h3 className="font-orbitron font-bold text-sm tracking-wider uppercase text-zinc-300">No Node Matches Found</h3>
                <p className="font-inter text-xs text-zinc-500 max-w-sm">
                  The search query did not return any records in this sector. Try clearing query filters or checking connection protocols.
                </p>
                <button 
                  onClick={resetFilters}
                  className="px-6 py-2 bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 font-orbitron font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-cyan-500/20 transition-all"
                >
                  Recalibrate Node
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
