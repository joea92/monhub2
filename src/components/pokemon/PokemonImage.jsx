import React, { useState } from 'react';

export default function PokemonImage({ src, alt, className = '' }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-muted/30 ${className}`}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground font-medium">
          <span>Image unavailable</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`w-full h-full object-contain ${isLoading || hasError ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}