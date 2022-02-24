(function(vue) {
  "use strict";
  function _interopNamespace(e) {
    if (e && e.__esModule)
      return e;
    var n = { __proto__: null, [Symbol.toStringTag]: "Module" };
    if (e) {
      Object.keys(e).forEach(function(k) {
        if (k !== "default") {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: function() {
              return e[k];
            }
          });
        }
      });
    }
    n["default"] = e;
    return Object.freeze(n);
  }
  var vue__namespace = /* @__PURE__ */ _interopNamespace(vue);
  const _sfc_main$3 = {
    setup(__props) {
      const audioInfo = getApp().globalData.audioInfo;
      const audioContext = uni.createInnerAudioContext();
      audioContext.src = getApp().globalData.audioSrc;
      audioContext.autoplay = true;
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "fixed bottom-0 shadow-sm shadow-inner w-full px-2 left-0 h-12 flex items-center" }, [
          vue.createElementVNode("view", { class: "w-10 h-10 border rounded-full overflow-hidden mr-2 relative -top-2" }, [
            vue.createElementVNode("image", {
              class: "w-full h-full",
              src: vue.unref(audioInfo).pic
            }, null, 8, ["src"])
          ]),
          vue.createElementVNode("view", { class: "flex flex-col justify-center items-center flex-1" }, [
            vue.createElementVNode("text", { class: "text-sm text-gray-500" }, "\u6211\u4EEC\u4ECD\u672A\u77E5\u9053\u90A3\u5929\u6240\u89C1\u82B1\u7684\u540D\u5B57"),
            vue.createElementVNode("text", { class: "text-xs text-gray-400" }, "\u5468\u6DF1")
          ]),
          vue.createElementVNode("text", { class: "iconfont icon-bofang2 text-3xl" }),
          vue.createElementVNode("text", { class: "iconfont icon-liebiao_o ml-2 text-3xl" })
        ]);
      };
    }
  };
  var _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$2 = {
    components: {
      TimpAudio: _sfc_main$3
    },
    data() {
      return {
        title: "Hello"
      };
    },
    onLoad() {
    },
    methods: {}
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_timp_audio = vue.resolveComponent("timp-audio");
    return vue.openBlock(), vue.createElementBlock("view", { class: "content" }, [
      vue.createElementVNode("view", { class: "flex bg-gray-100 items-center h-10 border shadow-md w-full pl-2" }, [
        vue.createElementVNode("text", { class: "text-green-500 mr-2 font-bold" }, "TIMP\u97F3\u4E50"),
        vue.createElementVNode("input", {
          class: "flex-1 bg-white px-2 text-sm h-9",
          placeholder: "\u8BF7\u8F93\u5165\u6B4C\u66F2\u540D"
        })
      ]),
      vue.createElementVNode("scroll-view"),
      vue.createVNode(_component_timp_audio)
    ]);
  }
  var PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1]]);
  const _sfc_main$1 = {
    data() {
      return {};
    },
    methods: {}
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", null, " \u6B4C\u5355\u8BE6\u60C5 ");
  }
  var PagesAlbumAlbum = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render]]);
  if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
    Promise.prototype.finally = function(callback) {
      const promise = this.constructor;
      return this.then((value) => promise.resolve(callback()).then(() => value), (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      }));
    };
  }
  if (uni.restoreGlobal) {
    uni.restoreGlobal(vue__namespace, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
  }
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/album/album", PagesAlbumAlbum);
  Object.freeze({});
  Object.freeze([]);
  const objectToString = Object.prototype.toString;
  const toTypeString = (value) => objectToString.call(value);
  const toRawType = (value) => {
    return toTypeString(value).slice(8, -1);
  };
  function isDebugMode() {
    return typeof __channelId__ === "string" && __channelId__;
  }
  function jsonStringifyReplacer(k, p) {
    switch (toRawType(p)) {
      case "Function":
        return "function() { [native code] }";
      default:
        return p;
    }
  }
  function normalizeLog(type, filename, args) {
    if (isDebugMode()) {
      args.push(filename.replace("at ", "uni-app:///"));
      return console[type].apply(console, args);
    }
    const msgs = args.map(function(v) {
      const type2 = toTypeString(v).toLowerCase();
      if (type2 === "[object object]" || type2 === "[object array]") {
        try {
          v = "---BEGIN:JSON---" + JSON.stringify(v, jsonStringifyReplacer) + "---END:JSON---";
        } catch (e) {
          v = type2;
        }
      } else {
        if (v === null) {
          v = "---NULL---";
        } else if (v === void 0) {
          v = "---UNDEFINED---";
        } else {
          const vType = toRawType(v).toUpperCase();
          if (vType === "NUMBER" || vType === "BOOLEAN") {
            v = "---BEGIN:" + vType + "---" + v + "---END:" + vType + "---";
          } else {
            v = String(v);
          }
        }
      }
      return v;
    });
    return msgs.join("---COMMA---") + " " + filename;
  }
  function formatAppLog(type, filename, ...args) {
    const res = normalizeLog(type, filename, args);
    res && console[type](res);
  }
  const _sfc_main = {
    globalData: {
      audioSrc: "http://m7.music.126.net/20220223165847/2515f43e9b9f6afc43cf0e7ad9e2f795/ymusic/obj/w5zDlMODwrDDiGjCn8Ky/3355921739/46f4/f5d9/4418/50d29712324d57b466ed78cc8f7b1892.mp3",
      audioInfo: {
        pic: "https://p2.music.126.net/qpvBqYIqkRhO9Ry2qOCdJQ==/2942293117852634.jpg"
      }
    },
    onLaunch: function() {
      formatAppLog("log", "at App.vue:10", "App Launch");
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:13", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:16", "App Hide");
    }
  };
  function createApp() {
    const app = vue.createVueApp(_sfc_main);
    return {
      app
    };
  }
  const __app__ = createApp().app;
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.use(uni.__vuePlugin).mount("#app");
})(Vue);
