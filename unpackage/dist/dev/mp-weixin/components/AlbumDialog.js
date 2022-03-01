"use strict";
var common_vendor = require("../common/vendor.js");
const _sfc_main = {
  props: {
    height: {
      type: String,
      default: "50%"
    },
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ["confirm", "update:show"],
  setup(__props, { emit }) {
    common_vendor.ref(true);
    common_vendor.ref(null);
    const store = common_vendor.useStore();
    const close = () => {
      emit("update:show", false);
    };
    const confirm = (id) => {
      emit("confirm", id);
      emit("update:show", false);
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(close),
        b: __props.show
      }, __props.show ? {
        c: common_vendor.f(common_vendor.unref(store).state.albumList, (album, index, i0) => {
          return {
            a: album.pic,
            b: common_vendor.t(album.name),
            c: common_vendor.o(($event) => confirm(album.id), album.id),
            d: album.id
          };
        }),
        d: __props.height
      } : {}, {
        e: __props.show
      });
    };
  }
};
var Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-68a7170c"]]);
wx.createComponent(Component);
