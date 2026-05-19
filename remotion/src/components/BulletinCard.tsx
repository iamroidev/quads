import React from 'react';
import { C } from '../tokens';

interface BulletinCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  offset?: number;
  borderWidth?: number;
  dark?: boolean;
}

export const BulletinCard: React.FC<BulletinCardProps> = ({
  children,
  style,
  offset = 5,
  borderWidth = 2,
  dark = false,
}) => {
  const surface = dark ? '#1a1a1a' : C.surface;
  const border  = dark ? '#333333' : C.border;
  const shadow  = dark ? '#000000' : C.shadow;

  return (
    <div style={{ position: 'relative', ...style }}>
      {/* Hard shadow layer */}
      <div style={{
        position: 'absolute',
        top:    offset,
        left:   offset,
        right:  -offset,
        bottom: -offset,
        backgroundColor: shadow,
      }} />
      {/* Card surface */}
      <div style={{
        position: 'relative',
        backgroundColor: surface,
        border: `${borderWidth}px solid ${border}`,
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
};
