import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'DeepFinery Docs',
  tagline: 'Rule distillation & AI for finance',
  favicon: 'img/favicon.ico',
  future: {
    v4: true
  },
  url: 'https://deepfinery.com',
  baseUrl: '/docs/',
  organizationName: 'deepfinery',
  projectName: 'rule-finery',
  onBrokenLinks: 'throw',
  i18n: {
    defaultLocale: 'en',
    locales: ['en']
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts'
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css'
        }
      } satisfies Preset.Options
    ]
  ],
  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            from: ['/','/docs','/docs/'],
            to: '/docs/intro'
          }
        ]
      }
    ]
  ],
  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true
    },
    navbar: {
      title: 'DeepFinery Docs',
      logo: {
        alt: 'DeepFinery Logo',
        src: 'img/logo.svg'
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs'
        },
        {
          href: 'https://github.com/deepfinery/rule-finery',
          label: 'GitHub',
          position: 'right'
        }
      ]
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Docs home',
              to: '/docs/intro'
            }
          ]
        },
        {
          title: 'More',
          items: [
            {
              label: 'Rule-Finery (GitHub)',
              href: 'https://github.com/deepfinery/rule-finery'
            }
          ]
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} DeepFinery. Built with Docusaurus.`
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula
    }
  } satisfies Preset.ThemeConfig
};

export default config;
