/**
 * Build-time module for @gwenjs/camera2d.
 *
 * Add to gwen.config.ts:
 *   modules: ['@gwenjs/camera2d']
 *
 * IMPORTANT: This file must never import from './index.js'.
 * Always import from './plugin.js' or './types.js' directly.
 */

import { defineGwenModule, definePluginTypes } from '@gwenjs/kit'
import type { Camera2dConfig } from './types'

export default defineGwenModule<Camera2dConfig>({
  meta: { name: '@gwenjs/camera2d' },
  defaults: {},
  async setup(options, kit) {
    // Direct import from plugin.ts — never from index.ts
    const { Camera2dPlugin } = await import('./plugin')

    kit.addPlugin(Camera2dPlugin(options))

    kit.addAutoImports([
      { name: 'useCamera2d', from: '@gwenjs/camera2d' },
    ])

    kit.addTypeTemplate({
      filename: 'camera2d.d.ts',
      getContents: () =>
        definePluginTypes({
          imports: ["import type { Camera2dService } from '@gwenjs/camera2d'"],
          provides: { 'camera2d': 'Camera2dService' },
        }),
    })
  },
})
