"use client";

import { Trash2, Ticket, X, Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CartItem } from "@/hooks/useCustomerCart";
import Image from "next/image";

interface CartItemListProps {
  cart: CartItem[];
  selectedItems: Record<string, boolean>;
  toggleItem: (id: string) => void;
  toggleSelectAll: () => void;
  deleteSelected: () => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, qty: number) => void;
}

export default function CartItemList({
  cart,
  selectedItems,
  toggleItem,
  toggleSelectAll,
  deleteSelected,
  removeFromCart,
  updateCartQuantity,
}: CartItemListProps) {
  const selectAllChecked = cart.length > 0 && cart.every((item) => selectedItems[item.voucher.id]);

  return (
    <div className="lg:col-span-8 flex flex-col gap-4">
      {/* Header Control */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="selectAll"
            checked={selectAllChecked}
            onChange={toggleSelectAll}
            className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
          />
          <label
            htmlFor="selectAll"
            className="font-label-md text-label-md text-on-surface cursor-pointer select-none font-semibold"
          >
            Chọn tất cả ({cart.length} sản phẩm)
          </label>
        </div>
        <button
          onClick={deleteSelected}
          className="font-label-md text-label-md text-error hover:text-on-error-container transition-colors flex items-center gap-1 cursor-pointer font-bold"
        >
          <Trash2 className="w-4 h-4" />
          Xóa đã chọn
        </button>
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-4">
        {cart.map((item) => {
          const voucher = item.voucher;
          const isChecked = !!selectedItems[voucher.id];
          const stock = item.availableStock ?? voucher.availableStock;
          const isOutOfStock = stock !== undefined && stock <= 0;
          const isAtMaxStock = stock !== undefined && item.quantity >= stock;

          return (
            <div
              key={voucher.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] transition-shadow duration-300 relative group"
            >
              {/* Checkbox */}
              <div className="pt-2 sm:pt-0 pl-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleItem(voucher.id)}
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                />
              </div>
              {/* Image */}
              <div className="w-full sm:w-32 h-24 rounded-md overflow-hidden shrink-0 border border-outline-variant/50">
                <Image
                  width={128}
                  height={96}
                  src={voucher.thumbnail || voucher.images?.[0] || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80"}
                  alt={voucher.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Content details */}
              <div className="flex-grow flex flex-col justify-between h-full w-full">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-title-md text-title-md text-on-surface line-clamp-2 leading-tight">
                      {voucher.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5" />
                        {voucher.category}
                      </p>
                      {stock !== undefined && (
                        <span className={`text-xs ${isOutOfStock ? "text-error font-bold" : "text-on-surface-variant font-medium"}`}>
                          {isOutOfStock ? "(Đã hết hàng)" : `(Còn ${stock})`}
                        </span>
                      )}
                    </div>
                    {item.selectedDate && (
                      <p className="text-xs text-text-muted mt-1">
                        Ngày sử dụng: {item.selectedDate}
                      </p>
                    )}
                  </div>
                  {/* Delete single button */}
                  <button
                    onClick={() => removeFromCart(voucher.id)}
                    className="text-outline hover:text-error transition-colors p-1 rounded-full hover:bg-error-container/20 cursor-pointer flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-end justify-between mt-4">
                  {/* Pricing */}
                  <div>
                    {voucher.originalPrice && (
                      <div className="font-label-sm text-label-sm text-on-surface-variant line-through">
                        {formatCurrency(voucher.originalPrice)}
                      </div>
                    )}
                    <div className="font-title-md text-title-md font-bold text-primary">
                      {formatCurrency(voucher.price)}
                    </div>
                  </div>
                  {/* Quantity controls */}
                  <div className="flex items-center bg-surface-container rounded-md border border-outline-variant h-9">
                    <button
                      onClick={() => updateCartQuantity(voucher.id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || isOutOfStock}
                      aria-label="Decrease quantity"
                      className="w-9 h-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors rounded-l-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-on-surface-variant"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      aria-label="Quantity"
                      type="number"
                      min="1"
                      max={stock !== undefined ? stock : undefined}
                      disabled={isOutOfStock}
                      value={isOutOfStock ? 0 : item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (isNaN(val) || val < 1) {
                          updateCartQuantity(voucher.id, 1);
                        } else if (stock !== undefined && val > stock) {
                          updateCartQuantity(voucher.id, stock);
                        } else {
                          updateCartQuantity(voucher.id, val);
                        }
                      }}
                      className="w-12 h-full text-center border-none bg-transparent font-label-md text-label-md text-on-surface p-0 focus:ring-0 no-spinner disabled:text-outline disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={() => updateCartQuantity(voucher.id, item.quantity + 1)}
                      disabled={isOutOfStock || isAtMaxStock}
                      aria-label="Increase quantity"
                      className="w-9 h-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors rounded-r-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-on-surface-variant"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
