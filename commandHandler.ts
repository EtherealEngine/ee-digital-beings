import { Quaternion, Vector2, Vector3 } from 'three'

import {
  getSubscribedChatSystems,
  subscribeToChatSystem,
  unsubscribeFromChatSystem
} from '@xrengine/client-core/src/social/services/utils/chatSystem'
import { UserId } from '@xrengine/common/src/interfaces/UserId'
import { lookAt } from '@xrengine/common/src/utils/mathUtils'
import { changeAvatarAnimationState } from '@xrengine/engine/src/avatar/animation/Util'
import { AvatarStates } from '@xrengine/engine/src/avatar/animation/Util'
import { FollowCameraComponent } from '@xrengine/engine/src/camera/components/FollowCameraComponent'
import { LifecycleValue } from '@xrengine/engine/src/common/enums/LifecycleValue'
import { isBot } from '@xrengine/engine/src/common/functions/isBot'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { Entity } from '@xrengine/engine/src/ecs/classes/Entity'
import { addComponent, getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { useWorld } from '@xrengine/engine/src/ecs/functions/SystemHooks'
import { InputComponent } from '@xrengine/engine/src/input/components/InputComponent'
import { LocalInputTagComponent } from '@xrengine/engine/src/input/components/LocalInputTagComponent'
import { BaseInput } from '@xrengine/engine/src/input/enums/BaseInput'
import { CameraInput } from '@xrengine/engine/src/input/enums/InputEnums'
import { InputType } from '@xrengine/engine/src/input/enums/InputType'
import { lipToInput } from '@xrengine/engine/src/input/functions/WebcamInput'
import { AutoPilotClickRequestComponent } from '@xrengine/engine/src/navigation/component/AutoPilotClickRequestComponent'
import { AutoPilotOverrideComponent } from '@xrengine/engine/src/navigation/component/AutoPilotOverrideComponent'
import { getUserEntityByName } from '@xrengine/engine/src/networking/utils/getUser'
import { TransformComponent } from '@xrengine/engine/src/transform/components/TransformComponent'

import { AfkCheckComponent } from './components/AfkCheckComponent'
import { createFollowComponent, removeFollowComponent } from './components/FollowComponent'

//The values the commands that must have in the start
export const commandStarters = ['/', '//']

//Checks if a text (string) is a command
export function isCommand(text: string): boolean {
  for (let i = 0; i < commandStarters.length; i++) {
    if (text.startsWith(commandStarters[i])) return true
  }

  return false
}
//Get the count of the command init value
export function getStarterCount(text: string): number {
  for (let i = 0; i < commandStarters.length; i++) {
    if (text.startsWith(commandStarters[i])) return commandStarters[i].length
  }

  return 0
}

/**
 * Handles a command, the input is sent both from server and client, each one can handle it differently
 * The return value is boolean (true/false), if it returns true the caller function will terminate, otherwise it will continue
 * First it is called in the server and then in the client
 * The entity in the server is the UserId, while in the client is the EntityId
 * @author Alex Titonis
 */
export function handleCommand(cmd: string, entity: Entity, userId: UserId): boolean {
  //It checks for all messages, the default
  if (!isCommand(cmd)) return false

  //Remove the command starter, get the data (the base which is the command and the parameters if exist, parameters are separated by , (commas))
  cmd = cmd.substring(getStarterCount(cmd))
  let data = cmd.split(' ')
  let base = data[0]
  let params: string[] = [] // data.length >= 2 ? data[1].split(',') : []
  if (data.length > 1) {
    for (let i = 1; i < data.length; i++) {
      const d = data[i].split(',')
      for (let k = 0; k < d.length; k++) {
        params.push(d[k])
      }
    }
  }

  console.log('command:', base)
  //Handle the command according to the base
  switch (base) {
    case 'move': {
      if (params.length < 3) {
        console.log('invalid move command - params length (' + params.length + ') ' + params)
        return true
      }

      const x = parseFloat(params[0])
      const y = parseFloat(params[1])
      const z = parseFloat(params[2])

      if (x === undefined || y === undefined || z === undefined) {
        console.log('invalid move command - params: ' + params)
        return true
      }

      handleMoveCommand(x, y, z, entity)

      return false
    }
    case 'metadata': {
      //This command is handled only in the client and only if the caller is a bot
      if (!Engine.isBot && !isBot(window)) return true

      //The params must either be 1 or 2, if it is scene, then 1 other wise 2 - world, max distance
      if (params.length > 0) {
        if (params[0] === 'world' && params.length != 2) {
          console.log('invalid params, available params, scene or world,distance (float)')
          return true
        }
      } else return true

      handleMetadataCommand(params, entity)

      return true
    }
    case 'goTo': {
      if (!Engine.isBot && !isBot(window)) return true

      if (params.length != 1) {
        console.log('invalid params, it should be /goTo landmark')
        return true
      }

      handleGoToCommand(params[0], entity)

      return true
    }
    case 'emote': {
      if (params.length !== 1) {
        console.log('invalid params, it should be /emote emote_name')
        return true
      }

      handleEmoteCommand(params[0], entity)

      return true
    }
    case 'subscribe': {
      if (params.length !== 1) {
        console.log('invalid params, it should be /subscribe chat_system (emotions_system, all)')
        return true
      }

      handleSubscribeToChatSystemCommand(params[0], userId)

      return true
    }
    case 'unsubscribe': {
      if (params.length !== 1) {
        console.log('invalid params, it should be /unsubscribe chat_system (emotions_system all)')
        return true
      }

      handleUnsubscribeFromChatSystemCommand(params[0], userId)

      return true
    }
    case 'getSubscribed': {
      handleGetSubscribedChatSystemsCommand(userId)

      return true
    }
    case 'face': {
      if (params.length !== 1) {
        console.log('invalid params')
        return true
      }

      handleFaceCommand(params[0], entity)

      return true
    }
    case 'getPosition': {
      if (params.length !== 1) {
        console.log('invalid params')
        return true
      }

      handleGetPositionCommand(params[0], userId)

      return true
    }
    case 'getRotation': {
      if (params.length !== 1) {
        console.log('invalid params')
        return true
      }

      handleGetRotationCommand(params[0], userId)

      return true
    }
    case 'getScale': {
      if (params.length !== 1) {
        console.log('invalid params')
        return true
      }

      handleGetScaleCommand(params[0], userId)

      return true
    }
    case 'getTransform': {
      if (params.length !== 1) {
        console.log('invalid params')
        return true
      }

      handleGetTransformCommand(params[0], userId)

      return true
    }
    case 'follow': {
      let name = ''
      if (params.length < 1) {
        console.log('invalid params')
        return true
      } else if (params.length === 1) {
        name = params[0]
      } else {
        name = params.join(' ')
      }

      handleFollowCommand(name, entity, userId)

      return true
    }
    case 'getChatHistory': {
      handleGetChatHistoryCommand()

      return true
    }
    case 'listAllusers': {
      handleListAllUsersCommand(userId)

      return true
    }
    case 'getLocalUserId': {
      if (!isBot(window)) return false

      handleGetLocalUserIdCommand(userId)

      return true
    }
    case 'lookAt': {
      let name = ''
      if (params.length < 1) {
        console.log('invalid params')
        return true
      } else if (params.length === 1) {
        name = params[0]
      } else {
        name = params.join(' ')
      }

      handleLookAt(name, entity, userId)

      return true
    }
    case 'lipSync': {
      if (params.length !== 3) {
        return true
      }

      const pucker = parseFloat(params[0])
      const widen = parseFloat(params[1])
      const open = parseFloat(params[2])

      handleLipSync(pucker, widen, open)

      return true
    }
    default: {
      console.log('unknown command: ' + base + ' params: ' + params)
      return false
    }
  }
}

//Create fake input on the map (like left click) with the coordinates written and implement the auto pilot click request component to the player
function handleMoveCommand(x: number, y: number, z: number, entity: any) {
  goTo(new Vector3(x, y, z), entity)
  /*let linput = getComponent(entity, LocalInputTagComponent)
  if (linput === undefined) linput = addComponent(entity, LocalInputTagComponent, {})
  addComponent(entity, AutoPilotClickRequestComponent, { coords: new Vector2(x, z) })*/
}

function handleMetadataCommand(params: any, entity: any) {
  if (params[0] === 'scene') {
    console.log('scene_metadata|' + Engine.currentWorld.sceneMetadata)
  } else {
    const position = getComponent(entity, TransformComponent).position
    const maxDistance: number = parseFloat(params[1])
    let vector: Vector3
    let distance: number = 0

    for (let i in Engine.currentWorld.worldMetadata) {
      vector = getMetadataPosition(Engine.currentWorld.worldMetadata[i])

      distance = position.distanceTo(vector)
      if (distance > maxDistance) continue
      else console.log('metadata|' + vector.x + ',' + vector.y + ',' + vector.z + '|' + i)
    }
  }
}

function handleGoToCommand(landmark: string, entity: any) {
  const position = getComponent(entity, TransformComponent).position
  let nearest: Vector3 = undefined!
  let distance: number = Number.MAX_SAFE_INTEGER
  let cDistance: number = 0
  let vector: Vector3

  for (let i in Engine.currentWorld.worldMetadata) {
    if (i === landmark) {
      vector = getMetadataPosition(Engine.currentWorld.worldMetadata[i])
      cDistance = position.distanceTo(vector)

      if (cDistance < distance) {
        distance = cDistance
        nearest = vector
      }
    }
  }

  console.log('goTo: ' + landmark + ' nearest: ' + JSON.stringify(nearest))
  if (nearest !== undefined) {
    goTo(nearest, entity)
  }
}

function handleEmoteCommand(emote: string, entity: any) {
  emote = emote.toLowerCase().trim()

  switch (emote) {
    case 'dance1':
      runAnimation(entity, AvatarStates.DANCE1)
      break
    case 'dance2':
      runAnimation(entity, AvatarStates.DANCE2)
      break
    case 'dance3':
      runAnimation(entity, AvatarStates.DANCE3)
      break
    case 'dance4':
      runAnimation(entity, AvatarStates.DANCE4)
      break
    case 'clap':
      runAnimation(entity, AvatarStates.CLAP)
      break
    case 'cry':
      runAnimation(entity, AvatarStates.CRY)
      break
    case 'laugh':
      runAnimation(entity, AvatarStates.LAUGH)
      break
    case 'sad':
      runAnimation(entity, AvatarStates.CRY)
      break
    case 'kiss':
      runAnimation(entity, AvatarStates.KISS)
      break
    case 'wave':
      runAnimation(entity, AvatarStates.WAVE)
      break
    default:
      console.log(
        'emote: ' + emote + ' not found, available: dance1, dance2, dance3, dance4, clap, cry, laugh, sad, kiss, wave'
      )
  }
}
function handleSubscribeToChatSystemCommand(system: string, userId: any) {
  subscribeToChatSystem(userId, system)
}
function handleUnsubscribeFromChatSystemCommand(system: string, userId: any) {
  unsubscribeFromChatSystem(userId, system)
}
async function handleGetSubscribedChatSystemsCommand(userId: any) {
  const systems: string[] = getSubscribedChatSystems(userId)
  console.log(systems)
}

const nameToInputValue = {
  angry: CameraInput.Angry,
  disgusted: CameraInput.Disgusted,
  fearful: CameraInput.Fearful,
  happy: CameraInput.Happy,
  neutral: CameraInput.Neutral,
  sad: CameraInput.Sad,
  surprised: CameraInput.Surprised
}
async function handleFaceCommand(face: string, entity: any) {
  if (face === undefined || !face || face === '') return

  face = face.toLowerCase().trim()

  Engine.inputState.set(nameToInputValue[face], {
    type: InputType.ONEDIM,
    value: 1,
    lifecycleState: LifecycleValue.Changed
  })

  await delay(2000)

  Engine.inputState.delete(nameToInputValue[face])
}
async function delay(timeout) {
  await this.waitForTimeout(timeout)
}

function handleGetPositionCommand(player: string, userId) {
  if (player === undefined || player === '') return

  const entity = getUserEntityByName(player, userId)
  if (entity === undefined) {
    console.log('undefiend entity')
    return
  }

  const transform = getComponent(entity, TransformComponent)
  if (transform === undefined) {
    console.log('undefined')
    return
  }

  console.log(player + ' position: ' + JSON.stringify(transform.position))
}

function handleGetRotationCommand(player: string, userid) {
  if (player === undefined || player === '') return

  const entity = getUserEntityByName(player, userid)
  if (entity === undefined) return

  const transform = getComponent(entity, TransformComponent)
  if (transform === undefined) return

  console.log(player + ' rotation: ' + JSON.stringify(transform.rotation))
}

function handleGetScaleCommand(player: string, userid) {
  if (player === undefined || player === '') return

  const entity = getUserEntityByName(player, userid)
  if (entity === undefined) return

  const transform = getComponent(entity, TransformComponent)
  if (transform === undefined) return

  console.log(player + ' scale: ' + JSON.stringify(transform.scale))
}

function handleGetTransformCommand(player: string, userid) {
  if (player === undefined || player === '') return

  const entity = getUserEntityByName(player, userid)
  if (entity === undefined) return

  const transform = getComponent(entity, TransformComponent)
  if (transform === undefined) return

  console.log(player + ' transform: ' + JSON.stringify(transform))
}
function handleFollowCommand(param: string, entity: Entity, userid) {
  if (param === 'stop') {
    removeFollowComponent(entity)
  } else {
    const targetEntity = getUserEntityByName(param, userid)
    console.log('follow target entity: ' + targetEntity)
    if (targetEntity === undefined || entity === targetEntity) return
    createFollowComponent(entity, targetEntity)
  }
}

function handleGetChatHistoryCommand() {
  // const chatState = accessChatState()
  // const channelState = chatState.channels
  // const channels = channelState.channels
  // const activeChannelMatch = Object.entries(channels).find(([, channel]) => channel.channelType === 'instance')
  // if (activeChannelMatch && activeChannelMatch.length > 0) {
  //   const activeChannel = activeChannelMatch[1]
  //   if (activeChannel === undefined) return
  //   const messages = activeChannel.messages
  //   if (messages === undefined) return
  //   for (let i = 0; i < messages.length; i++) messages[i].text = removeMessageSystem(messages[i].text)
  //   console.log('messages|' + JSON.stringify(messages))
  // } else {
  //   console.warn("Couldn't get chat state")
  // }
}

function handleListAllUsersCommand(userId) {
  console.log('listallusers, local id: ' + userId)
  if (userId === undefined) return

  const players = getRemoteUsers(userId, true)
  if (players === undefined) return

  const playerNames = players.map((userId) => Engine.currentWorld.clients.get(userId)?.name)
  console.log('players|' + playerNames)
}
function handleGetLocalUserIdCommand(userId) {
  if (userId === undefined || userId === '') return

  console.log('localId|' + userId)
}
async function handleLookAt(param: string, entity: number, userId: string) {
  const targetEntity = getUserEntityByName(param, userId)
  console.log('follow target (' + param + ') entity: ' + targetEntity)
  if (targetEntity === undefined || entity === targetEntity) return

  const selfT: TransformComponent = getComponent(entity, TransformComponent)
  const remoteT: TransformComponent = getComponent(targetEntity, TransformComponent)
  if (selfT === undefined || remoteT === undefined) return
  if (selfT.position === remoteT.position) return

  const remotePos = new Vector3().copy(remoteT.position)
  const selfPos = new Vector3().copy(selfT.position)

  const direction = remotePos.sub(selfPos).normalize()
  const dot = Dot(new Vector3(0, 0, 1), direction)
  let rot: Quaternion = new Quaternion().copy(selfT.rotation)
  let rotAngle = getComponent(entity, FollowCameraComponent).theta

  const fVector = new Vector3(0, 0, 1)
  const selfRot = new Quaternion().copy(selfT.rotation)
  const forwardB = fVector.applyQuaternion(selfRot)

  if (Math.abs(dot - -1.0) < 0.01) {
    rot = new Quaternion(0, 1, 0, Math.PI)
  } else if (Math.abs(dot - 1.0) < 0.000001) {
    rot = new Quaternion(0, 0, 0, 1)
  } else {
    rotAngle = Math.acos(dot)
    let rotAxis = Cross(new Vector3(0, 0, 1), direction)
    rotAxis = rotAxis.normalize()

    const halfAngle = rotAngle * 0.5
    const s = Math.sin(halfAngle)
    rot = new Quaternion(rotAxis.x * s, rotAxis.y * s, rotAxis.z * s, Math.cos(halfAngle))

    getComponent(entity, TransformComponent).rotation = rot

    const theta = -lookAt(selfPos, undefined, remotePos)
    console.log('new camera angle:', theta)

    Engine.inputState.set(BaseInput.LOOKTURN_PLAYERONE, {
      type: InputType.TWODIM,
      value: [0.5, 0],
      lifecycleState: LifecycleValue.Changed
    })

    await delay(500)

    Engine.inputState.delete(BaseInput.LOOKTURN_PLAYERONE)

    //setTargetCameraRotation(entity, getComponent(entity, FollowCameraComponent).phi, theta)

    //getComponent(entity, FollowCameraComponent).theta = theta
  }

  /* getComponent(entity, FollowCameraComponent).locked = false
  getComponent(entity, TransformComponent).rotation = rot
  getComponent(entity, FollowCameraComponent).theta = rotAngle
  getComponent(entity, FollowCameraComponent).phi = rotAngle
  getComponent(entity, FollowCameraComponent).locked = true*/
}
function handleLipSync(pucker: number, widen: number, open: number) {
  lipToInput(pucker, widen, open)
}

function runAnimation(entity: any, emote: string) {
  changeAvatarAnimationState(entity, emote)
}

function getMetadataPosition(_pos: string): Vector3 {
  if (_pos === undefined || _pos === '') return new Vector3(0, 0, 0)

  const _data = _pos.split(',')
  if (_data.length != 3) return new Vector3(0, 0, 0)

  const x = parseFloat(_data[0])
  const y = parseFloat(_data[1])
  const z = parseFloat(_data[2])

  return new Vector3(x, y, z)
}

export function goTo(pos: Vector3, entity: Entity) {
  let linput = getComponent(entity, LocalInputTagComponent)
  if (linput === undefined) linput = addComponent(entity, LocalInputTagComponent, {})
  addComponent(entity, AutoPilotOverrideComponent, {
    overrideCoords: true,
    overridePosition: pos
  })
  addComponent(entity, AutoPilotClickRequestComponent, {
    coords: new Vector2(0.01, 0.01)
  })
}

export function getRemoteUsers(localUserId, notAfk: boolean): UserId[] {
  const world = useWorld()
  const res: UserId[] = []

  for (let [_, client] of world.clients) {
    if (client.userId !== localUserId) {
      if (!notAfk) res.push(client.userId)
      else {
        const eid = world.getUserAvatarEntity(client.userId)
        if (eid !== undefined) {
          const acc = getComponent(eid, AfkCheckComponent)
          if (acc !== undefined && !acc.isAfk) res.push(client.userId)
        }
      }
    }
  }

  return res
}

export function Cross(lhs: Vector3, rhs: Vector3): Vector3 {
  return new Vector3(lhs.y * rhs.z - lhs.z * rhs.y, lhs.z * rhs.x - lhs.x * rhs.z, lhs.x * rhs.y - lhs.y * rhs.x)
}

export function Dot(lhs: Vector3, rhs: Vector3): number {
  return lhs.x * rhs.x + lhs.y * rhs.y + lhs.z * rhs.z
}

export function Project(vector: Vector3, onNormal: Vector3): Vector3 {
  const sqrMag = Dot(onNormal, onNormal)
  if (sqrMag < Number.EPSILON) {
    return new Vector3(0, 0, 0)
  } else {
    const dot = Dot(vector, onNormal)
    return new Vector3((onNormal.x * dot) / sqrMag, (onNormal.y * dot) / sqrMag, (onNormal.z * dot) / sqrMag)
  }
}

export function FromToRotation(aFrom: Vector3, aTo: Vector3): Quaternion {
  const axis = Cross(aFrom, aTo)
  const angle = Angle(aFrom, aTo)
  return AngleAxis(angle, axis.normalize())
}

export function Angle(from: Vector3, to: Vector3): number {
  const kEpsilonNormalSqrt = (1 ^ 10) - 15
  const Deg2Rad = (Math.PI * 2) / 360
  const Rad2Deg = 1 / Deg2Rad

  const denominator = Math.sqrt(SqrMagnitude(from) * SqrMagnitude(to))
  if (denominator < kEpsilonNormalSqrt) {
    console.log('value is lower than kepsilon')
    return 0
  }

  const dot = Clamp(Dot(from, to), -1, 1)
  return Math.acos(dot) * Rad2Deg
}

export function AngleAxis(aAngle: number, aAxis: Vector3): Quaternion {
  const Deg2Rad = (Math.PI * 2) / 360
  aAxis = aAxis.normalize()
  const rad = aAngle * Deg2Rad * 0.5
  return new Quaternion(aAxis.x, aAxis.y, aAxis.z, Math.cos(rad))
}

export function SqrMagnitude(vector: Vector3) {
  return vector.x * vector.x + vector.y * vector.y + vector.z * vector.z
}

export function Clamp(value: number, min: number, max: number): number {
  if (value < min) return min
  if (value > max) return max
  return value
}
