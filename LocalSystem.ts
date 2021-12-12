import { isClient } from '@xrengine/engine/src/common/functions/isClient'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { pipe } from 'bitecs'
import { client } from '@xrengine/client-core/src/feathers'
import { handleCommand, isCommand } from './commandHandler'
import { accessAuthState } from '@xrengine/client-core/src/user/services/AuthService'
import { isPlayerLocal } from '@xrengine/engine/src/networking/utils/isPlayerLocal'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import {
  getChatMessageSystem,
  hasSubscribedToChatSystem,
  removeMessageSystem
} from '@xrengine/engine/src/networking/utils/chatSystem'
import { isBot } from '@xrengine/engine/src/common/functions/isBot'

console.log('loaded local systems')

console.log('loaded chat system')
client.service('message').on('created', (params) => {
    const selfUser = accessAuthState().user.value
    const { message } = params
    console.log('new message: ' + message)

    if (message != undefined && message.text != undefined) {
      if (isPlayerLocal(message.senderId)) {
        if (handleCommand(message.text, Engine.currentWorld.localClientEntity, message.senderId)) return
        else {
          const system = getChatMessageSystem(message.text)
          if (system !== 'none') {
            message.text = removeMessageSystem(message.text)
            if (!isBot(window) && !Engine.isBot && !hasSubscribedToChatSystem(selfUser.id, system)) return
          }
        }
      } else {
        const system = getChatMessageSystem(message.text)
        if (system !== 'none') {
          message.text = removeMessageSystem(message.text)
          if (!isBot(window) && !Engine.isBot && !Engine.isBot && !hasSubscribedToChatSystem(selfUser.id, system))
            return
        } else if (isCommand(message.text) && !Engine.isBot && !isBot(window)) return
      }
    }
})

export default async function LocalSystem(world: World) {
  // TODO: this is temp, until reality packs have browser & node options
  if (!isClient) return () => {}

  const { ProximitySystem } = await import('./systems/ProximitySystem')
  const { WebCamInputSystem } = await import('./systems/WebCamInputSystem')
  const { FollowSystem } = await import('./systems/FollowSystem')
  const { AfkCheckSystem } = await import('./systems/AfkCheckSystem')

  const proximitySystem = await ProximitySystem(world)
  const webCamInputSystem = await WebCamInputSystem(world)
  const followSystem = await FollowSystem(world)
  const afkCheckSystem = await AfkCheckSystem(world)

  return pipe(proximitySystem, webCamInputSystem, followSystem, afkCheckSystem)
}
