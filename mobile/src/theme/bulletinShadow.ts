export function getBulletinShadow(width: number) {
  if (width < 640)  return { offset: 3, border: 2 };  // mobile
  if (width < 1024) return { offset: 5, border: 3 };  // tablet
  return              { offset: 6, border: 3 };        // desktop
}