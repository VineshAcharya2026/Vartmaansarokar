import React from 'react';
import {
  CheckCircle2,
  Copy,
  File,
  FileText,
  FileUp,
  Music2,
  RefreshCw,
  Search,
  Trash2
} from 'lucide-react';
import { formatFileSize, resolveAssetUrl } from '../../utils/app';
import api from '../../lib/api';

export type AdminMediaItem = {
  id: string;
  originalName: string;
  storedName: string;
  url: string;
  kind: 'image' | 'audio' | 'pdf' | 'other';
  mimeType: string;
  size: number;
  createdAt: string;
};

type Props = {
  onSelectForNewsImage?: (item: AdminMediaItem) => void;
  onSelectForMagazineCover?: (item: AdminMediaItem) => void;
  onSelectForMagazinePage?: (item: AdminMediaItem) => void;
  onSelectForMagazinePdf?: (item: AdminMediaItem) => void;
};

const MEDIA_KIND_OPTIONS: Array<'all' | AdminMediaItem['kind']> = ['all', 'image', 'pdf', 'audio', 'other'];

const kindBadgeStyles: Record<AdminMediaItem['kind'], string> = {
  image: 'bg-emerald-100 text-emerald-700',
  pdf: 'bg-red-100 text-red-700',
  audio: 'bg-red-50 text-[#800000]',
  other: 'bg-gray-100 text-gray-700'
};

const getKindLabel = (kind: AdminMediaItem['kind']) => {
  if (kind === 'pdf') return 'PDF';
  if (kind === 'audio') return 'Audio';
  if (kind === 'image') return 'Image';
  return 'File';
};

