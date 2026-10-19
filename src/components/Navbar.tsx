import React, { useState } from 'react';
import {
  ShoppingBag,
  MapPin,
  Search,
  ShieldCheck,
  Truck,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Navbar: React.FC<{
  onSearch: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}> = ({ onSearch, selectedCategory, onSelectCategory }) => {
  const {
    cartCount,
    setIsCartOpen,
    setIsTrackingOpen,
    isAdminOpen,
    setIsAdminOpen,
    currentPincode,
    serviceability,
    checkPincode,
    currentUser,
    isAdmin,
    loginWithGoogle,
    logout,
  } = useStore();

  const [pincodeInput, setPincodeInput] = useState(currentPincode);
  const [showPincodeDropdown, setShowPincodeDropdown] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const categories = [
    'All Crafts',
    'Handloom & Silks',
    'Brass & Metalcraft',
    'Pottery & Art',
    'Organic & Gourmet',
    'Aromatics & Wellness',
  ];

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincodeInput.length === 6) {
      checkPincode(pincodeInput);
      setShowPincodeDropdown(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-amber-900/10 shadow-xs">
      {/* Top Announcement Bar */}
      <div className="bg-amber-950 text-amber-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium tracking-wide">
              🇮🇳 All-India Express Courier Delivery via Shiprocket • Cash on Delivery (COD) Available
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-amber-300/80">
            <button
              onClick={() => setIsTrackingOpen(true)}
              className="hover:text-amber-100 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Truck className="w-3.5 h-3.5" /> Track Any Order
            </button>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Razorpay Verified Payments</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <a href="#" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 text-amber-100 flex items-center justify-center font-serif text-xl font-bold shadow-md shadow-amber-900/20 group-hover:scale-105 transition-transform">
                V
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight text-amber-950 block leading-tight">
                  Veda & Vastra
                </span>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-amber-800/80 block">
                  Artisans of Bharat
                </span>
              </div>
            </a>

            {/* Pincode Selector */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setShowPincodeDropdown(!showPincodeDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-900/15 bg-white/70 hover:bg-white text-xs text-slate-700 transition-colors shadow-2xs"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-700" />
                <span>Deliver to:</span>
                <span className="font-bold text-amber-950">{currentPincode}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showPincodeDropdown && (
                <div className="absolute top-full left-0 mt-2 w-72 p-4 bg-white rounded-xl shadow-xl border border-amber-900/10 z-50">
                  <p className="text-xs font-semibold text-slate-800 mb-2">Check Delivery & COD Serviceability</p>
                  <form onSubmit={handlePincodeSubmit} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={pincodeInput}
                      onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit Indian PIN"
                      className="flex-1 px-3 py-1.5 text-xs border border-amber-900/20 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-700"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-amber-900 text-amber-100 text-xs font-medium rounded-lg hover:bg-amber-800"
                    >
                      Check
                    </button>
                  </form>
                  {serviceability && (
                    <div className="text-[11px] text-slate-600 bg-amber-50/50 p-2 rounded-lg border border-amber-900/5">
                      <p className="font-medium text-amber-950">
                        {serviceability.isServiceable ? '✅ Courier Serviceable' : '❌ Non-serviceable PIN'}
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        {serviceability.codAvailable ? 'Cash on Delivery Available' : 'Prepaid Only'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  onSearch(e.target.value);
                }}
                placeholder="Search Banarasi Silk, Pashmina, Brass Diya..."
                className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-white/80 border border-amber-900/15 rounded-full placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Admin Console Switch */}
            <button
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isAdminOpen
                  ? 'bg-amber-900 text-amber-100 shadow-inner'
                  : 'bg-amber-100/70 text-amber-950 hover:bg-amber-200/80 border border-amber-900/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span className="hidden md:inline">Admin Portal</span>
              {isAdmin && (
                <span className="bg-emerald-600 text-[10px] text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  Admin
                </span>
              )}
            </button>

            {/* User Login / Profile */}
            {currentUser ? (
              <div className="relative group">
                <button className="flex items-center gap-1.5 p-2 rounded-xl hover:bg-amber-900/5 text-slate-700">
                  <div className="w-7 h-7 rounded-full bg-amber-800 text-amber-100 flex items-center justify-center text-xs font-bold">
                    {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                  </div>
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 p-2 bg-white rounded-xl shadow-lg border border-amber-900/10 hidden group-hover:block z-50">
                  <p className="text-xs font-semibold text-slate-800 truncate px-2 py-1">
                    {currentUser.displayName || currentUser.email}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate px-2 pb-2">
                    {currentUser.email}
                  </p>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-amber-900/5 border border-transparent hover:border-amber-900/10 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}

            {/* Shopping Cart Drawer Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-900 text-amber-100 hover:bg-amber-950 transition-transform active:scale-95 shadow-md shadow-amber-950/20 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-amber-200" />
              <span className="font-semibold text-xs">Cart</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-amber-950 text-[11px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected =
              cat === 'All Crafts'
                ? selectedCategory === 'All'
                : selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() =>
                  onSelectCategory(cat === 'All Crafts' ? 'All' : cat)
                }
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-950 text-amber-200 shadow-xs'
                    : 'bg-white/60 hover:bg-white text-slate-700 border border-amber-900/10'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
