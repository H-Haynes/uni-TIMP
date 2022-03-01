"use strict";
var common_vendor = require("../common/vendor.js");
var promisify = require("../promisify.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const store = common_vendor.useStore();
    const createAlbum = () => {
      promisify.promisify(common_vendor.index.showModal)({
        title: "\u521B\u5EFA\u6B4C\u5355",
        editable: true,
        placeholderText: "\u8BF7\u8F93\u5165\u6B4C\u5355\u540D\u79F0(20\u5B57\u5185)"
      }).then((res) => {
        if (res.confirm) {
          if (res.content.trim().length > 20) {
            return common_vendor.index.showToast({
              title: "\u540D\u79F020\u5B57\u5185",
              icon: "none"
            });
          }
          const albumInfo = {
            id: Math.random().toString(36).substr(2),
            platform: 0,
            pic: "http://preferyou.cn/freed/icon.png",
            name: res.content.trim(),
            list: []
          };
          const albumList = store.state.albumList.slice(0);
          albumList.push(albumInfo);
          common_vendor.index.setStorageSync("albumList", albumList);
          store.commit("setAlbumList", albumList);
        }
      });
    };
    const toAlbum = (id, platform, isRank) => {
      common_vendor.index.navigateTo({
        url: `/pages/album/album?type=${platform}&id=${id}&rank=${isRank}`
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(($event) => toAlbum(0, 0, 0)),
        b: common_vendor.o(createAlbum),
        c: common_vendor.f(common_vendor.unref(store).state.albumList, (item, k0, i0) => {
          return {
            a: item.pic || "http://preferyou.cn/freed/icon.png",
            b: common_vendor.t(item.name),
            c: common_vendor.o(($event) => toAlbum(item.id, 0, 0), item.id),
            d: item.id
          };
        }),
        d: common_vendor.f(common_vendor.unref(store).state.collectList, (item, k0, i0) => {
          return {
            a: item.pic || "http://preferyou.cn/freed/icon.png",
            b: common_vendor.t(item.name),
            c: common_vendor.o(($event) => toAlbum(item.id, item.platform, item.isRank), item.id),
            d: item.id
          };
        })
      };
    };
  }
});
wx.createComponent(_sfc_main);
