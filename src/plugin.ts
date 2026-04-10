import { definePlugin } from '@gwenjs/kit'
import type { GwenEngine } from '@gwenjs/core'
import type { Camera2dConfig, Camera2dService } from './types.js'

export const Camera2dPlugin = definePlugin((config: Camera2dConfig = {}) => {
  let service: Camera2dService | null = null

  return {
    name: '@gwenjs/camera2d',

    setup(engine: GwenEngine) {
      // TODO: implement your service
      service = {} as Camera2dService
      engine.provide('camera2d', service)
    },

    teardown() {
      service = null
    },
  }
})
