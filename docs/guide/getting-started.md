# Getting Started

## Installation

```bash
pnpm add @gwenjs/camera2d
```

## Setup

Register the module in your `gwen.config.ts`:

```typescript
import { defineConfig } from '@gwenjs/core'

export default defineConfig({
  modules: ['@gwenjs/camera2d'],
})
```

## Usage

Use the composable in your game code:

```typescript
import { useCamera2d } from '@gwenjs/camera2d'

const camera2d = useCamera2d()
```
