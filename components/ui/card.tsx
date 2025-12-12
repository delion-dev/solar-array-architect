
import React from 'react';

type CardVariant = 'default' | 'outline' | 'ghost' | 'alert' | 'success';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean; // 마우스 오버 시 인터랙션 효과 여부
  variant?: CardVariant; // 카드 스타일 변형
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = "", 
  onClick, 
  hoverable = false,
  variant = 'default'
}) => {
  // 기본 스타일
  const baseStyle = "rounded-xl transition-all duration-300";
  
  // 변형(Variant) 스타일 정의
  const variants = {
    default: "bg-white border border-slate-200 shadow-sm",
    outline: "bg-transparent border-2 border-slate-200 border-dashed",
    ghost: "bg-slate-50 border-none shadow-inner",
    alert: "bg-red-50 border border-red-200 shadow-sm",
    success: "bg-green-50 border border-green-200 shadow-sm"
  };

  // 인터랙션 스타일 (Hoverable)
  const hoverStyle = hoverable || onClick 
    ? "hover:shadow-md hover:-translate-y-1 cursor-pointer hover:border-accent/50 active:scale-[0.99]" 
    : "";

  return (
    <div 
      className={`${baseStyle} ${variants[variant]} ${hoverStyle} ${className}`} 
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = "", onClick }) => {
  return (
    <div 
      className={`px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100/80 flex items-center justify-between ${className}`} 
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  return (
    <h3 className={`text-base sm:text-lg font-bold text-slate-800 tracking-tight ${className}`}>
      {children}
    </h3>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <div className={`p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
};
