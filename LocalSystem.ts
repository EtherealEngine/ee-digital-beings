import { pipe } from 'bitecs'
import Hls from 'hls.js'

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
import { defineQuery, getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { isPlayerLocal } from '@xrengine/engine/src/networking/utils/isPlayerLocal'
import { Object3DComponent } from '@xrengine/engine/src/scene/components/Object3DComponent'
import { VideoComponent } from '@xrengine/engine/src/scene/components/VideoComponent'

import { handleCommand, isCommand } from './commandHandler'

console.log('loaded local systems')
let hls: any = undefined
const videoQuery = defineQuery([VideoComponent])

console.log('loaded chat system')
client.service('message').on('created', (params) => {
  const selfUser = accessAuthState().user.value
  const { message } = params
  let isVoice = false
  let isVoiceUrl = false
  if (message.text?.startsWith('!voice|')) {
    message.text = message.text.replace('!voice|', '')
    isVoice = true
  } else if (message.text?.startsWith('!voiceUrl|')) {
    message.text = message.text.replace('!voiceUrl|', '')
    isVoiceUrl = true
  }

  if (!isVoiceUrl) {
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
  }

  if (isVoiceUrl) {
    console.log('got voice url:', message.text)
    //play audio
    const audio = new Audio(message.text)
    audio.play()
    return
  }

  if (isVoice) {
    return
  }

  const text = message.text

  if (text.startsWith('/')) {
    // const [, video] = document.getElementsByTagName('video')
    let video
    let videoUrl
    for (const videoEntity of videoQuery()) {
      let obj3d = getComponent(videoEntity, Object3DComponent)?.value
      //TODO: first video entity for now, should expand for multiple videos
      if (!video) {
        video = obj3d.userData.videoEl
        videoUrl = obj3d.userData.videoUrl
      }
    }

    const [, video1] = document.getElementsByTagName('video')

    const [controlType, param] = text.split(' ')

    switch (controlType) {
      case '/playVideo':
        if (param) videoUrl = param
        if (Hls.isSupported()) {
          console.log('hls is supported')

          const config = {
            autoStartLoad: true,
            startPosition: -1,
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
            chunkDurationTarget: 100,
            maxChunkCount: 10,
            progressive: true,
            startFragPrefetch: true,
            fragLoadingRetryDelay: 50,
            maxLoadingDelay: 1
          }

          if (hls !== undefined && hls) {
            hls.stopLoad()
            hls.detachMedia()
            hls.destroy()
          }
          hls = new Hls(config)
          hls.loadSource(videoUrl)
          hls.attachMedia(video)
          hls.on(Hls.Events.MEDIA_ATTACHED, function () {
            video.muted = false
            video.loop = false
            video.play()
          })
          hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  // try to recover network error
                  console.log('fatal network error encountered, try to recover')
                  hls.startLoad()
                  break
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.log('fatal media error encountered, try to recover')
                  hls.recoverMediaError()
                  break
                default:
                  // cannot recover
                  console.log('cannot recover')
                  hls.destroy()
                  break
              }
            }
          })
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = videoUrl
          video.addEventListener('canplay', function () {
            video.play()
          })
        }

        /* video.src = 'https://localhost:3029/' + videoUrl
        video.crossOrigin = 'anonymous';
        video.play() */
        break
      case '/play':
        video?.play()
        break
      case '/pause':
        video?.pause()
        break
      case '/seek':
        if (!(video as any).paused) {
          video?.pause()
        }
        if (param && parseFloat(param) >= 0) {
          ;(video as any).currentTime = parseFloat(param)
        } else {
          ;(video as any).currentTime = (video as any).currentTime + 0.1
        }
        break
    }
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
