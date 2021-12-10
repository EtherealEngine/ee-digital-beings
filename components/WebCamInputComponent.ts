import { createMappedComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'

export type WebCamInputComponentType = {
  emotions: string[]
}

export const WebCamInputComponent = createMappedComponent<WebCamInputComponentType>('WebCamInputComponent')
