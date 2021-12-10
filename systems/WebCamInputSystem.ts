import { System } from '@xrengine/engine/src/ecs/classes/System'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import {
  getComponent,
  defineQuery
} from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { isEntityLocalClient } from '@xrengine/engine/src/networking/functions/isEntityLocalClient'
import { ChatService } from '@xrengine/client-core/src/social/services/ChatService'
import { accessAuthState } from '@xrengine/client-core/src/user/services/AuthService'
import { WebCamInputComponent } from '../components/WebCamInputComponent'

export const WebCamInputSystem = async (world: World) => {
  const webcamInputQuery = defineQuery([WebCamInputComponent])

  return () => {
    for (const eid of webcamInputQuery(world)) {
      if (isEntityLocalClient(eid)) {
        const { emotions } = getComponent(eid, WebCamInputComponent)

        if (emotions.length > 0) {
          for (let i = 0; i < emotions.length; i++) {
            sendProximityChatMessage(emotions[i])
          }

          getComponent(eid, WebCamInputComponent).emotions = []
        }
      }
    }
  }
}

function sendProximityChatMessage(text) {
  const user = accessAuthState().user.value
  ChatService.sendChatMessage({
    targetObjectId: user.instanceId,
    targetObjectType: 'instance',
    text: '[emotions]' + text
  })
}
