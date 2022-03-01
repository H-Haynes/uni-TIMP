"use strict";
var common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  setup(__props) {
    const store = common_vendor.useStore();
    const $eventBus = common_vendor.inject("$eventBus");
    const next = () => {
      $eventBus.emit("playNext");
    };
    const prev = () => {
      $eventBus.emit("playPrev");
    };
    const currentTime = common_vendor.ref(store.state.currentTime);
    store.state.audioManager.onPlay && store.state.audioManager.onPlay(() => {
      currentTime.value = store.state.audioManager.currentTime;
    });
    store.state.audioManager.ontimeupdate = () => {
      currentTime.value = store.state.audioManager.currentTime;
    };
    store.state.audioManager.onTimeUpdate && store.state.audioManager.onTimeUpdate(() => {
      currentTime.value = store.state.audioManager.currentTime;
    });
    const lyric = store.state.lyric;
    common_vendor.ref(store.state.audioInfo.time);
    const highlightLine = common_vendor.computed(() => {
      let index = lyric.findIndex((ele, index2) => {
        return currentTime.value > ele.time && (lyric[index2 + 1] ? currentTime.value < lyric[index2 + 1].time : true);
      });
      return index;
    });
    const toggleMode = () => {
      store.commit("changeMode");
    };
    const togglePlay = () => {
      $eventBus.emit(store.state.audioPlaying ? "pause" : "play");
    };
    const setCurrentTime = (e) => {
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select("#progress").boundingClientRect((data) => {
        const percent = e.detail.x / data.width;
        store.state.audioManager.startTime = store.state.audioInfo.time / 1e3 * percent;
      }).exec();
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(store).state.audioInfo.picUrl,
        b: common_vendor.t(common_vendor.unref(store).state.audioInfo.name),
        c: common_vendor.t(common_vendor.unref(store).state.audioInfo.author && common_vendor.unref(store).state.audioInfo.author.map((ele) => ele.name).join("&")),
        d: common_vendor.f(common_vendor.unref(store).state.lyric, (item, index, i0) => {
          return {
            a: common_vendor.t(item.words),
            b: common_vendor.unref(highlightLine) == index ? 1 : "",
            c: "lyric" + index,
            d: item.time + index
          };
        }),
        e: "lyric" + (common_vendor.unref(highlightLine) - 5),
        f: currentTime.value * 1e3 / common_vendor.unref(store).state.audioInfo.time * 100 + "%",
        g: common_vendor.o(setCurrentTime),
        h: common_vendor.o(prev),
        i: common_vendor.unref(store).state.audioPlaying
      }, common_vendor.unref(store).state.audioPlaying ? {
        j: common_vendor.o(togglePlay)
      } : {
        k: common_vendor.o(togglePlay)
      }, {
        l: common_vendor.o(next),
        m: common_vendor.unref(store).state.playMode == 0
      }, common_vendor.unref(store).state.playMode == 0 ? {
        n: common_vendor.o(toggleMode)
      } : common_vendor.unref(store).state.playMode == 1 ? {
        p: common_vendor.o(toggleMode)
      } : common_vendor.unref(store).state.playMode == 2 ? {
        r: common_vendor.o(toggleMode)
      } : {}, {
        o: common_vendor.unref(store).state.playMode == 1,
        q: common_vendor.unref(store).state.playMode == 2,
        s: -1,
        t: `url(${common_vendor.unref(store).state.audioInfo.picUrl})`
      });
    };
  }
};
wx.createPage(_sfc_main);
