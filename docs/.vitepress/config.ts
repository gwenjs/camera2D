import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Camera2d',
  description: 'Camera2d — GWEN plugin',

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
        ],
      },
      {
        text: 'API',
        items: [
          { text: 'Reference', link: '/api/' },
        ],
      },
      {
        text: 'Examples',
        items: [
          { text: 'Basic Usage', link: '/examples/' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/gwenjs/camera2D' },
    ],
  },
})
