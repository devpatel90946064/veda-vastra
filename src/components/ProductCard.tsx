import React from 'react';
import { ShoppingBag, Star, MapPin, Eye } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart, setSelectedProduct, formatINR } = useStore();

  const discountPercent = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-amber-900/10 hover:border-amber-900/30 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Product Image Container */}
      <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Origin State Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-950/80 backdrop-blur-md text-amber-200 text-[11px] font-medium px-2.5 py-1 rounded-full">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span>{product.originState}</span>
        </div>

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-3 right-3 bg-emerald-700 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
            {discountPercent}% OFF
          </div>
        )}

        {/* Quick View Button overlay */}
        <button
          onClick={() => setSelectedProduct(product)}
          className="absolute inset-x-4 bottom-3 py-2 bg-white/95 backdrop-blur-xs text-slate-800 text-xs font-semibold rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 hover:bg-white cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" /> Quick View & Delivery Check
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium text-amber-900">{product.category}</span>
            <div className="flex items-center gap-1 text-amber-600 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{product.rating}</span>
              {product.reviewsCount && (
                <span className="text-slate-400 font-normal">({product.reviewsCount})</span>
              )}
            </div>
          </div>

          <h3
            onClick={() => setSelectedProduct(product)}
            className="font-serif font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 hover:text-amber-850 cursor-pointer mb-2"
          >
            {product.name}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 mb-3 font-light leading-relaxed">
            {product.description}
          </p>
        </div>

        <div>
          {/* Logistics specs (Weight & COD) */}
          <div className="flex items-center justify-between text-[11px] mb-3 pt-2 border-t border-amber-900/5 text-slate-500">
            <span>📦 {product.weightKg} kg parcel</span>
            <span
              className={`font-medium ${
                product.isCodEligible ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              {product.isCodEligible ? 'COD Eligible' : 'Prepaid Only'}
            </span>
          </div>

          {/* Pricing & Add to Cart */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif font-bold text-lg text-slate-900">
                  {formatINR(product.price)}
                </span>
                <span className="text-xs text-slate-400 line-through">
                  {formatINR(product.mrp)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">Inclusive of all taxes</p>
            </div>

            <button
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
                product.stock > 0
                  ? 'bg-amber-900 hover:bg-amber-950 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{product.stock > 0 ? 'Add' : 'Sold Out'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
