"use client";

import Icon from "@/components/ui/Icon";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (
        (i === 2 && currentPage > 3) ||
        (i === totalPages - 1 && currentPage < totalPages - 2)
      ) {
        if (pages[pages.length - 1] !== "...") {
          pages.push("...");
        }
      }
    }
    return pages;
  };

  return (
    <div className="p-4 border-t border-outline-variant flex items-center justify-between text-base text-on-surface-variant bg-surface">
      <p>
        Hiển thị {totalItems > 0 ? startItem : 0} - {endItem} trong số {totalItems} voucher
      </p>

      <div className="flex items-center gap-2">
        {/* Nút Prev */}
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 rounded hover:bg-surface-container-high disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <Icon name="chevron_left" className="w-4 h-4 fill-current" />
        </button>

        {/* Nút Số trang */}
        {renderPageNumbers().map((page, idx) => {
          if (page === "...") {
            return (
              <span key={`dots-${idx}`} className="px-1.5 text-outline">
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isCurrent = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-9 h-9 rounded text-base font-semibold flex items-center justify-center transition-all ${
                isCurrent
                  ? "bg-primary text-on-primary shadow-sm font-bold"
                  : "hover:bg-surface-container-high text-on-surface"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Nút Next */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 rounded hover:bg-surface-container-high disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <Icon name="chevron_right" className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
}
