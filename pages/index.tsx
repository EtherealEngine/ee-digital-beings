import React, { useState } from 'react'
import { LoadLocationScene } from '@xrengine/client/src/components/World/LoadLocationScene'
import { LoadEngineWithScene } from '@xrengine/client/src/components/World/LoadEngineWithScene'
import AvatarInputSwitch from '@xrengine/client-core/src/world/components/Avatar/AvatarInputSwitch'
import { EngineEvents } from '@xrengine/engine/src/ecs/classes/EngineEvents'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import PlayButton from './components/PlayButton/PlayButton'

export const HomePage = (props): any => {
    const [joinedWorld, setJoinedWorld] = useState(false)
    const [inputsEnabled, setInputsEnabled] = useState(false)
    const [showStartButton, setShowStartButton] = useState(true)
  
    EngineEvents.instance.once(EngineEvents.EVENTS.JOINED_WORLD, () => {
      setTimeout(() => {
        setJoinedWorld(true)
      }, 1000)
    })
  
    const handleClickPlayButton = () => {
      setShowStartButton(false)
      if (!joinedWorld) return
  
      setInputsEnabled(true)
      if (Engine.xrSupported) {
        EngineEvents.instance.dispatchEvent({ type: EngineEvents.EVENTS.XR_START })
      }
    }
  
    return (
      <>
        {showStartButton && <PlayButton onclick={handleClickPlayButton} />}
        <LoadLocationScene locationName="bot" />
        <LoadEngineWithScene connectToInstanceServer={false} />
        <AvatarInputSwitch enabled={inputsEnabled} joinedWorld={joinedWorld} />
      </>
    )
}

export default HomePage