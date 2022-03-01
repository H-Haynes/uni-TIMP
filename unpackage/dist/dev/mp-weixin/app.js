"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports[Symbol.toStringTag] = "Module";
var common_vendor = require("./common/vendor.js");
var hooks_usePlayInfo = require("./hooks/usePlayInfo.js");
var store_index = require("./store/index.js");
require("./apis/netease.js");
require("./promisify.js");
require("./apis/qq.js");
require("./apis/kuwo.js");
require("./apis/kugou.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/album/album.js";
  "./pages/lyric/lyric.js";
}
const _sfc_main = {
  globalData: {
    audioSrc: "",
    audioInfo: {
      name: "ss",
      pic: "https://p2.music.126.net/qpvBqYIqkRhO9Ry2qOCdJQ==/2942293117852634.jpg"
    },
    audioName: "yyyy"
  },
  onLaunch: function() {
    const store = common_vendor.useStore();
    const $eventBus = common_vendor.inject("$eventBus");
    console.log("App Launch");
    const bgAudioManager = common_vendor.index.getBackgroundAudioManager();
    store.commit("setAudioManager", bgAudioManager);
    bgAudioManager.onCanplay(() => {
      bgAudioManager.play();
      store.commit("changeAudioPlaying", true);
    });
    bgAudioManager.onPause(() => {
      store.commit("changeAudioPlaying", false);
    });
    bgAudioManager.onStop(() => {
      store.commit("changeAudioPlaying", false);
    });
    bgAudioManager.onEnded(() => {
      store.commit("changeAudioPlaying", false);
      $eventBus.emit("playNext");
    });
    bgAudioManager.onTimeUpdate(() => {
      store.commit("changeCurrentTime", bgAudioManager.currentTime);
    });
    store.commit("setPlayList", common_vendor.index.getStorageSync("playList"));
    store.commit("setLikeList", common_vendor.index.getStorageSync("likeList"));
    store.commit("setAlbumList", common_vendor.index.getStorageSync("albumList"));
    store.commit("setCollectList", common_vendor.index.getStorageSync("collectList"));
    $eventBus.on("addLike", (song) => {
      console.log(1);
      if (store.state.likeList.some((ele) => ele.id == song.id && ele.platform == song.platform)) {
        common_vendor.index.showToast({
          title: "\u6B4C\u66F2\u5DF2\u5B58\u5728",
          icon: "none"
        });
        return;
      }
      const list = [...store.state.likeList, song];
      common_vendor.index.setStorageSync("likeList", list);
      store.commit("setLikeList", list);
    });
    $eventBus.on("unlike", (song) => {
      let list = store.state.likeList.slice(0);
      let index = list.findIndex((ele) => ele.id == song.id && ele.platform == song.platform);
      if (index == -1) {
        return common_vendor.index.showToast({
          title: "\u5217\u8868\u4E2D\u65E0\u6B64\u6B4C\u66F2",
          icon: "none"
        });
      } else {
        list.splice(index, 1);
        common_vendor.index.setStorageSync("likeList", list);
        store.commit("setLikeList", list);
      }
    });
    $eventBus.on("addCollect", (album) => {
      console.log(common_vendor.toRaw(store.state.collectList), album);
      if (store.state.collectList.some((ele) => ele.id == album.id && ele.platform == album.platform)) {
        return common_vendor.index.showToast({
          title: "\u91CD\u590D\u6536\u85CF!",
          icon: "none"
        });
      } else {
        let list = [...store.state.collectList, album];
        common_vendor.index.setStorageSync("collectList", list);
        store.commit("setCollectList", list);
        common_vendor.index.showToast({
          title: "\u6536\u85CF\u6210\u529F",
          icon: "none"
        });
      }
    });
    $eventBus.on("unCollect", (album) => {
      let list = store.state.collectList;
      let index = list.findIndex((ele) => ele.id == album.id && ele.platform == album.platform);
      if (index == -1) {
        return common_vendor.index.showToast({
          title: "\u5217\u8868\u4E2D\u65E0\u6B64\u6B4C\u5355",
          icon: "none"
        });
      } else {
        list.splice(index, 1);
        common_vendor.index.setStorageSync("collectList", list);
        store.commit("setCollectList", list);
        common_vendor.index.showToast({
          title: "\u5DF2\u53D6\u6D88\u6536\u85CF",
          icon: "none"
        });
      }
    });
    $eventBus.on("addSongToAlbum", ({ song, albumId }) => {
      let albumList = common_vendor.index.getStorageSync("albumList") || [];
      let index = albumList.findIndex((ele) => ele.id == albumId);
      if (albumList[index].list.some((ele) => ele.id == song.id && ele.platform == song.platform)) {
        return common_vendor.index.showToast({
          title: "\u91CD\u590D\u6DFB\u52A0",
          icon: "none"
        });
      }
      albumList[index].list.push(song);
      common_vendor.index.setStorageSync("albumList", albumList);
      store.commit("setAlbumList", albumList);
      common_vendor.index.showToast({
        title: "\u6DFB\u52A0\u6210\u529F",
        icon: "none"
      });
    });
    $eventBus.on("delAlbum", (id) => {
      const albumList = common_vendor.index.getStorageSync("albumList");
      let index = albumList.findIndex((ele) => ele.id == id);
      if (index != -1) {
        albumList.splice(index, 1);
        common_vendor.index.setStorageSync("albumList", albumList);
        store.commit("setAlbumList", albumList);
        common_vendor.index.showToast({
          title: "\u5220\u9664\u6210\u529F",
          icon: "none"
        });
      }
    });
    $eventBus.on("playSong", async ({ id, platform, auto = false, force = false }) => {
      if (!id)
        return;
      if (store.state.audioIdBaseInfo.id == id && !force) {
        return;
      }
      const songUrl = await hooks_usePlayInfo.getSongUrl(id, platform);
      if (!songUrl) {
        common_vendor.index.showToast({
          title: "\u6682\u65E0\u64AD\u653E\u5730\u5740",
          icon: "none"
        });
        if (auto) {
          store.commit("setAudioBaseInfo", {
            id,
            platform
          });
          $eventBus.emit("playNext");
        }
        return;
      }
      store.state.audioManager.startTime = 0;
      const songInfo = await hooks_usePlayInfo.getSongInfo(id, platform);
      songInfo.src = songUrl;
      store.commit("setAudioInfo", {
        id,
        platform,
        songInfo
      });
      const lyric = await hooks_usePlayInfo.getLyric(id, platform);
      store.commit("setLyric", lyric);
      if (!auto) {
        let list = store.state.playList.slice(0);
        let index = list.findIndex((ele) => ele.id == id && ele.platform == platform);
        if (index !== -1) {
          list.splice(index, 1);
        }
        list.unshift({
          id,
          platform,
          name: songInfo.name,
          author: songInfo.author
        });
        common_vendor.index.setStorageSync("playList", list);
        store.commit("setPlayList", list);
      }
    });
    $eventBus.on("playAll", async (songList) => {
      common_vendor.index.setStorageSync("playList", songList);
      store.commit("setPlayList", songList);
      $eventBus.emit("playSong", {
        id: songList[0].id,
        platform: songList[0].platform
      });
    });
    $eventBus.on("playNext", () => {
      let playList = store.state.playList;
      let current = store.state.audioIdBaseInfo;
      let playMode = store.state.playMode;
      let index = playList.findIndex((ele) => ele.id == current.id && ele.platform == current.platform);
      if (playMode == 0) {
        index = index == playList.length - 1 ? 0 : index + 1;
      } else if (playMode == 1) {
        index = Math.floor(Math.random() * (playList.length + 1));
      }
      $eventBus.emit("playSong", {
        id: playList[index].id,
        platform: playList[index].platform,
        auto: true,
        force: playMode == 2
      });
    });
    $eventBus.on("playPrev", () => {
      let playList = store.state.playList;
      let current = store.state.audioIdBaseInfo;
      let playMode = store.state.playMode;
      let index = playList.findIndex((ele) => ele.id == current.id && ele.platform == current.platform);
      if (playMode == 0) {
        index = index == 0 ? playList.length - 1 : index - 1;
      } else if (playMode == 1) {
        index = Math.floor(Math.random() * (playList.length + 1));
      }
      $eventBus.emit("playSong", {
        id: playList[index].id,
        platform: playList[index].platform,
        auto: true,
        force: playMode == 2
      });
    });
    $eventBus.on("pause", () => {
      if (!store.state.audioIdBaseInfo.id)
        return;
      store.state.audioManager.pause();
      store.commit("changeAudioPlaying", false);
    });
    $eventBus.on("play", () => {
      if (!store.state.audioIdBaseInfo.id)
        return;
      store.state.audioManager.play();
      store.commit("changeAudioPlaying", true);
    });
  },
  onShow: function() {
    console.log("App Show");
  },
  onHide: function() {
    console.log("App Hide");
  },
  onLoad: function() {
    console.log(9999);
  }
};
const filters = {
  timeFormat: (value) => {
    if (!value)
      return "-";
    const date = new Date(value);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const seconds = date.getSeconds();
    const addZero = (num) => num < 10 ? "0" + num : num;
    return `${year}-${addZero(month)}-${addZero(day)} ${addZero(hour)}:${addZero(minute)}:${addZero(seconds)}`;
  },
  dateFormat: (value) => {
    if (!value)
      return "-";
    const date = new Date(value);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const addZero = (num) => num < 10 ? "0" + num : num;
    return `${year}-${addZero(month)}-${addZero(day)}`;
  },
  durationFormat: (value) => {
    if (!value)
      return "--:--";
    const minute = Math.floor(value / 6e4);
    const second = Math.floor(value % 6e4 / 1e3);
    const addZero = (num) => num < 10 ? "0" + num : num;
    return `${addZero(minute)}:${addZero(second)}`;
  },
  secToMin: (value) => {
    const minute = Math.floor(value / 60);
    const second = Math.floor(value % 60);
    const addZero = (num) => num < 10 ? "0" + num : num;
    return `${addZero(minute)}:${addZero(second)}`;
  },
  countFormat: (value) => {
    if (isNaN(+value))
      return 0;
    if (value < 1e4)
      return value;
    if (value < 1e8)
      return Math.floor(value / 1e4) + "\u4E07";
    return Math.floor(value / 1e8) + "\u4EBF";
  },
  durationTransSec: (value) => {
    if (!value)
      return 0;
    const temp = value.split(":");
    const minute = temp[0];
    const second = temp[1];
    return +minute * 60 + +second;
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  app.use(store_index.store);
  app.provide("$filters", filters);
  app.provide("$eventBus", common_vendor.mitt());
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
