import { NetworkWorldAction } from '@xrengine/engine/src/networking/functions/NetworkWorldAction'
import { defineActionCreator, matchesUserId } from '@xrengine/engine/src/networking/interfaces/Action'
import matches from 'ts-matches'

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