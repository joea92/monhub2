import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { TYPE_COLORS } from '@/lib/typeColors';

// Cache signed URLs so we only call the backend once per URI
const signedUrlCache = {};
// Cache processed silhouette data URLs so canvas work is done once per src+type
const silhouetteCache = {};
// Track in-flight signed URL requests to avoid duplicate calls
const pendingSignedUrls = {};

async function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (signedUrlCache[url]) return signedUrlCache[url];
  if (pendingSignedUrls[url]) return pendingSignedUrls[url];

  pendingSignedUrls[url] = base44.functions.invoke('getSignedImageUrl', { file_uri: url })
    .then(res => {
      const signed = res.data?.signed_url;
      if (signed) signedUrlCache[url] = signed;
      delete pendingSignedUrls[url];
      return signed || null;
    });

  return pendingSignedUrls[url];
}

function getTypeColor(primaryType) {
  if (!primaryType) return 'rgb(168,168,168)';
  return TYPE_COLORS[primaryType.toLowerCase()] || 'rgb(168,168,168)';
}

function buildSilhouette(resolvedSrc, primaryType) {
  const cacheKey = `${resolvedSrc}__${primaryType}`;
  if (silhouetteCache[cacheKey]) return Promise.resolve(silhouetteCache[cacheKey]);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const typeColor = getTypeColor(primaryType);
        const rgbMatch = typeColor.match(/\d+/g);
        if (!rgbMatch || rgbMatch.length < 3) { resolve(null); return; }

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
        const dataUrl = canvas.toDataURL();
        silhouetteCache[cacheKey] = dataUrl;
        resolve(dataUrl);
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = resolvedSrc;
  });
}

export default function PokemonSilhouette({ src, alt, primaryType, className = '' }) {
  const [silhouetteSrc, setSilhouetteSrc] = useState(() => {
    // Synchronously return cached result if available
    if (!src) return null;
    const cacheKey = `${src}__${primaryType}`;
    return silhouetteCache[cacheKey] || null;
  });

  useEffect(() => {
    if (!src) return;
    const cacheKey = `${src}__${primaryType}`;
    if (silhouetteCache[cacheKey]) {
      setSilhouetteSrc(silhouetteCache[cacheKey]);
      return;
    }

    let cancelled = false;
    resolveImageUrl(src).then(resolved => {
      if (!resolved || cancelled) return;
      return buildSilhouette(resolved, primaryType);
    }).then(dataUrl => {
      if (!cancelled && dataUrl) setSilhouetteSrc(dataUrl);
    });

    return () => { cancelled = true; };
  }, [src, primaryType]);

  if (!silhouetteSrc) {
    return <div className={`bg-muted/30 ${className}`} />;
  }

  return (
    <img
      src={silhouetteSrc}
      alt={alt}
      loading="lazy"
      className={`object-contain ${className}`}
    />
  );
}