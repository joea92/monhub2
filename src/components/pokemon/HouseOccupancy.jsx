import React from 'react';
import { Users } from 'lucide-react';

export default function HouseOccupancy({ count, max = 4 }) {
  const isFull = count >= max;
  return (
    <div className={`flex items-center gap-1.5 text-sm font-medium ${isFull ? 'text-red-600' : 'text-muted-foreground'}`}>
      <Users className="w-4 h-4" />
      <span>{count} / {max}</span>
      {isFull && <span className="text-xs">(Full)</span>}
    </div>
  );
}