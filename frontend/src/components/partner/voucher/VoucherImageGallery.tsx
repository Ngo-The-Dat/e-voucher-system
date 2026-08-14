"use client";

import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { GripVertical, ImagePlus, Star, Trash2 } from "lucide-react";
import { useRef } from "react";

export type GalleryUploadStatus = "pending" | "uploading" | "uploaded" | "error";

export interface GalleryImageItem {
  id: string;
  url: string;
  name: string;
  size?: number;
  isPrimary: boolean;
  sortOrder: number;
  file?: File;
  status?: GalleryUploadStatus;
  error?: string;
}

interface VoucherImageGalleryProps {
  items: GalleryImageItem[];
  editable: boolean;
  busy?: boolean;
  onFilesAdded?: (files: File[]) => void;
  onRemove?: (id: string) => void;
  onSetPrimary?: (id: string) => void;
  onReorder?: (items: GalleryImageItem[]) => void;
}

const formatFileSize = (bytes?: number) => {
  if (bytes === undefined) return null;
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

function SortableImageCard({
  item,
  index,
  editable,
  busy,
  onRemove,
  onSetPrimary,
}: {
  item: GalleryImageItem;
  index: number;
  editable: boolean;
  busy: boolean;
  onRemove?: (id: string) => void;
  onSetPrimary?: (id: string) => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: item.id,
    index,
    disabled: !editable || busy,
  });

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-xl border bg-surface shadow-sm transition-opacity ${
        item.isPrimary ? "border-primary ring-2 ring-primary/20" : "border-outline-variant"
      } ${isDragging ? "opacity-60" : "opacity-100"}`}
    >
      <div className="relative aspect-[4/3] bg-surface-container-low">
        {/* blob: preview URLs cannot be rendered by next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt={item.name} className="h-full w-full object-cover" />

        {item.isPrimary && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs font-bold text-on-primary shadow">
            <Star className="h-3.5 w-3.5 fill-current" /> Ảnh chính
          </span>
        )}

        {editable && (
          <button
            ref={handleRef}
            type="button"
            disabled={busy}
            aria-label={`Kéo để sắp xếp ${item.name}`}
            title="Kéo để sắp xếp"
            className="absolute right-2 top-2 flex h-9 w-9 touch-none items-center justify-center rounded-lg bg-black/65 text-white shadow hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GripVertical className="h-5 w-5" />
          </button>
        )}

        {item.status === "uploading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-bold text-white">
            Đang tải lên...
          </div>
        )}
        {item.status === "error" && (
          <div className="absolute inset-x-0 bottom-0 bg-error/90 px-2 py-1.5 text-xs font-semibold text-on-error">
            {item.error || "Upload thất bại"}
          </div>
        )}
      </div>

      <div className="space-y-2 p-3">
        <div>
          <p className="truncate text-sm font-semibold text-on-surface" title={item.name}>{item.name}</p>
          {item.size !== undefined && (
            <p className="text-xs text-on-surface-variant">{formatFileSize(item.size)}</p>
          )}
        </div>
        {editable && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || item.isPrimary}
              onClick={() => onSetPrimary?.(item.id)}
              className="flex-1 rounded-lg border border-outline-variant px-2 py-1.5 text-xs font-bold text-on-surface hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
            >
              Đặt làm ảnh chính
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onRemove?.(item.id)}
              aria-label={`Xóa ${item.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-error hover:bg-error-container/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VoucherImageGallery({
  items,
  editable,
  busy = false,
  onFilesAdded,
  onRemove,
  onSetPrimary,
  onReorder,
}: VoucherImageGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="space-y-4 rounded-xl border border-outline-variant bg-surface-bright p-6 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-outline-variant/40 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Hình ảnh voucher</h3>
          <p className="text-sm text-on-surface-variant">
            JPEG, PNG hoặc WebP, tối đa 5 MB mỗi ảnh. Kéo biểu tượng để đổi thứ tự.
          </p>
        </div>
        {editable && (
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length > 0) onFilesAdded?.(files);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-on-primary shadow-sm hover:bg-surface-tint disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImagePlus className="h-5 w-5" /> Chọn ảnh
            </button>
          </>
        )}
      </div>

      {items.length === 0 ? (
        <button
          type="button"
          disabled={!editable || busy}
          onClick={() => inputRef.current?.click()}
          className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low px-6 text-center text-on-surface-variant hover:border-primary hover:text-primary disabled:cursor-default disabled:hover:border-outline-variant disabled:hover:text-on-surface-variant"
        >
          <ImagePlus className="h-9 w-9" />
          <span className="font-semibold">{editable ? "Chọn ảnh cho voucher" : "Voucher chưa có hình ảnh"}</span>
          {editable && <span className="text-xs">Có thể chọn nhiều ảnh cùng lúc</span>}
        </button>
      ) : (
        <DragDropProvider
          onDragEnd={(event) => {
            if (event.canceled || !editable || busy) return;
            const reorderedIds = move(items.map((item) => item.id), event);
            const byId = new Map(items.map((item) => [item.id, item]));
            const reordered = reorderedIds
              .map((id, index) => {
                const item = byId.get(String(id));
                return item ? { ...item, sortOrder: index } : null;
              })
              .filter((item): item is GalleryImageItem => item !== null);
            if (reordered.some((item, index) => item.id !== items[index]?.id)) {
              onReorder?.(reordered);
            }
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <SortableImageCard
                key={item.id}
                item={item}
                index={index}
                editable={editable}
                busy={busy}
                onRemove={onRemove}
                onSetPrimary={onSetPrimary}
              />
            ))}
          </div>
        </DragDropProvider>
      )}
    </section>
  );
}

