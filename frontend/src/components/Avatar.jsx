import { useState } from 'react';

// Choose your style: 'bottts' | 'adventurer' | 'micah' | 'pixel-art' | 'big-ears'
const AVATAR_STYLE = 'bottts';

// Dark, masculine gradient per role
const ROLE_GRADIENT = {
  admin: 'from-slate-700 via-slate-800 to-slate-900',
  inventory_manager: 'from-teal-700 via-cyan-800 to-slate-900',
  sales_manager: 'from-emerald-700 via-teal-800 to-slate-900',
  purchase_manager: 'from-violet-700 via-purple-800 to-slate-900',
  analyst: 'from-blue-700 via-indigo-800 to-slate-900',
};

const SIZE = {
  sm: { box: 'h-8 w-8',  ring: 'p-[2px]',   dot: 'h-2 w-2' },
  md: { box: 'h-10 w-10', ring: 'p-[2.5px]', dot: 'h-2.5 w-2.5' },
  lg: { box: 'h-12 w-12', ring: 'p-[3px]',   dot: 'h-3 w-3' },
  xl: { box: 'h-16 w-16', ring: 'p-[3px]',   dot: 'h-3.5 w-3.5' },
};

export default function Avatar({
  name = '',
  email = '',
  role = 'analyst',
  size = 'md',
  showStatus = true,
  isOnline = true,
}) {
  const [imgError, setImgError] = useState(false);

  // Seed: use email if available, otherwise name. Ensures unique avatar per user.
  const seed = encodeURIComponent(email || name || 'guest');

  const avatarUrl = `https://api.dicebear.com/7.x/${AVATAR_STYLE}/svg?seed=${seed}&backgroundColor=transparent&radius=50`;

  const sizeConf = SIZE[size] || SIZE.md;
  const gradient = ROLE_GRADIENT[role] || ROLE_GRADIENT.analyst;

  const initialsText =
    name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  return (
    <div className="relative inline-block group">
      {/* Gradient ring (dark, masculine) */}
      <div
        className={`relative ${sizeConf.box} rounded-full bg-gradient-to-br ${gradient} ${sizeConf.ring} shadow-md transition-transform duration-200 group-hover:scale-105`}
      >
        {/* Avatar inner */}
        <div className="relative h-full w-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center">
          {!imgError ? (
            <img
              src={avatarUrl}
              alt={name}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <span className="text-xs font-bold text-white tracking-wide">
              {initialsText}
            </span>
          )}
        </div>
      </div>

      {/* Online status dot */}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 ${sizeConf.dot} rounded-full ring-2 ring-slate-900 ${
            isOnline ? 'bg-emerald-400' : 'bg-slate-500'
          }`}
        >
          {isOnline && (
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50" />
          )}
        </span>
      )}
    </div>
  );
}