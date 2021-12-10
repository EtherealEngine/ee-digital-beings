import React from 'react'
import styles from './PlayButtonStyles.module.scss'

interface Props {
  onclick?: any
}

export const PlayButton = (props: Props): any => {
  return (
    <div className={styles.playButtonContainer}>
      <button type="button" onClick={props.onclick} className={styles.playButton}>
        Play Now
      </button>
    </div>
  )
}

PlayButton.defaultProps = { onclick: () => {} }

export default PlayButton
