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
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(($event) => platform.value = 0),
        b: platform.value === 0 ? 1 : "",
        c: common_vendor.o(($event) => platform.value = 1),
        d: platform.value === 1 ? 1 : "",
        e: common_vendor.o(($event) => platform.value = 2),
        f: platform.value === 2 ? 1 : "",
        g: common_vendor.o(($event) => platform.value = 3),
        h: platform.value === 3 ? 1 : "",
        i: common_vendor.o(($event) => platform.value = 4),
        j: platform.value === 4 ? 1 : "",
        k: platform.value === 0,
        l: platform.value === 1,
        m: platform.value === 2,
        n: platform.value === 3,
        o: platform.value === 4
      };
    };
  }
};
wx.createPage(_sfc_main);
