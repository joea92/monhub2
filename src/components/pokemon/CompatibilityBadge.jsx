import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getCompatLabelColor } from '@/lib/compatibility';

export default function CompatibilityBadge({ result, showScore = true }) {
  if (!result) return null;
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2">
      <Badge className={`${getCompatLabelColor(result.label)} border text-xs font-medium`}>
        {result.label}
      </Badge>
      {showScore && (
        <span className="text-xs text-muted-foreground font-medium">{result.percentage}%</span>
      )}
    </div>
  );
}