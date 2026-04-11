import { beforeEach, describe, expect, it, vi } from 'vitest'

const runtime = vi.hoisted(() => {
  const afterUpdateCallbacks: Array<(deltaMs: number) => void> = []
  const cameraManager = {
    get: vi.fn<(viewportId: string) => unknown>(),
    set: vi.fn<(viewportId: string, state: unknown) => void>(),
  }

  return {
    afterUpdateCallbacks,
    cameraManager,
    onAfterUpdate: vi.fn((callback: (deltaMs: number) => void) => {
      afterUpdateCallbacks.push(callback)
    }),
    useCameraManager: vi.fn(() => cameraManager),
  }
})

vi.mock('@gwenjs/core', () => ({
  onAfterUpdate: runtime.onAfterUpdate,
}))

vi.mock('@gwenjs/renderer-core', () => ({
  useCameraManager: runtime.useCameraManager,
}))

async function loadSubject() {
  return import('../src/pixel-perfect.js')
}

describe('pixel-perfect runtime', () => {
  beforeEach(() => {
    runtime.afterUpdateCallbacks.length = 0
    runtime.cameraManager.get.mockReset()
    runtime.cameraManager.set.mockReset()
    runtime.onAfterUpdate.mockClear()
    runtime.useCameraManager.mockClear()
  })

  it('snapCameraToPixels rounds x and y while preserving z and metadata', async () => {
    const { snapCameraToPixels } = await loadSubject()

    const state = {
      worldTransform: {
        position: { x: 12.4, y: -3.6, z: 9.25 },
        rotation: { x: 1, y: 2, z: 3 },
      },
      projection: { type: 'orthographic', zoom: 2, near: -1, far: 1 },
      viewportId: 'hud',
      active: true,
      priority: 7,
      custom: { preserved: true },
    }

    const snapped = snapCameraToPixels(state)

    expect(snapped).not.toBe(state)
    expect(snapped.worldTransform).not.toBe(state.worldTransform)
    expect(snapped.worldTransform.position).toEqual({ x: 12, y: -4, z: 9.25 })
    expect(snapped.worldTransform.rotation).toBe(state.worldTransform.rotation)
    expect(snapped.projection).toBe(state.projection)
    expect(snapped.priority).toBe(7)
    expect(snapped.active).toBe(true)
    expect(snapped.viewportId).toBe('hud')
    expect(snapped.custom).toBe(state.custom)
  })

  it('usePixelPerfect registers an after-update callback', async () => {
    const { usePixelPerfect } = await loadSubject()

    usePixelPerfect()

    expect(runtime.useCameraManager).toHaveBeenCalledTimes(1)
    expect(runtime.onAfterUpdate).toHaveBeenCalledTimes(1)
    expect(runtime.afterUpdateCallbacks).toHaveLength(1)
  })

  it('snaps the active camera state for the viewport on each after-update callback', async () => {
    const { usePixelPerfect } = await loadSubject()
    const state = {
      worldTransform: {
        position: { x: 8.8, y: 15.2, z: 5 },
        rotation: { x: 0, y: 0, z: 0.5 },
      },
      projection: { type: 'orthographic', zoom: 1.5, near: -1, far: 1 },
      viewportId: 'hud',
      active: true,
      priority: 3,
    }
    runtime.cameraManager.get.mockReturnValue(state)

    usePixelPerfect('hud')
    runtime.afterUpdateCallbacks[0]?.(16)

    expect(runtime.cameraManager.get).toHaveBeenCalledWith('hud')
    expect(runtime.cameraManager.set).toHaveBeenCalledWith('hud', {
      ...state,
      worldTransform: {
        ...state.worldTransform,
        position: { x: 9, y: 15, z: 5 },
      },
    })
  })

  it('ignores missing camera state', async () => {
    const { usePixelPerfect } = await loadSubject()
    runtime.cameraManager.get.mockReturnValue(undefined)

    usePixelPerfect('hud')
    runtime.afterUpdateCallbacks[0]?.(16)

    expect(runtime.cameraManager.get).toHaveBeenCalledWith('hud')
    expect(runtime.cameraManager.set).not.toHaveBeenCalled()
  })

  it('ignores inactive camera state', async () => {
    const { usePixelPerfect } = await loadSubject()
    runtime.cameraManager.get.mockReturnValue({
      worldTransform: {
        position: { x: 1.2, y: 2.6, z: 3 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      projection: { type: 'orthographic', zoom: 1, near: -1, far: 1 },
      viewportId: 'hud',
      active: false,
      priority: 0,
    })

    usePixelPerfect('hud')
    runtime.afterUpdateCallbacks[0]?.(16)

    expect(runtime.cameraManager.get).toHaveBeenCalledWith('hud')
    expect(runtime.cameraManager.set).not.toHaveBeenCalled()
  })
})
