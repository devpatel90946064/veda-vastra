import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Product } from './types';
import { Truck, ShieldCheck, Banknote, Award, Heart, Sparkles } from 'lucide-react';

function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.originState.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar
        onSearch={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <main className="flex-1">
        <HeroBanner />

        {/* Product Catalog Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-800">
                Curated Collection
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                {selectedCategory === 'All' ? 'All Handcrafted Creations' : selectedCategory}
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Showing {filteredProducts.length} GI-authentic items
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200"></div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-amber-900/10">
              <p className="text-slate-500 text-sm">No items found matching your filter.</p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs font-bold text-amber-900 underline"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Heritage Trust Showcase Banner */}
        <section className="bg-amber-950 text-amber-100 py-12 px-4 sm:px-6 border-t border-amber-900">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-lg text-white">Veda & Vastra</h3>
              <p className="text-xs text-amber-200/80 leading-relaxed font-light">
                Empowering India’s heritage weavers and craft communities through fair compensation, digital direct-to-consumer access, and authentic GI verification.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-amber-400">
                Logistics & Courier Delivery
              </h4>
              <p className="text-xs text-amber-200/80 leading-relaxed font-light">
                Integrated with Shiprocket shipping APIs across Delhivery, Blue Dart, and Shadowfax. Real-time AWB generation, automated tracking, and Cash on Delivery (COD) serviceability.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-amber-400">
                Payments & Security
              </h4>
              <p className="text-xs text-amber-200/80 leading-relaxed font-light">
                Razorpay Checkout with UPI (GPay, PhonePe, Paytm), RuPay, Credit & Debit Cards, and Netbanking. Secured with server-side HMAC SHA-256 signature verification.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-6 px-4 border-t border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <p>© 2026 Veda & Vastra Co. Handcrafted in India. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>🇮🇳 All-India Shipping via Shiprocket</span>
            <span>•</span>
            <span>Razorpay Payment Gateway</span>
            <span>•</span>
            <span>COD Available</span>
          </div>
        </div>
      </footer>

      {/* Drawers and Modals */}
      <CartDrawer />
      <ProductModal />
      <CheckoutModal />
      <OrderTrackingModal />
      <AdminDashboard />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Storefront />
    </StoreProvider>
  );
}
