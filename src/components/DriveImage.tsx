import { useState } from 'react';
import { getDriveFallbackUrls } from '@/utils/imageUtils';

const FINAL_FALLBACK = 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=800';

interface DriveImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Componente de imagen que prueba múltiples URLs de Google Drive en cascada.
 * Si todas fallan, muestra una imagen de alta calidad de Unsplash como respaldo.
 */
const DriveImage = ({ src, alt, className = '', style }: DriveImageProps) => {
  const urls = src ? getDriveFallbackUrls(src) : [];
  const [urlIndex, setUrlIndex] = useState(0);

  const currentSrc = urls[urlIndex] ?? FINAL_FALLBACK;

  const handleError = () => {
    if (urlIndex < urls.length - 1) {
      setUrlIndex(prev => prev + 1);
    } else {
      // All drive URLs failed — use Unsplash fallback
      const img = document.querySelector(`img[data-src-key="${src}"]`) as HTMLImageElement;
      if (img) img.src = FINAL_FALLBACK;
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      data-src-key={src}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default DriveImage;
