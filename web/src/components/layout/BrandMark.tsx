import React from 'react';

interface BrandMarkProps {
  className?: string;
}

const BrandMark: React.FC<BrandMarkProps> = ({ className = 'h-10 w-10' }) => {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Industrial Stamped Frame */}
      <rect x="4" y="4" width="56" height="56" stroke="currentColor" strokeWidth="6" />
      {/* Bold Stencil Q */}
      <path d="M18 18H46V46H18V18ZM26 26V38H38V26H26Z" fill="currentColor" fillRule="evenodd" />
      <rect x="42" y="42" width="12" height="6" fill="currentColor" transform="rotate(45 42 42)" />
      {/* Red Thumbtack Detail */}
      <circle cx="52" cy="12" r="4" fill="#ff6b6b" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
};

export default BrandMark;
