import matches from 'ts-matches'

import { defineActionCreator, matchesUserId } from '@xrengine/engine/src/ecs/functions/Action'

export const Action = {
  sendState: defineActionCreator({
    type: 'digital_being.GAME_STATE',
    state: matches.any
  }),

  playerLeave: defineActionCreator({
    type: 'digital_being.PLAYER_LEAVE',
    userId: matchesUserId
  })
}
