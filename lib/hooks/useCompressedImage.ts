// lib/hooks/useCompressedImage.ts
import { useState, useEffect } from 'react';
import { getCompressedImageUrl } from '@/lib/utils/image-compression';

interface UseCompressedImageOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Hook to load and compress an image
 * Returns { src, loading, error }
 */
export function useCompressedImage(
  imageUrl: string | null | undefined,
  options: UseCompressedImageOptions = {}
) {
  const [src, setSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { quality = 0.7, maxWidth = 1200, maxHeight = 1200 } = options;

  useEffect(() => {
    if (!imageUrl) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadImage = async () => {
      try {
        const compressedUrl = await getCompressedImageUrl(
          imageUrl,
          quality,
          maxWidth,
          maxHeight
        );

        if (isMounted) {
          setSrc(compressedUrl);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error('Image compression error:', errorMessage);
          setError(errorMessage);
          // Fallback to original URL on error
          setSrc(imageUrl);
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [imageUrl, quality, maxWidth, maxHeight]);

  return { src, loading, error };
}