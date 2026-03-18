import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getTypeColor, getTypeContrastColor } from '@/lib/typeColors';

export default function TypeBadge({ type, size = "sm" }) {
  const types = type.split('/');
  return (
    <div className="flex gap-1 flex-wrap">
      {types.map(t => {
        const bgColor = getTypeColor(t.trim());
        const textColor = getTypeContrastColor(bgColor);
        return (
          <Badge
            key={t}
            style={{
              backgroundColor: bgColor,
              color: textColor,
              borderColor: bgColor,
            }}
            className={`border text-[10px] font-medium px-1.5 py-0 ${size === "lg" ? "text-xs px-2 py-0.5" : ""}`}
          >
            {t.trim()}
          </Badge>
        );
      })}
    </div>
  );
}