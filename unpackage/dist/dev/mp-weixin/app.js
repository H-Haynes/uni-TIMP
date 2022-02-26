"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports[Symbol.toStringTag] = "Module";
var common_vendor = require("./common/vendor.js");
var store_index = require("./store/index.js");
require("./hooks/usePlayInfo.js");
require("./apis/netease.js");
require("./promisify.js");
require("./apis/qq.js");
require("./apis/kuwo.js");
require("./apis/kugou.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/album/album.js";
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
    console.log("App Launch", store);
    const bgAudioManager = common_vendor.index.getBackgroundAudioManager();
    store.commit("setAudioManager", bgAudioManager);
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
