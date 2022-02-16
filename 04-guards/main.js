// @ts-check
import "../style.css";
import { createMachine, assign, interpret } from "xstate";
import { raise } from "xstate/lib/actions";
import elements from "../utils/elements";
import { formatTime } from "../utils/formatTime";
import { inspect } from "@xstate/inspect";

inspect({
  iframe: false,
  url: 'https://stately.ai/viz?inspect',
});

const playerMachine = createMachine({
  initial: "loading",
  context: {
    title: undefined,
    artist: undefined,
    duration: 0,
    elapsed: 0,
    likeStatus: "unliked", // or 'liked' or 'disliked'
    volume: 5,
  },
  states: {
    loading: {
      tags: ["loading"],
      on: {
        LOADED: {
          actions: "assignSongData",
          target: "playing",
        },
      },
    },
    paused: {
      on: {
        PLAY: { target: "playing" },
      },
    },
    playing: {
      entry: "playAudio",
      exit: "pauseAudio",
      on: {
        PAUSE: { target: "paused" },
      },
      always: {
        cond: (context) =>  context.elapsed >= context.duration,
        target: 'paused'
      },
      // Add an eventless transition here that always goes to 'paused'
      // when `elapsed` value is >= the `duration` value
    },
  },
  on: {
    SKIP: {
      actions: "skipSong",
      target: "loading",
    },
    LIKE: {
      actions: "likeSong",
    },
    UNLIKE: {
      actions: "unlikeSong",
    },
    DISLIKE: {
      actions: ["dislikeSong", raise("SKIP")],
    },
    "LIKE.TOGGLE": [
      {
        cond: (ctx) => ctx.likeStatus === 'liked',
        actions: raise('UNLIKE'),
      },
      {
        cond: (ctx) => ctx.likeStatus === 'unliked',
        actions: raise('LIKE'),
      },
    ],
    VOLUME: {
      cond: (state, event) => {
        return event.level >= 0 && event.level <= 10;
      },

      actions: "assignVolume",
    },
    "AUDIO.TIME": {
      actions: "assignTime",
    },
  },
}).withConfig({
  actions: {
    assignSongData: assign({
      title: (_, e) => e.data.title,
      artist: (_, e) => e.data.artist,
      duration: (ctx, e) => e.data.duration,
      elapsed: (ctx, e) => 0,
      likeStatus: (ctx, e) => "unliked",
    }),
    likeSong: assign((_context) => ({
      likeStatus: 'liked',
    })),
    unlikeSong: assign((_context) => ({
      likeStatus: 'unliked',
    })),
    dislikeSong: (_, event) =>
      assign((_context) => ({
        likeStatus: "disliked",
      })),
    assignVolume: 
      assign({
      volume: (_, e) => e.level,
    }),
    assignTime: assign({
      elapsed: (_, e) => e.currentTime,
    }),
    skipSong: () => {
      console.log("Skipping song");
    },
    playAudio: () => {},
    pauseAudio: () => {},
  },
  guards: {
    likeToggleLiked: (context) => {
      return context.likeStatus === "liked";
    },
    likeToggleUnLiked: (context) => {
      return context.likeStatus === "unliked";
    },

  },
});

const service = interpret(playerMachine, {devTools: true}).start();
window.service = service;

elements.elPlayButton.addEventListener("click", () => {
  service.send({ type: "PLAY" });
});
elements.elPauseButton.addEventListener("click", () => {
  service.send({ type: "PAUSE" });
});
elements.elSkipButton.addEventListener("click", () => {
  service.send({ type: "SKIP" });
});
elements.elLikeButton.addEventListener("click", () => {
  service.send({ type: "LIKE.TOGGLE" });
});
elements.elDislikeButton.addEventListener("click", () => {
  service.send({ type: "DISLIKE" });
});

service.subscribe((state) => {
  console.log(state.context);
  const { context } = state;

  elements.elLoadingButton.hidden = !state.hasTag("loading");
  elements.elPlayButton.hidden = !state.can({ type: "PLAY" });
  elements.elPauseButton.hidden = !state.can({ type: "PAUSE" });
  elements.elVolumeButton.dataset.level =
    context.volume === 0
      ? "zero"
      : context.volume <= 2
      ? "low"
      : context.volume >= 8
      ? "high"
      : undefined;

  elements.elScrubberInput.setAttribute("max", context.duration);
  elements.elScrubberInput.value = context.elapsed;
  elements.elElapsedOutput.innerHTML = formatTime(
    context.elapsed - context.duration
  );

  console.log("HERE", context)
  elements.elLikeButton.dataset.likeStatus = context.likeStatus;
  elements.elArtist.innerHTML = context.artist;
  elements.elTitle.innerHTML = context.title;
});

service.send({
  type: "LOADED",
  data: {
    title: "Some song title",
    artist: "Some song artist",
    duration: 100,
  },
});
