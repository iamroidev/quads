import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: { url: string; publicId?: string }[];
  alt?: string;
  className?: string;
}

export default function ImageCarousel({ images, alt = 'Product', className = '' }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const count = images.length;
  if (count === 0) return null;

  const next = () => setCurrent(i => (i + 1) % count);
  const prev = () => setCurrent(i => (i - 1 + count) % count);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
  };

  return (
    <div className={`relative overflow-hidden ${className}`} ref={containerRef}>
      {/* Main image */}
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((img, i) => (
          <img
            key={i}
            src={img.url}
            alt={`${alt} ${i + 1}`}
            className="w-full h-full object-contain flex-shrink-0"
            style={{ minWidth: '100%' }}
            draggable={false}
          />
        ))}
      </div>

      {/* Arrow buttons */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors z-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors z-10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 border-2 border-black transition-all ${
                i === current ? 'bg-[#ff6b6b] scale-125' : 'bg-white'
              }`}
            />
          ))}
        </div>
      )}

      {/* Counter badge */}
      {count > 1 && (
        <div className="absolute top-3 right-3 bg-black text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest z-10">
          {current + 1}/{count}
        </div>
      )}
    </div>
  );
}
