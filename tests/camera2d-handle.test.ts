import type { CameraWaypoint } from '@gwenjs/camera-core'
import type { EntityId } from '@gwenjs/core'
import {
  Camera,
  CameraBounds,
  CameraEmptyPathError,
  CameraPath,
  CameraShake,
  CameraViewportNotFoundError,
  FollowTarget,
  cameraPathStore,
  cameraViewportMap,
} from '@gwenjs/camera-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCamera2DHandle } from '../src/camera2d-handle.js'

vi.mock('@gwenjs/camera-core', () => {
  const createComponent = <T extends string>(name: T) => ({ name })

  class MockCameraViewportNotFoundError extends Error {
    code = 'CAMERA:VIEWPORT_NOT_FOUND' as const
    hint = 'Declare or register the viewport before using it.'
    docsUrl = 'https://gwenengine.dev/docs/camera#viewports'

    constructor(viewportId: string) {
      super(`[GwenCamera] Viewport "${viewportId}" not found.`)
      this.name = 'CameraViewportNotFoundError'
    }
  }

  class MockCameraEmptyPathError extends Error {
    code = 'CAMERA:EMPTY_PATH' as const
    hint = 'Provide a non-empty waypoints array to playPath().'
    docsUrl = 'https://gwenengine.dev/docs/camera#playPath'

    constructor() {
      super('[GwenCamera] playPath() requires at least one waypoint.')
      this.name = 'CameraEmptyPathError'
    }
  }

  return {
    Camera: createComponent('Camera'),
    FollowTarget: createComponent('FollowTarget'),
    CameraBounds: createComponent('CameraBounds'),
    CameraShake: createComponent('CameraShake'),
    CameraPath: createComponent('CameraPath'),
    cameraPathStore: new Map<bigint, unknown>(),
    cameraViewportMap: new Map<bigint, string>(),
    CameraViewportNotFoundError: MockCameraViewportNotFoundError,
    CameraEmptyPathError: MockCameraEmptyPathError,
  }
})

type ComponentDef = { name: string }
type MockViewportManager = {
  get?: (viewportId: string) => unknown
  has?: (viewportId: string) => boolean
}
type MockEngine = {
  addComponent(id: EntityId, def: ComponentDef, data: Record<string, unknown>): void
  getComponent<T>(id: EntityId, def: ComponentDef): T | undefined
  hasComponent(id: EntityId, def: ComponentDef): boolean
  removeComponent(id: EntityId, def: ComponentDef): boolean
  inject(key: 'viewportManager'): MockViewportManager
}

function createMockEngine(viewportManager: MockViewportManager = { get: () => undefined }): MockEngine {
  const components = new Map<string, Map<EntityId, Record<string, unknown>>>()

  return {
    addComponent(id, def, data) {
      const byEntity = components.get(def.name) ?? new Map<EntityId, Record<string, unknown>>()
      const current = byEntity.get(id) ?? {}
      byEntity.set(id, { ...current, ...data })
      components.set(def.name, byEntity)
    },
    getComponent(id, def) {
      return components.get(def.name)?.get(id) as never
    },
    hasComponent(id, def) {
      return components.get(def.name)?.has(id) ?? false
    },
    removeComponent(id, def) {
      return components.get(def.name)?.delete(id) ?? false
    },
    inject() {
      return viewportManager
    },
  }
}

function seedCamera(engine: MockEngine, id: EntityId) {
  engine.addComponent(id, Camera, {
    active: 0,
    priority: 0,
    x: 0,
    y: 0,
    z: 0,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    projectionType: 0,
    zoom: 1,
    fov: 0,
    near: 0,
    far: 0,
  })
}

