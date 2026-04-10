// Side-effect: activates typed engine.inject('camera2d') in manual mode
import './augment'

// Plugin factory — for manual registration in plugins: []
export { Camera2dPlugin } from './plugin'

// Composables — useCamera2d() for runtime access
export { useCamera2d } from './composables'

// Public types
export type { Camera2dConfig, Camera2dService } from './types'

// The build-time module is exported via the './module' package export.
// Do NOT re-export it here — that would create a circular dependency.
