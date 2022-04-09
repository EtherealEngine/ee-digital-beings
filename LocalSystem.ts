import { pipe } from 'bitecs'

import { client } from '@xrengine/client-core/src/feathers'
import {
  getChatMessageSystem,
  hasSubscribedToChatSystem,
  removeMessageSystem
} from '@xrengine/client-core/src/social/services/utils/chatSystem'
import { accessAuthState } from '@xrengine/client-core/src/user/services/AuthService'
import { isBot } from '@xrengine/engine/src/common/functions/isBot'
import { isClient } from '@xrengine/engine/src/common/functions/isClient'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { isPlayerLocal } from '@xrengine/engine/src/networking/utils/isPlayerLocal'

import { handleCommand, isCommand } from './commandHandler'

console.log('loaded local systems')

console.log('loaded chat system')
client.service('message').on('created', (params) => {
  const selfUser = accessAuthState().user.value
  const { message } = params
  let isVoice = false
  if (message.text?.startsWith('!voice|')) {
    message.text = message.text.replace('!voice|', '')
    isVoice = true
  }

  console.log(
    'BOT_MESSAGE|',
    JSON.stringify({
      id: message.id,
      sender: message.sender.name,
      senderId: message.sender.userId,
      channelId: message.channelId,
      text: message.text,
      updatedAt: message.updatedAt
    })
  )

  if (isVoice) {
    return;
  }
  
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
        if (!isBot(window) && !Engine.isBot && !Engine.isBot && !hasSubscribedToChatSystem(selfUser.id, system)) return
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
