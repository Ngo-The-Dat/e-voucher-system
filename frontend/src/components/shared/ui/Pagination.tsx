"use client";

import Icon from "@/components/shared/ui/Icon";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemName = "mục",
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
    <nav aria-label="Phân trang" className="p-4 border-t border-outline-variant flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-base text-on-surface-variant bg-surface">
      <p>
        Hiển thị {totalItems > 0 ? startItem : 0} - {endItem} trong số {totalItems} {itemName}
      </p>

      <div className="flex items-center gap-2">
        {/* Nút Prev */}
        <button
          type="button"
          aria-label="Trang trước"
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
              type="button"
              key={pageNum}
              aria-label={`Trang ${pageNum}`}
              aria-current={isCurrent ? "page" : undefined}
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
          type="button"
          aria-label="Trang tiếp theo"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 rounded hover:bg-surface-container-high disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <Icon name="chevron_right" className="w-4 h-4 fill-current" />
        </button>
      </div>
    </nav>
  );
}
