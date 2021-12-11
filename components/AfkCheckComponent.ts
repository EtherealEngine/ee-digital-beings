import { Vector3 } from 'three'
import { createMappedComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'

export type AfkCheckComponentType = {
  isAfk: boolean
  prevPosition: Vector3
  cStep: number
  cStep2: number
  timer: number
}

export const AfkCheckComponent = createMappedComponent<AfkCheckComponentType>('AfkCheckComponent')
