/**
 * Declaration merging — types engine.inject('camera2d') as Camera2dService.
 * Activated as a side-effect when importing from '@gwenjs/camera2d'.
 */

import type { Camera2dService } from './types.js'

declare module '@gwenjs/core' {
  interface GwenProvides {
    'camera2d': Camera2dService
  }
}

export {}
