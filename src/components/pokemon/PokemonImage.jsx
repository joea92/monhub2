import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Cache signed URLs in memory to avoid repeated API calls
const signedUrlCache = {};

async function resolveImageUrl(url) {
  if (!url) return null;
  // If it's already a public http URL (not a private file_uri), use it directly
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // It's a private file_uri — get a signed URL
  if (signedUrlCache[url]) return signedUrlCache[url];
  const res = await base44.functions.invoke('getSignedImageUrl', { file_uri: url });
  const signed = res.data?.signed_url;
  if (signed) signedUrlCache[url] = signed;
  return signed || null;
}

export default function PokemonImage({ src, alt, className = '' }) {
  const [resolvedSrc, setResolvedSrc] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    setResolvedSrc(null);
    if (!src) return;
    resolveImageUrl(src).then(url => setResolvedSrc(url));
  }, [src]);

  if (hasError || (!resolvedSrc && src)) {
    if (!resolvedSrc) {
      // Still loading
      return (
        <div className={`flex items-center justify-center bg-muted/30 ${className}`} />
      );
    }
    return (
      <div className={`flex items-center justify-center bg-muted/30 text-xs text-muted-foreground ${className}`}>
        ?
      </div>
    );
  }

  if (!resolvedSrc) return null;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading="lazy"
      className={`object-contain ${className}`}
      onError={() => setHasError(true)}
    />
  );
}