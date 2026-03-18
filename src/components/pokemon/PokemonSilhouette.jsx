import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { TYPE_COLORS } from '@/lib/typeColors';

// Cache signed URLs in memory to avoid repeated API calls
const signedUrlCache = {};

async function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (signedUrlCache[url]) return signedUrlCache[url];
  const res = await base44.functions.invoke('getSignedImageUrl', { file_uri: url });
  const signed = res.data?.signed_url;
  if (signed) signedUrlCache[url] = signed;
  return signed || null;
}

function rgbToString(rgb) {
  if (typeof rgb === 'string') return rgb;
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export default function PokemonSilhouette({ src, alt, primaryType, className = '' }) {
  const [resolvedSrc, setResolvedSrc] = useState(null);
  const [hasError, setHasError] = useState(false);
  const canvasRef = useRef(null);
  const [silhouetteSrc, setSilhouetteSrc] = useState(null);

  // Get color from type
  const getTypeColor = () => {
    if (!primaryType) return 'rgb(168,168,168)'; // Default neutral grey
    const color = TYPE_COLORS[primaryType.toLowerCase()];
    return color || 'rgb(168,168,168)';
  };

  useEffect(() => {
    setHasError(false);
    setResolvedSrc(null);
    setSilhouetteSrc(null);
    if (!src) return;
    resolveImageUrl(src).then(url => setResolvedSrc(url));
  }, [src]);

  // Process image and create silhouette
  useEffect(() => {
    if (!resolvedSrc || !canvasRef.current) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Parse type color
        const typeColor = getTypeColor();
        const rgbMatch = typeColor.match(/\d+/g);
        
        if (!rgbMatch || rgbMatch.length < 3) {
          // Fallback to normal grey
          const fallback = [168, 168, 168];
          setSilhouetteSrc(img.src);
          return;
        }

        const colorR = parseInt(rgbMatch[0], 10);
        const colorG = parseInt(rgbMatch[1], 10);
        const colorB = parseInt(rgbMatch[2], 10);

        // Replace all non-transparent pixels with solid color while preserving alpha
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          // If pixel has any opacity, make it solid color
          if (alpha > 0) {
            data[i] = colorR;       // R
            data[i + 1] = colorG;   // G
            data[i + 2] = colorB;   // B
            // Keep original alpha (data[i + 3])
          }
        }

        ctx.putImageData(imageData, 0, 0);
        setSilhouetteSrc(canvas.toDataURL());
      } catch (e) {
        // If canvas processing fails, fall back to original image
        setSilhouetteSrc(img.src);
      }
    };
    img.onerror = () => setHasError(true);
    img.src = resolvedSrc;
  }, [resolvedSrc, primaryType]);

  if (hasError || (!silhouetteSrc && src)) {
    if (!silhouetteSrc && resolvedSrc) {
      // Still processing
      return <div className={`flex items-center justify-center bg-muted/30 ${className}`} />;
    }
    return (
      <div className={`flex items-center justify-center bg-muted/30 text-xs text-muted-foreground ${className}`}>
        ?
      </div>
    );
  }

  if (!silhouetteSrc) return null;

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <img
        src={silhouetteSrc}
        alt={alt}
        loading="lazy"
        className={`object-contain ${className}`}
        onError={() => setHasError(true)}
      />
    </>
  );
}