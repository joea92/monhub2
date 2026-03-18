import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { getTypeColor } from '@/lib/typeColors';

export default function TypeBadge({ type, size = "sm", clickable = false }) {
  const types = type.split('/');
  return (
    <div className="flex gap-1 flex-wrap">
      {types.map(t => {
        const bgColor = getTypeColor(t.trim());
        const badge = (
          <Badge
            key={t}
            style={{
              backgroundColor: bgColor,
              color: '#ffffff',
              borderColor: bgColor,
            }}
            className={`border text-[10px] font-medium px-1.5 py-0 ${size === "lg" ? "text-xs px-2 py-0.5" : ""} ${clickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
          >
            {t.trim()}
          </Badge>
        );
        
        return clickable ? (
          <Link key={t} to={`/PokemonByType?type=${t.trim()}`}>
            {badge}
          </Link>
        ) : badge;
      })}
    </div>
  );
}