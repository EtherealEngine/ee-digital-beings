import { isClient } from '@xrengine/engine/src/common/functions/isClient'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { pipe } from 'bitecs'

export default async function LocalSystem(world: World) {
  // TODO: this is temp, until reality packs have browser & node options
  if (!isClient) return () => {}

  const { ProximitySystem } = await import('./systems/ProximitySystem')
  const { WebCamInputSystem } = await import('./systems/WebCamInputSystem')
  const { FollowSystem } = await import('./systems/FollowSystem')

  const proximitySystem = await ProximitySystem(world)
  const webCamInputSystem = await WebCamInputSystem(world)
  const followSystem = await FollowSystem(world)

  return pipe(proximitySystem, webCamInputSystem, followSystem)
}
