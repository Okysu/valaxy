import fs from 'fs'
import { resolve } from 'path'
import type { PluginOption } from 'vite'

import matter from 'gray-matter'

import Vue from '@vitejs/plugin-vue'
import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-layouts'
import Components from 'unplugin-vue-components/vite'
import { VitePWA } from 'vite-plugin-pwa'
import VueI18n from '@intlify/vite-plugin-vue-i18n'
import Inspect from 'vite-plugin-inspect'

import type { ResolvedValaxyOptions, ValaxyServerOptions } from '../options'
import type { Mode } from '../vite'
import { render as mdRender } from '../markdown'
import { createMarkdownPlugin, excerpt_separator } from './markdown'
import { createUnocssPlugin } from './unocss'
import { createValaxyPlugin } from '.'

export function ViteValaxyPlugins(options: ResolvedValaxyOptions, serverOptions: ValaxyServerOptions = {}, mode: Mode = 'dev'): (PluginOption | PluginOption[])[] | undefined {
  const { clientRoot, themeRoot, userRoot } = options

  const MarkdownPlugin = createMarkdownPlugin(options)
  const UnocssPlugin = createUnocssPlugin(options)

  const ValaxyPlugin = createValaxyPlugin(options, serverOptions)

  return [
    Vue({
      include: [/\.vue$/, /\.md$/],
    }),

    ValaxyPlugin,
    MarkdownPlugin,

    // https://github.com/hannoeru/vite-plugin-pages
    Pages({
      extensions: ['vue', 'md'],
      dirs: [`${userRoot}/pages`, `${themeRoot}/src/pages`, `${clientRoot}/src/pages`],
      /**
       * we need get frontmatter before route, so write it in Pages.extendRoute
       */
      extendRoute(route) {
        let path = ''
        if (!route.meta) route.meta = {}

        if (fs.existsSync(route.component))
          path = route.component

        // /src/pages
        if (fs.existsSync(clientRoot + route.component))
          path = clientRoot + route.component

        if (route.path === '/')
          route.meta.layout = 'home'

        // set layout for post
        if (route.path.startsWith('/posts/'))
          route.meta.layout = 'post'

        if (path) {
          const md = fs.readFileSync(path, 'utf-8')
          const { data, excerpt } = matter(md, { excerpt_separator })
          route.meta = Object.assign(route.meta, { frontmatter: data, excerpt: excerpt ? mdRender(excerpt) : '' })

          // set layout
          if (data.layout)
            route.meta.layout = data.layout
        }

        return route
      },
    }),

    // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
    Layouts({
      layoutsDirs: [`${userRoot}/layouts`, `${themeRoot}/src/layouts`, `${clientRoot}/src/layouts`],
    }),

    // https://github.com/antfu/unplugin-vue-components
    Components({
      // allow auto load markdown components under `./src/components/`
      extensions: ['vue', 'md'],

      // allow auto import and register components used in markdown
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],

      // allow override
      allowOverrides: true,
      // override: user -> theme -> client
      // latter override former
      dirs: [`${clientRoot}/src/components`, `${themeRoot}/src/components`, `${userRoot}/components`],
    }),

    // https://github.com/antfu/unocss
    // UnocssPlugin,
    UnocssPlugin,

    // https://github.com/antfu/vite-plugin-pwa
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'safari-pinned-tab.svg'],
      manifest: {
        name: 'Theme Yun',
        short_name: 'Yun',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),

    // https://github.com/intlify/bundle-tools/tree/main/packages/vite-plugin-vue-i18n
    VueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      include: [resolve(clientRoot, 'locales/**'), `${options.userRoot}/locales/**`],
    }),

    // https://github.com/antfu/vite-plugin-inspect
    // Visit http://localhost:3333/__inspect/ to see the inspector
    mode === 'dev' && Inspect(),
  ]
}