import { forwardVector3, multiplyQuaternion, normalize, subVector } from '@xrengine/common/src/utils/mathUtils'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { defineQuery, getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { NetworkObjectComponent } from '@xrengine/engine/src/networking/components/NetworkObjectComponent'
import { isEntityLocalClient } from '@xrengine/engine/src/networking/functions/isEntityLocalClient'
import { UserNameComponent } from '@xrengine/engine/src/scene/components/UserNameComponent'
import { TransformComponent } from '@xrengine/engine/src/transform/components/TransformComponent'

import { ProximityComponent } from '../components/ProximityComponent'

const maxDistance: number = 10
const intimateDistance: number = 5
const harassmentDistance: number = 1

export const ProximitySystem = async (world: World) => {
  const proximityCheckerQuery = defineQuery([TransformComponent, ProximityComponent])

  return () => {
    for (const eid of proximityCheckerQuery(world)) {
      if (isEntityLocalClient(eid)) {
        const { usersInRange, usersInIntimateRange, usersInHarassmentRange, usersLookingTowards } = getComponent(
          eid,
          ProximityComponent
        )

        const _usersInRange: any[] = []
        const _usersInIntimateRange: any = []
        const _usersInHarassmentRange: any = []
        const _usersLookingTowards: any[] = []
        const usersJustAdded: any[] = []
        const userId = getComponent(eid, NetworkObjectComponent).userId
        const transform = getComponent(eid, TransformComponent)
        let remoteTransform
        let distance: number = -1
        let dot: number = -1

        for (const [_, client] of world.clients) {
          if (client.userId === userId) continue
          const userEntity = world.getUserAvatarEntity(client.userId)
          if (!userEntity) continue

          const usernameComponent = getComponent(userEntity, UserNameComponent)
          const username =
            usernameComponent !== undefined && usernameComponent ? usernameComponent.username : 'remote user'
          remoteTransform = getComponent(userEntity, TransformComponent)
          if (remoteTransform === undefined) continue

          distance = transform.position.distanceTo(remoteTransform.position)
          if (distance > 0) {
            if (distance <= maxDistance && distance > intimateDistance) {
              if (
                !_usersInRange.includes(userEntity) &&
                !_usersInIntimateRange.includes(userEntity) &&
                !usersInHarassmentRange.includes(userEntity)
              ) {
                if (_usersInIntimateRange.includes(userEntity))
                  _usersInIntimateRange.slice(_usersInIntimateRange.indexOf(userEntity), 1)
                if (_usersInHarassmentRange.includes(userEntity))
                  _usersInHarassmentRange.slice(_usersInHarassmentRange.indexOf(userEntity), 1)

                _usersInRange.push(userEntity)
                usersJustAdded.push(userEntity)
                if (!usersInRange.includes(userEntity)) {
                  console.log('proximity|inRange|' + username + '|' + distance)
                }
              }
            } else if (distance <= intimateDistance && distance > harassmentDistance) {
              if (
                !_usersInRange.includes(userEntity) &&
                !_usersInIntimateRange.includes(userEntity) &&
                !usersInHarassmentRange.includes(userEntity)
              ) {
                if (_usersInRange.includes(userEntity)) _usersInRange.splice(_usersInRange.indexOf(userEntity), 1)
                if (_usersInHarassmentRange.includes(userEntity))
                  _usersInHarassmentRange.splice(_usersInHarassmentRange.indexOf(userEntity), 1)

                _usersInIntimateRange.push(userEntity)
                usersJustAdded.push(userEntity)
                if (!usersInIntimateRange.includes(userEntity)) {
                  console.log('proximity|intimate|' + username + '|' + distance)
                }
              }
            }
          }
          const forward = multiplyQuaternion(transform.rotation, forwardVector3)
          const toOther = normalize(subVector(remoteTransform.position, transform.position))
          dot = forward.dot(toOther)
          if (dot >= 0.7) {
            if (!_usersLookingTowards.includes(userEntity)) {
              _usersLookingTowards.push(userEntity)
              if (!usersLookingTowards.includes(userEntity)) {
                console.log('proximity|lookAt|' + username + '|' + dot)
              }
            }
          }
        }

        let left = false
        for (let i = 0; i < usersInRange.length; i++) {
          if (!usersJustAdded.includes(usersInRange[i]) && !_usersInRange.includes(usersInRange[i])) {
            const usernameComponent1 = getComponent(usersInRange[i], UserNameComponent)
            const username1 =
              usernameComponent1 !== undefined && usernameComponent1 ? usernameComponent1.username : 'remote user'
            console.log('proximity|inRange|' + username1 + '|left')
            left = true
          }
        }
        if (left == false) {
          for (let i = 0; i < usersInIntimateRange.length; i++) {
            if (
              !usersJustAdded.includes(_usersInIntimateRange[i]) &&
              !_usersInIntimateRange.includes(usersInIntimateRange[i])
            ) {
              const usernameComponent1 = getComponent(usersInIntimateRange[i], UserNameComponent)
              const username1 =
                usernameComponent1 !== undefined && usernameComponent1 ? usernameComponent1.username : 'remote user'
              console.log('proximity|intimate|' + username1 + '|left')
              left = true
            }
          }
        }

        for (let i = 0; i < usersLookingTowards.length; i++) {
          if (!_usersLookingTowards.includes(usersLookingTowards[i])) {
            const usernameComponent1 = getComponent(usersLookingTowards[i], UserNameComponent)
            const username1 =
              usernameComponent1 !== undefined && usernameComponent1 ? usernameComponent1.username : 'remote user'
            console.log('proximity|lookAt|' + username1 + '|left')
          }
        }

        getComponent(eid, ProximityComponent).usersInRange = _usersInRange
        getComponent(eid, ProximityComponent).usersInIntimateRange = _usersInIntimateRange
        getComponent(eid, ProximityComponent).usersInHarassmentRange = _usersInHarassmentRange
        getComponent(eid, ProximityComponent).usersLookingTowards = _usersLookingTowards
      }
    }
  }
}
