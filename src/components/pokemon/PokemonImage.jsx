import React, { useState, useEffect } from 'react';

export default function PokemonImage({ src, alt, className = '' }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 text-xs text-muted-foreground ${className}`}>
        ?
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`object-contain ${className}`}
      onError={() => setHasError(true)}
    />
  );
}