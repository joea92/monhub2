import React, { useState, useMemo } from 'react';
import { calculatePairScore, getCompatLabelColor } from '@/lib/compatibility';
import { getPokemonById } from '@/lib/pokemonData';
import PokemonSilhouette from './PokemonSilhouette';

function getEdgeColor(percentage) {
  if (percentage >= 70) return '#22c55e';  // green
  if (percentage >= 50) return '#06b6d4';  // cyan
  if (percentage >= 30) return '#8b5cf6';  // violet
  return '#f97316';                         // orange
}

function getNodePositions(count, cx, cy, r) {
  if (count === 1) return [{ x: cx, y: cy }];
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

export default function HouseCompatibilityGraph({ memberIds }) {
  const [hoveredPair, setHoveredPair] = useState(null);

  const pokemon = useMemo(
    () => memberIds.map(getPokemonById).filter(Boolean),
    [memberIds.join(',')]
  );

  const pairs = useMemo(() => {
    const result = [];
    for (let i = 0; i < pokemon.length; i++) {
      for (let j = i + 1; j < pokemon.length; j++) {
        const score = calculatePairScore(pokemon[i], pokemon[j]);
        result.push({ a: pokemon[i], b: pokemon[j], score, key: `${pokemon[i].id}-${pokemon[j].id}` });
      }
    }
    return result;
  }, [memberIds.join(',')]);

  if (pokemon.length < 2) return null;

  const W = 260, H = 200;
  const cx = W / 2, cy = H / 2;
  const r = pokemon.length <= 2 ? 60 : 68;
  const nodeSize = 28;
  const positions = getNodePositions(pokemon.length, cx, cy, r);

  const isHovered = (a, b) =>
    hoveredPair && ((hoveredPair.a.id === a.id && hoveredPair.b.id === b.id) ||
                    (hoveredPair.a.id === b.id && hoveredPair.b.id === a.id));

  return (
    <div className="mt-4 pt-4 border-t border-border/50">
      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Compatibility Graph</p>
      <div className="relative flex flex-col items-center">
        <svg width={W} height={H} className="overflow-visible">
          {/* Edges */}
          {pairs.map(({ a, b, score, key }) => {
            const ai = pokemon.indexOf(a);
            const bi = pokemon.indexOf(b);
            const pa = positions[ai];
            const pb = positions[bi];
            const pct = score?.percentage ?? 0;
            const color = getEdgeColor(pct);
            const highlighted = isHovered(a, b);
            const thickness = highlighted ? 4 : Math.max(1.5, (pct / 100) * 4);
            const midX = (pa.x + pb.x) / 2;
            const midY = (pa.y + pb.y) / 2;

            return (
              <g key={key}>
                <line
                  x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke={color}
                  strokeWidth={thickness}
                  strokeOpacity={highlighted ? 1 : 0.6}
                  style={{ transition: 'all 0.15s' }}
                />
                {/* Invisible hit area */}
                <line
                  x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke="transparent"
                  strokeWidth={18}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPair({ a, b, score })}
                  onMouseLeave={() => setHoveredPair(null)}
                />
                {/* Score label */}
                <text
                  x={midX} y={midY - 5}
                  textAnchor="middle"
                  fontSize={9}
                  fill={color}
                  fontWeight="600"
                  pointerEvents="none"
                  style={{ transition: 'opacity 0.15s', opacity: highlighted ? 1 : 0.85 }}
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {pokemon.map((p, i) => {
            const pos = positions[i];
            const halfSize = nodeSize / 2;
            return (
              <g key={p.id} transform={`translate(${pos.x - halfSize},${pos.y - halfSize})`}>
                <rect
                  width={nodeSize} height={nodeSize}
                  rx={6}
                  fill="white"
                  stroke="#e5e7eb"
                  strokeWidth={1.5}
                />
                <foreignObject width={nodeSize} height={nodeSize}>
                  <div className="w-full h-full">
                    <PokemonSilhouette
                      src={p.imageUrl}
                      alt={p.name}
                      primaryType={p.type?.split('/')[0]}
                      className="w-full h-full"
                    />
                  </div>
                </foreignObject>
                <text
                  x={halfSize} y={nodeSize + 11}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#374151"
                  fontWeight="500"
                  pointerEvents="none"
                >
                  {p.name.length > 9 ? p.name.slice(0, 9) + '…' : p.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredPair && (
          <div className="mt-2 w-full bg-muted/40 rounded-xl border border-border/50 p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold">
              <span>{hoveredPair.a.name}</span>
              <span className="text-muted-foreground">↔</span>
              <span>{hoveredPair.b.name}</span>
              <span className={`ml-auto px-2 py-0.5 rounded-md border text-[10px] ${getCompatLabelColor(hoveredPair.score?.label)}`}>
                {hoveredPair.score?.percentage}% · {hoveredPair.score?.label}
              </span>
            </div>
            {hoveredPair.score?.breakdown && (
              <ul className="space-y-0.5 text-muted-foreground">
                {hoveredPair.score.breakdown.habitatMatch && (
                  <li className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                    Same habitat: <span className="font-medium text-foreground">{hoveredPair.a.idealHabitat}</span>
                  </li>
                )}
                {hoveredPair.score.breakdown.specialtyMatch && (
                  <li className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                    Shared specialty: <span className="font-medium text-foreground">{hoveredPair.score.breakdown.sharedSpecialty?.join(', ')}</span>
                  </li>
                )}
                {hoveredPair.score.breakdown.sharedFavourites?.length > 0 && (
                  <li className="flex items-start gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 mt-1" />
                    <span>Shared likes: <span className="font-medium text-foreground">{hoveredPair.score.breakdown.sharedFavourites.join(', ')}</span></span>
                  </li>
                )}
                {!hoveredPair.score.breakdown.habitatMatch && !hoveredPair.score.breakdown.specialtyMatch && !hoveredPair.score.breakdown.sharedFavourites?.length && (
                  <li className="text-muted-foreground">No shared traits</li>
                )}
              </ul>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-3 mt-3 flex-wrap justify-center">
          {[
            { color: '#22c55e', label: 'Excellent (70%+)' },
            { color: '#06b6d4', label: 'Good (50%+)' },
            { color: '#8b5cf6', label: 'Decent (30%+)' },
            { color: '#f97316', label: 'Low' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <div className="w-5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}