import { createState, Downgraded, useState } from '@speigg/hookstate'
import { Vector3 } from 'three'
import matches from 'ts-matches'

import { UserId } from '@xrengine/common/src/interfaces/UserId'
import { isClient } from '@xrengine/engine/src/common/functions/isClient'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { addComponent, hasComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { useWorld } from '@xrengine/engine/src/ecs/functions/SystemHooks'
import { isEntityLocalClient } from '@xrengine/engine/src/networking/functions/isEntityLocalClient'
import { NetworkWorldAction } from '@xrengine/engine/src/networking/functions/NetworkWorldAction'

import { AfkCheckComponent } from './components/AfkCheckComponent'
import { ProximityComponent } from './components/ProximityComponent'
import { WebCamInputComponent } from './components/WebCamInputComponent'

export const DBState = createState({
  players: [] as Array<{
    userId: UserId
    isConnected: boolean
  }>
})

export type DBStateType = typeof DBState

// Attach logging
DBState.attach(() => ({
  id: Symbol('Logger'),
  init: () => ({
    onSet(arg) {
      console.log('DB STATE \n' + JSON.stringify(DBState.attach(Downgraded).value, null, 2))
    }
  })
}))

export function accessDBState() {
  return DBState.attach(Downgraded).value
}
export function useDBState() {
  return useState(DBState) as any as typeof DBState
}

globalThis.DBState = DBState
console.log('initializing db system script')

export default async function dbSystem(world: World) {
  console.log('init db system')
  world.receptors.push((action) => {
    matches(action).when(NetworkWorldAction.spawnAvatar.matches, (spawnAction) => {

      const world = useWorld()
      const entity = world.getNetworkObject(spawnAction.$from, spawnAction.networkId)
      if (isClient) {
        if (entity && !hasComponent(entity, AfkCheckComponent)) {
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
    })
  })

  return () => {
    return world
  }
}
