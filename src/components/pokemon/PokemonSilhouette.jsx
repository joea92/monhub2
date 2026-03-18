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

export default function PokemonSilhouette({ src, alt, primaryType, className = '' }) {
  const [resolvedSrc, setResolvedSrc] = useState(null);
  const canvasRef = useRef(null);
  const [silhouetteSrc, setSilhouetteSrc] = useState(null);

  const getTypeColor = () => {
    if (!primaryType) return 'rgb(168,168,168)';
    const color = TYPE_COLORS[primaryType.toLowerCase()];
    return color || 'rgb(168,168,168)';
  };

  useEffect(() => {
    if (!src) return;
    resolveImageUrl(src).then(url => setResolvedSrc(url));
  }, [src]);

  useEffect(() => {
    if (!resolvedSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const typeColor = getTypeColor();
        const rgbMatch = typeColor.match(/\d+/g);
        
        if (!rgbMatch || rgbMatch.length < 3) {
          return;
        }

        const colorR = parseInt(rgbMatch[0], 10);
        const colorG = parseInt(rgbMatch[1], 10);
        const colorB = parseInt(rgbMatch[2], 10);

        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) {
            data[i] = colorR;
            data[i + 1] = colorG;
            data[i + 2] = colorB;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        setSilhouetteSrc(canvas.toDataURL());
      } catch (e) {
        // Silhouette processing failed, keep original
      }
    };
    
    img.onerror = () => {
      // Image load failed
    };
    
    img.src = resolvedSrc;
  }, [resolvedSrc, primaryType]);

  // Display silhouette if available, otherwise show original image
  const displaySrc = silhouetteSrc || resolvedSrc;

  if (!displaySrc) {
    return <div className={`flex items-center justify-center bg-muted/30 ${className}`} />;
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <img
        src={displaySrc}
        alt={alt}
        loading="lazy"
        className={`object-contain ${className}`}
      />
    </>
  );
}