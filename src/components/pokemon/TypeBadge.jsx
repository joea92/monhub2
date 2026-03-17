import React from 'react';
import { Badge } from '@/components/ui/badge';

const TYPE_COLORS = {
  "Grass": "bg-green-100 text-green-800 border-green-200",
  "Fire": "bg-orange-100 text-orange-800 border-orange-200",
  "Water": "bg-blue-100 text-blue-800 border-blue-200",
  "Normal": "bg-gray-100 text-gray-700 border-gray-200",
  "Bug": "bg-lime-100 text-lime-800 border-lime-200",
  "Poison": "bg-purple-100 text-purple-800 border-purple-200",
  "Electric": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Ground": "bg-amber-100 text-amber-800 border-amber-200",
  "Fighting": "bg-red-100 text-red-800 border-red-200",
  "Psychic": "bg-pink-100 text-pink-800 border-pink-200",
  "Rock": "bg-stone-100 text-stone-700 border-stone-200",
  "Ghost": "bg-violet-100 text-violet-800 border-violet-200",
  "Ice": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Dragon": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Dark": "bg-zinc-200 text-zinc-800 border-zinc-300",
  "Steel": "bg-slate-100 text-slate-700 border-slate-200",
  "Fairy": "bg-pink-100 text-pink-700 border-pink-200",
  "Flying": "bg-sky-100 text-sky-800 border-sky-200",
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