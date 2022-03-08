import { Downgraded } from '@speigg/hookstate'
import { Vector3 } from 'three'
import matches from 'ts-matches'

import { isClient } from '@xrengine/engine/src/common/functions/isClient'
import { EngineActions, EngineActionType } from '@xrengine/engine/src/ecs/classes/EngineService'
import { addComponent, hasComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { useWorld } from '@xrengine/engine/src/ecs/functions/SystemHooks'
import { dispatchFrom } from '@xrengine/engine/src/networking/functions/dispatchFrom'
import { isEntityLocalClient } from '@xrengine/engine/src/networking/functions/isEntityLocalClient'
import { NetworkWorldAction } from '@xrengine/engine/src/networking/functions/NetworkWorldAction'

import { Action } from './Actions'
import { AfkCheckComponent } from './components/AfkCheckComponent'
import { ProximityComponent } from './components/ProximityComponent'
import { WebCamInputComponent } from './components/WebCamInputComponent'
import { EngineEvents } from '@xrengine/engine/src/ecs/classes/EngineEvents'
import { DBStateType } from './dbSystem'

export const receptorSpawnAvatar = (s: DBStateType, action: ReturnType<typeof NetworkWorldAction.spanAvatar>) => {
 
}

export const receptorPlayerLeave = (s: DBStateType, action: ReturnType<typeof Action.playerLeave>) => {
  const world = useWorld()
  s.players.find((p) => p.userId.value === action.userId)?.merge({ isConnected: false })
}
