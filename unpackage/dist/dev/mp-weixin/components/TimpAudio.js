"use strict";
var common_vendor = require("../common/vendor.js");
if (!Math) {
  Drawer();
}
const Drawer = () => "./fui-drawer/fui-drawer.js";
const _sfc_main = {
  setup(__props) {
    const defaultPic = common_vendor.readonly("http://preferyou.cn/freed/icon.png");
    const store = common_vendor.useStore();
    const $eventBus = common_vendor.inject("$eventBus");
    const drawRef = common_vendor.ref(null);
    const showDrawer = common_vendor.ref(false);
    const playSong = (song) => {
      $eventBus.emit("playSong", {
        id: song.id,
        platform: song.platform,
        auto: true
      });
    };
    const pause = () => {
      store.state.audioManager.pause();
    };
    const play = () => {
      store.state.audioManager.play();
    };
    const showPlayList = () => {
      console.log(drawRef.value.open);
      showDrawer.value = true;
      drawRef.vlaue && drawRef.value.open();
    };
    const toLyric = () => {
      common_vendor.index.navigateTo({
        url: "/pages/lyric/lyric"
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(toLyric),
        b: common_vendor.unref(store).state.audioPlaying ? 1 : "",
        c: common_vendor.unref(store).state.audioInfo.picUrl || common_vendor.unref(defaultPic),
        d: common_vendor.t(common_vendor.unref(store).state.audioInfo.name || "TIMP,\u4F60\u60F3\u542C\u7684\u90FD\u5728\u8FD9\u91CC!"),
        e: common_vendor.t(common_vendor.unref(store).state.audioInfo.name ? common_vendor.unref(store).state.audioInfo.author.map((ele) => ele.name).join("&") : "\u6682\u65E0\u6B4C\u66F2"),
        f: !common_vendor.unref(store).state.audioPlaying
      }, !common_vendor.unref(store).state.audioPlaying ? {
        g: common_vendor.o(play)
      } : {
        h: common_vendor.o(pause)
      }, {
        i: common_vendor.o(showPlayList),
        j: common_vendor.f(common_vendor.unref(store).state.playList, (song, index, i0) => {
          return {
            a: common_vendor.t(song.name),
            b: common_vendor.t(song.author.map((ele) => ele.name).join("&")),
            c: index % 2 == 0 ? 1 : "",
            d: common_vendor.unref(store).state.audioIdBaseInfo.id == song.id && common_vendor.unref(store).state.audioIdBaseInfo.platform == song.platform ? 1 : "",
            e: song.id,
            f: common_vendor.o(($event) => playSong(song), song.id)
          };
        }),
        k: common_vendor.sr(drawRef, "45c99028-0", {
          "k": "drawRef"
        }),
        l: common_vendor.o(($event) => showDrawer.value = false),
        m: common_vendor.p({
          show: showDrawer.value
        })
      });
    };
  }
};
wx.createComponent(_sfc_main);