const MediaManager: React.FC<Props> = ({
  onSelectForNewsImage,
  onSelectForMagazineCover,
  onSelectForMagazinePage,
  onSelectForMagazinePdf
}) => {
  const [media, setMedia] = React.useState<AdminMediaItem[]>([]);
  const [search, setSearch] = React.useState('');
  const [kindFilter, setKindFilter] = React.useState<'all' | AdminMediaItem['kind']>('all');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDeletingId, setIsDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const loadMedia = React.useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (kindFilter !== 'all') params.kind = kindFilter;

      const { data } = await api.get('/api/media', { params });
      setMedia(data?.media ?? []);
    } catch (loadError: any) {
      setError(loadError.response?.data?.error || 'Failed to load media library');
    } finally {
      setIsLoading(false);
    }
  }, [kindFilter, search]);

  React.useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  const validateFile = (file: File) => {
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'File size must be 15MB or smaller.';
    }
    return '';
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post('/api/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (data?.media) {
        setMedia((prev) => [data.media, ...prev.filter((item) => item.id !== data.media.id)]);
        setSuccess(`Uploaded ${data.media.originalName}`);
      }
    } catch (uploadError: any) {
      setError(uploadError.response?.data?.error || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeletingId(id);
    setError('');
    setSuccess('');

    try {
      await api.delete(`/api/media/${id}`);
      setMedia((prev) => prev.filter((item) => item.id !== id));
      setSuccess('Media deleted successfully.');
    } catch (deleteError: any) {
      setError(deleteError.response?.data?.error || 'Failed to delete media');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleCopy = async (item: AdminMediaItem) => {
    try {
      await navigator.clipboard.writeText(resolveAssetUrl(item.url));
      setSuccess(`Copied ${item.originalName} URL`);
    } catch (_error) {
      setError('Could not copy asset URL.');
    }
  };

  const renderPreview = (item: AdminMediaItem) => {
    if (item.kind === 'image') {
      return <img src={resolveAssetUrl(item.url)} alt={item.originalName} className="w-full h-44 object-cover" />;
    }

    const icon = item.kind === 'audio' ? <Music2 size={28} /> : item.kind === 'pdf' ? <FileText size={28} /> : <File size={28} />;
    return (
      <div className="h-44 flex flex-col items-center justify-center gap-3 bg-[#001f3f] text-white">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-[0.26em]">{getKindLabel(item.kind)}</span>
      </div>
    );
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#001f3f] serif">Media Library</h2>
          <p className="text-sm text-gray-500 mt-1">Upload images, PDFs, and audio files, then reuse them directly across articles and magazine publishing.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input ref={inputRef} type="file" className="hidden" onChange={(event) => void handleUpload(event)} />
          <button onClick={() => inputRef.current?.click()} className="bg-[#800000] text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2">
            <FileUp size={16} /> {isUploading ? 'Uploading...' : 'Upload Media'}
          </button>
          <button onClick={() => void loadMedia()} className="bg-gray-100 text-[#001f3f] px-5 py-3 rounded-2xl font-bold flex items-center gap-2">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-5">
        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr,0.8fr] gap-4 items-center">
          <div>
            <p className="text-sm font-bold text-[#001f3f]">Upload guidelines</p>
            <p className="text-sm text-gray-500 mt-1">Supported types: images, PDF, and audio. Maximum file size: 15MB. Uploaded assets are available immediately in the admin panel.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs font-bold text-gray-500 uppercase tracking-widest">
            <div className="rounded-2xl bg-white px-4 py-3 text-center border border-gray-100">Images</div>
            <div className="rounded-2xl bg-white px-4 py-3 text-center border border-gray-100">PDF</div>
            <div className="rounded-2xl bg-white px-4 py-3 text-center border border-gray-100">Audio</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,220px] gap-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search media by file name" className="w-full bg-gray-50 pl-12 pr-4 py-3 rounded-2xl" />
        </div>
        <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as typeof kindFilter)} className="bg-gray-50 px-4 py-3 rounded-2xl">
          {MEDIA_KIND_OPTIONS.map((option) => (
            <option key={option} value={option}>{option === 'all' ? 'All Types' : getKindLabel(option)}</option>
          ))}
        </select>
      </div>

      {(error || success) && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {error || success}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl border border-dashed border-gray-200 p-12 text-center text-gray-500">Loading media library...</div>
      ) : media.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {media.map((item) => (
            <div key={item.id} className="border border-gray-100 rounded-3xl overflow-hidden bg-gray-50 min-w-0">
              {renderPreview(item)}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.22em] ${kindBadgeStyles[item.kind]}`}>
                    {getKindLabel(item.kind)}
                  </span>
                  <span className="text-xs text-gray-400">{formatFileSize(item.size)}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#001f3f] truncate">{item.originalName}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => void handleCopy(item)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm font-bold text-[#001f3f]">
                    <Copy size={14} /> Copy URL
                  </button>
                  <a href={resolveAssetUrl(item.url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl bg-[#001f3f] px-3 py-2 text-sm font-bold text-white">
                    Open Asset
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {item.kind === 'image' && onSelectForNewsImage && (
                    <button onClick={() => onSelectForNewsImage(item)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-[#800000]">Use In Article</button>
                  )}
                  {item.kind === 'image' && onSelectForMagazineCover && (
                    <button onClick={() => onSelectForMagazineCover(item)} className="rounded-xl bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700">Use As Cover</button>
                  )}
                  {item.kind === 'image' && onSelectForMagazinePage && (
                    <button onClick={() => onSelectForMagazinePage(item)} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">Add As Page</button>
                  )}
                  {item.kind === 'pdf' && onSelectForMagazinePdf && (
                    <button onClick={() => onSelectForMagazinePdf(item)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">Attach PDF</button>
                  )}
                </div>
                <button
                  onClick={() => void handleDelete(item.id)}
                  disabled={isDeletingId === item.id}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-[#800000] disabled:opacity-60"
                >
                  <Trash2 size={14} /> {isDeletingId === item.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-gray-200 p-12 text-center text-gray-500">
          No uploaded media yet. Use the upload button to build your reusable media library.
        </div>
      )}

      <div className="rounded-2xl bg-[#001f3f]/5 px-4 py-3 text-sm text-gray-600 flex items-start gap-3">
        <CheckCircle2 size={18} className="mt-0.5 text-[#800000]" />
        <p>Tip: assets uploaded here can be copied as URLs or sent directly into article images, magazine covers, magazine pages, and attached magazine PDFs.</p>
      </div>
    </div>
  );
};

export default MediaManager;
