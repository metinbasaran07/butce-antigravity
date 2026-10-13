import React from 'react';
import {
  ShoppingCart,
  Home,
  Zap,
  Car,
  Utensils,
  Film,
  HeartPulse,
  BookOpen,
  ShoppingBag,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Key,
  PlusCircle,
  ShieldCheck,
  Palmtree,
  Coffee,
  Dumbbell,
  Plane,
  Gift,
  Wallet,
  Tag,
  PiggyBank,
  HelpCircle,
} from 'lucide-react';

interface Props {
  name: string;
  className?: string;
}

export const CategoryIcon: React.FC<Props> = ({ name, className = 'w-4 h-4' }) => {
  switch (name) {
    case 'shopping-cart':
      return <ShoppingCart className={className} />;
    case 'home':
      return <Home className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'car':
      return <Car className={className} />;
    case 'utensils':
      return <Utensils className={className} />;
    case 'film':
      return <Film className={className} />;
    case 'heart-pulse':
      return <HeartPulse className={className} />;
    case 'book-open':
      return <BookOpen className={className} />;
    case 'shopping-bag':
      return <ShoppingBag className={className} />;
    case 'more-horizontal':
      return <MoreHorizontal className={className} />;
    case 'briefcase':
      return <Briefcase className={className} />;
    case 'laptop':
      return <Laptop className={className} />;
    case 'trending-up':
      return <TrendingUp className={className} />;
    case 'key':
      return <Key className={className} />;
    case 'plus-circle':
      return <PlusCircle className={className} />;
    case 'shield-check':
      return <ShieldCheck className={className} />;
    case 'palmtree':
      return <Palmtree className={className} />;
    case 'coffee':
      return <Coffee className={className} />;
    case 'dumbbell':
      return <Dumbbell className={className} />;
    case 'plane':
      return <Plane className={className} />;
    case 'gift':
      return <Gift className={className} />;
    case 'wallet':
      return <Wallet className={className} />;
    case 'piggy-bank':
      return <PiggyBank className={className} />;
    case 'tag':
      return <Tag className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
};
