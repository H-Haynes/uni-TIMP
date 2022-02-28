"use strict";
var common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  emits: ["bannerClick"],
  props: {
    bannerList: {
      type: Array,
      default() {
        return [];
      }
    },
    swiperConfig: {
      type: Object,
      default() {
        return {
          indicatorDots: true,
          indicatorColor: "rgba(255, 255, 255, .4)",
          indicatorActiveColor: "rgba(255, 255, 255, 1)",
          autoplay: false,
          interval: 3e3,
          duration: 300,
          circular: true,
          previousMargin: "40rpx",
          nextMargin: "40rpx"
        };
      }
    },
    scaleX: {
      type: String,
      default: (634 / 550).toFixed(4)
    },
    scaleY: {
      type: String,
      default: (378 / 328).toFixed(4)
    }
  },
  computed: {
    listLen() {
      return this.bannerList.length;
    }
  },
  data() {
    return {
      curIndex: 0,
      descIndex: 0,
      isDescAnimating: false
    };
  },
  methods: {
    swiperChange(e) {
      const that = this;
      this.curIndex = e.detail.current;
      this.isDescAnimating = true;
      let timer = setTimeout(function() {
        that.descIndex = e.detail.current;
        clearTimeout(timer);
      }, 150);
    },
    animationfinish(e) {
      this.isDescAnimating = false;
    },
    bannerClick(item) {
      this.$emit("bannerClick", item);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($props.bannerList, (item, i, i0) => {
      return {
        a: item.pic,
        b: $data.curIndex === i ? "scale(" + $props.scaleX + "," + $props.scaleY + ")" : "scale(1,1)",
        c: common_vendor.o(($event) => $options.bannerClick(item)),
        d: common_vendor.n($data.curIndex === 0 ? i === $options.listLen - 1 ? "item-left" : i === 1 ? "item-right" : "item-center" : $data.curIndex === $options.listLen - 1 ? i === 0 ? "item-right" : i === $options.listLen - 2 ? "item-left" : "item-center" : i === $data.curIndex - 1 ? "item-left" : i === $data.curIndex + 1 ? "item-right" : "item-center"),
        e: i
      };
    }),
    b: $props.swiperConfig.indicatorDots,
    c: $props.swiperConfig.indicatorColor,
    d: $props.swiperConfig.indicatorActiveColor,
    e: $props.swiperConfig.autoplay,
    f: $props.swiperConfig.interval,
    g: $props.swiperConfig.duration,
    h: $props.swiperConfig.circular,
    i: $props.swiperConfig.previousMargin,
    j: $props.swiperConfig.nextMargin,
    k: common_vendor.o((...args) => $options.swiperChange && $options.swiperChange(...args)),
    l: common_vendor.o((...args) => $options.animationfinish && $options.animationfinish(...args))
  };
}
var Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-5562298d"]]);
wx.createComponent(Component);
