export const TYPE_COLORS = {
  "normal": "rgb(168,168,168)",
  "fire": "rgb(240,128,48)",
  "water": "rgb(104,144,240)",
  "electric": "rgb(248,208,48)",
  "grass": "rgb(120,200,80)",
  "ice": "rgb(152,216,216)",
  "fighting": "rgb(192,48,40)",
  "poison": "rgb(160,64,160)",
  "ground": "rgb(224,192,104)",
  "flying": "rgb(168,144,240)",
  "psychic": "rgb(248,88,136)",
  "bug": "rgb(168,184,32)",
  "rock": "rgb(184,160,56)",
  "ghost": "rgb(112,88,152)",
  "dragon": "rgb(112,56,248)",
  "dark": "rgb(112,88,72)",
  "steel": "rgb(184,184,208)",
  "fairy": "rgb(238,153,172)"
};

export function getTypeColor(type) {
  const normalized = (type || '').toLowerCase().trim();
  return TYPE_COLORS[normalized] || TYPE_COLORS['normal'];
}

export function getTypeContrastColor(bgColor) {
  // Simple luminance calculation for text contrast
  const rgb = bgColor.match(/\d+/g);
  if (!rgb || rgb.length < 3) return '#ffffff';
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}