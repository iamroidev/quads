import React from 'react';
import { BulletinCard } from './BulletinCard';
import { C } from '../tokens';

interface ProductCardProps {
  title: string;
  price: number;
  condition: string;
  category: string;
  color: string;
  width: number;
  dark?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  title, price, condition, category, color, width, dark = false,
}) => {
  const textCol  = dark ? '#F0F0F0' : C.text;
  const mutedCol = dark ? '#9A9A9A' : C.muted;
  const surface  = dark ? '#1a1a1a' : C.surface;
  const h = width * 0.85;

  return (
    <BulletinCard style={{ width, flexShrink: 0 }} offset={4} borderWidth={2} dark={dark}>
      {/* Image placeholder — color block */}
      <div style={{
        width,
        height: h,
        backgroundColor: color,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Category icon-letter */}
        <span style={{
          fontSize: width * 0.22,
          fontWeight: 900,
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'sans-serif',
        }}>{category[0].toUpperCase()}</span>

        {/* Condition badge */}
        <div style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          backgroundColor: C.accent,
          border: '1.5px solid ' + (dark ? '#000' : C.border),
          padding: '3px 8px',
        }}>
          <span style={{
            fontSize: width * 0.07,
            fontWeight: 900,
            color: '#fff',
            textTransform: 'uppercase',
            fontFamily: 'sans-serif',
            letterSpacing: 0.5,
          }}>{condition}</span>
        </div>
      </div>

      {/* Info */}
      <div style={{
        padding: `${width * 0.09}px ${width * 0.1}px`,
        backgroundColor: surface,
      }}>
        <div style={{
          fontSize: width * 0.1,
          fontWeight: 900,
          color: textCol,
          textTransform: 'uppercase',
          letterSpacing: -0.3,
          fontFamily: 'sans-serif',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>{title}</div>
        <div style={{
          marginTop: 4,
          fontSize: width * 0.12,
          fontWeight: 900,
          color: C.accent,
          fontFamily: 'sans-serif',
        }}>GHS {price}</div>
        <div style={{
          fontSize: width * 0.075,
          color: mutedCol,
          marginTop: 3,
          fontFamily: 'sans-serif',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>{category}</div>
      </div>
    </BulletinCard>
  );
};
