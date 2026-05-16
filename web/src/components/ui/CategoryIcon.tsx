import React from 'react';
import { 
  BookOpen, 
  Smartphone, 
  Utensils, 
  Shirt, 
  Briefcase, 
  Home, 
  PenTool, 
  Dumbbell, 
  Package,
  LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  'smartphone': Smartphone,
  'utensils': Utensils,
  'shirt': Shirt,
  'briefcase': Briefcase,
  'home': Home,
  'pen-tool': PenTool,
  'dumbbell': Dumbbell,
  'package': Package,
};

interface CategoryIconProps {
  name: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = "h-8 w-8" }) => {
  const Icon = iconMap[name] || Package;
  return <Icon className={className} strokeWidth={2.5} />;
};
