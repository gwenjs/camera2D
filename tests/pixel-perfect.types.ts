import type { CameraState } from '@gwenjs/renderer-core'

import { snapCameraToPixels } from '../src/pixel-perfect'

const state: CameraState = {
  worldTransform: {
    position: { x: 12.4, y: -3.6, z: 9.25 },
    rotation: { x: 1, y: 2, z: 3 },
  },
  projection: { type: 'orthographic', zoom: 2, near: -1, far: 1 },
  viewportId: 'hud',
  active: true,
  priority: 7,
}

const snapped: CameraState = snapCameraToPixels(state)

void snapped
