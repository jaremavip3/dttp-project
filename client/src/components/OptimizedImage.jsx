import Image from 'next/image';
import { memo } from 'react';

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'blur',
  blurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGBkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  loading = 'lazy',
  ...props
}) {
  // Generate optimized blur data URL based on dimensions
  const getBlurDataURL = (w, h) => {
    if (blurDataURL !== 'blur') return blurDataURL;
    
    const canvas = typeof window !== 'undefined' && document.createElement('canvas');
    if (!canvas) return blurDataURL;
    
    canvas.width = w || 10;
    canvas.height = h || 10;
    const ctx = canvas.getContext('2d');
    
    // Create a simple gradient for blur effect
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL();
  };

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      placeholder={placeholder === 'blur' ? 'blur' : placeholder}
      blurDataURL={placeholder === 'blur' ? getBlurDataURL(width, height) : undefined}
      sizes={sizes}
      quality={quality}
      loading={priority ? 'eager' : loading}
      {...props}
      style={{
        objectFit: 'cover',
        ...props.style,
      }}
    />
  );
});

export default OptimizedImage;
