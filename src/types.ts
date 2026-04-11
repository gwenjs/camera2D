import type { EntityId } from '@gwenjs/core'
import type { Vec2 } from '@gwenjs/math'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Use2DCameraOpts {
  viewport?: string
  priority?: number
  zoom?: number
  position?: Vec2
  follow?: EntityId
  lerp?: number
  offset?: Vec2
  bounds?: Rect
}

export interface Camera2DHandle {
  follow(targetId: EntityId, opts?: { lerp?: number; offset?: Vec2 }): void
  setPosition(x: number, y: number): void
  playPath(
    waypoints: Array<{ position: Vec2; zoom?: number; duration: number }>,
    opts?: {
      loop?: boolean
      onComplete?: () => void
      onWaypoint?: (index: number) => void
    },
  ): void
  setZoom(zoom: number): void
  setBounds(rect: Rect): void
  setViewport(viewportId: string): void
  shake(intensity: number): void
  activate(): void
  deactivate(): void
}

export interface ParallaxLayer {
  rendererName: string
  layerName: string
  factor: number
}
