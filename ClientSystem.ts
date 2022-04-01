import { setSoundFunction } from '@xrengine/client-core/src/components/MediaIconsBox/index.tsx'
import { isBot } from '@xrengine/engine/src/common/functions/isBot.ts'
import { isClient } from '@xrengine/engine/src/common/functions/isClient'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { startLipsyncTracking, stopLipsyncTracking } from '@xrengine/engine/src/input/functions/WebcamInput'

import singleton from './speechUtils'

let recording: boolean = false

window.onbeforeunload = () => {
  if (recording && !singleton.getInstance().streamStreaming) {
    singleton.getInstance().socket?.emit('endGoogleCloudStream', '')
  }
}

export default async function ClientSystem(world: World) {
  console.log('init client system, isClient:', isClient)
  if (!isClient) {
    return
  }

  setSoundFunction(async (on: boolean) => {
    recording = on
    console.log('setSoundFunction', on)

    if (on === true) {
      if (!isBot(window) && !Engine.isBot) {
        singleton.getInstance().initRecording(async (text) => {
          console.log(text)
        })
      }
      startLipsyncTracking()
    } else {
      if (!isBot(window) && !Engine.isBot) {
        singleton.getInstance().stopRecording()
      }
      stopLipsyncTracking()
    }
  })

  return () => {
    return world
  }
}
