import React, { useState } from 'react';
import type { User } from '../../types';

interface AvatarProps {
  user?: Partial<User>;
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  status?: 'active' | 'away' | 'offline';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  user,
  name: explicitName,
  src: explicitSrc,
  size = 'md',
  showStatus = false,
  status: explicitStatus,
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  const name = explicitName || user?.name || 'User';
  const src = explicitSrc || user?.avatar;
  const status = explicitStatus || user?.status || 'active';

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-16 h-16 text-lg'
  };

  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5 ring-1',
    sm: 'w-2 h-2 ring-1.5',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-3.5 h-3.5 ring-2'
  };

  const statusColors = {
    active: 'bg-emerald-500',
    away: 'bg-amber-500',
    offline: 'bg-slate-400'
  };

  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className={`relative inline-flex shrink-0 select-none ${className}`}>
      {src && !imgError ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgError(true)}
          className={`${sizeClasses[size]} rounded-full object-cover border border-slate-200/80`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-slate-200 text-slate-700 font-semibold flex items-center justify-center border border-slate-300/80`}
        >
          {getInitials(name)}
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-white ${statusSizeClasses[size]} ${statusColors[status]}`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};

export const AvatarGroup: React.FC<{
  users: User[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}> = ({ users, max = 3, size = 'sm', className = '' }) => {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className={`flex items-center -space-x-2 overflow-hidden ${className}`}>
      {visibleUsers.map((user) => (
        <Avatar
          key={user.id}
          user={user}
          size={size}
          className="ring-2 ring-white hover:z-10 transition-transform"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={`relative inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-medium border-2 border-white text-xs ${
            size === 'xs' ? 'w-6 h-6 text-[10px]' : size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'
          }`}
          title={`${remainingCount} more members`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};
