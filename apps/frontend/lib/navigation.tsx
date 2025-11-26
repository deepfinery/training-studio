import type { LucideIcon } from 'lucide-react';
import {
  BookText,
  BrainCircuit,
  Building2,
  CloudDownload,
  CreditCard,
  FolderKanban,
  GaugeCircle,
  KeyRound,
  LayoutDashboard,
  Layers3,
  Rocket,
  Settings,
  ShieldCheck,
  TableProperties,
  UserRound,
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
      { title: 'Training Results', href: '/training/results', icon: CloudDownload },
      { title: 'Serve & Reinforce', href: '/deploy', icon: Rocket, badge: 'soon' }
    ]
  },
  {
    title: 'Operations',
    children: [
      { title: 'Billing', href: '/billing', icon: CreditCard },
      { title: 'Credits', href: '/credits', icon: GaugeCircle },
      { title: 'Datasets API', href: '/ingestions', icon: Layers3, badge: 'soon' }
    ]
  },
  {
    title: 'Profile',
    children: [
      { title: 'Profile', href: '/profile', icon: UserRound },
      { title: 'Settings', href: '/settings', icon: Settings },
      { title: 'Password', href: '/profile#security', icon: ShieldCheck },
      { title: 'Tokens', href: '/profile#tokens', icon: KeyRound },
      { title: 'Users', href: '/users', icon: UsersRound },
      { title: 'Organization', href: '/settings#organization', icon: Building2 }
    ]
  }
];
