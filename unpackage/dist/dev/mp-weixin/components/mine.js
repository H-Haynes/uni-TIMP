"use strict";
var common_vendor = require("../common/vendor.js");
if (!Array) {
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_easycom_uni_list_item2 + _easycom_uni_list2)();
}
const _easycom_uni_list_item = () => "../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../uni_modules/uni-list/components/uni-list/uni-list.js";
if (!Math) {
  (_easycom_uni_list_item + _easycom_uni_list)();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const myAlbumList = common_vendor.ref([
      {
        name: "\u6211\u559C\u6B22",
        id: 0,
        pic: ""
      },
      {
        name: "\u8F7B\u97F3\u4E50",
        id: 1,
        pic: ""
      }
    ]);
    const myCollectList = common_vendor.ref([
      {
        name: "\u3010\u4E00\u671F\u4E00\u4F1A\u3011\u7EAF\u97F3\u4E50\u5408\u96C6",
        id: 177,
        pic: "",
        type: 1
      },
      {
        name: "\u767D\u566A\u97F3\u7761\u7720\u4E13\u7528\u5408\u96C6",
        id: 88299,
        pic: "",
        type: 2
      }
    ]);
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(myAlbumList.value, (item, k0, i0) => {
          return {
            a: item.id,
            b: "25bfaf2f-1-" + i0 + ",25bfaf2f-0",
            c: common_vendor.p({
              title: item.name,
              thumb: item.pic || "http://preferyou.cn/freed/icon.png",
              thumbSize: "lg"
            })
          };
        }),
        b: common_vendor.p({
          border: false
        }),
        c: common_vendor.f(myCollectList.value, (item, k0, i0) => {
          return {
            a: item.id,
            b: "25bfaf2f-3-" + i0 + ",25bfaf2f-2",
            c: common_vendor.p({
              title: item.name,
              thumb: item.pic || "http://preferyou.cn/freed/icon.png",
              thumbSize: "lg"
            })
          };
        }),
        d: common_vendor.p({
          border: false
        })
      };
    };
  }
});
wx.createComponent(_sfc_main);
