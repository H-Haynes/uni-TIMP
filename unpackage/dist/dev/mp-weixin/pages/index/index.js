"use strict";
var common_vendor = require("../../common/vendor.js");
if (!Math) {
  (mine + NeteaseList + QQList + KuwoList + KugouList + TimpAudio)();
}
const TimpAudio = () => "../../components/TimpAudio.js";
const mine = () => "../../components/mine.js";
const NeteaseList = () => "../../components/NeteaseList.js";
const QQList = () => "../../components/QQList.js";
const KuwoList = () => "../../components/kuwoList.js";
const KugouList = () => "../../components/kugouList.js";
const _sfc_main = {
  setup(__props) {
    const platform = common_vendor.ref(0);
    common_vendor.computed(() => {
      switch (platform.value) {
        case 0:
          return mine;
        case 1:
          return NeteaseList;
        case 2:
          return QQList;
        case 3:
          return KuwoList;
        case 4:
          return KugouList;
        default:
          return mine;
      }
    });
    const toSearch = (e) => {
      common_vendor.index.navigateTo({
        url: `/pages/search/search?keywords=${e.detail.value}`
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(toSearch),
        b: common_vendor.o(($event) => platform.value = 0),
        c: platform.value === 0 ? 1 : "",
        d: common_vendor.o(($event) => platform.value = 1),
        e: platform.value === 1 ? 1 : "",
        f: common_vendor.o(($event) => platform.value = 2),
        g: platform.value === 2 ? 1 : "",
        h: common_vendor.o(($event) => platform.value = 3),
        i: platform.value === 3 ? 1 : "",
        j: common_vendor.o(($event) => platform.value = 4),
        k: platform.value === 4 ? 1 : "",
        l: platform.value === 0,
        m: platform.value === 1,
        n: platform.value === 2,
        o: platform.value === 3,
        p: platform.value === 4
      };
    };
  }
};
wx.createPage(_sfc_main);
