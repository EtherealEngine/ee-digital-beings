import { Vector3 } from 'three'
import { positionBehind } from '@xrengine/common/src/utils/mathUtils'
import { defineQuery, getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { TransformComponent } from '@xrengine/engine/src/transform/components/TransformComponent'
import { goTo } from '@xrengine/engine/src/common/functions/commandHandler'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { System } from '@xrengine/engine/src/ecs/classes/System'
import { FollowComponent } from '../components/FollowComponent'

const distanceToPlayer: number = 1
const step: number = 10

export const FollowSystem = async (world: World) => {
  const followQuery = defineQuery([FollowComponent])

  return () => {
    for (const eid of followQuery(world)) {
      let { targetEid, cStep, prevTarget } = getComponent(eid, FollowComponent)
      cStep++
      getComponent(eid, FollowComponent).cStep = cStep
      if (cStep < step) continue
      getComponent(eid, FollowComponent).cStep = 0

      const tTransform = getComponent(targetEid, TransformComponent)
      if (tTransform !== undefined) {
        const pos: Vector3 = positionBehind(tTransform.position, tTransform.rotation, distanceToPlayer)
        if (pos !== prevTarget) {
          goTo(pos, eid)
          getComponent(eid, FollowComponent).prevTarget = pos
        }
      }
    }
  }
}
