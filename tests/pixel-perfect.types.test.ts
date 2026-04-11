import type { CameraState } from '@gwenjs/renderer-core'
import { expectTypeOf, test } from 'vitest'

import { snapCameraToPixels } from '../src/pixel-perfect'

test('snapCameraToPixels preserves CameraState compatibility', () => {
  const state = {
    worldTransform: {
      position: { x: 12.4, y: -3.6, z: 9.25 },
      rotation: { x: 1, y: 2, z: 3 },
    },
    projection: { type: 'orthographic', zoom: 2, near: -1, far: 1 },
    viewportId: 'hud',
    active: true,
    priority: 7,
  } satisfies CameraState

  const snapped = snapCameraToPixels(state)

  expectTypeOf(snapped).toMatchTypeOf<CameraState>()
})
