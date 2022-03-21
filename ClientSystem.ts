import { setSoundFunction } from '@xrengine/client-core/src/components/MediaIconsBox/index.tsx'
import { isBot } from '@xrengine/engine/src/common/functions/isBot.ts'

import { isClient } from '@xrengine/engine/src/common/functions/isClient'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { World } from '@xrengine/engine/src/ecs/classes/World'

import singleton from './speechUtils'

let recording: boolean = false

window.onbeforeunload = () => {
  if (recording && !singleton.getInstance().streamStreaming) {
    singleton.getInstance().socket?.emit('endGoogleCloudStream', '')
  }
}

export default async function ClientSystem(world: World) {
  if (!isClient || isBot(window) || Engine.isBot) {
    return
  }

  setSoundFunction(async (on: boolean) => {
    recording = on

    if (on === true) {
      singleton.getInstance().initRecording(async (text) => {
        console.log(text)
      })
    } else {
      singleton.getInstance().stopRecording()
    }
  })

  return () => {
    return world
  }
}
