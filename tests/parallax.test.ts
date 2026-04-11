import { beforeEach, describe, expect, it, vi } from 'vitest'

const runtime = vi.hoisted(() => {
  const afterUpdateCallbacks: Array<(deltaMs: number) => void> = []
  const cameraManager = {
    get: vi.fn<(viewportId: string) => unknown>(),
  }
  const backgroundElement = { style: { transform: '' } }
  const middlegroundElement = { style: { transform: '' } }
  const backgroundRenderer = {
    getLayerElement: vi.fn((layerName: string) => {
      if (layerName === 'background') {
        return backgroundElement
      }

      throw new Error(`Unknown layer: ${layerName}`)
    }),
  }
  const middlegroundRenderer = {
    getLayerElement: vi.fn((layerName: string) => {
      if (layerName === 'middleground') {
        return middlegroundElement
      }

      throw new Error(`Unknown layer: ${layerName}`)
    }),
  }

  return {
    afterUpdateCallbacks,
    cameraManager,
    backgroundElement,
    middlegroundElement,
    backgroundRenderer,
    middlegroundRenderer,
    onAfterUpdate: vi.fn((callback: (deltaMs: number) => void) => {
      afterUpdateCallbacks.push(callback)
    }),
    useCameraManager: vi.fn(() => cameraManager),
    useService: vi.fn((rendererName: string) => {
      if (rendererName === 'renderer:bg') {
        return backgroundRenderer
      }

      if (rendererName === 'renderer:mid') {
        return middlegroundRenderer
      }

      throw new Error(`Unknown renderer: ${rendererName}`)
    }),
  }
})

vi.mock('@gwenjs/core', () => ({
  onAfterUpdate: runtime.onAfterUpdate,
}))

vi.mock('@gwenjs/renderer-core', () => ({
  useCameraManager: runtime.useCameraManager,
  useService: runtime.useService,
}))

async function loadSubject() {
  return import('../src/parallax.js')
}

describe('useParallax', () => {
  beforeEach(() => {
    runtime.afterUpdateCallbacks.length = 0
    runtime.cameraManager.get.mockReset()
    runtime.backgroundRenderer.getLayerElement.mockClear()
    runtime.middlegroundRenderer.getLayerElement.mockClear()
    runtime.onAfterUpdate.mockClear()
    runtime.useCameraManager.mockClear()
    runtime.useService.mockClear()
    runtime.backgroundElement.style.transform = ''
    runtime.middlegroundElement.style.transform = ''
  })

  it('applies parallax transforms to each configured layer for an active camera', async () => {
    const { useParallax } = await loadSubject()

    runtime.cameraManager.get.mockReturnValue({
      active: true,
      worldTransform: {
        position: { x: 40, y: -10, z: 0 },
      },
    })

    useParallax([
      { rendererName: 'renderer:bg', layerName: 'background', factor: 0.5 },
      { rendererName: 'renderer:mid', layerName: 'middleground', factor: 1.25 },
    ], 'hud')

    runtime.afterUpdateCallbacks[0]?.(16)

    expect(runtime.cameraManager.get).toHaveBeenCalledWith('hud')
    expect(runtime.backgroundRenderer.getLayerElement).toHaveBeenCalledWith('background')
    expect(runtime.middlegroundRenderer.getLayerElement).toHaveBeenCalledWith('middleground')
    expect(runtime.backgroundElement.style.transform).toBe('translate(-20px, 5px)')
    expect(runtime.middlegroundElement.style.transform).toBe('translate(-50px, 12.5px)')
  })

  it('ignores missing camera state', async () => {
    const { useParallax } = await loadSubject()

    runtime.cameraManager.get.mockReturnValue(undefined)

    useParallax([{ rendererName: 'renderer:bg', layerName: 'background', factor: 0.5 }], 'hud')
    runtime.afterUpdateCallbacks[0]?.(16)

    expect(runtime.cameraManager.get).toHaveBeenCalledWith('hud')
    expect(runtime.backgroundRenderer.getLayerElement).not.toHaveBeenCalled()
    expect(runtime.backgroundElement.style.transform).toBe('')
  })

  it('ignores inactive camera state', async () => {
    const { useParallax } = await loadSubject()

    runtime.cameraManager.get.mockReturnValue({
      active: false,
      worldTransform: {
        position: { x: 40, y: 10, z: 0 },
      },
    })

    useParallax([{ rendererName: 'renderer:bg', layerName: 'background', factor: 0.5 }], 'hud')
    runtime.afterUpdateCallbacks[0]?.(16)

    expect(runtime.cameraManager.get).toHaveBeenCalledWith('hud')
    expect(runtime.backgroundRenderer.getLayerElement).not.toHaveBeenCalled()
    expect(runtime.backgroundElement.style.transform).toBe('')
  })

  it('resolves the renderer service for each configured layer', async () => {
    const { useParallax } = await loadSubject()

    useParallax([
      { rendererName: 'renderer:bg', layerName: 'background', factor: 0.5 },
      { rendererName: 'renderer:mid', layerName: 'middleground', factor: 1.25 },
    ])

    expect(runtime.useCameraManager).toHaveBeenCalledTimes(1)
    expect(runtime.useService).toHaveBeenCalledTimes(2)
    expect(runtime.useService).toHaveBeenNthCalledWith(1, 'renderer:bg')
    expect(runtime.useService).toHaveBeenNthCalledWith(2, 'renderer:mid')
    expect(runtime.onAfterUpdate).toHaveBeenCalledTimes(1)
    expect(runtime.afterUpdateCallbacks).toHaveLength(1)
  })
})
