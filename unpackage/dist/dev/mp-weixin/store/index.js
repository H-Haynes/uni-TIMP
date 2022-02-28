"use strict";
var common_vendor = require("../common/vendor.js");
const store = common_vendor.createStore({
  state() {
    return {
      audioManager: null,
      currentTime: 0,
      audioInfo: {
        name: "",
        art: [],
        time: 0,
        picUrl: "",
        albumId: "",
        src: ""
      },
      audioIdBaseInfo: {
        id: "",
        platform: ""
      },
      audioPlaying: false,
      playList: [],
      likeList: [],
      albumList: [],
      collectList: [],
      playMode: 0,
      lyric: []
    };
  },
  mutations: {
    setAudioManager(state, manager) {
      state.audioManager = manager;
    },
    setPlayMode(state, mode) {
      state.playMode = mode;
    },
    changeCurrentTime(state, time) {
      state.currentTime = time;
    },
    setLyric(state, lyric) {
      state.lyric = lyric;
    },
    changeMode(state) {
      state.playMode = (state.playMode + 1) % 3;
    },
    setAduioInfo(state, info) {
      state.audioInfo = info;
      state.audioManager.src = info.src;
      state.audioManager.title = info.name;
    },
    setAudioBaseInfo(state, info) {
      state.audioIdBaseInfo = info;
    },
    setPlayList(state, list) {
      state.playList = list || [];
    },
    setLikeList(state, list) {
      state.likeList = list || [];
    },
    setAlbumList(state, list) {
      state.albumList = list || [];
    },
    setCollectList(state, list) {
      state.collectList = list || [];
    },
    setAudioInfo(state, info) {
      state.audioIdBaseInfo = { id: info.id, platform: info.platform };
      state.audioInfo = info.songInfo;
      state.audioManager.src = info.songInfo.src;
      state.audioManager.title = info.songInfo.name;
    },
    changeAudioPlaying(state, playing) {
      state.audioPlaying = playing;
    }
  },
  actions: {}
});
exports.store = store;
