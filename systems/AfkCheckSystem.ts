import { TransformComponent } from '@xrengine/engine/src/transform/components/TransformComponent'
import { defineQuery, getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { AfkCheckComponent } from '../components/AfkCheckComponent'

const afkTime: number = 0.5
const step: number = 50

export const AfkCheckSystem = async (world: World) => {
  const afkQuery = defineQuery([AfkCheckComponent, TransformComponent])

  return () => {
    for (const eid of afkQuery(world)) {
      const { isAfk, prevPosition, cStep } = getComponent(eid, AfkCheckComponent)
      const { position } = getComponent(eid, TransformComponent)

      getComponent(eid, AfkCheckComponent).cStep++
      if (cStep + 1 < step) continue
      getComponent(eid, AfkCheckComponent).cStep = 0

      if (position.distanceTo(prevPosition) <= 0.05) {
        if (!isAfk) {
          getComponent(eid, AfkCheckComponent).timer += world.delta
          if (getComponent(eid, AfkCheckComponent).cStep2 >= afkTime) getComponent(eid, AfkCheckComponent).isAfk = true
        }
      } else {
        getComponent(eid, AfkCheckComponent).cStep2 = 0
        if (isAfk) getComponent(eid, AfkCheckComponent).isAfk = false
      }

      getComponent(eid, AfkCheckComponent).prevPosition.copy(position)
    }
  }
}
