// lib/utils/image-compression.ts

/**
 * Compress an image from a URL and return a blob URL
 * @param imageUrl - The original image URL
 * @param quality - Compression quality (0.1 to 1, default 0.7)
 * @param maxWidth - Max width in pixels (default 1200)
 * @param maxHeight - Max height in pixels (default 1200)
 */
export async function compressImage(
  imageUrl: string,
  quality: number = 0.7,
  maxWidth: number = 1200,
  maxHeight: number = 1200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob URL with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const blobUrl = URL.createObjectURL(blob);
              resolve(blobUrl);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/webp', // Use WebP for better compression
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };

    img.src = imageUrl;
  });
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
  imageUrls: string[],
  quality?: number,
  maxWidth?: number,
  maxHeight?: number
): Promise<string[]> {
  return Promise.all(
    imageUrls.map((url) => compressImage(url, quality, maxWidth, maxHeight))
  );
}

/**
 * Get a compressed image with fallback to original
 */
export async function getCompressedImageUrl(
  imageUrl: string,
  quality: number = 0.7,
  maxWidth: number = 1200,
  maxHeight: number = 1200
): Promise<string> {
  try {
    return await compressImage(imageUrl, quality, maxWidth, maxHeight);
  } catch (error) {
    console.warn(`Failed to compress image ${imageUrl}, using original:`, error);
    return imageUrl; // Fallback to original if compression fails
  }
}

/**
 * Create a data URL with compression (for smaller images)
 */
export async function compressImageToDataUrl(
  imageUrl: string,
  quality: number = 0.7,
  maxWidth: number = 1200,
  maxHeight: number = 1200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/webp', quality));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };

    img.src = imageUrl;
  });
}