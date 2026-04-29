import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { MediaItem } from '../vartmaan-shared-types';
import { resolveAssetUrl } from '../utils/app';

type MediaApiResponse = {
  media?: MediaItem[];
  meta?: { page?: number; pageSize?: number; total?: number; totalPages?: number };
};

const PAGE_SIZE = 100;

export default function MediaGallery() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/media', { params: { kind: 'image', page: nextPage, pageSize: PAGE_SIZE } });
      const payload = data as MediaApiResponse;
      setItems(payload.media ?? []);
      setPage(payload.meta?.page ?? nextPage);
      setTotalPages(payload.meta?.totalPages ?? 1);
      setTotal(payload.meta?.total ?? (payload.media?.length ?? 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-[#001f3f] serif">Media Gallery</h1>
        <p className="text-xs font-semibold text-gray-500">{total} images</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500 text-sm font-semibold">Loading images...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500 text-sm font-semibold">No images available.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 min-w-[1660px] xl:min-w-0">
              {items.map((item) => (
                <div key={item.id} className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-[166px]">
                  <div className="w-[150px] h-[150px] bg-gray-50 rounded-xl overflow-hidden relative mb-2">
                    <img
                      src={resolveAssetUrl(item.url)}
                      alt={item.originalName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = 'none';
                        const parent = el.parentElement;
                        if (!parent || parent.querySelector('[data-img-fallback]')) return;
                        const fallback = document.createElement('div');
                        fallback.setAttribute('data-img-fallback', '1');
                        fallback.className = 'absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100';
                        fallback.textContent = 'Missing Image';
                        parent.appendChild(fallback);
                      }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 truncate px-1">{item.originalName}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500 font-semibold">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => void load(Math.max(1, page - 1))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => void load(page + 1)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
