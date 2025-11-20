import type { LucideIcon } from 'lucide-react';
import {
  BadgeDollarSign,
  BookText,
  BrainCircuit,
  CreditCard,
  GaugeCircle,
  Layers3,
  LayoutDashboard,
  Rocket,
  Settings,
  Sparkles,
  UsersRound
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const primaryNav: NavSection[] = [
  {
    title: 'Workspace',
    items: [
      { title: 'Dashboard', href: '/', icon: LayoutDashboard },
      { title: 'Workflows', href: '/workflows', icon: BookText },
      { title: 'Training Hub', href: '/training', icon: BrainCircuit, badge: 'live' },
      { title: 'Serve & Reinforce', href: '/deploy', icon: Rocket }
    ]
  },
  {
    title: 'Operations',
    items: [
      { title: 'Users', href: '/users', icon: UsersRound },
      { title: 'Billing', href: '/billing', icon: CreditCard },
      { title: 'Credits', href: '/credits', icon: GaugeCircle },
      { title: 'Settings', href: '/settings', icon: Settings }
    ]
  }
];

export const quickActions = [
  { title: 'Create dataset', icon: Layers3 },
  { title: 'Distill rules', icon: Sparkles },
  { title: 'Request credits', icon: BadgeDollarSign }
];
