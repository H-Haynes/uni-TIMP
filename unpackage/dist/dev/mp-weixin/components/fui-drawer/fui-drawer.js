"use strict";
var common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "fui-drawer",
  emits: ["close"],
  props: {
    show: {
      type: Boolean,
      default: false
    },
    direction: {
      type: String,
      default: "right"
    },
    background: {
      type: String,
      default: "#fff"
    },
    zIndex: {
      type: [Number, String],
      default: 996
    },
    maskClosable: {
      type: Boolean,
      default: true
    },
    maskBackground: {
      type: String,
      default: "rgba(0,0,0,.6)"
    }
  },
  data() {
    let isNvue = false;
    return {
      isNvue,
      isShow: false
    };
  },
  methods: {
    handleClose(e) {
      if (!this.maskClosable)
        return;
      this.$emit("close", {});
    },
    stop(e, tap) {
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.isShow || !$data.isNvue
  }, $data.isShow || !$data.isNvue ? {
    b: common_vendor.n("fui-drawer_" + $props.direction),
    c: common_vendor.n($props.show ? "fui-drawer__show" : ""),
    d: $props.background,
    e: common_vendor.o(($event) => $options.stop($event, true)),
    f: $props.show ? 1 : "",
    g: $props.zIndex,
    h: $props.maskBackground,
    i: $props.direction === "left" ? "flex-start" : "flex-end",
    j: common_vendor.o((...args) => $options.handleClose && $options.handleClose(...args)),
    k: common_vendor.o((...args) => $options.stop && $options.stop(...args))
  } : {});
}
var Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-755fb578"]]);
wx.createComponent(Component);
