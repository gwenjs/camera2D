import * as core from '@gwenjs/core'
import * as rendererCore from '@gwenjs/renderer-core'

export interface CameraState {
  worldTransform: {
    position: {
      x: number
      y: number
      z: number
    }
    rotation: {
      x: number
      y: number
      z: number
    }
  }
  projection: unknown
  viewportId: string
  active: boolean
  priority: number
  [key: string]: unknown
}

type CameraManagerLike = {
  get: (viewportId: string) => CameraState | undefined
  set: (viewportId: string, state: CameraState) => void
}

type RendererCoreWithCameraManager = typeof rendererCore & {
  useCameraManager: () => CameraManagerLike
}

type CoreWithAfterUpdate = typeof core & {
  onAfterUpdate: (callback: (deltaMs: number) => void) => void
}

export function snapCameraToPixels(state: CameraState): CameraState {
  return {
    ...state,
    worldTransform: {
      ...state.worldTransform,
      position: {
        ...state.worldTransform.position,
        x: Math.round(state.worldTransform.position.x),
        y: Math.round(state.worldTransform.position.y),
      },
    },
  }
}

export function usePixelPerfect(viewportId = 'main'): void {
  const cameraManager = (rendererCore as RendererCoreWithCameraManager).useCameraManager()

  ;(core as CoreWithAfterUpdate).onAfterUpdate(() => {
    const state = cameraManager.get(viewportId)

    if (!state || !state.active) {
      return
    }

    cameraManager.set(viewportId, snapCameraToPixels(state))
  })
}
