import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 48, withText = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
        style={{ 
            width: size, 
            height: size,
            minWidth: size,
        }}
      >
        {/* Using 2.5 stroke width to match the desktop icon file exactly */}
        <UtensilsCrossed size={size * 0.6} strokeWidth={2.5} />
      </div>
      
      {withText && (
        <div className="flex flex-col">
            <span className="font-black text-slate-800 text-xl tracking-tight leading-none">نظام المائدة</span>
            <span className="text-[10px] font-bold text-primary-600 tracking-wider uppercase mt-1">Smart Sales System</span>
        </div>
      )}
    </div>
  );
};

export default Logo;