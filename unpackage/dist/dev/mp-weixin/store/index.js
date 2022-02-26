"use strict";
var common_vendor = require("../common/vendor.js");
var hooks_usePlayInfo = require("../hooks/usePlayInfo.js");
const store = common_vendor.createStore({
  state() {
    return {
      audioManager: null,
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
      }
    };
  },
  mutations: {
    setAudioManager(state, manager) {
      state.audioManager = manager;
    },
    setAduioInfo(state, info) {
      console.log(info);
      state.audioInfo = info;
      state.audioManager.src = info.src;
      state.audioManager.title = info.name;
      state.audioManager.oncanplay = state.audioManager.onCanplay = () => {
        state.audioManager.play();
      };
    },
    setAudioBaseInfo(state, info) {
      state.audioIdBaseInfo = info;
    }
  },
  actions: {
    async changeAudioBaseInfo({ commit }, info) {
      commit("setAudioBaseInfo", info);
      const songInfo = await hooks_usePlayInfo.getSongInfo(info.id, info.platform);
      const songUrl = await hooks_usePlayInfo.getSongUrl(info.id, info.platform);
      if (!songUrl) {
        return common_vendor.index.showToast({
          title: "\u6682\u65E0\u64AD\u653E\u5730\u5740",
          icon: "none"
        });
      }
      songInfo.src = songUrl;
      commit("setAduioInfo", songInfo);
    }
  }
});
exports.store = store;
