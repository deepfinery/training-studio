import type { LucideIcon } from 'lucide-react';
import {
  BookText,
  BrainCircuit,
  CreditCard,
  FolderKanban,
  GaugeCircle,
  LayoutDashboard,
  Layers3,
  Rocket,
  Settings,
  TableProperties,
  UsersRound
} from 'lucide-react';

export interface NavNode {
  title: string;
  href?: string;
  icon?: LucideIcon;
  badge?: string;
  children?: NavNode[];
}

export const navTree: NavNode[] = [
  {
    title: 'Workspace',
    children: [
      { title: 'Overview', href: '/', icon: LayoutDashboard },
      { title: 'Projects', href: '/projects', icon: FolderKanban },
      { title: 'Datasets', href: '/data', icon: TableProperties },
      { title: 'Workflows', href: '/workflows', icon: BookText },
      { title: 'Training Hub', href: '/training', icon: BrainCircuit, badge: 'live' },
      { title: 'Serve & Reinforce', href: '/deploy', icon: Rocket }
    ]
  },
  {
    title: 'Operations',
    children: [
      { title: 'Users', href: '/users', icon: UsersRound },
      { title: 'Billing', href: '/billing', icon: CreditCard },
      { title: 'Credits', href: '/credits', icon: GaugeCircle },
      { title: 'Datasets API', href: '/ingestions', icon: Layers3 },
      { title: 'Settings', href: '/settings', icon: Settings }
    ]
  }
];
