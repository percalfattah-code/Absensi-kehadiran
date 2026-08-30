import React from 'react';
import { Star, ShieldCheck, Flame, Sparkles, Crown, Users, Heart, Zap } from 'lucide-react';

interface AppLogoProps {
  logoIcon?: string;
  logoUrl?: string;
  className?: string;
  iconClassName?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  logoIcon = 'star',
  logoUrl,
  className = 'w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-purple-950 flex items-center justify-center font-bold shrink-0 shadow-[0_4px_0_0_#92400e,0_8px_15px_rgba(245,158,11,0.4)] border border-amber-200/60',
  iconClassName = 'w-5 h-5 sm:w-6 sm:h-6 fill-purple-950 text-purple-950',
}) => {
  if (logoUrl) {
    return (
      <div className={`${className} overflow-hidden p-0.5 bg-violet-950 border-amber-400/80`}>
        <img
          src={logoUrl}
          alt="Logo Aplikasi"
          className="w-full h-full object-cover rounded-xl"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  const renderIcon = () => {
    switch (logoIcon) {
      case 'shield':
        return <ShieldCheck className={iconClassName} />;
      case 'flame':
        return <Flame className={iconClassName} />;
      case 'sparkles':
        return <Sparkles className={iconClassName} />;
      case 'crown':
        return <Crown className={iconClassName} />;
      case 'users':
        return <Users className={iconClassName} />;
      case 'heart':
        return <Heart className={iconClassName} />;
      case 'zap':
        return <Zap className={iconClassName} />;
      case 'star':
      default:
        return <Star className={iconClassName} />;
    }
  };

  return <div className={className}>{renderIcon()}</div>;
};
