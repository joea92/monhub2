import React, { useState, useEffect } from 'react';
import { usePokemonImages } from '@/hooks/usePokemonImages';

export default function PokemonImage({ src, alt, className = '' }) {
  const { getImageUrl } = usePokemonImages();
  const resolvedSrc = getImageUrl(alt, src);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset loading state when src changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [resolvedSrc]);

  return (
    <div className={`relative overflow-hidden bg-muted/30 ${className}`}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground font-medium">
          <span>?</span>
        </div>
      )}
      <img
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        className={`w-full h-full object-contain ${isLoading || hasError ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          // If hosted URL failed, fall back to original src
          if (resolvedSrc !== src && src) {
            setIsLoading(false);
            setHasError(false);
          } else {
            setIsLoading(false);
            setHasError(true);
          }
        }}
      />
    </div>
  );
}