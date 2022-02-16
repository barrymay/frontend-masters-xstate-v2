// @ts-check
import '../style.css';
import { createMachine, assign, interpret, send } from 'xstate';
import { raise } from 'xstate/lib/actions';
import elements from '../utils/elements';

const playerMachine = createMachine({
  initial: 'loading',
  states: {
    loading: {
      on: {
        LOADED: {
          actions: ['assignSongData'],
          target: 'playing',
        },
      },
    },
    paused: {
      on: {
        PLAY: { target: 'playing' },
      },
    },
    playing: {
      entry: ['playAudio'],
      exit: ['pauseAudio'],
      on: {
        PAUSE: { target: 'paused' },
      },
    },
  },
  on: {
    SKIP: {
      actions: ['skip', raise({type: 'LOADED'})],
      target: 'loading',
    },
    LIKE: {
      actions: ['like'],

      // Add an action to like the song
    },
    UNLIKE: {
      actions: ['unlike'],

      // Add an action to unlike the song
    },
    DISLIKE: {
      actions: ['dislike', 'skip'],

      // Add two actions to dislike the song and raise the skip event
    },
    VOLUME: {
      actions: ['assignVolume'],

      // Add an action to assign to the volume
    },
  },
}).withConfig({
  actions: {
    assignSongData: () => {
      console.log("Assign Song Data")
    },
    playAudio: () => {
      console.log("Play audio")
    },
    pauseAudio: () => {
      console.log("Pause audio")
    },
    skip: () => {
      console.log("Skip Song")
    },
    like: () => {
      console.log("Like")
    },
    unlike: () => {
      console.log("Unlike")
    },
    dislike: () => {
      console.log("Dislike")
    },
    assignVolume: () => {
      console.log("Assign Volume")
    }
    // Add implementations for the actions here, if you'd like
    // For now you can just console.log something
  },
});

elements.elPlayButton.addEventListener('click', () => {
  service.send({ type: 'PLAY' });
});
elements.elPauseButton.addEventListener('click', () => {
  service.send({ type: 'PAUSE' });
});
elements.elSkipButton.addEventListener('click', () => {
  service.send({ type: 'SKIP' });
});
elements.elLikeButton.addEventListener('click', () => {
  service.send({ type: 'LIKE' });
});
elements.elDislikeButton.addEventListener('click', () => {
  service.send({ type: 'DISLIKE' });
});

const service = interpret(playerMachine).start();

service.subscribe((state) => {
  console.log(state.actions);

  elements.elLoadingButton.hidden = !state.matches('loading');
  elements.elPlayButton.hidden = !state.can({ type: 'PLAY' });
  elements.elPauseButton.hidden = !state.can({ type: 'PAUSE' });
});

service.send('LOADED');
