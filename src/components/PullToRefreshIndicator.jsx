import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function PullToRefreshIndicator({ isRefreshing, pulledDistance }) {
  const threshold = 80;
  const progress = Math.min(pulledDistance / threshold, 1);
  const rotation = progress * 180;

  return (
    <div
      className="flex justify-center items-center overflow-hidden transition-all"
      style={{
        height: Math.max(0, pulledDistance),
        opacity: Math.min(progress, 1),
      }}
    >
      <RefreshCw
        className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
        style={{ transform: !isRefreshing ? `rotate(${rotation}deg)` : undefined }}
      />
    </div>
  );
}