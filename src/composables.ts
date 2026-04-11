import { useEngine, GwenPluginNotFoundError } from '@gwenjs/core'
import type { Camera2dService } from './types'
import './augment'

/**
 * Returns the Camera2d service registered by Camera2dPlugin.
 *
 * @throws {GwenPluginNotFoundError} If Camera2dPlugin is not registered.
 */
export function useCamera2d(): Camera2dService {
  const engine = useEngine()
  const camera2d = engine.tryInject('camera2d')
  if (camera2d) return camera2d
  throw new GwenPluginNotFoundError({
    pluginName: '@gwenjs/camera2d',
    hint: "Add '@gwenjs/camera2d' to modules in gwen.config.ts",
    docsUrl: 'https://gwenengine.dev/camera2D/guide/getting-started',
  })
}
