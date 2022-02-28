"use strict";
var common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "w-loading",
  props: {
    text: String,
    mask: Boolean | String,
    click: Boolean | String
  },
  data() {
    return {
      show: false
    };
  },
  methods: {
    preventTouchMove() {
      console.log("stop user scroll it!");
      return;
    },
    Mclose() {
      if (this.click == "false" || this.click == false) {
        this.show = false;
      }
    },
    open() {
      this.show = true;
    },
    close() {
      this.show = false;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.show
  }, $data.show ? {
    b: common_vendor.t($props.text),
    c: common_vendor.n($props.mask == "true" || $props.mask == true ? "mask-show" : ""),
    d: common_vendor.o((...args) => $options.Mclose && $options.Mclose(...args)),
    e: common_vendor.o((...args) => $options.preventTouchMove && $options.preventTouchMove(...args))
  } : {});
}
var Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
