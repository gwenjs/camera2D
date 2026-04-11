// @ts-expect-error current core typings only expose createEngine as a named export
import createEngine from '@gwenjs/core'
import { describe, expect, it, vi } from 'vitest'
import Camera2DPlugin from '../src/index.js'

vi.mock('@gwenjs/core', () => {
  const createMockEngine = () => {
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

describe('camera2d', () => {
  it('installs camera and viewport managers', async () => {
    const engine = createEngine()

    await engine.use(Camera2DPlugin())

    expect(engine.inject('cameraManager')).toBeDefined()
    expect(engine.inject('viewportManager')).toBeDefined()
  })
})
