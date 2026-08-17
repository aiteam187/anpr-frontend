import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>
      <div
        className="flex w-[560px] flex-col items-center gap-3 rounded-xl bg-white p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 16:9 rather than a taller box — most captures (wide vehicle shots
            or plate close-ups) are landscape, so a taller frame just added
            empty gray space above/below the image instead of framing it. */}
        <div className="flex h-[315px] w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100">
          <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-md border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
