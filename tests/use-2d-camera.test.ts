import { beforeEach, describe, expect, it, vi } from 'vitest'

const runtime = vi.hoisted(() => {
  const cleanupCallbacks: Array<() => void> = []
  const childLogger = {
    error: vi.fn(),
  }
  const engine = {
    createEntity: vi.fn<() => bigint>(),
    addComponent: vi.fn(),
    destroyEntity: vi.fn(),
    logger: {
      child: vi.fn(() => childLogger),
    },
  }
  const viewportManager = {
    get: vi.fn<(viewportId: string) => unknown>(),
  }
  const returnedHandle = { kind: 'camera-handle' }
  const Camera = { name: 'Camera' }
  const FollowTarget = { name: 'FollowTarget' }
  const CameraBounds = { name: 'CameraBounds' }
  const cameraViewportMap = new Map<bigint, string>()

  class CameraViewportNotFoundError extends Error {
    code = 'CAMERA:VIEWPORT_NOT_FOUND' as const
    hint = 'Declare or register the viewport before using it.'
    docsUrl = 'https://gwenengine.dev/docs/camera#viewports'

    constructor(viewportId: string) {
      super(`[GwenCamera] Viewport "${viewportId}" not found.`)
      this.name = 'CameraViewportNotFoundError'
    }
  }

  return {
    cleanupCallbacks,
    childLogger,
    engine,
    viewportManager,
    returnedHandle,
    Camera,
    FollowTarget,
    CameraBounds,
    cameraViewportMap,
    CameraViewportNotFoundError,
    useEngine: vi.fn(() => engine),
    onCleanup: vi.fn((callback: () => void) => {
      cleanupCallbacks.push(callback)
    }),
    useViewportManager: vi.fn(() => viewportManager),
    createCamera2DHandle: vi.fn(() => returnedHandle),
  }
})

vi.mock('@gwenjs/core', () => ({
  useEngine: runtime.useEngine,
  onCleanup: runtime.onCleanup,
}))

vi.mock('@gwenjs/renderer-core', () => ({
  useViewportManager: runtime.useViewportManager,
}))

vi.mock('@gwenjs/camera-core', () => ({
  Camera: runtime.Camera,
  FollowTarget: runtime.FollowTarget,
  CameraBounds: runtime.CameraBounds,
  CameraViewportNotFoundError: runtime.CameraViewportNotFoundError,
  cameraViewportMap: runtime.cameraViewportMap,
}))

vi.mock('../src/camera2d-handle.js', () => ({
  createCamera2DHandle: runtime.createCamera2DHandle,
}))

async function loadSubject() {
  return import('../src/use-2d-camera.js')
}

describe('use2DCamera', () => {
  beforeEach(() => {
    runtime.cleanupCallbacks.length = 0
    runtime.cameraViewportMap.clear()
    runtime.childLogger.error.mockReset()
    runtime.engine.createEntity.mockReset()
    runtime.engine.addComponent.mockReset()
    runtime.engine.destroyEntity.mockReset()
    runtime.engine.logger.child.mockClear()
    runtime.viewportManager.get.mockReset()
    runtime.useEngine.mockClear()
    runtime.onCleanup.mockClear()
    runtime.useViewportManager.mockClear()
    runtime.createCamera2DHandle.mockClear()

    runtime.engine.createEntity.mockReturnValue(101n)
    runtime.engine.destroyEntity.mockReturnValue(true)
    runtime.viewportManager.get.mockImplementation((viewportId: string) => ({ id: viewportId }))
  })

  it('creates a camera entity with orthographic defaults and returns the camera handle', async () => {
    const { use2DCamera } = await loadSubject()

    const handle = use2DCamera()

    expect(runtime.useEngine).toHaveBeenCalledTimes(1)
    expect(runtime.useViewportManager).toHaveBeenCalledTimes(1)
    expect(runtime.engine.createEntity).toHaveBeenCalledTimes(1)
    expect(runtime.engine.addComponent).toHaveBeenCalledWith(101n, runtime.Camera, {
      active: 1,
      priority: 0,
      projectionType: 0,
      x: 0,
      y: 0,
      z: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      zoom: 1,
      fov: 1,
      near: -1,
      far: 1,
    })
    expect(runtime.cameraViewportMap.get(101n)).toBe('main')
    expect(runtime.engine.logger.child).toHaveBeenCalledWith('camera2d:handle')
    expect(runtime.createCamera2DHandle).toHaveBeenCalledWith(101n, runtime.engine, runtime.childLogger)
    expect(handle).toBe(runtime.returnedHandle)
  })

  it('applies viewport, zoom, position, priority, follow, and bounds options', async () => {
    const { use2DCamera } = await loadSubject()

    use2DCamera({
      viewport: 'hud',
      priority: 4,
      zoom: 2.5,
      position: { x: 12, y: 34 },
      follow: 202n,
      lerp: 0.25,
      offset: { x: 8, y: -3 },
      bounds: { x: 5, y: 6, width: 7, height: 8 },
    })

    expect(runtime.engine.addComponent).toHaveBeenCalledWith(101n, runtime.Camera, {
      active: 1,
      priority: 4,
      projectionType: 0,
      x: 12,
      y: 34,
      z: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      zoom: 2.5,
      fov: 1,
      near: -1,
      far: 1,
    })
    expect(runtime.engine.addComponent).toHaveBeenCalledWith(101n, runtime.FollowTarget, {
      entityId: 202n,
      lerp: 0.25,
      offsetX: 8,
      offsetY: -3,
      offsetZ: 0,
    })
    expect(runtime.engine.addComponent).toHaveBeenCalledWith(101n, runtime.CameraBounds, {
      minX: 5,
      minY: 6,
      minZ: 0,
      maxX: 12,
      maxY: 14,
      maxZ: 0,
    })
    expect(runtime.cameraViewportMap.get(101n)).toBe('hud')
  })

  it('throws when the requested viewport does not exist', async () => {
    const { use2DCamera } = await loadSubject()
    runtime.viewportManager.get.mockImplementation(() => undefined)

    expect(() => use2DCamera({ viewport: 'missing' })).toThrow(runtime.CameraViewportNotFoundError)
    expect(runtime.childLogger.error).toHaveBeenCalledWith(
      '[GwenCamera] Viewport "missing" not found.',
      expect.objectContaining({
        code: 'CAMERA:VIEWPORT_NOT_FOUND',
      }),
    )
    expect(runtime.engine.createEntity).not.toHaveBeenCalled()
    expect(runtime.createCamera2DHandle).not.toHaveBeenCalled()
  })

  it('registers cleanup that removes the viewport mapping and destroys the entity', async () => {
    const { use2DCamera } = await loadSubject()

    use2DCamera()

    expect(runtime.cleanupCallbacks).toHaveLength(1)

    runtime.cleanupCallbacks[0]?.()

    expect(runtime.cameraViewportMap.has(101n)).toBe(false)
    expect(runtime.engine.destroyEntity).toHaveBeenCalledWith(101n)
  })
})
