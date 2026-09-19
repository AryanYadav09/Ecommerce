/**
 * Generates an optimized image URL for Cloudinary and Unsplash images.
 * Automatically injects WebP/AVIF format auto-negotiation, quality compression,
 * and responsive width transformations to minimize bandwidth and eliminate layout shift.
 */
export const getOptimizedImageUrl = (url, { width = 400, quality = 'auto', format = 'auto' } = {}) => {
  if (!url || typeof url !== 'string') return url;

  // Cloudinary optimization
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (url.includes('/f_auto') || url.includes('/q_auto') || url.includes('/w_')) {
      return url;
    }
    const transformString = `f_${format},q_${quality},w_${width},c_limit`;
    return url.replace('/upload/', `/upload/${transformString}/`);
  }

  // Unsplash optimization
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('q', quality === 'auto' ? '80' : String(quality));
      return parsed.toString();
    } catch {
      return url;
    }
  }

  return url;
};
