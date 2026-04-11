import { createEngine } from '@gwenjs/core'
import type { CameraWaypoint, PathOpts } from '@gwenjs/camera-core'
import { describe, expect, it, vi } from 'vitest'
import Camera2DPlugin from '../src/index.js'
import type { Camera2DHandle, Rect } from '../src/types.js'

type MockEngine = {
  use(plugin: { setup?: (engine: any) => void | Promise<void> }): Promise<void>
  provide(key: string, value: unknown): void
  inject(key: string): unknown
}

vi.mock('@gwenjs/core', () => {
  const createMockEngine = async () => {
    const services = new Map<string, unknown>()

    return {
      async use(plugin: { setup?: (engine: unknown) => void | Promise<void> }) {
        await plugin.setup?.(this)
      },
      provide(key: string, value: unknown) {
        services.set(key, value)
      },
      inject(key: string) {
        return services.get(key)
      },
    }
  }

  return {
    default: createMockEngine,
    createEngine: createMockEngine,
    createEntityId: () => 0n,
    unpackEntityId: () => ({ index: 0, generation: 0 }),
  }
})

vi.mock('@gwenjs/camera-core', () => ({
  CameraCorePlugin: () => ({
    name: '@gwenjs/camera-core',
    setup(engine: { provide(key: string, value: unknown): void }) {
      engine.provide('cameraManager', {})
      engine.provide('viewportManager', {})
    },
  }),
}))

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B
  ? 1
  : 2)
  ? true
  : false
type Expect<T extends true> = T

type _PlayPathArgs = Expect<
  Equal<Parameters<Camera2DHandle['playPath']>, [CameraWaypoint[], PathOpts?]>
>
type _SetBoundsArgs = Expect<Equal<Parameters<Camera2DHandle['setBounds']>, [Rect | null]>>

describe('Camera2DPlugin', () => {
  it('installs camera and viewport managers', async () => {
    // TODO: Replace this temporary mock-backed test with the real integration path after the upstream published package mismatch is fixed.
    const engine = (await createEngine({ maxEntities: 32 })) as unknown as MockEngine

    await engine.use(Camera2DPlugin())

    expect(engine.inject('cameraManager')).toBeDefined()
    expect(engine.inject('viewportManager')).toBeDefined()
  })
})