describe('createCamera2DHandle', () => {
  const cameraId = 1n as EntityId
  const targetId = 2n as EntityId
  const log = {
    error: vi.fn(),
  }

  beforeEach(() => {
    cameraPathStore.clear()
    cameraViewportMap.clear()
    log.error.mockReset()
  })

  it('follow() defaults lerp to 0.1 and clears active camera paths', () => {
    const engine = createMockEngine()
    seedCamera(engine, cameraId)
    engine.addComponent(cameraId, CameraPath, { index: 3, progress: 0.5 })
    cameraPathStore.set(cameraId, {
      waypoints: [{ position: { x: 1, y: 2, z: 0 }, duration: 1 }],
      opts: {},
      elapsed: 0.25,
    })

    const handle = createCamera2DHandle(cameraId, engine as never, log as never)

    handle.follow(targetId, { offset: { x: 8, y: -3 } })

    expect(engine.getComponent(cameraId, FollowTarget)).toEqual({
      entityId: targetId,
      lerp: 0.1,
      offsetX: 8,
      offsetY: -3,
      offsetZ: 0,
    })
    expect(engine.hasComponent(cameraId, CameraPath)).toBe(false)
    expect(cameraPathStore.has(cameraId)).toBe(false)
  })

  it('setPosition() clears follow/path behavior and updates the camera position', () => {
    const engine = createMockEngine()
    seedCamera(engine, cameraId)
    engine.addComponent(cameraId, FollowTarget, { entityId: targetId, lerp: 1, offsetX: 0, offsetY: 0, offsetZ: 0 })
    engine.addComponent(cameraId, CameraPath, { index: 1, progress: 0.2 })
    cameraPathStore.set(cameraId, {
      waypoints: [{ position: { x: 1, y: 2, z: 0 }, duration: 1 }],
      opts: {},
      elapsed: 0.25,
    })

    const handle = createCamera2DHandle(cameraId, engine as never, log as never)

    handle.setPosition(12, 34)

    expect(engine.hasComponent(cameraId, FollowTarget)).toBe(false)
    expect(engine.hasComponent(cameraId, CameraPath)).toBe(false)
    expect(cameraPathStore.has(cameraId)).toBe(false)
    expect(engine.getComponent(cameraId, Camera)).toMatchObject({ x: 12, y: 34 })
  })

  it('playPath() throws and logs when called with an empty path', () => {
    const engine = createMockEngine()
    seedCamera(engine, cameraId)
    const handle = createCamera2DHandle(cameraId, engine as never, log as never)

    expect(() => handle.playPath([])).toThrow(CameraEmptyPathError)
    expect(log.error).toHaveBeenCalledTimes(1)
    expect(log.error.mock.calls[0]?.[0]).toContain('playPath() requires at least one waypoint')
  })

  it('playPath() stores path data, adds CameraPath, and removes FollowTarget', () => {
    const engine = createMockEngine()
    seedCamera(engine, cameraId)
    engine.addComponent(cameraId, FollowTarget, { entityId: targetId, lerp: 1, offsetX: 0, offsetY: 0, offsetZ: 0 })

    const handle = createCamera2DHandle(cameraId, engine as never, log as never)
    const waypoints: CameraWaypoint[] = [
      { position: { x: 10, y: 20, z: 0 }, duration: 1 },
      { position: { x: 30, y: 40, z: 0 }, duration: 2, zoom: 2 },
    ]
    const opts = { loop: true }

    handle.playPath(waypoints, opts)

    expect(engine.hasComponent(cameraId, FollowTarget)).toBe(false)
    expect(engine.getComponent(cameraId, CameraPath)).toEqual({ index: 0, progress: 0 })
    expect(cameraPathStore.get(cameraId)).toEqual({
      waypoints,
      opts,
      elapsed: 0,
    })
  })

  it('setZoom(), setBounds(), activate(), and deactivate() mutate camera state', () => {
    const engine = createMockEngine()
    seedCamera(engine, cameraId)
    const handle = createCamera2DHandle(cameraId, engine as never, log as never)

    handle.setZoom(2.5)
    handle.setBounds({ x: 5, y: 6, width: 7, height: 8 })
    expect(engine.getComponent(cameraId, CameraBounds)).toEqual({
      minX: 5,
      minY: 6,
      minZ: 0,
      maxX: 12,
      maxY: 14,
      maxZ: 0,
    })

    handle.activate()
    expect(engine.getComponent(cameraId, Camera)).toMatchObject({
      zoom: 2.5,
      active: 1,
    })

    handle.deactivate()
    handle.setBounds(null)

    expect(engine.getComponent(cameraId, Camera)).toMatchObject({
      zoom: 2.5,
      active: 0,
    })
    expect(engine.hasComponent(cameraId, CameraBounds)).toBe(false)
  })

  it('shake() clamps trauma and preserves support fields on updates', () => {
    const engine = createMockEngine()
    seedCamera(engine, cameraId)
    const handle = createCamera2DHandle(cameraId, engine as never, log as never)

    handle.shake(0.6)

    const initialShake = engine.getComponent<Record<string, number>>(cameraId, CameraShake)
    expect(initialShake).toEqual(expect.objectContaining({
      trauma: 0.6,
      decay: expect.any(Number),
      maxX: expect.any(Number),
      maxY: expect.any(Number),
    }))
    expect(initialShake?.decay).toBeGreaterThan(0)
    expect(initialShake?.maxX).toBeGreaterThan(0)
    expect(initialShake?.maxY).toBeGreaterThan(0)

    engine.addComponent(cameraId, CameraShake, { trauma: 0.4, decay: 0.5, maxX: 2, maxY: 3 })

    handle.shake(0.8)

    expect(engine.getComponent(cameraId, CameraShake)).toEqual({
      trauma: 1,
      decay: 0.5,
      maxX: 2,
      maxY: 3,
    })
  })

  it('setViewport() rejects unknown viewports and records known viewport ids', () => {
    const viewportManager = {
      get: vi.fn((viewportId: string) => (viewportId === 'main' ? { id: viewportId } : undefined)),
    }
    const engine = createMockEngine(viewportManager)
    seedCamera(engine, cameraId)
    const handle = createCamera2DHandle(cameraId, engine as never, log as never)

    expect(() => handle.setViewport('missing')).toThrow(CameraViewportNotFoundError)
    expect(log.error).toHaveBeenCalledTimes(1)

    handle.setViewport('main')

    expect(viewportManager.get).toHaveBeenCalledWith('main')
    expect(cameraViewportMap.get(cameraId)).toBe('main')
  })
})
