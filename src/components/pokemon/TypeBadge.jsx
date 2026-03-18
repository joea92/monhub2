import React from 'react';
import { Badge } from '@/components/ui/badge';

// All types use Pokopia Cyan — consistent with the Pokédex feature colour
const TYPE_COLORS = {
  "Grass":    "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Fire":     "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Water":    "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Normal":   "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Bug":      "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Poison":   "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Electric": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Ground":   "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Fighting": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Psychic":  "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Rock":     "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Ghost":    "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Ice":      "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Dragon":   "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Dark":     "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Steel":    "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Fairy":    "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Flying":   "bg-cyan-100 text-cyan-800 border-cyan-200",
};

function getTypeColor(type) {
  for (const [key, val] of Object.entries(TYPE_COLORS)) {
    if (type.includes(key)) return val;
  }
  return "bg-gray-100 text-gray-700 border-gray-200";
}

export default function TypeBadge({ type, size = "sm" }) {
  const types = type.split('/');
  return (
    <div className="flex gap-1 flex-wrap">
      {types.map(t => (
        <Badge key={t} className={`${getTypeColor(t)} border text-[10px] font-medium px-1.5 py-0 ${size === "lg" ? "text-xs px-2 py-0.5" : ""}`}>
          {t.trim()}
        </Badge>
      ))}
    </div>
  );
}