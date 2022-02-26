"use strict";
var common_vendor = require("../common/vendor.js");
const _sfc_main = {
  setup(__props) {
    const store = common_vendor.useStore();
    const pause = () => {
      store.state.audioManager.pause();
    };
    const play = () => {
      store.state.audioManager.play();
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(store).state.audioPlaying ? 1 : "",
        b: common_vendor.unref(store).state.audioInfo.picUrl,
        c: common_vendor.t(common_vendor.unref(store).state.audioInfo.name || "TIMP,\u4F60\u60F3\u542C\u7684\u90FD\u5728\u8FD9\u91CC!"),
        d: common_vendor.t(common_vendor.unref(store).state.audioInfo.name ? common_vendor.unref(store).state.audioInfo.art.map((ele) => ele.name).join("&") : "\u6682\u65E0\u6B4C\u66F2"),
        e: !common_vendor.unref(store).state.audioPlaying
      }, !common_vendor.unref(store).state.audioPlaying ? {
        f: common_vendor.o(play)
      } : {
        g: common_vendor.o(pause)
      });
    };
  }
};
wx.createComponent(_sfc_main);
