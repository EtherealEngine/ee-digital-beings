import { Downgraded } from '@speigg/hookstate'
import { Vector3 } from 'three'
import matches from 'ts-matches'

import { isClient } from '@xrengine/engine/src/common/functions/isClient'
import { addComponent, hasComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { useWorld } from '@xrengine/engine/src/ecs/functions/SystemHooks'
import { dispatchFrom } from '@xrengine/engine/src/networking/functions/dispatchFrom'
import { isEntityLocalClient } from '@xrengine/engine/src/networking/functions/isEntityLocalClient'
import { NetworkWorldAction } from '@xrengine/engine/src/networking/functions/NetworkWorldAction'

import { Action } from './Actions'
import { AfkCheckComponent } from './components/AfkCheckComponent'
import { ProximityComponent } from './components/ProximityComponent'
import { WebCamInputComponent } from './components/WebCamInputComponent'
import { DBStateType } from './dbSystem'

export function createReceptor(dbState: DBStateType) {
  return function receptor(action) {
    dbState.batch((s: DBStateType) => {
      matches(action)
        .when(Action.sendState.matches, ({ state }) => {
          s.set(state)
        })
        .when(NetworkWorldAction.spawnAvatar.matches, (action) => receptorSpawnAvatar(s, action))
        .when(Action.playerLeave.matches, (action) => receptorPlayerLeave(s, action))
    })
  }
}

export const receptorSpawnAvatar = (s: DBStateType, action: ReturnType<typeof NetworkWorldAction.spanAvatar>) => {
  console.log('spawning player, from receptor 1234')
  const { userId } = action
  const playerLareadyExists = s.players.find((p) => p.userId.value === userId)
  if (playerLareadyExists) {
    playerLareadyExists.merge({ isConnected: true })
    console.log(`player ${userId} rejoined`)
  } else {
    s.players.merge([
      {
        userId: userId,
        isConnected: true
      }
    ])
    console.log(`player ${userId} joined`)
  }

  const world = useWorld()
  console.log('clients:', world.getAllNetworkObjects())
  dispatchFrom(world.hostId, () => Action.sendState({ state: s.attach(Downgraded).value })).to(userId)
  const entity = world.getUserAvatarEntity(userId)
  console.log(
    'spawning player, isClient: ' +
      isClient +
      ' isEntityLocalClient: ' +
      isEntityLocalClient(entity) +
      ' entity: ' +
      entity
  )
  if (isClient) {
    if (!hasComponent(entity, AfkCheckComponent)) {
      addComponent(entity, AfkCheckComponent, {
        isAfk: false,
        prevPosition: new Vector3(0, 0, 0),
        cStep: 0,
        cStep2: 0,
        timer: 0
      })
    }
    if (isEntityLocalClient(entity)) {
      if (!hasComponent(world.localClientEntity, ProximityComponent, world)) {
        // && isBot(window)) {
        addComponent(
          world.localClientEntity,
          ProximityComponent,
          {
            usersInRange: [],
            usersInIntimateRange: [],
            usersInHarassmentRange: [],
            usersLookingTowards: []
          },
          world
        )
      }
      if (!hasComponent(world.localClientEntity, WebCamInputComponent, world)) {
        addComponent(
          world.localClientEntity,
          WebCamInputComponent,
          {
            emotions: []
          },
          world
        )
      }
      console.log('added web cam input component to local client')
    }
  }
}

export const receptorPlayerLeave = (s: DBStateType, action: ReturnType<typeof Action.playerLeave>) => {
  const world = useWorld()
  s.players.find((p) => p.userId.value === action.userId)?.merge({ isConnected: false })
}
