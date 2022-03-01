var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
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
  Object.freeze({});
  Object.freeze([]);
  const isString = (val) => typeof val === "string";
  const objectToString = Object.prototype.toString;
  const toTypeString = (value) => objectToString.call(value);
  const toRawType = (value) => {
    return toTypeString(value).slice(8, -1);
  };
  const ON_LOAD = "onLoad";
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
  function resolveEasycom(component, easycom) {
    return isString(component) ? easycom : component;
  }
  const createHook = (lifecycle) => (hook, target = vue.getCurrentInstance()) => !vue.isInSSRComponentSetup && vue.injectHook(lifecycle, hook, target);
  const onLoad = /* @__PURE__ */ createHook(ON_LOAD);
  function getDevtoolsGlobalHook() {
    return getTarget().__VUE_DEVTOOLS_GLOBAL_HOOK__;
  }
  function getTarget() {
    return typeof navigator !== "undefined" && typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};
  }
  const isProxyAvailable = typeof Proxy === "function";
  const HOOK_SETUP = "devtools-plugin:setup";
  const HOOK_PLUGIN_SETTINGS_SET = "plugin:settings:set";
  class ApiProxy {
    constructor(plugin, hook) {
      this.target = null;
      this.targetQueue = [];
      this.onQueue = [];
      this.plugin = plugin;
      this.hook = hook;
      const defaultSettings = {};
      if (plugin.settings) {
        for (const id in plugin.settings) {
          const item = plugin.settings[id];
          defaultSettings[id] = item.defaultValue;
        }
      }
      const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
      let currentSettings = __spreadValues({}, defaultSettings);
      try {
        const raw = localStorage.getItem(localSettingsSaveId);
        const data = JSON.parse(raw);
        Object.assign(currentSettings, data);
      } catch (e) {
      }
      this.fallbacks = {
        getSettings() {
          return currentSettings;
        },
        setSettings(value) {
          try {
            localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
          } catch (e) {
          }
          currentSettings = value;
        }
      };
      hook.on(HOOK_PLUGIN_SETTINGS_SET, (pluginId, value) => {
        if (pluginId === this.plugin.id) {
          this.fallbacks.setSettings(value);
        }
      });
      this.proxiedOn = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target.on[prop];
          } else {
            return (...args) => {
              this.onQueue.push({
                method: prop,
                args
              });
            };
          }
        }
      });
      this.proxiedTarget = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target[prop];
          } else if (prop === "on") {
            return this.proxiedOn;
          } else if (Object.keys(this.fallbacks).includes(prop)) {
            return (...args) => {
              this.targetQueue.push({
                method: prop,
                args,
                resolve: () => {
                }
              });
              return this.fallbacks[prop](...args);
            };
          } else {
            return (...args) => {
              return new Promise((resolve) => {
                this.targetQueue.push({
                  method: prop,
                  args,
                  resolve
                });
              });
            };
          }
        }
      });
    }
    async setRealTarget(target) {
      this.target = target;
      for (const item of this.onQueue) {
        this.target.on[item.method](...item.args);
      }
      for (const item of this.targetQueue) {
        item.resolve(await this.target[item.method](...item.args));
      }
    }
  }
  function setupDevtoolsPlugin(pluginDescriptor, setupFn) {
    const target = getTarget();
    const hook = getDevtoolsGlobalHook();
    const enableProxy = isProxyAvailable && pluginDescriptor.enableEarlyProxy;
    if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
      hook.emit(HOOK_SETUP, pluginDescriptor, setupFn);
    } else {
      const proxy = enableProxy ? new ApiProxy(pluginDescriptor, hook) : null;
      const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
      list.push({
        pluginDescriptor,
        setupFn,
        proxy
      });
      if (proxy)
        setupFn(proxy.proxiedTarget);
    }
  }
  /*!
   * vuex v4.0.2
   * (c) 2021 Evan You
   * @license MIT
   */
  var storeKey = "store";
  function useStore(key) {
    if (key === void 0)
      key = null;
    return vue.inject(key !== null ? key : storeKey);
  }
  function forEachValue(obj, fn) {
    Object.keys(obj).forEach(function(key) {
      return fn(obj[key], key);
    });
  }
  function isObject$1(obj) {
    return obj !== null && typeof obj === "object";
  }
  function isPromise(val) {
    return val && typeof val.then === "function";
  }
  function assert(condition, msg) {
    if (!condition) {
      throw new Error("[vuex] " + msg);
    }
  }
  function partial(fn, arg) {
    return function() {
      return fn(arg);
    };
  }
  function genericSubscribe(fn, subs, options) {
    if (subs.indexOf(fn) < 0) {
      options && options.prepend ? subs.unshift(fn) : subs.push(fn);
    }
    return function() {
      var i = subs.indexOf(fn);
      if (i > -1) {
        subs.splice(i, 1);
      }
    };
  }
  function resetStore(store2, hot) {
    store2._actions = Object.create(null);
    store2._mutations = Object.create(null);
    store2._wrappedGetters = Object.create(null);
    store2._modulesNamespaceMap = Object.create(null);
    var state = store2.state;
    installModule(store2, state, [], store2._modules.root, true);
    resetStoreState(store2, state, hot);
  }
  function resetStoreState(store2, state, hot) {
    var oldState = store2._state;
    store2.getters = {};
    store2._makeLocalGettersCache = Object.create(null);
    var wrappedGetters = store2._wrappedGetters;
    var computedObj = {};
    forEachValue(wrappedGetters, function(fn, key) {
      computedObj[key] = partial(fn, store2);
      Object.defineProperty(store2.getters, key, {
        get: function() {
          return computedObj[key]();
        },
        enumerable: true
      });
    });
    store2._state = vue.reactive({
      data: state
    });
    if (store2.strict) {
      enableStrictMode(store2);
    }
    if (oldState) {
      if (hot) {
        store2._withCommit(function() {
          oldState.data = null;
        });
      }
    }
  }
  function installModule(store2, rootState, path, module, hot) {
    var isRoot = !path.length;
    var namespace = store2._modules.getNamespace(path);
    if (module.namespaced) {
      if (store2._modulesNamespaceMap[namespace] && true) {
        console.error("[vuex] duplicate namespace " + namespace + " for the namespaced module " + path.join("/"));
      }
      store2._modulesNamespaceMap[namespace] = module;
    }
    if (!isRoot && !hot) {
      var parentState = getNestedState(rootState, path.slice(0, -1));
      var moduleName = path[path.length - 1];
      store2._withCommit(function() {
        {
          if (moduleName in parentState) {
            console.warn('[vuex] state field "' + moduleName + '" was overridden by a module with the same name at "' + path.join(".") + '"');
          }
        }
        parentState[moduleName] = module.state;
      });
    }
    var local = module.context = makeLocalContext(store2, namespace, path);
    module.forEachMutation(function(mutation, key) {
      var namespacedType = namespace + key;
      registerMutation(store2, namespacedType, mutation, local);
    });
    module.forEachAction(function(action, key) {
      var type = action.root ? key : namespace + key;
      var handler = action.handler || action;
      registerAction(store2, type, handler, local);
    });
    module.forEachGetter(function(getter, key) {
      var namespacedType = namespace + key;
      registerGetter(store2, namespacedType, getter, local);
    });
    module.forEachChild(function(child, key) {
      installModule(store2, rootState, path.concat(key), child, hot);
    });
  }
  function makeLocalContext(store2, namespace, path) {
    var noNamespace = namespace === "";
    var local = {
      dispatch: noNamespace ? store2.dispatch : function(_type, _payload, _options) {
        var args = unifyObjectStyle(_type, _payload, _options);
        var payload = args.payload;
        var options = args.options;
        var type = args.type;
        if (!options || !options.root) {
          type = namespace + type;
          if (!store2._actions[type]) {
            console.error("[vuex] unknown local action type: " + args.type + ", global type: " + type);
            return;
          }
        }
        return store2.dispatch(type, payload);
      },
      commit: noNamespace ? store2.commit : function(_type, _payload, _options) {
        var args = unifyObjectStyle(_type, _payload, _options);
        var payload = args.payload;
        var options = args.options;
        var type = args.type;
        if (!options || !options.root) {
          type = namespace + type;
          if (!store2._mutations[type]) {
            console.error("[vuex] unknown local mutation type: " + args.type + ", global type: " + type);
            return;
          }
        }
        store2.commit(type, payload, options);
      }
    };
    Object.defineProperties(local, {
      getters: {
        get: noNamespace ? function() {
          return store2.getters;
        } : function() {
          return makeLocalGetters(store2, namespace);
        }
      },
      state: {
        get: function() {
          return getNestedState(store2.state, path);
        }
      }
    });
    return local;
  }
  function makeLocalGetters(store2, namespace) {
    if (!store2._makeLocalGettersCache[namespace]) {
      var gettersProxy = {};
      var splitPos = namespace.length;
      Object.keys(store2.getters).forEach(function(type) {
        if (type.slice(0, splitPos) !== namespace) {
          return;
        }
        var localType = type.slice(splitPos);
        Object.defineProperty(gettersProxy, localType, {
          get: function() {
            return store2.getters[type];
          },
          enumerable: true
        });
      });
      store2._makeLocalGettersCache[namespace] = gettersProxy;
    }
    return store2._makeLocalGettersCache[namespace];
  }
  function registerMutation(store2, type, handler, local) {
    var entry = store2._mutations[type] || (store2._mutations[type] = []);
    entry.push(function wrappedMutationHandler(payload) {
      handler.call(store2, local.state, payload);
    });
  }
  function registerAction(store2, type, handler, local) {
    var entry = store2._actions[type] || (store2._actions[type] = []);
    entry.push(function wrappedActionHandler(payload) {
      var res = handler.call(store2, {
        dispatch: local.dispatch,
        commit: local.commit,
        getters: local.getters,
        state: local.state,
        rootGetters: store2.getters,
        rootState: store2.state
      }, payload);
      if (!isPromise(res)) {
        res = Promise.resolve(res);
      }
      if (store2._devtoolHook) {
        return res.catch(function(err) {
          store2._devtoolHook.emit("vuex:error", err);
          throw err;
        });
      } else {
        return res;
      }
    });
  }
  function registerGetter(store2, type, rawGetter, local) {
    if (store2._wrappedGetters[type]) {
      {
        console.error("[vuex] duplicate getter key: " + type);
      }
      return;
    }
    store2._wrappedGetters[type] = function wrappedGetter(store3) {
      return rawGetter(local.state, local.getters, store3.state, store3.getters);
    };
  }
  function enableStrictMode(store2) {
    vue.watch(function() {
      return store2._state.data;
    }, function() {
      {
        assert(store2._committing, "do not mutate vuex store state outside mutation handlers.");
      }
    }, { deep: true, flush: "sync" });
  }
  function getNestedState(state, path) {
    return path.reduce(function(state2, key) {
      return state2[key];
    }, state);
  }
  function unifyObjectStyle(type, payload, options) {
    if (isObject$1(type) && type.type) {
      options = payload;
      payload = type;
      type = type.type;
    }
    {
      assert(typeof type === "string", "expects string as the type, but found " + typeof type + ".");
    }
    return { type, payload, options };
  }
  var LABEL_VUEX_BINDINGS = "vuex bindings";
  var MUTATIONS_LAYER_ID = "vuex:mutations";
  var ACTIONS_LAYER_ID = "vuex:actions";
  var INSPECTOR_ID = "vuex";
  var actionId = 0;
  function addDevtools(app, store2) {
    setupDevtoolsPlugin({
      id: "org.vuejs.vuex",
      app,
      label: "Vuex",
      homepage: "https://next.vuex.vuejs.org/",
      logo: "https://vuejs.org/images/icons/favicon-96x96.png",
      packageName: "vuex",
      componentStateTypes: [LABEL_VUEX_BINDINGS]
    }, function(api) {
      api.addTimelineLayer({
        id: MUTATIONS_LAYER_ID,
        label: "Vuex Mutations",
        color: COLOR_LIME_500
      });
      api.addTimelineLayer({
        id: ACTIONS_LAYER_ID,
        label: "Vuex Actions",
        color: COLOR_LIME_500
      });
      api.addInspector({
        id: INSPECTOR_ID,
        label: "Vuex",
        icon: "storage",
        treeFilterPlaceholder: "Filter stores..."
      });
      api.on.getInspectorTree(function(payload) {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          if (payload.filter) {
            var nodes = [];
            flattenStoreForInspectorTree(nodes, store2._modules.root, payload.filter, "");
            payload.rootNodes = nodes;
          } else {
            payload.rootNodes = [
              formatStoreForInspectorTree(store2._modules.root, "")
            ];
          }
        }
      });
      api.on.getInspectorState(function(payload) {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          var modulePath = payload.nodeId;
          makeLocalGetters(store2, modulePath);
          payload.state = formatStoreForInspectorState(getStoreModule(store2._modules, modulePath), modulePath === "root" ? store2.getters : store2._makeLocalGettersCache, modulePath);
        }
      });
      api.on.editInspectorState(function(payload) {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          var modulePath = payload.nodeId;
          var path = payload.path;
          if (modulePath !== "root") {
            path = modulePath.split("/").filter(Boolean).concat(path);
          }
          store2._withCommit(function() {
            payload.set(store2._state.data, path, payload.state.value);
          });
        }
      });
      store2.subscribe(function(mutation, state) {
        var data = {};
        if (mutation.payload) {
          data.payload = mutation.payload;
        }
        data.state = state;
        api.notifyComponentUpdate();
        api.sendInspectorTree(INSPECTOR_ID);
        api.sendInspectorState(INSPECTOR_ID);
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: {
            time: Date.now(),
            title: mutation.type,
            data
          }
        });
      });
      store2.subscribeAction({
        before: function(action, state) {
          var data = {};
          if (action.payload) {
            data.payload = action.payload;
          }
          action._id = actionId++;
          action._time = Date.now();
          data.state = state;
          api.addTimelineEvent({
            layerId: ACTIONS_LAYER_ID,
            event: {
              time: action._time,
              title: action.type,
              groupId: action._id,
              subtitle: "start",
              data
            }
          });
        },
        after: function(action, state) {
          var data = {};
          var duration = Date.now() - action._time;
          data.duration = {
            _custom: {
              type: "duration",
              display: duration + "ms",
              tooltip: "Action duration",
              value: duration
            }
          };
          if (action.payload) {
            data.payload = action.payload;
          }
          data.state = state;
          api.addTimelineEvent({
            layerId: ACTIONS_LAYER_ID,
            event: {
              time: Date.now(),
              title: action.type,
              groupId: action._id,
              subtitle: "end",
              data
            }
          });
        }
      });
    });
  }
  var COLOR_LIME_500 = 8702998;
  var COLOR_DARK = 6710886;
  var COLOR_WHITE = 16777215;
  var TAG_NAMESPACED = {
    label: "namespaced",
    textColor: COLOR_WHITE,
    backgroundColor: COLOR_DARK
  };
  function extractNameFromPath(path) {
    return path && path !== "root" ? path.split("/").slice(-2, -1)[0] : "Root";
  }
  function formatStoreForInspectorTree(module, path) {
    return {
      id: path || "root",
      label: extractNameFromPath(path),
      tags: module.namespaced ? [TAG_NAMESPACED] : [],
      children: Object.keys(module._children).map(function(moduleName) {
        return formatStoreForInspectorTree(module._children[moduleName], path + moduleName + "/");
      })
    };
  }
  function flattenStoreForInspectorTree(result, module, filter, path) {
    if (path.includes(filter)) {
      result.push({
        id: path || "root",
        label: path.endsWith("/") ? path.slice(0, path.length - 1) : path || "Root",
        tags: module.namespaced ? [TAG_NAMESPACED] : []
      });
    }
    Object.keys(module._children).forEach(function(moduleName) {
      flattenStoreForInspectorTree(result, module._children[moduleName], filter, path + moduleName + "/");
    });
  }
  function formatStoreForInspectorState(module, getters, path) {
    getters = path === "root" ? getters : getters[path];
    var gettersKeys = Object.keys(getters);
    var storeState = {
      state: Object.keys(module.state).map(function(key) {
        return {
          key,
          editable: true,
          value: module.state[key]
        };
      })
    };
    if (gettersKeys.length) {
      var tree = transformPathsToObjectTree(getters);
      storeState.getters = Object.keys(tree).map(function(key) {
        return {
          key: key.endsWith("/") ? extractNameFromPath(key) : key,
          editable: false,
          value: canThrow(function() {
            return tree[key];
          })
        };
      });
    }
    return storeState;
  }
  function transformPathsToObjectTree(getters) {
    var result = {};
    Object.keys(getters).forEach(function(key) {
      var path = key.split("/");
      if (path.length > 1) {
        var target = result;
        var leafKey = path.pop();
        path.forEach(function(p) {
          if (!target[p]) {
            target[p] = {
              _custom: {
                value: {},
                display: p,
                tooltip: "Module",
                abstract: true
              }
            };
          }
          target = target[p]._custom.value;
        });
        target[leafKey] = canThrow(function() {
          return getters[key];
        });
      } else {
        result[key] = canThrow(function() {
          return getters[key];
        });
      }
    });
    return result;
  }
  function getStoreModule(moduleMap, path) {
    var names = path.split("/").filter(function(n) {
      return n;
    });
    return names.reduce(function(module, moduleName, i) {
      var child = module[moduleName];
      if (!child) {
        throw new Error('Missing module "' + moduleName + '" for path "' + path + '".');
      }
      return i === names.length - 1 ? child : child._children;
    }, path === "root" ? moduleMap : moduleMap.root._children);
  }
  function canThrow(cb) {
    try {
      return cb();
    } catch (e) {
      return e;
    }
  }
  var Module = function Module2(rawModule, runtime) {
    this.runtime = runtime;
    this._children = Object.create(null);
    this._rawModule = rawModule;
    var rawState = rawModule.state;
    this.state = (typeof rawState === "function" ? rawState() : rawState) || {};
  };
  var prototypeAccessors$1 = { namespaced: { configurable: true } };
  prototypeAccessors$1.namespaced.get = function() {
    return !!this._rawModule.namespaced;
  };
  Module.prototype.addChild = function addChild(key, module) {
    this._children[key] = module;
  };
  Module.prototype.removeChild = function removeChild(key) {
    delete this._children[key];
  };
  Module.prototype.getChild = function getChild(key) {
    return this._children[key];
  };
  Module.prototype.hasChild = function hasChild(key) {
    return key in this._children;
  };
  Module.prototype.update = function update2(rawModule) {
    this._rawModule.namespaced = rawModule.namespaced;
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions;
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations;
    }
    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters;
    }
  };
  Module.prototype.forEachChild = function forEachChild(fn) {
    forEachValue(this._children, fn);
  };
  Module.prototype.forEachGetter = function forEachGetter(fn) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn);
    }
  };
  Module.prototype.forEachAction = function forEachAction(fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn);
    }
  };
  Module.prototype.forEachMutation = function forEachMutation(fn) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn);
    }
  };
  Object.defineProperties(Module.prototype, prototypeAccessors$1);
  var ModuleCollection = function ModuleCollection2(rawRootModule) {
    this.register([], rawRootModule, false);
  };
  ModuleCollection.prototype.get = function get(path) {
    return path.reduce(function(module, key) {
      return module.getChild(key);
    }, this.root);
  };
  ModuleCollection.prototype.getNamespace = function getNamespace(path) {
    var module = this.root;
    return path.reduce(function(namespace, key) {
      module = module.getChild(key);
      return namespace + (module.namespaced ? key + "/" : "");
    }, "");
  };
  ModuleCollection.prototype.update = function update$1(rawRootModule) {
    update([], this.root, rawRootModule);
  };
  ModuleCollection.prototype.register = function register(path, rawModule, runtime) {
    var this$1$1 = this;
    if (runtime === void 0)
      runtime = true;
    {
      assertRawModule(path, rawModule);
    }
    var newModule = new Module(rawModule, runtime);
    if (path.length === 0) {
      this.root = newModule;
    } else {
      var parent = this.get(path.slice(0, -1));
      parent.addChild(path[path.length - 1], newModule);
    }
    if (rawModule.modules) {
      forEachValue(rawModule.modules, function(rawChildModule, key) {
        this$1$1.register(path.concat(key), rawChildModule, runtime);
      });
    }
  };
  ModuleCollection.prototype.unregister = function unregister(path) {
    var parent = this.get(path.slice(0, -1));
    var key = path[path.length - 1];
    var child = parent.getChild(key);
    if (!child) {
      {
        console.warn("[vuex] trying to unregister module '" + key + "', which is not registered");
      }
      return;
    }
    if (!child.runtime) {
      return;
    }
    parent.removeChild(key);
  };
  ModuleCollection.prototype.isRegistered = function isRegistered(path) {
    var parent = this.get(path.slice(0, -1));
    var key = path[path.length - 1];
    if (parent) {
      return parent.hasChild(key);
    }
    return false;
  };
  function update(path, targetModule, newModule) {
    {
      assertRawModule(path, newModule);
    }
    targetModule.update(newModule);
    if (newModule.modules) {
      for (var key in newModule.modules) {
        if (!targetModule.getChild(key)) {
          {
            console.warn("[vuex] trying to add a new module '" + key + "' on hot reloading, manual reload is needed");
          }
          return;
        }
        update(path.concat(key), targetModule.getChild(key), newModule.modules[key]);
      }
    }
  }
  var functionAssert = {
    assert: function(value) {
      return typeof value === "function";
    },
    expected: "function"
  };
  var objectAssert = {
    assert: function(value) {
      return typeof value === "function" || typeof value === "object" && typeof value.handler === "function";
    },
    expected: 'function or object with "handler" function'
  };
  var assertTypes = {
    getters: functionAssert,
    mutations: functionAssert,
    actions: objectAssert
  };
  function assertRawModule(path, rawModule) {
    Object.keys(assertTypes).forEach(function(key) {
      if (!rawModule[key]) {
        return;
      }
      var assertOptions = assertTypes[key];
      forEachValue(rawModule[key], function(value, type) {
        assert(assertOptions.assert(value), makeAssertionMessage(path, key, type, value, assertOptions.expected));
      });
    });
  }
  function makeAssertionMessage(path, key, type, value, expected) {
    var buf = key + " should be " + expected + ' but "' + key + "." + type + '"';
    if (path.length > 0) {
      buf += ' in module "' + path.join(".") + '"';
    }
    buf += " is " + JSON.stringify(value) + ".";
    return buf;
  }
  function createStore(options) {
    return new Store(options);
  }
  var Store = function Store2(options) {
    var this$1$1 = this;
    if (options === void 0)
      options = {};
    {
      assert(typeof Promise !== "undefined", "vuex requires a Promise polyfill in this browser.");
      assert(this instanceof Store2, "store must be called with the new operator.");
    }
    var plugins = options.plugins;
    if (plugins === void 0)
      plugins = [];
    var strict = options.strict;
    if (strict === void 0)
      strict = false;
    var devtools = options.devtools;
    this._committing = false;
    this._actions = Object.create(null);
    this._actionSubscribers = [];
    this._mutations = Object.create(null);
    this._wrappedGetters = Object.create(null);
    this._modules = new ModuleCollection(options);
    this._modulesNamespaceMap = Object.create(null);
    this._subscribers = [];
    this._makeLocalGettersCache = Object.create(null);
    this._devtools = devtools;
    var store2 = this;
    var ref = this;
    var dispatch = ref.dispatch;
    var commit = ref.commit;
    this.dispatch = function boundDispatch(type, payload) {
      return dispatch.call(store2, type, payload);
    };
    this.commit = function boundCommit(type, payload, options2) {
      return commit.call(store2, type, payload, options2);
    };
    this.strict = strict;
    var state = this._modules.root.state;
    installModule(this, state, [], this._modules.root);
    resetStoreState(this, state);
    plugins.forEach(function(plugin) {
      return plugin(this$1$1);
    });
  };
  var prototypeAccessors = { state: { configurable: true } };
  Store.prototype.install = function install(app, injectKey) {
    app.provide(injectKey || storeKey, this);
    app.config.globalProperties.$store = this;
    var useDevtools = this._devtools !== void 0 ? this._devtools : true;
    if (useDevtools) {
      addDevtools(app, this);
    }
  };
  prototypeAccessors.state.get = function() {
    return this._state.data;
  };
  prototypeAccessors.state.set = function(v) {
    {
      assert(false, "use store.replaceState() to explicit replace store state.");
    }
  };
  Store.prototype.commit = function commit(_type, _payload, _options) {
    var this$1$1 = this;
    var ref = unifyObjectStyle(_type, _payload, _options);
    var type = ref.type;
    var payload = ref.payload;
    var options = ref.options;
    var mutation = { type, payload };
    var entry = this._mutations[type];
    if (!entry) {
      {
        console.error("[vuex] unknown mutation type: " + type);
      }
      return;
    }
    this._withCommit(function() {
      entry.forEach(function commitIterator(handler) {
        handler(payload);
      });
    });
    this._subscribers.slice().forEach(function(sub) {
      return sub(mutation, this$1$1.state);
    });
    if (options && options.silent) {
      console.warn("[vuex] mutation type: " + type + ". Silent option has been removed. Use the filter functionality in the vue-devtools");
    }
  };
  Store.prototype.dispatch = function dispatch(_type, _payload) {
    var this$1$1 = this;
    var ref = unifyObjectStyle(_type, _payload);
    var type = ref.type;
    var payload = ref.payload;
    var action = { type, payload };
    var entry = this._actions[type];
    if (!entry) {
      {
        console.error("[vuex] unknown action type: " + type);
      }
      return;
    }
    try {
      this._actionSubscribers.slice().filter(function(sub) {
        return sub.before;
      }).forEach(function(sub) {
        return sub.before(action, this$1$1.state);
      });
    } catch (e) {
      {
        console.warn("[vuex] error in before action subscribers: ");
        console.error(e);
      }
    }
    var result = entry.length > 1 ? Promise.all(entry.map(function(handler) {
      return handler(payload);
    })) : entry[0](payload);
    return new Promise(function(resolve, reject) {
      result.then(function(res) {
        try {
          this$1$1._actionSubscribers.filter(function(sub) {
            return sub.after;
          }).forEach(function(sub) {
            return sub.after(action, this$1$1.state);
          });
        } catch (e) {
          {
            console.warn("[vuex] error in after action subscribers: ");
            console.error(e);
          }
        }
        resolve(res);
      }, function(error) {
        try {
          this$1$1._actionSubscribers.filter(function(sub) {
            return sub.error;
          }).forEach(function(sub) {
            return sub.error(action, this$1$1.state, error);
          });
        } catch (e) {
          {
            console.warn("[vuex] error in error action subscribers: ");
            console.error(e);
          }
        }
        reject(error);
      });
    });
  };
  Store.prototype.subscribe = function subscribe(fn, options) {
    return genericSubscribe(fn, this._subscribers, options);
  };
  Store.prototype.subscribeAction = function subscribeAction(fn, options) {
    var subs = typeof fn === "function" ? { before: fn } : fn;
    return genericSubscribe(subs, this._actionSubscribers, options);
  };
  Store.prototype.watch = function watch$1(getter, cb, options) {
    var this$1$1 = this;
    {
      assert(typeof getter === "function", "store.watch only accepts a function.");
    }
    return vue.watch(function() {
      return getter(this$1$1.state, this$1$1.getters);
    }, cb, Object.assign({}, options));
  };
  Store.prototype.replaceState = function replaceState(state) {
    var this$1$1 = this;
    this._withCommit(function() {
      this$1$1._state.data = state;
    });
  };
  Store.prototype.registerModule = function registerModule(path, rawModule, options) {
    if (options === void 0)
      options = {};
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
      assert(path.length > 0, "cannot register the root module by using registerModule.");
    }
    this._modules.register(path, rawModule);
    installModule(this, this.state, path, this._modules.get(path), options.preserveState);
    resetStoreState(this, this.state);
  };
  Store.prototype.unregisterModule = function unregisterModule(path) {
    var this$1$1 = this;
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
    }
    this._modules.unregister(path);
    this._withCommit(function() {
      var parentState = getNestedState(this$1$1.state, path.slice(0, -1));
      delete parentState[path[path.length - 1]];
    });
    resetStore(this);
  };
  Store.prototype.hasModule = function hasModule(path) {
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
    }
    return this._modules.isRegistered(path);
  };
  Store.prototype.hotUpdate = function hotUpdate(newOptions) {
    this._modules.update(newOptions);
    resetStore(this, true);
  };
  Store.prototype._withCommit = function _withCommit(fn) {
    var committing = this._committing;
    this._committing = true;
    fn();
    this._committing = committing;
  };
  Object.defineProperties(Store.prototype, prototypeAccessors);
  var _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$n = {
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
  function _sfc_render$d(_ctx, _cache, $props, $setup, $data, $options) {
    return $data.isShow || !$data.isNvue ? (vue.openBlock(), vue.createElementBlock("view", {
      key: 0,
      class: vue.normalizeClass(["fui-drawer__popup-wrap", { "fui-drawer__wrap-show": $props.show }]),
      style: vue.normalizeStyle({ zIndex: $props.zIndex, background: $props.maskBackground, alignItems: $props.direction === "left" ? "flex-start" : "flex-end" }),
      onClick: _cache[1] || (_cache[1] = vue.withModifiers((...args) => $options.handleClose && $options.handleClose(...args), ["stop"])),
      onTouchmove: _cache[2] || (_cache[2] = vue.withModifiers((...args) => $options.stop && $options.stop(...args), ["stop", "prevent"])),
      ref: "fui_dwr_mk_ani"
    }, [
      vue.createElementVNode("view", {
        ref: "fui_dwr_ani",
        class: vue.normalizeClass(["fui-drawer__popup", ["fui-drawer_" + $props.direction, $props.show ? "fui-drawer__show" : ""]]),
        style: vue.normalizeStyle({ background: $props.background }),
        onClick: _cache[0] || (_cache[0] = vue.withModifiers(($event) => $options.stop($event, true), ["stop"]))
      }, [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ], 6)
    ], 38)) : vue.createCommentVNode("v-if", true);
  }
  var Drawer = /* @__PURE__ */ _export_sfc(_sfc_main$n, [["render", _sfc_render$d], ["__scopeId", "data-v-755fb578"]]);
  const _sfc_main$m = {
    setup(__props) {
      const defaultPic = vue.readonly("http://preferyou.cn/freed/icon.png");
      const store2 = useStore();
      const $eventBus = vue.inject("$eventBus");
      const drawRef = vue.ref(null);
      const showDrawer = vue.ref(false);
      const playSong = (song) => {
        $eventBus.emit("playSong", {
          id: song.id,
          platform: song.platform,
          auto: true
        });
      };
      const pause = () => {
        $eventBus.emit("pause");
      };
      const play = () => {
        $eventBus.emit("play");
      };
      const showPlayList = () => {
        formatAppLog("log", "at components/TimpAudio.vue:73", drawRef.value.open);
        showDrawer.value = true;
        drawRef.vlaue && drawRef.value.open();
      };
      const toLyric = () => {
        if (!store2.state.audioIdBaseInfo.id) {
          return uni.showToast({
            title: "\u6682\u65E0\u64AD\u653E\u66F2\u76EE",
            icon: "none"
          });
        }
        uni.navigateTo({
          url: "/pages/lyric/lyric"
        });
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "fixed bottom-0 shadow-sm shadow-inner w-full left-0 h-12 flex items-center" }, [
          vue.createElementVNode("view", {
            class: "filter grayscale linear-bg w-full h-full",
            style: { "filter": "blur(1px)" }
          }),
          vue.createElementVNode("view", { class: "absolute left-0 top-0 w-full h-full items-center flex px-2 text-white" }, [
            vue.createElementVNode("view", { class: "w-12 h-12 border rounded-full overflow-hidden mr-2 relative -top-2" }, [
              vue.createElementVNode("image", {
                onClick: toLyric,
                class: vue.normalizeClass([{ "album-rotate": vue.unref(store2).state.audioPlaying }, "w-full h-full"]),
                src: vue.unref(store2).state.audioInfo.picUrl || vue.unref(defaultPic)
              }, null, 10, ["src"])
            ]),
            vue.createElementVNode("view", { class: "flex flex-col justify-center items-center flex-1 truncate" }, [
              vue.createElementVNode("text", { class: "text-sm text-gray-200 truncate" }, vue.toDisplayString(vue.unref(store2).state.audioInfo.name || "TIMP,\u4F60\u60F3\u542C\u7684\u90FD\u5728\u8FD9\u91CC!"), 1),
              vue.createElementVNode("text", { class: "text-xs text-gray-300 truncate" }, vue.toDisplayString(vue.unref(store2).state.audioInfo.name ? vue.unref(store2).state.audioInfo.author.map((ele) => ele.name).join("&") : "\u6682\u65E0\u6B4C\u66F2"), 1)
            ]),
            !vue.unref(store2).state.audioPlaying ? (vue.openBlock(), vue.createElementBlock("text", {
              key: 0,
              class: "iconfont icon-bofang2 text-3xl",
              onClick: play
            })) : (vue.openBlock(), vue.createElementBlock("text", {
              key: 1,
              class: "iconfont icon-zantingtingzhi ml-2 text-2xl",
              onClick: pause
            })),
            vue.createElementVNode("text", {
              onClick: showPlayList,
              class: "iconfont icon-liebiao_o ml-2 text-3xl"
            })
          ]),
          vue.createVNode(Drawer, {
            ref_key: "drawRef",
            ref: drawRef,
            show: showDrawer.value,
            onClose: _cache[0] || (_cache[0] = ($event) => showDrawer.value = false)
          }, {
            default: vue.withCtx(() => [
              vue.createElementVNode("view", { class: "w-64 h-full bg-gray-50 flex flex-col" }, [
                vue.createElementVNode("view", { class: "flex justify-between text-sm linear-bg text-white py-3 px-3" }, [
                  vue.createElementVNode("text", null, "\u6B4C\u66F2\u540D"),
                  vue.createElementVNode("text", null, "\u6B4C\u624B")
                ]),
                vue.createElementVNode("scroll-view", {
                  class: "flex-1 overflow-hidden",
                  "scroll-y": "true"
                }, [
                  (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(store2).state.playList, (song, index) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      class: vue.normalizeClass(["py-3 text-gray-500 px-3 flex justify-between text-xs", {
                        "bg-gray-200": index % 2 == 0,
                        "text-red": vue.unref(store2).state.audioIdBaseInfo.id == song.id && vue.unref(store2).state.audioIdBaseInfo.platform == song.platform
                      }]),
                      key: song.id,
                      onClick: ($event) => playSong(song)
                    }, [
                      vue.createElementVNode("text", { class: "truncate mr-2 flex-2 flex-shrink-0" }, vue.toDisplayString(song.name), 1),
                      vue.createElementVNode("text", { class: "truncate flex-1 text-right" }, vue.toDisplayString(song.author.map((ele) => ele.name).join("&")), 1)
                    ], 10, ["onClick"]);
                  }), 128))
                ])
              ])
            ]),
            _: 1
          }, 8, ["show"])
        ]);
      };
    }
  };
  var TimpAudio = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["__scopeId", "data-v-d1c9d3da"]]);
  var promisify = (api) => {
    return (options, ...params) => {
      return new Promise((resolve, reject) => {
        api(Object.assign({}, options, {
          success: resolve,
          fail: reject
        }), ...params);
      });
    };
  };
  const _sfc_main$l = /* @__PURE__ */ vue.defineComponent({
    setup(__props) {
      const store2 = useStore();
      const createAlbum = () => {
        promisify(uni.showModal)({
          title: "\u521B\u5EFA\u6B4C\u5355",
          editable: true,
          placeholderText: "\u8BF7\u8F93\u5165\u6B4C\u5355\u540D\u79F0(20\u5B57\u5185)"
        }).then((res) => {
          if (res.confirm) {
            if (res.content.trim().length > 20) {
              return uni.showToast({
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
            const albumList = store2.state.albumList.slice(0);
            albumList.push(albumInfo);
            uni.setStorageSync("albumList", albumList);
            store2.commit("setAlbumList", albumList);
          }
        });
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", null, [
          vue.createElementVNode("view", { class: "my-2 px-4 mt-5" }, [
            vue.createElementVNode("view", { class: "flex justify-between mb-2" }, [
              vue.createElementVNode("text", { class: "text-xl font-bold" }, "\u6211\u7684\u97F3\u4E50")
            ]),
            vue.createElementVNode("view", { class: "flex px-5 items-center py-2 border-b" }, [
              vue.createElementVNode("image", {
                class: "w-12 h-12 rounded mr-3",
                src: "http://preferyou.cn/freed/icon.png"
              }),
              vue.createElementVNode("text", { class: "text-sm text-gray-500" }, "\u6211\u559C\u6B22")
            ])
          ]),
          vue.createElementVNode("view", { class: "my-2 px-4 mt-5" }, [
            vue.createElementVNode("view", { class: "flex justify-between mb-2" }, [
              vue.createElementVNode("text", { class: "text-xl font-bold" }, "\u6211\u7684\u6B4C\u5355"),
              vue.createElementVNode("view", { class: "flex items-center text-gray-400" }, [
                vue.createElementVNode("text", {
                  onClick: createAlbum,
                  class: "iconfont icon-plus text-xl"
                }),
                vue.createElementVNode("text", { class: "iconfont icon-guanbi text-lg ml-3" })
              ])
            ]),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(store2).state.albumList, (item) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: item.id,
                class: "flex px-5 items-center py-2 border-b"
              }, [
                vue.createElementVNode("image", {
                  class: "w-12 h-12 rounded mr-3",
                  src: item.pic || "http://preferyou.cn/freed/icon.png"
                }, null, 8, ["src"]),
                vue.createElementVNode("text", { class: "text-sm text-gray-500" }, vue.toDisplayString(item.name), 1)
              ]);
            }), 128))
          ]),
          vue.createElementVNode("view", { class: "my-2 px-4" }, [
            vue.createElementVNode("text", { class: "text-xl font-bold" }, "\u6211\u7684\u6536\u85CF"),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(store2).state.collectList, (item) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: item.id,
                class: "flex px-5 items-center py-2 border-b"
              }, [
                vue.createElementVNode("image", {
                  class: "w-12 h-12 rounded mr-3",
                  src: item.pic || "http://preferyou.cn/freed/icon.png"
                }, null, 8, ["src"]),
                vue.createElementVNode("text", { class: "text-sm text-gray-500" }, vue.toDisplayString(item.name), 1)
              ]);
            }), 128))
          ])
        ]);
      };
    }
  });
  const _sfc_main$k = {
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
        formatAppLog("log", "at components/w-loading/w-loading.vue:35", "stop user scroll it!");
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
  function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(vue.Fragment, null, [
      $data.show ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: vue.normalizeClass(["mask", $props.mask == "true" || $props.mask == true ? "mask-show" : ""]),
        onClick: _cache[0] || (_cache[0] = (...args) => $options.Mclose && $options.Mclose(...args)),
        onTouchmove: _cache[1] || (_cache[1] = vue.withModifiers((...args) => $options.preventTouchMove && $options.preventTouchMove(...args), ["stop", "prevent"]))
      }, [
        vue.createCommentVNode(" \u52A0\u8F7D\u52A8\u753B\u5F00\u59CB "),
        vue.createCommentVNode(" loading1~loading30\u6311\u9009\u4EFB\u610F\u4E00\u4E2A\u66FF\u6362\u4E0B\u65B9html \u4E14\u66FF\u6362\u5BF9\u5E94css "),
        vue.createCommentVNode(' <view class="container">\r\n      <view class="popsicle">\r\n        <view class="colors"></view>\r\n      </view>\r\n      <view class="stick"></view>\r\n      <view class="shadow"></view>\r\n    </view> '),
        vue.createElementVNode("view", { class: "preloader" }, [
          vue.createElementVNode("view", { class: "loader" })
        ]),
        vue.createCommentVNode(" \u52A0\u8F7D\u52A8\u753B\u7ED3\u675F "),
        vue.createElementVNode("view", { class: "title" }, vue.toDisplayString($props.text), 1)
      ], 34)) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" \u906E\u7F69\u5C42")
    ], 2112);
  }
  var wLoading = /* @__PURE__ */ _export_sfc(_sfc_main$k, [["render", _sfc_render$c], ["__scopeId", "data-v-85c3a0dc"]]);
  const prefix$3 = "http://preferyou.cn/wy";
  const request$3 = promisify(uni.request);
  const getRecommendWy = () => {
    return request$3({
      url: `${prefix$3}/personalized?limit=120`,
      method: "GET"
    });
  };
  const getBannerWy = () => {
    return request$3({
      url: `${prefix$3}/banner`,
      method: "GET"
    });
  };
  const getCategoryListWy = () => {
    return request$3({
      url: `${prefix$3}/playlist/catlist/hot`,
      methods: "GET"
    });
  };
  const getAlbumListWy = (type, page = 1) => {
    return request$3({
      url: `${prefix$3}/top/playlist?cat=${type}&offset=${(page - 1) * 50}`,
      method: "GET"
    });
  };
  const getRankListWy = () => {
    return request$3({
      url: `${prefix$3}/toplist`,
      method: "GET"
    });
  };
  const getAlbumDetailWy = (id) => {
    return request$3({
      url: `${prefix$3}/playlist/detail?id=${id}`,
      methods: "GET"
    });
  };
  const getSongUrlWy = (id) => {
    return request$3({ url: `${prefix$3}/song/url?id=${id}` });
  };
  const getSongDetailWy = (id) => {
    return request$3({ url: `${prefix$3}/song/detail?ids=${id}` });
  };
  const getLyricWy = (id) => {
    return request$3({ url: `${prefix$3}/lyric?id=${id}` });
  };
  const _sfc_main$j = {
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
  function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("div", { class: "banner-container" }, [
      vue.createElementVNode("swiper", {
        style: { width: "100vw", height: "340rpx" },
        "indicator-dots": $props.swiperConfig.indicatorDots,
        "indicator-color": $props.swiperConfig.indicatorColor,
        "indicator-active-color": $props.swiperConfig.indicatorActiveColor,
        autoplay: $props.swiperConfig.autoplay,
        interval: $props.swiperConfig.interval,
        duration: $props.swiperConfig.duration,
        circular: $props.swiperConfig.circular,
        "previous-margin": $props.swiperConfig.previousMargin,
        "next-margin": $props.swiperConfig.nextMargin,
        onChange: _cache[0] || (_cache[0] = (...args) => $options.swiperChange && $options.swiperChange(...args)),
        onAnimationfinish: _cache[1] || (_cache[1] = (...args) => $options.animationfinish && $options.animationfinish(...args))
      }, [
        (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList($props.bannerList, (item, i) => {
          return vue.openBlock(), vue.createElementBlock("swiper-item", { key: i }, [
            vue.createCommentVNode(" 1.\u5F53\u524D\u5C55\u793A\u4E3A\u7B2C1\u9879\u65F6\uFF0CbannerList\u6700\u540E\u4E00\u9879\u548C\u7B2C\u4E8C\u9879\u7684justifyContent\u503C\u5206\u522B\u4E3Aflex-end\u548Cflex-start\uFF0C\u5176\u4F59\u9879\u503C\u4E3Acenter "),
            vue.createCommentVNode(" 2.\u5F53\u524D\u5C55\u793A\u4E3A\u6700\u540E\u4E00\u9879\u65F6\uFF0CbannerList\u5012\u6570\u7B2C2\u9879\u548C\u7B2C1\u9879\u7684justifyContent\u503C\u5206\u522B\u4E3Aflex-end\u548Cflex-start\uFF0C\u5176\u4F59\u9879\u503C\u4E3Acenter "),
            vue.createCommentVNode(" 3.\u5F53\u524D\u5C55\u793A\u4E3A\u5176\u4ED6\u9879\uFF08\u975E\u7B2C1\u548C\u6700\u540E1\u9879\uFF09\u65F6\uFF0CbannerList\u5F53\u524D\u9879\u7684\u524D1\u9879\u548C\u540E1\u9879\u7684justifyContent\u503C\u5206\u522B\u4E3Aflex-end\u548Cflex-start\uFF0C\u5176\u4F59\u9879\u503C\u4E3Acenter "),
            vue.createCommentVNode(" 4.padding\u503C\u4E5F\u9700\u8981\u6839\u636E\u4E0D\u540C\u9879\u8BBE\u5B9A\u4E0D\u540C\u503C\uFF0C\u4F46\u7406\u540CjustifyContent "),
            vue.createElementVNode("div", {
              class: vue.normalizeClass(["image-container", [$data.curIndex === 0 ? i === $options.listLen - 1 ? "item-left" : i === 1 ? "item-right" : "item-center" : $data.curIndex === $options.listLen - 1 ? i === 0 ? "item-right" : i === $options.listLen - 2 ? "item-left" : "item-center" : i === $data.curIndex - 1 ? "item-left" : i === $data.curIndex + 1 ? "item-right" : "item-center"]])
            }, [
              vue.createElementVNode("image", {
                src: item.pic,
                class: "slide-image",
                style: vue.normalizeStyle({
                  transform: $data.curIndex === i ? "scale(" + $props.scaleX + "," + $props.scaleY + ")" : "scale(1,1)",
                  transitionDuration: ".3s",
                  transitionTimingFunction: "ease"
                }),
                onClick: ($event) => $options.bannerClick(item)
              }, null, 12, ["src", "onClick"])
            ], 2)
          ]);
        }), 128))
      ], 40, ["indicator-dots", "indicator-color", "indicator-active-color", "autoplay", "interval", "duration", "circular", "previous-margin", "next-margin"])
    ]);
  }
  var myBanner = /* @__PURE__ */ _export_sfc(_sfc_main$j, [["render", _sfc_render$b], ["__scopeId", "data-v-5562298d"]]);
  const _sfc_main$i = /* @__PURE__ */ vue.defineComponent({
    setup(__props) {
      const albumList = vue.ref([]);
      const bannerList = vue.ref([]);
      const categoryList = vue.ref([]);
      const showAllCategory = vue.ref(false);
      const currentCategory = vue.ref(null);
      const page = vue.ref(1);
      const loading = vue.ref(false);
      const loadingRef = vue.ref(null);
      getApp().globalData.audioInfo.name = "8888";
      getRecommendWy().then((res) => {
        if (res.data.result) {
          albumList.value = res.data.result.map((ele) => ({
            name: ele.name,
            pic: ele.picUrl,
            id: ele.id
          }));
        }
      });
      getBannerWy().then((res) => {
        if (res.data.code === 200) {
          bannerList.value = res.data.banners.map((ele) => ({
            pic: ele.imageUrl,
            type: ele.targetType === 1 ? 1 : 2,
            id: ele.targetId
          }));
        }
      });
      getCategoryListWy().then((res) => {
        if (res.data.code === 200) {
          categoryList.value = res.data.sub.map((ele) => ({
            id: ele.name,
            name: ele.name,
            type: 1
          }));
        }
      });
      const handleBannerClick = (e) => {
        formatAppLog("log", "at components/NeteaseList.vue:74", vue.toRaw(e));
      };
      const getRankList = () => {
        loading.value = true;
        getRankListWy().then((res) => {
          if (res.data.code === 200) {
            albumList.value = res.data.list.map((ele) => ({
              name: ele.name,
              id: ele.id,
              pic: ele.coverImgUrl,
              rank: 1
            }));
          }
        }).finally(() => {
          loading.value = false;
        });
      };
      const changeCategory = (category) => {
        if (category === currentCategory)
          return;
        currentCategory.value = category;
        page.value = 1;
      };
      const getAlbumList = async (category, pageNum = 1) => {
        page.value = pageNum;
        currentCategory.value = category;
        loading.value = true;
        const albumListResult = await getAlbumListWy(category, pageNum);
        if (albumListResult.data.code === 200) {
          const list = albumListResult.data.playlists.map((ele) => {
            return {
              id: ele.id,
              name: ele.name,
              pic: ele.coverImgUrl
            };
          });
          albumList.value = pageNum == 1 ? list : albumList.value.concat(list);
        }
        loading.value = false;
      };
      const detail = ({ id, rank }) => {
        uni.navigateTo({
          url: `/pages/album/album?type=1&id=${id}&rank=${rank || 0}`
        });
      };
      vue.watch([() => currentCategory.value, () => page.value], () => {
        if (+currentCategory.value === 0) {
          getRankList();
        } else if (currentCategory.value) {
          getAlbumList(currentCategory.value, page.value);
        }
      });
      const scroll = () => {
        if (loading.value || !currentCategory.value || currentCategory.value == "0")
          return;
        page.value += 1;
      };
      vue.watch(() => loading.value, () => {
        if (loading.value) {
          loadingRef.value && loadingRef.value.open();
        } else {
          loadingRef.value && loadingRef.value.close();
        }
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("scroll-view", {
          onScrolltolower: scroll,
          onLowerThreshold: ($event) => 200,
          "scroll-y": "",
          class: "h-full"
        }, [
          vue.createVNode(wLoading, {
            mask: "true",
            click: "true",
            ref_key: "loadingRef",
            ref: loadingRef
          }, null, 512),
          vue.createVNode(myBanner, {
            scaleY: "1.1",
            scaleX: "1.1",
            onBannerClick: handleBannerClick,
            bannerList: bannerList.value
          }, null, 8, ["bannerList"]),
          vue.createElementVNode("view", { class: "my-3 px-2" }, [
            vue.createElementVNode("text", {
              onClick: _cache[0] || (_cache[0] = ($event) => changeCategory(0)),
              class: vue.normalizeClass([{ "current-category border-gray-100": currentCategory.value === 0 }, "inline-block text-sm text-red-500 border border-red-500 mr-1 px-2 mb-2"])
            }, "\u6392\u884C\u699C", 2),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(categoryList.value.slice(0, 10), (category) => {
              return vue.openBlock(), vue.createElementBlock("text", {
                onClick: ($event) => changeCategory(category.id),
                class: vue.normalizeClass([{ "current-category": currentCategory.value === category.id }, "inline-block text-gray-500 text-sm mr-1 border px-2 mb-2"]),
                key: category.id
              }, vue.toDisplayString(category.name), 11, ["onClick"]);
            }), 128)),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(categoryList.value.slice(10, categoryList.value.length - 1), (category) => {
              return vue.withDirectives((vue.openBlock(), vue.createElementBlock("text", {
                onClick: ($event) => changeCategory(category.id),
                class: vue.normalizeClass([{ "current-category": currentCategory.value === category.id, "hidden": !showAllCategory.value }, "inline-block text-gray-500 text-sm mr-1 border px-2 mb-2"]),
                key: category.id
              }, vue.toDisplayString(category.name), 11, ["onClick"])), [
                [vue.vShow, showAllCategory.value]
              ]);
            }), 128)),
            !showAllCategory.value ? (vue.openBlock(), vue.createElementBlock("text", {
              key: 0,
              onClick: _cache[1] || (_cache[1] = ($event) => showAllCategory.value = true),
              class: "inline-block text-gray-500 text-sm mr-1 border px-2 mb-2"
            }, "\xB7\xB7\xB7")) : (vue.openBlock(), vue.createElementBlock("text", {
              key: 1,
              onClick: _cache[2] || (_cache[2] = ($event) => showAllCategory.value = false),
              class: "inline-block text-gray-500 text-sm mr-1 border px-2 mb-2"
            }, "\u6536\u8D77"))
          ]),
          vue.createElementVNode("view", { class: "flex flex-wrap justify-around" }, [
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(albumList.value, (album) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                onClick: ($event) => detail(album),
                class: "w-28",
                key: album.id
              }, [
                vue.createElementVNode("image", {
                  class: "w-28 h-28 rounded",
                  "lazy-load": true,
                  src: album.pic
                }, null, 8, ["src"]),
                vue.createElementVNode("text", { class: "text-xs inline-block leading-5 h-10 overflow-hidden" }, vue.toDisplayString(album.name), 1)
              ], 8, ["onClick"]);
            }), 128)),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(3 - albumList.value.length % 3, (item) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                class: "w-28 empty",
                key: item
              });
            }), 128))
          ])
        ], 32);
      };
    }
  });
  var NeteaseList = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["__scopeId", "data-v-f2301884"]]);
  const prefix$2 = "http://preferyou.cn/qq";
  const request$2 = promisify(uni.request);
  const getRecommendQQ = () => {
    return request$2({
      url: `${prefix$2}/getRecommend`,
      method: "GET"
    });
  };
  const getCategoryListQQ = () => {
    return request$2({
      url: `${prefix$2}/getSongListCategories`,
      methods: "GET"
    });
  };
  const getAlbumListQQ = (type, page = 1) => {
    return request$2({
      url: `${prefix$2}/getSongLists?categoryId=${type}&page=${page}`,
      method: "GET"
    });
  };
  const getRankListQQ = () => {
    return request$2({
      url: `${prefix$2}/getTopLists?limit=50`,
      method: "GET"
    });
  };
  const getAlbumDetailQQ = (id) => {
    return request$2({
      url: `${prefix$2}//getSongListDetail?disstid=${id}`,
      methods: "GET"
    });
  };
  const getRankDetailQQ = (id) => {
    return request$2({
      url: `${prefix$2}/getRanks?topId=${id}&limit=100`,
      method: "GET"
    });
  };
  const getSongUrlQQ = (id) => {
    return request$2({ url: `${prefix$2}/getMusicPlay?songmid=${id}` });
  };
  const getSongInfoQQ = (id) => {
    return request$2({ url: `${prefix$2}/getSongInfo?songmid=${id}` });
  };
  const getSongPicQQ = (id) => {
    return request$2({ url: `${prefix$2}/getImageUrl?id=${id}` });
  };
  const getLyricQQ = (id) => {
    return request$2({ url: `${prefix$2}/getLyric?songmid=${id}` });
  };
  const _sfc_main$h = /* @__PURE__ */ vue.defineComponent({
    setup(__props) {
      const albumList = vue.ref([]);
      const bannerList = vue.ref([]);
      const categoryList = vue.ref([]);
      const showAllCategory = vue.ref(false);
      const currentCategory = vue.ref(null);
      const page = vue.ref(1);
      const loading = vue.ref(false);
      const loadingRef = vue.ref(null);
      getRecommendQQ().then((res) => {
        if (res.data.response.code === 0) {
          albumList.value = res.data.response.playlist.data.v_playlist.map((ele) => ({
            name: ele.title,
            pic: ele.cover_url_small,
            id: ele.tid
          }));
          bannerList.value = res.data.response.focus.data.content.map((ele) => ({
            pic: ele.pic_info.url,
            id: ele.jump_info.url,
            type: ele.type === 10002 ? 1 : 2
          }));
        }
      });
      getCategoryListQQ().then((res) => {
        if (res.data.response.code === 0) {
          let list = res.data.response.data.categories.map((ele) => {
            return ele.items.map((e) => ({
              name: e.categoryName,
              id: e.categoryId,
              type: 2
            }));
          });
          categoryList.value = list.reduce((pre, cur) => pre.concat(cur), []);
        }
      });
      const handleBannerClick = (e) => {
        formatAppLog("log", "at components/QQList.vue:69", vue.toRaw(e));
      };
      const getRankList = () => {
        loading.value = true;
        getRankListQQ().then((res) => {
          if (res.data.response.code === 0) {
            albumList.value = res.data.response.data.topList.map((ele) => ({
              name: ele.topTitle,
              id: ele.id,
              pic: ele.picUrl,
              rank: 1
            }));
          }
        }).finally(() => {
          loading.value = false;
        });
      };
      const changeCategory = (category) => {
        if (category === currentCategory)
          return;
        currentCategory.value = category;
        page.value = 1;
      };
      const getAlbumList = async (category, pageNum = 1) => {
        page.value = pageNum;
        currentCategory.value = category;
        loading.value = true;
        try {
          const albumListResult = await getAlbumListQQ(category, pageNum);
          if (albumListResult.data.response.code === 0) {
            const list = albumListResult.data.response.data.list.map((ele) => ({
              id: ele.dissid,
              name: ele.dissname,
              pic: ele.imgurl
            }));
            albumList.value = pageNum == 1 ? list : albumList.value.concat(list);
          }
          loading.value = false;
        } catch {
          loading.value = false;
        }
      };
      const detail = (e) => {
        uni.navigateTo({
          url: `/pages/album/album?type=2&id=${e.id}&rank=${e.rank || 0}`
        });
      };
      vue.watch([() => currentCategory.value, () => page.value], () => {
        if (+currentCategory.value === 0) {
          getRankList();
        } else if (currentCategory.value) {
          getAlbumList(currentCategory.value, page.value);
        }
      });
      const scroll = (e) => {
        if (loading.value || !currentCategory.value || currentCategory.value == "0")
          return;
        page.value += 1;
      };
      vue.watch(() => loading.value, () => {
        if (loading.value) {
          loadingRef.value && loadingRef.value.open();
        } else {
          loadingRef.value && loadingRef.value.close();
        }
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("scroll-view", {
          onScrolltolower: scroll,
          onLowerThreshold: ($event) => 200,
          "scroll-y": "",
          class: "h-full"
        }, [
          vue.createVNode(wLoading, {
            mask: "true",
            click: "true",
            ref_key: "loadingRef",
            ref: loadingRef
          }, null, 512),
          vue.createVNode(myBanner, {
            scaleY: "1.1",
            scaleX: "1.1",
            onBannerClick: handleBannerClick,
            bannerList: bannerList.value
          }, null, 8, ["bannerList"]),
          vue.createElementVNode("view", { class: "mb-3 px-2" }, [
            vue.createElementVNode("text", {
              onClick: _cache[0] || (_cache[0] = ($event) => changeCategory(0)),
              class: vue.normalizeClass([{ "current-category border-gray-100": currentCategory.value === 0 }, "inline-block text-sm text-red-500 border border-red-500 mr-1 px-2 mb-2"])
            }, "\u6392\u884C\u699C", 2),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(categoryList.value.slice(0, 10), (category) => {
              return vue.openBlock(), vue.createElementBlock("text", {
                onClick: ($event) => changeCategory(category.id),
                class: vue.normalizeClass([{ "current-category": currentCategory.value === category.id }, "inline-block text-gray-500 text-sm mr-1 border px-2 mb-2"]),
                key: category.name
              }, vue.toDisplayString(category.name), 11, ["onClick"]);
            }), 128)),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(categoryList.value.slice(10, categoryList.value.length - 1), (category) => {
              return vue.openBlock(), vue.createElementBlock("text", {
                onClick: ($event) => changeCategory(category.id),
                class: vue.normalizeClass([{ "current-category": currentCategory.value === category.id, "hidden": !showAllCategory.value }, "inline-block text-gray-500 text-sm mr-1 border px-2 mb-2"]),
                key: category.name
              }, vue.toDisplayString(category.name), 11, ["onClick"]);
            }), 128)),
            !showAllCategory.value ? (vue.openBlock(), vue.createElementBlock("text", {
              key: 0,
              onClick: _cache[1] || (_cache[1] = ($event) => showAllCategory.value = true),
              class: "inline-block text-gray-500 text-sm mr-1 border px-2 mb-2"
            }, "\xB7\xB7\xB7")) : (vue.openBlock(), vue.createElementBlock("text", {
              key: 1,
              onClick: _cache[2] || (_cache[2] = ($event) => showAllCategory.value = false),
              class: "inline-block text-gray-500 text-sm mr-1 border px-2 mb-2"
            }, "\u6536\u8D77"))
          ]),
          vue.createElementVNode("view", { class: "flex flex-wrap justify-around" }, [
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(albumList.value, (album) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                onClick: ($event) => detail(album),
                class: "w-28",
                key: album.id
              }, [
                vue.createElementVNode("image", {
                  class: "w-28 h-28 rounded",
                  "lazy-load": true,
                  src: album.pic
                }, null, 8, ["src"]),
                vue.createElementVNode("text", { class: "text-xs inline-block leading-5 h-10 overflow-hidden" }, vue.toDisplayString(album.name), 1)
              ], 8, ["onClick"]);
            }), 128)),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(3 - albumList.value.length % 3, (item) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                class: "w-28 empty",
                key: item
              });
            }), 128))
          ])
        ], 32);
      };
    }
  });
  var QQList = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["__scopeId", "data-v-9242fe4e"]]);
  const prefix$1 = "http://preferyou.cn/kuwo";
  const request$1 = promisify(uni.request);
  const getBannerKW = () => {
    return request$1({
      url: `${prefix$1}/kuwo/banner`,
      method: "GET"
    });
  };
  const getRecommendKW = () => {
    return request$1({
      url: `${prefix$1}/kuwo/rec_gedan?pn=30`,
      method: "GET"
    });
  };
  const getCategoryListKW = () => {
    return request$1({
      url: `${prefix$1}/kuwo/getTagList`,
      methods: "GET"
    });
  };
  const getRankListKW = () => {
    return request$1({
      url: `${prefix$1}/kuwo/rank`,
      method: "GET"
    });
  };
  const getAlbumListKW = (type, page = 1) => {
    return request$1({
      url: `${prefix$1}/kuwo/playList/getTagPlayList?id=${type}&pn=${page}`,
      method: "GET"
    });
  };
  const getAlbumDetailKW = (id) => {
    return request$1({
      url: `${prefix$1}/kuwo/musicList?pid=${id}`,
      methods: "GET"
    });
  };
  const getRankMusicListKW = (id) => {
    return request$1({
      url: `${prefix$1}/kuwo/rank/musicList?bangId=${id}&rn=100`,
      method: "GET"
    });
  };
  const getMusicUrlKW = (id, format = "mp3") => {
    return request$1({ url: `${prefix$1}/kuwo/musicUrl?mid=${id}&format=${format}` });
  };
  const getSongDetailKW = (id) => {
    return request$1({ url: `${prefix$1}/kuwo/musicInfo?mid=${id}` });
  };
  const getLyricKW = (id) => {
    return request$1({ url: `${prefix$1}/kuwo/lrc?musicId=${id}` });
  };
  const _sfc_main$g = /* @__PURE__ */ vue.defineComponent({
    setup(__props) {
      const albumList = vue.ref([]);
      const bannerList = vue.ref([]);
      const categoryList = vue.ref([]);
      const showAllCategory = vue.ref(false);
      const currentCategory = vue.ref(null);
      const page = vue.ref(1);
      const loading = vue.ref(false);
      const loadingRef = vue.ref(null);
      getRecommendKW().then((res) => {
        if (res.data.code === 200) {
          albumList.value = res.data.data.list.map((ele) => ({
            name: ele.name,
            pic: ele.img,
            id: ele.id
          }));
        }
      });
      getBannerKW().then((res) => {
        if (res.data.code === 200) {
          bannerList.value = res.data.data.map((ele) => {
            let splitUrl = ele.url.split("/");
            return {
              pic: ele.pic,
              type: ele.url.includes("playlist") ? 2 : ele.url.includes("album") ? 3 : 0,
              id: splitUrl[splitUrl.length - 1]
            };
          });
        }
      });
      getCategoryListKW().then((res) => {
        if (res.data.code === 200) {
          let list = res.data.data.reduce((prev, cur) => {
            let list2 = cur.data.map((ele) => ({
              name: ele.name,
              id: ele.id,
              type: 3
            }));
            return prev.concat(list2);
          }, []);
          categoryList.value = list.reduce((pre, cur) => pre.concat(cur), []);
        }
      });
      const handleBannerClick = (e) => {
        formatAppLog("log", "at components/kuwoList.vue:79", vue.toRaw(e));
      };
      const getRankList = () => {
        loading.value = true;
        getRankListKW().then((res) => {
          if (res.data.code === 200) {
            const list = res.data.data.reduce((prev, cur) => {
              let list2 = cur.list.map((ele) => ({
                id: ele.sourceid,
                name: ele.name,
                pic: ele.pic,
                rank: 1
              }));
              return prev.concat(list2);
            }, []);
            albumList.value = list;
          }
        }).finally(() => {
          loading.value = false;
        });
      };
      const changeCategory = (category) => {
        if (category === currentCategory)
          return;
        currentCategory.value = category;
        page.value = 1;
      };
      const getAlbumList = async (category, pageNum = 1) => {
        page.value = pageNum;
        currentCategory.value = category;
        loading.value = true;
        const albumListResult = await getAlbumListKW(category, pageNum);
        if (albumListResult.data.code === 200) {
          const list = albumListResult.data.data.data.map((ele) => ({
            name: ele.name,
            pic: ele.img,
            id: ele.id
          }));
          albumList.value = pageNum == 1 ? list : albumList.value.concat(list);
        }
        loading.value = false;
      };
      const detail = (e) => {
        uni.navigateTo({
          url: `/pages/album/album?type=3&id=${e.id}&rank=${e.rank || 0}`
        });
      };
      vue.watch([() => currentCategory.value, () => page.value], () => {
        if (+currentCategory.value === 0) {
          getRankList();
        } else if (currentCategory.value) {
          getAlbumList(currentCategory.value, page.value);
        }
      });
      const scroll = () => {
        if (loading.value || !currentCategory.value || currentCategory.value == "0")
          return;
        page.value += 1;
      };
      vue.watch(() => loading.value, () => {
        if (loading.value) {
          loadingRef.value && loadingRef.value.open();
        } else {
          loadingRef.value && loadingRef.value.close();
        }
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("scroll-view", {
          onScrolltolower: scroll,
          onLowerThreshold: ($event) => 200,
          "scroll-y": "",
          class: "h-full"
        }, [
          vue.createVNode(wLoading, {
            mask: "true",
            click: "true",
            ref_key: "loadingRef",
            ref: loadingRef
          }, null, 512),
          vue.createVNode(myBanner, {
            scaleY: "1.1",
            scaleX: "1.1",
            onBannerClick: handleBannerClick,
            bannerList: bannerList.value
          }, null, 8, ["bannerList"]),
          vue.createElementVNode("view", { class: "mb-3 px-2" }, [
            vue.createElementVNode("text", {
              onClick: _cache[0] || (_cache[0] = ($event) => changeCategory(0)),
              class: vue.normalizeClass([{ "current-category border-gray-100": currentCategory.value === 0 }, "inline-block text-sm text-red-500 border border-red-500 mr-1 px-2 mb-2"])
            }, "\u6392\u884C\u699C", 2),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(categoryList.value.slice(0, 10), (category) => {
              return vue.openBlock(), vue.createElementBlock("text", {
                onClick: ($event) => changeCategory(category.id),
                class: vue.normalizeClass([{ "current-category": currentCategory.value === category.id }, "inline-block text-gray-500 text-sm mr-1 border px-2 mb-2"]),
                key: category.name
              }, vue.toDisplayString(category.name), 11, ["onClick"]);
            }), 128)),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(categoryList.value.slice(10, categoryList.value.length - 1), (category) => {
              return vue.openBlock(), vue.createElementBlock("text", {
                onClick: ($event) => changeCategory(category.id),
                class: vue.normalizeClass([{ "current-category": currentCategory.value === category.id, "hidden": !showAllCategory.value }, "inline-block text-gray-500 text-sm mr-1 border px-2 mb-2"]),
                key: category.name
              }, vue.toDisplayString(category.name), 11, ["onClick"]);
            }), 128)),
            !showAllCategory.value ? (vue.openBlock(), vue.createElementBlock("text", {
              key: 0,
              onClick: _cache[1] || (_cache[1] = ($event) => showAllCategory.value = true),
              class: "inline-block text-gray-500 text-sm mr-1 border px-2 mb-2"
            }, "\xB7\xB7\xB7")) : (vue.openBlock(), vue.createElementBlock("text", {
              key: 1,
              onClick: _cache[2] || (_cache[2] = ($event) => showAllCategory.value = false),
              class: "inline-block text-gray-500 text-sm mr-1 border px-2 mb-2"
            }, "\u6536\u8D77"))
          ]),
          vue.createElementVNode("view", { class: "flex flex-wrap justify-around" }, [
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(albumList.value, (album) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                onClick: ($event) => detail(album),
                class: "w-28",
                key: album.id
              }, [
                vue.createElementVNode("image", {
                  class: "w-28 h-28 rounded",
                  "lazy-load": true,
                  src: album.pic
                }, null, 8, ["src"]),
                vue.createElementVNode("text", { class: "text-xs inline-block leading-5 h-10 overflow-hidden" }, vue.toDisplayString(album.name), 1)
              ], 8, ["onClick"]);
            }), 128)),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(3 - albumList.value.length % 3, (item) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                class: "w-28 empty",
                key: item
              });
            }), 128))
          ])
        ], 32);
      };
    }
  });
  var KuwoList = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["__scopeId", "data-v-0fb611bb"]]);
  const prefix = "http://preferyou.cn/kuwo";
  const request = promisify(uni.request);
  const getRecommendKG = (page = 1) => {
    return request({
      url: `${prefix}/kugou/getAlbumList?&page=${page}`,
      method: "GET"
    });
  };
  const getCategoryListKG = () => {
    return request({
      url: `${prefix}/kugou/getTagList`,
      methods: "GET"
    });
  };
  const getRankListKG = () => {
    return request({
      url: `${prefix}/kugou/rank/list`,
      method: "GET"
    });
  };
  const getAlbumListKG = (type, page = 1) => {
    return request({
      url: `${prefix}/kugou/albumList?tagid=${type}&page=${page}`,
      method: "GET"
    });
  };
  const getAlbumDetailKG = (id) => {
    return request({
      url: `${prefix}/kugou/albumInfo?albumId=${id}`,
      methods: "GET"
    });
  };
  const getRankMusicListKG = (id) => {
    return request({
      url: `${prefix}/kugou/rank/info?rankid=${id}`,
      method: "GET"
    });
  };
  const getSongDetailKG = (id) => {
    return request({
      url: `${prefix}/kugou/playInfo?id=${id}`
    });
  };
  const _sfc_main$f = /* @__PURE__ */ vue.defineComponent({
    setup(__props) {
      const albumList = vue.ref([]);
      const categoryList = vue.ref([]);
      const showAllCategory = vue.ref(false);
      const currentCategory = vue.ref(null);
      const page = vue.ref(1);
      const loading = vue.ref(false);
      const loadingRef = vue.ref(null);
      const getRecommend = (page2) => {
        loading.value = true;
        getRecommendKG(page2).then((res) => {
          const list = res.data.plist.list.info.map((ele) => ({
            name: ele.specialname,
            pic: ele.imgurl.replace("{size}", "400"),
            id: ele.specialid
          }));
          albumList.value = page2.value == 1 ? list : albumList.value.concat(list);
          loading.value = false;
        }).finally(() => {
          loading.value = false;
        });
      };
      getRecommend(page.value);
      getCategoryListKG().then((res) => {
        if (res.data.code === 200) {
          categoryList.value = res.data.result;
        }
      });
      const getRankList = () => {
        loading.value = true;
        getRankListKG().then((res) => {
          albumList.value = res.data.rank.list.map((ele) => ({
            id: ele.rankid,
            name: ele.rankname,
            pic: ele.imgurl.replace("{size}", "400"),
            rank: 1
          }));
        }).finally(() => {
          loading.value = false;
        });
      };
      const changeCategory = (category) => {
        if (category === currentCategory)
          return;
        currentCategory.value = category;
        page.value = 1;
      };
      const getAlbumList = async (category, pageNum = 1) => {
        page.value = pageNum;
        currentCategory.value = category;
        loading.value = true;
        try {
          const result = await getAlbumListKG(category, page.value);
          if (result.data.errcode === 0 && result.data.data.info) {
            const list = result.data.data.info.map((ele) => ({
              name: ele.specialname,
              pic: ele.imgurl.replace("{size}", "400"),
              id: ele.specialid
            }));
            albumList.value = page.value === 1 ? list : albumList.value.concat(list);
          }
          loading.value = false;
        } catch {
          loading.value = false;
        }
      };
      const detail = (e) => {
        uni.navigateTo({
          url: `/pages/album/album?type=4&id=${e.id}&rank=${e.rank || 0}`
        });
      };
      vue.watch([() => currentCategory.value, () => page.value], () => {
        if (currentCategory.value == null) {
          getRecommend(page.value);
        } else if (+currentCategory.value === 0) {
          getRankList();
        } else if (currentCategory.value) {
          getAlbumList(currentCategory.value, page.value);
        }
      });
      const scroll = () => {
        if (loading.value || currentCategory.value == "0")
          return;
        page.value += 1;
      };
      vue.watch(() => loading.value, () => {
        if (loading.value) {
          loadingRef.value && loadingRef.value.open();
        } else {
          loadingRef.value && loadingRef.value.close();
        }
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("scroll-view", {
          onScrolltolower: scroll,
          onLowerThreshold: ($event) => 200,
          "scroll-y": "",
          class: "h-full"
        }, [
          vue.createVNode(wLoading, {
            mask: "true",
            click: "true",
            ref_key: "loadingRef",
            ref: loadingRef
          }, null, 512),
          vue.createElementVNode("view", { class: "mb-3 px-2" }, [
            vue.createElementVNode("text", {
              onClick: _cache[0] || (_cache[0] = ($event) => changeCategory(0)),
              class: vue.normalizeClass([{ "current-category border-gray-100": currentCategory.value === 0 }, "inline-block text-sm text-red-500 border border-red-500 mr-1 px-2 mb-2"])
            }, "\u6392\u884C\u699C", 2),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(categoryList.value.slice(0, 10), (category) => {
              return vue.openBlock(), vue.createElementBlock("text", {
                onClick: ($event) => changeCategory(category.id),
                class: vue.normalizeClass([{ "current-category": currentCategory.value === category.id }, "inline-block text-gray-500 text-sm mr-1 border px-2 mb-2"]),
                key: category.name
              }, vue.toDisplayString(category.name), 11, ["onClick"]);
            }), 128)),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(categoryList.value.slice(10, categoryList.value.length - 1), (category) => {
              return vue.withDirectives((vue.openBlock(), vue.createElementBlock("text", {
                onClick: ($event) => changeCategory(category.id),
                class: vue.normalizeClass([{ "current-category": currentCategory.value === category.id, "hidden": !showAllCategory.value }, "inline-block text-gray-500 text-sm mr-1 border px-2 mb-2"]),
                key: category.name
              }, vue.toDisplayString(category.name), 11, ["onClick"])), [
                [vue.vShow, showAllCategory.value]
              ]);
            }), 128)),
            !showAllCategory.value ? (vue.openBlock(), vue.createElementBlock("text", {
              key: 0,
              onClick: _cache[1] || (_cache[1] = ($event) => showAllCategory.value = true),
              class: "inline-block text-gray-500 text-sm mr-1 border px-2 mb-2"
            }, "\xB7\xB7\xB7")) : (vue.openBlock(), vue.createElementBlock("text", {
              key: 1,
              onClick: _cache[2] || (_cache[2] = ($event) => showAllCategory.value = false),
              class: "inline-block text-gray-500 text-sm mr-1 border px-2 mb-2"
            }, "\u6536\u8D77"))
          ]),
          vue.createElementVNode("view", { class: "flex flex-wrap justify-around" }, [
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(albumList.value, (album) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                onClick: ($event) => detail(album),
                class: "w-28",
                key: album.id
              }, [
                vue.createElementVNode("image", {
                  class: "w-28 h-28 rounded",
                  "lazy-load": true,
                  src: album.pic
                }, null, 8, ["src"]),
                vue.createElementVNode("text", { class: "text-xs inline-block leading-5 h-10 overflow-hidden" }, vue.toDisplayString(album.name), 1)
              ], 8, ["onClick"]);
            }), 128)),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(3 - albumList.value.length % 3, (item) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                class: "w-28 empty",
                key: item
              });
            }), 128))
          ])
        ], 32);
      };
    }
  });
  var KugouList = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["__scopeId", "data-v-f7898a14"]]);
  const _sfc_main$e = {
    setup(__props) {
      const platform2 = vue.ref(0);
      const platformComp = vue.computed(() => {
        switch (platform2.value) {
          case 0:
            return _sfc_main$l;
          case 1:
            return NeteaseList;
          case 2:
            return QQList;
          case 3:
            return KuwoList;
          case 4:
            return KugouList;
          default:
            return _sfc_main$l;
        }
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "content flex flex-col h-full" }, [
          vue.createElementVNode("view", { class: "flex items-center shadow-sm shadow-inner w-full pl-2 py-2" }, [
            vue.createElementVNode("text", { class: "iconfont text-2xl icon-yuyin linear-text px-2" }),
            vue.createElementVNode("input", {
              class: "flex-1 rounded-2xl bg-gradient-to-r from-blue-100 to-purple-100 px-2 text-sm h-8",
              placeholder: "\u8BF7\u8F93\u5165\u6B4C\u66F2\u540D"
            }),
            vue.createElementVNode("text", { class: "iconfont text-2xl linear-text icon-tinggeshiqu text-blue-500 px-2" })
          ]),
          vue.createElementVNode("scroll-view", {
            "scroll-x": "true",
            "show-scrollbar": false,
            class: "hide-scroll-bar whitespace-nowrap flex leading-10 text-gray-600"
          }, [
            vue.createElementVNode("view", {
              onClick: _cache[0] || (_cache[0] = ($event) => platform2.value = 0),
              class: vue.normalizeClass([{ "linear-text font-bold border-b-2  border-purple-500": platform2.value === 0 }, "inline-block text-base mx-3"])
            }, "\u6211\u7684", 2),
            vue.createElementVNode("view", {
              onClick: _cache[1] || (_cache[1] = ($event) => platform2.value = 1),
              class: vue.normalizeClass([{ "linear-text font-bold border-b-2 border-purple-500": platform2.value === 1 }, "inline-block text-base mx-3"])
            }, "\u7F51\u6613\u4E91\u97F3\u4E50", 2),
            vue.createElementVNode("view", {
              onClick: _cache[2] || (_cache[2] = ($event) => platform2.value = 2),
              class: vue.normalizeClass([{ "linear-text font-bold border-b-2 border-purple-500": platform2.value === 2 }, "inline-block text-base mx-3"])
            }, "QQ\u97F3\u4E50", 2),
            vue.createElementVNode("view", {
              onClick: _cache[3] || (_cache[3] = ($event) => platform2.value = 3),
              class: vue.normalizeClass([{ "linear-text font-bold border-b-2 border-purple-500": platform2.value === 3 }, "inline-block text-base mx-3"])
            }, "\u9177\u6211\u97F3\u4E50", 2),
            vue.createElementVNode("view", {
              onClick: _cache[4] || (_cache[4] = ($event) => platform2.value = 4),
              class: vue.normalizeClass([{ "linear-text font-bold border-b-2 border-purple-500": platform2.value === 4 }, "inline-block text-base mx-3"])
            }, "\u9177\u72D7\u97F3\u4E50", 2)
          ]),
          vue.createElementVNode("view", { class: "flex-1 overflow-hidden pb-12" }, [
            (vue.openBlock(), vue.createBlock(vue.resolveDynamicComponent(vue.unref(platformComp)), { key: platform2.value }))
          ]),
          vue.createVNode(TimpAudio)
        ]);
      };
    }
  };
  var icons = {
    "id": "2852637",
    "name": "uniui\u56FE\u6807\u5E93",
    "font_family": "uniicons",
    "css_prefix_text": "uniui-",
    "description": "",
    "glyphs": [
      {
        "icon_id": "25027049",
        "name": "yanse",
        "font_class": "color",
        "unicode": "e6cf",
        "unicode_decimal": 59087
      },
      {
        "icon_id": "25027048",
        "name": "wallet",
        "font_class": "wallet",
        "unicode": "e6b1",
        "unicode_decimal": 59057
      },
      {
        "icon_id": "25015720",
        "name": "settings-filled",
        "font_class": "settings-filled",
        "unicode": "e6ce",
        "unicode_decimal": 59086
      },
      {
        "icon_id": "25015434",
        "name": "shimingrenzheng-filled",
        "font_class": "auth-filled",
        "unicode": "e6cc",
        "unicode_decimal": 59084
      },
      {
        "icon_id": "24934246",
        "name": "shop-filled",
        "font_class": "shop-filled",
        "unicode": "e6cd",
        "unicode_decimal": 59085
      },
      {
        "icon_id": "24934159",
        "name": "staff-filled-01",
        "font_class": "staff-filled",
        "unicode": "e6cb",
        "unicode_decimal": 59083
      },
      {
        "icon_id": "24932461",
        "name": "VIP-filled",
        "font_class": "vip-filled",
        "unicode": "e6c6",
        "unicode_decimal": 59078
      },
      {
        "icon_id": "24932462",
        "name": "plus_circle_fill",
        "font_class": "plus-filled",
        "unicode": "e6c7",
        "unicode_decimal": 59079
      },
      {
        "icon_id": "24932463",
        "name": "folder_add-filled",
        "font_class": "folder-add-filled",
        "unicode": "e6c8",
        "unicode_decimal": 59080
      },
      {
        "icon_id": "24932464",
        "name": "yanse-filled",
        "font_class": "color-filled",
        "unicode": "e6c9",
        "unicode_decimal": 59081
      },
      {
        "icon_id": "24932465",
        "name": "tune-filled",
        "font_class": "tune-filled",
        "unicode": "e6ca",
        "unicode_decimal": 59082
      },
      {
        "icon_id": "24932455",
        "name": "a-rilidaka-filled",
        "font_class": "calendar-filled",
        "unicode": "e6c0",
        "unicode_decimal": 59072
      },
      {
        "icon_id": "24932456",
        "name": "notification-filled",
        "font_class": "notification-filled",
        "unicode": "e6c1",
        "unicode_decimal": 59073
      },
      {
        "icon_id": "24932457",
        "name": "wallet-filled",
        "font_class": "wallet-filled",
        "unicode": "e6c2",
        "unicode_decimal": 59074
      },
      {
        "icon_id": "24932458",
        "name": "paihangbang-filled",
        "font_class": "medal-filled",
        "unicode": "e6c3",
        "unicode_decimal": 59075
      },
      {
        "icon_id": "24932459",
        "name": "gift-filled",
        "font_class": "gift-filled",
        "unicode": "e6c4",
        "unicode_decimal": 59076
      },
      {
        "icon_id": "24932460",
        "name": "fire-filled",
        "font_class": "fire-filled",
        "unicode": "e6c5",
        "unicode_decimal": 59077
      },
      {
        "icon_id": "24928001",
        "name": "refreshempty",
        "font_class": "refreshempty",
        "unicode": "e6bf",
        "unicode_decimal": 59071
      },
      {
        "icon_id": "24926853",
        "name": "location-ellipse",
        "font_class": "location-filled",
        "unicode": "e6af",
        "unicode_decimal": 59055
      },
      {
        "icon_id": "24926735",
        "name": "person-filled",
        "font_class": "person-filled",
        "unicode": "e69d",
        "unicode_decimal": 59037
      },
      {
        "icon_id": "24926703",
        "name": "personadd-filled",
        "font_class": "personadd-filled",
        "unicode": "e698",
        "unicode_decimal": 59032
      },
      {
        "icon_id": "24923351",
        "name": "back",
        "font_class": "back",
        "unicode": "e6b9",
        "unicode_decimal": 59065
      },
      {
        "icon_id": "24923352",
        "name": "forward",
        "font_class": "forward",
        "unicode": "e6ba",
        "unicode_decimal": 59066
      },
      {
        "icon_id": "24923353",
        "name": "arrowthinright",
        "font_class": "arrow-right",
        "unicode": "e6bb",
        "unicode_decimal": 59067
      },
      {
        "icon_id": "24923353",
        "name": "arrowthinright",
        "font_class": "arrowthinright",
        "unicode": "e6bb",
        "unicode_decimal": 59067
      },
      {
        "icon_id": "24923354",
        "name": "arrowthinleft",
        "font_class": "arrow-left",
        "unicode": "e6bc",
        "unicode_decimal": 59068
      },
      {
        "icon_id": "24923354",
        "name": "arrowthinleft",
        "font_class": "arrowthinleft",
        "unicode": "e6bc",
        "unicode_decimal": 59068
      },
      {
        "icon_id": "24923355",
        "name": "arrowthinup",
        "font_class": "arrow-up",
        "unicode": "e6bd",
        "unicode_decimal": 59069
      },
      {
        "icon_id": "24923355",
        "name": "arrowthinup",
        "font_class": "arrowthinup",
        "unicode": "e6bd",
        "unicode_decimal": 59069
      },
      {
        "icon_id": "24923356",
        "name": "arrowthindown",
        "font_class": "arrow-down",
        "unicode": "e6be",
        "unicode_decimal": 59070
      },
      {
        "icon_id": "24923356",
        "name": "arrowthindown",
        "font_class": "arrowthindown",
        "unicode": "e6be",
        "unicode_decimal": 59070
      },
      {
        "icon_id": "24923349",
        "name": "arrowdown",
        "font_class": "bottom",
        "unicode": "e6b8",
        "unicode_decimal": 59064
      },
      {
        "icon_id": "24923349",
        "name": "arrowdown",
        "font_class": "arrowdown",
        "unicode": "e6b8",
        "unicode_decimal": 59064
      },
      {
        "icon_id": "24923346",
        "name": "arrowright",
        "font_class": "right",
        "unicode": "e6b5",
        "unicode_decimal": 59061
      },
      {
        "icon_id": "24923346",
        "name": "arrowright",
        "font_class": "arrowright",
        "unicode": "e6b5",
        "unicode_decimal": 59061
      },
      {
        "icon_id": "24923347",
        "name": "arrowup",
        "font_class": "top",
        "unicode": "e6b6",
        "unicode_decimal": 59062
      },
      {
        "icon_id": "24923347",
        "name": "arrowup",
        "font_class": "arrowup",
        "unicode": "e6b6",
        "unicode_decimal": 59062
      },
      {
        "icon_id": "24923348",
        "name": "arrowleft",
        "font_class": "left",
        "unicode": "e6b7",
        "unicode_decimal": 59063
      },
      {
        "icon_id": "24923348",
        "name": "arrowleft",
        "font_class": "arrowleft",
        "unicode": "e6b7",
        "unicode_decimal": 59063
      },
      {
        "icon_id": "24923334",
        "name": "eye",
        "font_class": "eye",
        "unicode": "e651",
        "unicode_decimal": 58961
      },
      {
        "icon_id": "24923335",
        "name": "eye-filled",
        "font_class": "eye-filled",
        "unicode": "e66a",
        "unicode_decimal": 58986
      },
      {
        "icon_id": "24923336",
        "name": "eye-slash",
        "font_class": "eye-slash",
        "unicode": "e6b3",
        "unicode_decimal": 59059
      },
      {
        "icon_id": "24923337",
        "name": "eye-slash-filled",
        "font_class": "eye-slash-filled",
        "unicode": "e6b4",
        "unicode_decimal": 59060
      },
      {
        "icon_id": "24923305",
        "name": "info-filled",
        "font_class": "info-filled",
        "unicode": "e649",
        "unicode_decimal": 58953
      },
      {
        "icon_id": "24923299",
        "name": "reload-01",
        "font_class": "reload",
        "unicode": "e6b2",
        "unicode_decimal": 59058
      },
      {
        "icon_id": "24923195",
        "name": "mic_slash_fill",
        "font_class": "micoff-filled",
        "unicode": "e6b0",
        "unicode_decimal": 59056
      },
      {
        "icon_id": "24923165",
        "name": "map-pin-ellipse",
        "font_class": "map-pin-ellipse",
        "unicode": "e6ac",
        "unicode_decimal": 59052
      },
      {
        "icon_id": "24923166",
        "name": "map-pin",
        "font_class": "map-pin",
        "unicode": "e6ad",
        "unicode_decimal": 59053
      },
      {
        "icon_id": "24923167",
        "name": "location",
        "font_class": "location",
        "unicode": "e6ae",
        "unicode_decimal": 59054
      },
      {
        "icon_id": "24923064",
        "name": "starhalf",
        "font_class": "starhalf",
        "unicode": "e683",
        "unicode_decimal": 59011
      },
      {
        "icon_id": "24923065",
        "name": "star",
        "font_class": "star",
        "unicode": "e688",
        "unicode_decimal": 59016
      },
      {
        "icon_id": "24923066",
        "name": "star-filled",
        "font_class": "star-filled",
        "unicode": "e68f",
        "unicode_decimal": 59023
      },
      {
        "icon_id": "24899646",
        "name": "a-rilidaka",
        "font_class": "calendar",
        "unicode": "e6a0",
        "unicode_decimal": 59040
      },
      {
        "icon_id": "24899647",
        "name": "fire",
        "font_class": "fire",
        "unicode": "e6a1",
        "unicode_decimal": 59041
      },
      {
        "icon_id": "24899648",
        "name": "paihangbang",
        "font_class": "medal",
        "unicode": "e6a2",
        "unicode_decimal": 59042
      },
      {
        "icon_id": "24899649",
        "name": "font",
        "font_class": "font",
        "unicode": "e6a3",
        "unicode_decimal": 59043
      },
      {
        "icon_id": "24899650",
        "name": "gift",
        "font_class": "gift",
        "unicode": "e6a4",
        "unicode_decimal": 59044
      },
      {
        "icon_id": "24899651",
        "name": "link",
        "font_class": "link",
        "unicode": "e6a5",
        "unicode_decimal": 59045
      },
      {
        "icon_id": "24899652",
        "name": "notification",
        "font_class": "notification",
        "unicode": "e6a6",
        "unicode_decimal": 59046
      },
      {
        "icon_id": "24899653",
        "name": "staff",
        "font_class": "staff",
        "unicode": "e6a7",
        "unicode_decimal": 59047
      },
      {
        "icon_id": "24899654",
        "name": "VIP",
        "font_class": "vip",
        "unicode": "e6a8",
        "unicode_decimal": 59048
      },
      {
        "icon_id": "24899655",
        "name": "folder_add",
        "font_class": "folder-add",
        "unicode": "e6a9",
        "unicode_decimal": 59049
      },
      {
        "icon_id": "24899656",
        "name": "tune",
        "font_class": "tune",
        "unicode": "e6aa",
        "unicode_decimal": 59050
      },
      {
        "icon_id": "24899657",
        "name": "shimingrenzheng",
        "font_class": "auth",
        "unicode": "e6ab",
        "unicode_decimal": 59051
      },
      {
        "icon_id": "24899565",
        "name": "person",
        "font_class": "person",
        "unicode": "e699",
        "unicode_decimal": 59033
      },
      {
        "icon_id": "24899566",
        "name": "email-filled",
        "font_class": "email-filled",
        "unicode": "e69a",
        "unicode_decimal": 59034
      },
      {
        "icon_id": "24899567",
        "name": "phone-filled",
        "font_class": "phone-filled",
        "unicode": "e69b",
        "unicode_decimal": 59035
      },
      {
        "icon_id": "24899568",
        "name": "phone",
        "font_class": "phone",
        "unicode": "e69c",
        "unicode_decimal": 59036
      },
      {
        "icon_id": "24899570",
        "name": "email",
        "font_class": "email",
        "unicode": "e69e",
        "unicode_decimal": 59038
      },
      {
        "icon_id": "24899571",
        "name": "personadd",
        "font_class": "personadd",
        "unicode": "e69f",
        "unicode_decimal": 59039
      },
      {
        "icon_id": "24899558",
        "name": "chatboxes-filled",
        "font_class": "chatboxes-filled",
        "unicode": "e692",
        "unicode_decimal": 59026
      },
      {
        "icon_id": "24899559",
        "name": "contact",
        "font_class": "contact",
        "unicode": "e693",
        "unicode_decimal": 59027
      },
      {
        "icon_id": "24899560",
        "name": "chatbubble-filled",
        "font_class": "chatbubble-filled",
        "unicode": "e694",
        "unicode_decimal": 59028
      },
      {
        "icon_id": "24899561",
        "name": "contact-filled",
        "font_class": "contact-filled",
        "unicode": "e695",
        "unicode_decimal": 59029
      },
      {
        "icon_id": "24899562",
        "name": "chatboxes",
        "font_class": "chatboxes",
        "unicode": "e696",
        "unicode_decimal": 59030
      },
      {
        "icon_id": "24899563",
        "name": "chatbubble",
        "font_class": "chatbubble",
        "unicode": "e697",
        "unicode_decimal": 59031
      },
      {
        "icon_id": "24881290",
        "name": "upload-filled",
        "font_class": "upload-filled",
        "unicode": "e68e",
        "unicode_decimal": 59022
      },
      {
        "icon_id": "24881292",
        "name": "upload",
        "font_class": "upload",
        "unicode": "e690",
        "unicode_decimal": 59024
      },
      {
        "icon_id": "24881293",
        "name": "weixin",
        "font_class": "weixin",
        "unicode": "e691",
        "unicode_decimal": 59025
      },
      {
        "icon_id": "24881274",
        "name": "compose",
        "font_class": "compose",
        "unicode": "e67f",
        "unicode_decimal": 59007
      },
      {
        "icon_id": "24881275",
        "name": "qq",
        "font_class": "qq",
        "unicode": "e680",
        "unicode_decimal": 59008
      },
      {
        "icon_id": "24881276",
        "name": "download-filled",
        "font_class": "download-filled",
        "unicode": "e681",
        "unicode_decimal": 59009
      },
      {
        "icon_id": "24881277",
        "name": "pengyouquan",
        "font_class": "pyq",
        "unicode": "e682",
        "unicode_decimal": 59010
      },
      {
        "icon_id": "24881279",
        "name": "sound",
        "font_class": "sound",
        "unicode": "e684",
        "unicode_decimal": 59012
      },
      {
        "icon_id": "24881280",
        "name": "trash-filled",
        "font_class": "trash-filled",
        "unicode": "e685",
        "unicode_decimal": 59013
      },
      {
        "icon_id": "24881281",
        "name": "sound-filled",
        "font_class": "sound-filled",
        "unicode": "e686",
        "unicode_decimal": 59014
      },
      {
        "icon_id": "24881282",
        "name": "trash",
        "font_class": "trash",
        "unicode": "e687",
        "unicode_decimal": 59015
      },
      {
        "icon_id": "24881284",
        "name": "videocam-filled",
        "font_class": "videocam-filled",
        "unicode": "e689",
        "unicode_decimal": 59017
      },
      {
        "icon_id": "24881285",
        "name": "spinner-cycle",
        "font_class": "spinner-cycle",
        "unicode": "e68a",
        "unicode_decimal": 59018
      },
      {
        "icon_id": "24881286",
        "name": "weibo",
        "font_class": "weibo",
        "unicode": "e68b",
        "unicode_decimal": 59019
      },
      {
        "icon_id": "24881288",
        "name": "videocam",
        "font_class": "videocam",
        "unicode": "e68c",
        "unicode_decimal": 59020
      },
      {
        "icon_id": "24881289",
        "name": "download",
        "font_class": "download",
        "unicode": "e68d",
        "unicode_decimal": 59021
      },
      {
        "icon_id": "24879601",
        "name": "help",
        "font_class": "help",
        "unicode": "e679",
        "unicode_decimal": 59001
      },
      {
        "icon_id": "24879602",
        "name": "navigate-filled",
        "font_class": "navigate-filled",
        "unicode": "e67a",
        "unicode_decimal": 59002
      },
      {
        "icon_id": "24879603",
        "name": "plusempty",
        "font_class": "plusempty",
        "unicode": "e67b",
        "unicode_decimal": 59003
      },
      {
        "icon_id": "24879604",
        "name": "smallcircle",
        "font_class": "smallcircle",
        "unicode": "e67c",
        "unicode_decimal": 59004
      },
      {
        "icon_id": "24879605",
        "name": "minus-filled",
        "font_class": "minus-filled",
        "unicode": "e67d",
        "unicode_decimal": 59005
      },
      {
        "icon_id": "24879606",
        "name": "micoff",
        "font_class": "micoff",
        "unicode": "e67e",
        "unicode_decimal": 59006
      },
      {
        "icon_id": "24879588",
        "name": "closeempty",
        "font_class": "closeempty",
        "unicode": "e66c",
        "unicode_decimal": 58988
      },
      {
        "icon_id": "24879589",
        "name": "clear",
        "font_class": "clear",
        "unicode": "e66d",
        "unicode_decimal": 58989
      },
      {
        "icon_id": "24879590",
        "name": "navigate",
        "font_class": "navigate",
        "unicode": "e66e",
        "unicode_decimal": 58990
      },
      {
        "icon_id": "24879591",
        "name": "minus",
        "font_class": "minus",
        "unicode": "e66f",
        "unicode_decimal": 58991
      },
      {
        "icon_id": "24879592",
        "name": "image",
        "font_class": "image",
        "unicode": "e670",
        "unicode_decimal": 58992
      },
      {
        "icon_id": "24879593",
        "name": "mic",
        "font_class": "mic",
        "unicode": "e671",
        "unicode_decimal": 58993
      },
      {
        "icon_id": "24879594",
        "name": "paperplane",
        "font_class": "paperplane",
        "unicode": "e672",
        "unicode_decimal": 58994
      },
      {
        "icon_id": "24879595",
        "name": "close",
        "font_class": "close",
        "unicode": "e673",
        "unicode_decimal": 58995
      },
      {
        "icon_id": "24879596",
        "name": "help-filled",
        "font_class": "help-filled",
        "unicode": "e674",
        "unicode_decimal": 58996
      },
      {
        "icon_id": "24879597",
        "name": "plus-filled",
        "font_class": "paperplane-filled",
        "unicode": "e675",
        "unicode_decimal": 58997
      },
      {
        "icon_id": "24879598",
        "name": "plus",
        "font_class": "plus",
        "unicode": "e676",
        "unicode_decimal": 58998
      },
      {
        "icon_id": "24879599",
        "name": "mic-filled",
        "font_class": "mic-filled",
        "unicode": "e677",
        "unicode_decimal": 58999
      },
      {
        "icon_id": "24879600",
        "name": "image-filled",
        "font_class": "image-filled",
        "unicode": "e678",
        "unicode_decimal": 59e3
      },
      {
        "icon_id": "24855900",
        "name": "locked-filled",
        "font_class": "locked-filled",
        "unicode": "e668",
        "unicode_decimal": 58984
      },
      {
        "icon_id": "24855901",
        "name": "info",
        "font_class": "info",
        "unicode": "e669",
        "unicode_decimal": 58985
      },
      {
        "icon_id": "24855903",
        "name": "locked",
        "font_class": "locked",
        "unicode": "e66b",
        "unicode_decimal": 58987
      },
      {
        "icon_id": "24855884",
        "name": "camera-filled",
        "font_class": "camera-filled",
        "unicode": "e658",
        "unicode_decimal": 58968
      },
      {
        "icon_id": "24855885",
        "name": "chat-filled",
        "font_class": "chat-filled",
        "unicode": "e659",
        "unicode_decimal": 58969
      },
      {
        "icon_id": "24855886",
        "name": "camera",
        "font_class": "camera",
        "unicode": "e65a",
        "unicode_decimal": 58970
      },
      {
        "icon_id": "24855887",
        "name": "circle",
        "font_class": "circle",
        "unicode": "e65b",
        "unicode_decimal": 58971
      },
      {
        "icon_id": "24855888",
        "name": "checkmarkempty",
        "font_class": "checkmarkempty",
        "unicode": "e65c",
        "unicode_decimal": 58972
      },
      {
        "icon_id": "24855889",
        "name": "chat",
        "font_class": "chat",
        "unicode": "e65d",
        "unicode_decimal": 58973
      },
      {
        "icon_id": "24855890",
        "name": "circle-filled",
        "font_class": "circle-filled",
        "unicode": "e65e",
        "unicode_decimal": 58974
      },
      {
        "icon_id": "24855891",
        "name": "flag",
        "font_class": "flag",
        "unicode": "e65f",
        "unicode_decimal": 58975
      },
      {
        "icon_id": "24855892",
        "name": "flag-filled",
        "font_class": "flag-filled",
        "unicode": "e660",
        "unicode_decimal": 58976
      },
      {
        "icon_id": "24855893",
        "name": "gear-filled",
        "font_class": "gear-filled",
        "unicode": "e661",
        "unicode_decimal": 58977
      },
      {
        "icon_id": "24855894",
        "name": "home",
        "font_class": "home",
        "unicode": "e662",
        "unicode_decimal": 58978
      },
      {
        "icon_id": "24855895",
        "name": "home-filled",
        "font_class": "home-filled",
        "unicode": "e663",
        "unicode_decimal": 58979
      },
      {
        "icon_id": "24855896",
        "name": "gear",
        "font_class": "gear",
        "unicode": "e664",
        "unicode_decimal": 58980
      },
      {
        "icon_id": "24855897",
        "name": "smallcircle-filled",
        "font_class": "smallcircle-filled",
        "unicode": "e665",
        "unicode_decimal": 58981
      },
      {
        "icon_id": "24855898",
        "name": "map-filled",
        "font_class": "map-filled",
        "unicode": "e666",
        "unicode_decimal": 58982
      },
      {
        "icon_id": "24855899",
        "name": "map",
        "font_class": "map",
        "unicode": "e667",
        "unicode_decimal": 58983
      },
      {
        "icon_id": "24855825",
        "name": "refresh-filled",
        "font_class": "refresh-filled",
        "unicode": "e656",
        "unicode_decimal": 58966
      },
      {
        "icon_id": "24855826",
        "name": "refresh",
        "font_class": "refresh",
        "unicode": "e657",
        "unicode_decimal": 58967
      },
      {
        "icon_id": "24855808",
        "name": "cloud-upload",
        "font_class": "cloud-upload",
        "unicode": "e645",
        "unicode_decimal": 58949
      },
      {
        "icon_id": "24855809",
        "name": "cloud-download-filled",
        "font_class": "cloud-download-filled",
        "unicode": "e646",
        "unicode_decimal": 58950
      },
      {
        "icon_id": "24855810",
        "name": "cloud-download",
        "font_class": "cloud-download",
        "unicode": "e647",
        "unicode_decimal": 58951
      },
      {
        "icon_id": "24855811",
        "name": "cloud-upload-filled",
        "font_class": "cloud-upload-filled",
        "unicode": "e648",
        "unicode_decimal": 58952
      },
      {
        "icon_id": "24855813",
        "name": "redo",
        "font_class": "redo",
        "unicode": "e64a",
        "unicode_decimal": 58954
      },
      {
        "icon_id": "24855814",
        "name": "images-filled",
        "font_class": "images-filled",
        "unicode": "e64b",
        "unicode_decimal": 58955
      },
      {
        "icon_id": "24855815",
        "name": "undo-filled",
        "font_class": "undo-filled",
        "unicode": "e64c",
        "unicode_decimal": 58956
      },
      {
        "icon_id": "24855816",
        "name": "more",
        "font_class": "more",
        "unicode": "e64d",
        "unicode_decimal": 58957
      },
      {
        "icon_id": "24855817",
        "name": "more-filled",
        "font_class": "more-filled",
        "unicode": "e64e",
        "unicode_decimal": 58958
      },
      {
        "icon_id": "24855818",
        "name": "undo",
        "font_class": "undo",
        "unicode": "e64f",
        "unicode_decimal": 58959
      },
      {
        "icon_id": "24855819",
        "name": "images",
        "font_class": "images",
        "unicode": "e650",
        "unicode_decimal": 58960
      },
      {
        "icon_id": "24855821",
        "name": "paperclip",
        "font_class": "paperclip",
        "unicode": "e652",
        "unicode_decimal": 58962
      },
      {
        "icon_id": "24855822",
        "name": "settings",
        "font_class": "settings",
        "unicode": "e653",
        "unicode_decimal": 58963
      },
      {
        "icon_id": "24855823",
        "name": "search",
        "font_class": "search",
        "unicode": "e654",
        "unicode_decimal": 58964
      },
      {
        "icon_id": "24855824",
        "name": "redo-filled",
        "font_class": "redo-filled",
        "unicode": "e655",
        "unicode_decimal": 58965
      },
      {
        "icon_id": "24841702",
        "name": "list",
        "font_class": "list",
        "unicode": "e644",
        "unicode_decimal": 58948
      },
      {
        "icon_id": "24841489",
        "name": "mail-open-filled",
        "font_class": "mail-open-filled",
        "unicode": "e63a",
        "unicode_decimal": 58938
      },
      {
        "icon_id": "24841491",
        "name": "hand-thumbsdown-filled",
        "font_class": "hand-down-filled",
        "unicode": "e63c",
        "unicode_decimal": 58940
      },
      {
        "icon_id": "24841492",
        "name": "hand-thumbsdown",
        "font_class": "hand-down",
        "unicode": "e63d",
        "unicode_decimal": 58941
      },
      {
        "icon_id": "24841493",
        "name": "hand-thumbsup-filled",
        "font_class": "hand-up-filled",
        "unicode": "e63e",
        "unicode_decimal": 58942
      },
      {
        "icon_id": "24841494",
        "name": "hand-thumbsup",
        "font_class": "hand-up",
        "unicode": "e63f",
        "unicode_decimal": 58943
      },
      {
        "icon_id": "24841496",
        "name": "heart-filled",
        "font_class": "heart-filled",
        "unicode": "e641",
        "unicode_decimal": 58945
      },
      {
        "icon_id": "24841498",
        "name": "mail-open",
        "font_class": "mail-open",
        "unicode": "e643",
        "unicode_decimal": 58947
      },
      {
        "icon_id": "24841488",
        "name": "heart",
        "font_class": "heart",
        "unicode": "e639",
        "unicode_decimal": 58937
      },
      {
        "icon_id": "24839963",
        "name": "loop",
        "font_class": "loop",
        "unicode": "e633",
        "unicode_decimal": 58931
      },
      {
        "icon_id": "24839866",
        "name": "pulldown",
        "font_class": "pulldown",
        "unicode": "e632",
        "unicode_decimal": 58930
      },
      {
        "icon_id": "24813798",
        "name": "scan",
        "font_class": "scan",
        "unicode": "e62a",
        "unicode_decimal": 58922
      },
      {
        "icon_id": "24813786",
        "name": "bars",
        "font_class": "bars",
        "unicode": "e627",
        "unicode_decimal": 58919
      },
      {
        "icon_id": "24813788",
        "name": "cart-filled",
        "font_class": "cart-filled",
        "unicode": "e629",
        "unicode_decimal": 58921
      },
      {
        "icon_id": "24813790",
        "name": "checkbox",
        "font_class": "checkbox",
        "unicode": "e62b",
        "unicode_decimal": 58923
      },
      {
        "icon_id": "24813791",
        "name": "checkbox-filled",
        "font_class": "checkbox-filled",
        "unicode": "e62c",
        "unicode_decimal": 58924
      },
      {
        "icon_id": "24813794",
        "name": "shop",
        "font_class": "shop",
        "unicode": "e62f",
        "unicode_decimal": 58927
      },
      {
        "icon_id": "24813795",
        "name": "headphones",
        "font_class": "headphones",
        "unicode": "e630",
        "unicode_decimal": 58928
      },
      {
        "icon_id": "24813796",
        "name": "cart",
        "font_class": "cart",
        "unicode": "e631",
        "unicode_decimal": 58929
      }
    ]
  };
  const getVal = (val) => {
    const reg = /^[0-9]*$/g;
    return typeof val === "number" || reg.test(val) ? val + "px" : val;
  };
  const _sfc_main$d = {
    name: "UniIcons",
    emits: ["click"],
    props: {
      type: {
        type: String,
        default: ""
      },
      color: {
        type: String,
        default: "#333333"
      },
      size: {
        type: [Number, String],
        default: 16
      },
      customPrefix: {
        type: String,
        default: ""
      }
    },
    data() {
      return {
        icons: icons.glyphs
      };
    },
    computed: {
      unicode() {
        let code = this.icons.find((v) => v.font_class === this.type);
        if (code) {
          return unescape(`%u${code.unicode}`);
        }
        return "";
      },
      iconSize() {
        return getVal(this.size);
      }
    },
    methods: {
      _onClick() {
        this.$emit("click");
      }
    }
  };
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("text", {
      style: vue.normalizeStyle({ color: $props.color, "font-size": $options.iconSize }),
      class: vue.normalizeClass(["uni-icons", ["uniui-" + $props.type, $props.customPrefix, $props.customPrefix ? $props.type : ""]]),
      onClick: _cache[0] || (_cache[0] = (...args) => $options._onClick && $options._onClick(...args))
    }, null, 6);
  }
  var __easycom_0$2 = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["render", _sfc_render$a], ["__scopeId", "data-v-a2e81f6e"]]);
  class Calendar {
    constructor({
      date,
      selected,
      startDate,
      endDate,
      range
    } = {}) {
      this.date = this.getDate(new Date());
      this.selected = selected || [];
      this.startDate = startDate;
      this.endDate = endDate;
      this.range = range;
      this.cleanMultipleStatus();
      this.weeks = {};
      this.lastHover = false;
    }
    setDate(date) {
      this.selectDate = this.getDate(date);
      this._getWeek(this.selectDate.fullDate);
    }
    cleanMultipleStatus() {
      this.multipleStatus = {
        before: "",
        after: "",
        data: []
      };
    }
    resetSatrtDate(startDate) {
      this.startDate = startDate;
    }
    resetEndDate(endDate) {
      this.endDate = endDate;
    }
    getDate(date, AddDayCount = 0, str = "day") {
      if (!date) {
        date = new Date();
      }
      if (typeof date !== "object") {
        date = date.replace(/-/g, "/");
      }
      const dd = new Date(date);
      switch (str) {
        case "day":
          dd.setDate(dd.getDate() + AddDayCount);
          break;
        case "month":
          if (dd.getDate() === 31) {
            dd.setDate(dd.getDate() + AddDayCount);
          } else {
            dd.setMonth(dd.getMonth() + AddDayCount);
          }
          break;
        case "year":
          dd.setFullYear(dd.getFullYear() + AddDayCount);
          break;
      }
      const y = dd.getFullYear();
      const m = dd.getMonth() + 1 < 10 ? "0" + (dd.getMonth() + 1) : dd.getMonth() + 1;
      const d = dd.getDate() < 10 ? "0" + dd.getDate() : dd.getDate();
      return {
        fullDate: y + "-" + m + "-" + d,
        year: y,
        month: m,
        date: d,
        day: dd.getDay()
      };
    }
    _getLastMonthDays(firstDay, full) {
      let dateArr = [];
      for (let i = firstDay; i > 0; i--) {
        const beforeDate = new Date(full.year, full.month - 1, -i + 1).getDate();
        dateArr.push({
          date: beforeDate,
          month: full.month - 1,
          disable: true
        });
      }
      return dateArr;
    }
    _currentMonthDys(dateData, full) {
      let dateArr = [];
      let fullDate = this.date.fullDate;
      for (let i = 1; i <= dateData; i++) {
        let nowDate = full.year + "-" + (full.month < 10 ? full.month : full.month) + "-" + (i < 10 ? "0" + i : i);
        let isDay = fullDate === nowDate;
        let info = this.selected && this.selected.find((item) => {
          if (this.dateEqual(nowDate, item.date)) {
            return item;
          }
        });
        let disableBefore = true;
        let disableAfter = true;
        if (this.startDate) {
          disableBefore = this.dateCompare(this.startDate, nowDate);
        }
        if (this.endDate) {
          disableAfter = this.dateCompare(nowDate, this.endDate);
        }
        let multiples = this.multipleStatus.data;
        let checked = false;
        let multiplesStatus = -1;
        if (this.range) {
          if (multiples) {
            multiplesStatus = multiples.findIndex((item) => {
              return this.dateEqual(item, nowDate);
            });
          }
          if (multiplesStatus !== -1) {
            checked = true;
          }
        }
        let data = {
          fullDate: nowDate,
          year: full.year,
          date: i,
          multiple: this.range ? checked : false,
          beforeMultiple: this.isLogicBefore(nowDate, this.multipleStatus.before, this.multipleStatus.after),
          afterMultiple: this.isLogicAfter(nowDate, this.multipleStatus.before, this.multipleStatus.after),
          month: full.month,
          disable: !(disableBefore && disableAfter),
          isDay,
          userChecked: false
        };
        if (info) {
          data.extraInfo = info;
        }
        dateArr.push(data);
      }
      return dateArr;
    }
    _getNextMonthDays(surplus, full) {
      let dateArr = [];
      for (let i = 1; i < surplus + 1; i++) {
        dateArr.push({
          date: i,
          month: Number(full.month) + 1,
          disable: true
        });
      }
      return dateArr;
    }
    getInfo(date) {
      if (!date) {
        date = new Date();
      }
      const dateInfo = this.canlender.find((item) => item.fullDate === this.getDate(date).fullDate);
      return dateInfo;
    }
    dateCompare(startDate, endDate) {
      startDate = new Date(startDate.replace("-", "/").replace("-", "/"));
      endDate = new Date(endDate.replace("-", "/").replace("-", "/"));
      if (startDate <= endDate) {
        return true;
      } else {
        return false;
      }
    }
    dateEqual(before, after) {
      before = new Date(before.replace("-", "/").replace("-", "/"));
      after = new Date(after.replace("-", "/").replace("-", "/"));
      if (before.getTime() - after.getTime() === 0) {
        return true;
      } else {
        return false;
      }
    }
    isLogicBefore(currentDay, before, after) {
      let logicBefore = before;
      if (before && after) {
        logicBefore = this.dateCompare(before, after) ? before : after;
      }
      return this.dateEqual(logicBefore, currentDay);
    }
    isLogicAfter(currentDay, before, after) {
      let logicAfter = after;
      if (before && after) {
        logicAfter = this.dateCompare(before, after) ? after : before;
      }
      return this.dateEqual(logicAfter, currentDay);
    }
    geDateAll(begin, end) {
      var arr = [];
      var ab = begin.split("-");
      var ae = end.split("-");
      var db = new Date();
      db.setFullYear(ab[0], ab[1] - 1, ab[2]);
      var de = new Date();
      de.setFullYear(ae[0], ae[1] - 1, ae[2]);
      var unixDb = db.getTime() - 24 * 60 * 60 * 1e3;
      var unixDe = de.getTime() - 24 * 60 * 60 * 1e3;
      for (var k = unixDb; k <= unixDe; ) {
        k = k + 24 * 60 * 60 * 1e3;
        arr.push(this.getDate(new Date(parseInt(k))).fullDate);
      }
      return arr;
    }
    setMultiple(fullDate) {
      let {
        before,
        after
      } = this.multipleStatus;
      if (!this.range)
        return;
      if (before && after) {
        if (!this.lastHover) {
          this.lastHover = true;
          return;
        }
        this.multipleStatus.before = fullDate;
        this.multipleStatus.after = "";
        this.multipleStatus.data = [];
        this.multipleStatus.fulldate = "";
        this.lastHover = false;
      } else {
        if (!before) {
          this.multipleStatus.before = fullDate;
          this.lastHover = false;
        } else {
          this.multipleStatus.after = fullDate;
          if (this.dateCompare(this.multipleStatus.before, this.multipleStatus.after)) {
            this.multipleStatus.data = this.geDateAll(this.multipleStatus.before, this.multipleStatus.after);
          } else {
            this.multipleStatus.data = this.geDateAll(this.multipleStatus.after, this.multipleStatus.before);
          }
          this.lastHover = true;
        }
      }
      this._getWeek(fullDate);
    }
    setHoverMultiple(fullDate) {
      let {
        before,
        after
      } = this.multipleStatus;
      if (!this.range)
        return;
      if (this.lastHover)
        return;
      if (!before) {
        this.multipleStatus.before = fullDate;
      } else {
        this.multipleStatus.after = fullDate;
        if (this.dateCompare(this.multipleStatus.before, this.multipleStatus.after)) {
          this.multipleStatus.data = this.geDateAll(this.multipleStatus.before, this.multipleStatus.after);
        } else {
          this.multipleStatus.data = this.geDateAll(this.multipleStatus.after, this.multipleStatus.before);
        }
      }
      this._getWeek(fullDate);
    }
    setDefaultMultiple(before, after) {
      this.multipleStatus.before = before;
      this.multipleStatus.after = after;
      if (before && after) {
        if (this.dateCompare(before, after)) {
          this.multipleStatus.data = this.geDateAll(before, after);
          this._getWeek(after);
        } else {
          this.multipleStatus.data = this.geDateAll(after, before);
          this._getWeek(before);
        }
      }
    }
    _getWeek(dateData) {
      const {
        fullDate,
        year,
        month,
        date,
        day
      } = this.getDate(dateData);
      let firstDay = new Date(year, month - 1, 1).getDay();
      let currentDay = new Date(year, month, 0).getDate();
      let dates = {
        lastMonthDays: this._getLastMonthDays(firstDay, this.getDate(dateData)),
        currentMonthDys: this._currentMonthDys(currentDay, this.getDate(dateData)),
        nextMonthDays: [],
        weeks: []
      };
      let canlender = [];
      const surplus = 42 - (dates.lastMonthDays.length + dates.currentMonthDys.length);
      dates.nextMonthDays = this._getNextMonthDays(surplus, this.getDate(dateData));
      canlender = canlender.concat(dates.lastMonthDays, dates.currentMonthDys, dates.nextMonthDays);
      let weeks = {};
      for (let i = 0; i < canlender.length; i++) {
        if (i % 7 === 0) {
          weeks[parseInt(i / 7)] = new Array(7);
        }
        weeks[parseInt(i / 7)][i % 7] = canlender[i];
      }
      this.canlender = canlender;
      this.weeks = weeks;
    }
  }
  const _sfc_main$c = {
    props: {
      weeks: {
        type: Object,
        default() {
          return {};
        }
      },
      calendar: {
        type: Object,
        default: () => {
          return {};
        }
      },
      selected: {
        type: Array,
        default: () => {
          return [];
        }
      },
      lunar: {
        type: Boolean,
        default: false
      },
      checkHover: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      choiceDate(weeks) {
        this.$emit("change", weeks);
      },
      handleMousemove(weeks) {
        this.$emit("handleMouse", weeks);
      }
    }
  };
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", {
      class: vue.normalizeClass(["uni-calendar-item__weeks-box", {
        "uni-calendar-item--disable": $props.weeks.disable,
        "uni-calendar-item--before-checked-x": $props.weeks.beforeMultiple,
        "uni-calendar-item--multiple": $props.weeks.multiple,
        "uni-calendar-item--after-checked-x": $props.weeks.afterMultiple
      }]),
      onClick: _cache[0] || (_cache[0] = ($event) => $options.choiceDate($props.weeks)),
      onMouseenter: _cache[1] || (_cache[1] = ($event) => $options.handleMousemove($props.weeks))
    }, [
      vue.createElementVNode("view", {
        class: vue.normalizeClass(["uni-calendar-item__weeks-box-item", {
          "uni-calendar-item--checked": $props.calendar.fullDate === $props.weeks.fullDate && ($props.calendar.userChecked || !$props.checkHover),
          "uni-calendar-item--checked-range-text": $props.checkHover,
          "uni-calendar-item--before-checked": $props.weeks.beforeMultiple,
          "uni-calendar-item--multiple": $props.weeks.multiple,
          "uni-calendar-item--after-checked": $props.weeks.afterMultiple,
          "uni-calendar-item--disable": $props.weeks.disable
        }])
      }, [
        $props.selected && $props.weeks.extraInfo ? (vue.openBlock(), vue.createElementBlock("text", {
          key: 0,
          class: "uni-calendar-item__weeks-box-circle"
        })) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("text", { class: "uni-calendar-item__weeks-box-text uni-calendar-item__weeks-box-text-disable uni-calendar-item--checked-text" }, vue.toDisplayString($props.weeks.date), 1)
      ], 2),
      vue.createElementVNode("view", {
        class: vue.normalizeClass({ "uni-calendar-item--isDay": $props.weeks.isDay })
      }, null, 2)
    ], 34);
  }
  var calendarItem = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["render", _sfc_render$9], ["__scopeId", "data-v-39ec3f8e"]]);
  const isArray = Array.isArray;
  const isObject = (val) => val !== null && typeof val === "object";
  const defaultDelimiters = ["{", "}"];
  class BaseFormatter {
    constructor() {
      this._caches = Object.create(null);
    }
    interpolate(message, values, delimiters = defaultDelimiters) {
      if (!values) {
        return [message];
      }
      let tokens = this._caches[message];
      if (!tokens) {
        tokens = parse(message, delimiters);
        this._caches[message] = tokens;
      }
      return compile(tokens, values);
    }
  }
  const RE_TOKEN_LIST_VALUE = /^(?:\d)+/;
  const RE_TOKEN_NAMED_VALUE = /^(?:\w)+/;
  function parse(format, [startDelimiter, endDelimiter]) {
    const tokens = [];
    let position = 0;
    let text = "";
    while (position < format.length) {
      let char = format[position++];
      if (char === startDelimiter) {
        if (text) {
          tokens.push({ type: "text", value: text });
        }
        text = "";
        let sub = "";
        char = format[position++];
        while (char !== void 0 && char !== endDelimiter) {
          sub += char;
          char = format[position++];
        }
        const isClosed = char === endDelimiter;
        const type = RE_TOKEN_LIST_VALUE.test(sub) ? "list" : isClosed && RE_TOKEN_NAMED_VALUE.test(sub) ? "named" : "unknown";
        tokens.push({ value: sub, type });
      } else {
        text += char;
      }
    }
    text && tokens.push({ type: "text", value: text });
    return tokens;
  }
  function compile(tokens, values) {
    const compiled = [];
    let index = 0;
    const mode = isArray(values) ? "list" : isObject(values) ? "named" : "unknown";
    if (mode === "unknown") {
      return compiled;
    }
    while (index < tokens.length) {
      const token = tokens[index];
      switch (token.type) {
        case "text":
          compiled.push(token.value);
          break;
        case "list":
          compiled.push(values[parseInt(token.value, 10)]);
          break;
        case "named":
          if (mode === "named") {
            compiled.push(values[token.value]);
          } else {
            {
              console.warn(`Type of token '${token.type}' and format of value '${mode}' don't match!`);
            }
          }
          break;
        case "unknown":
          {
            console.warn(`Detect 'unknown' type of token!`);
          }
          break;
      }
      index++;
    }
    return compiled;
  }
  const LOCALE_ZH_HANS = "zh-Hans";
  const LOCALE_ZH_HANT = "zh-Hant";
  const LOCALE_EN = "en";
  const LOCALE_FR = "fr";
  const LOCALE_ES = "es";
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const hasOwn = (val, key) => hasOwnProperty.call(val, key);
  const defaultFormatter = new BaseFormatter();
  function include(str, parts) {
    return !!parts.find((part) => str.indexOf(part) !== -1);
  }
  function startsWith(str, parts) {
    return parts.find((part) => str.indexOf(part) === 0);
  }
  function normalizeLocale(locale, messages2) {
    if (!locale) {
      return;
    }
    locale = locale.trim().replace(/_/g, "-");
    if (messages2 && messages2[locale]) {
      return locale;
    }
    locale = locale.toLowerCase();
    if (locale === "chinese") {
      return LOCALE_ZH_HANS;
    }
    if (locale.indexOf("zh") === 0) {
      if (locale.indexOf("-hans") > -1) {
        return LOCALE_ZH_HANS;
      }
      if (locale.indexOf("-hant") > -1) {
        return LOCALE_ZH_HANT;
      }
      if (include(locale, ["-tw", "-hk", "-mo", "-cht"])) {
        return LOCALE_ZH_HANT;
      }
      return LOCALE_ZH_HANS;
    }
    const lang = startsWith(locale, [LOCALE_EN, LOCALE_FR, LOCALE_ES]);
    if (lang) {
      return lang;
    }
  }
  class I18n {
    constructor({ locale, fallbackLocale, messages: messages2, watcher, formater }) {
      this.locale = LOCALE_EN;
      this.fallbackLocale = LOCALE_EN;
      this.message = {};
      this.messages = {};
      this.watchers = [];
      if (fallbackLocale) {
        this.fallbackLocale = fallbackLocale;
      }
      this.formater = formater || defaultFormatter;
      this.messages = messages2 || {};
      this.setLocale(locale || LOCALE_EN);
      if (watcher) {
        this.watchLocale(watcher);
      }
    }
    setLocale(locale) {
      const oldLocale = this.locale;
      this.locale = normalizeLocale(locale, this.messages) || this.fallbackLocale;
      if (!this.messages[this.locale]) {
        this.messages[this.locale] = {};
      }
      this.message = this.messages[this.locale];
      if (oldLocale !== this.locale) {
        this.watchers.forEach((watcher) => {
          watcher(this.locale, oldLocale);
        });
      }
    }
    getLocale() {
      return this.locale;
    }
    watchLocale(fn) {
      const index = this.watchers.push(fn) - 1;
      return () => {
        this.watchers.splice(index, 1);
      };
    }
    add(locale, message, override = true) {
      const curMessages = this.messages[locale];
      if (curMessages) {
        if (override) {
          Object.assign(curMessages, message);
        } else {
          Object.keys(message).forEach((key) => {
            if (!hasOwn(curMessages, key)) {
              curMessages[key] = message[key];
            }
          });
        }
      } else {
        this.messages[locale] = message;
      }
    }
    f(message, values, delimiters) {
      return this.formater.interpolate(message, values, delimiters).join("");
    }
    t(key, locale, values) {
      let message = this.message;
      if (typeof locale === "string") {
        locale = normalizeLocale(locale, this.messages);
        locale && (message = this.messages[locale]);
      } else {
        values = locale;
      }
      if (!hasOwn(message, key)) {
        console.warn(`Cannot translate the value of keypath ${key}. Use the value of keypath as default.`);
        return key;
      }
      return this.formater.interpolate(message[key], values).join("");
    }
  }
  function watchAppLocale(appVm, i18n) {
    if (appVm.$watchLocale) {
      appVm.$watchLocale((newLocale) => {
        i18n.setLocale(newLocale);
      });
    } else {
      appVm.$watch(() => appVm.$locale, (newLocale) => {
        i18n.setLocale(newLocale);
      });
    }
  }
  function getDefaultLocale() {
    if (typeof uni !== "undefined" && uni.getLocale) {
      return uni.getLocale();
    }
    if (typeof global !== "undefined" && global.getLocale) {
      return global.getLocale();
    }
    return LOCALE_EN;
  }
  function initVueI18n(locale, messages2 = {}, fallbackLocale, watcher) {
    if (typeof locale !== "string") {
      [locale, messages2] = [
        messages2,
        locale
      ];
    }
    if (typeof locale !== "string") {
      locale = getDefaultLocale();
    }
    if (typeof fallbackLocale !== "string") {
      fallbackLocale = typeof __uniConfig !== "undefined" && __uniConfig.fallbackLocale || LOCALE_EN;
    }
    const i18n = new I18n({
      locale,
      fallbackLocale,
      messages: messages2,
      watcher
    });
    let t2 = (key, values) => {
      if (typeof getApp !== "function") {
        t2 = function(key2, values2) {
          return i18n.t(key2, values2);
        };
      } else {
        let isWatchedAppLocale = false;
        t2 = function(key2, values2) {
          const appVm = getApp().$vm;
          if (appVm) {
            appVm.$locale;
            if (!isWatchedAppLocale) {
              isWatchedAppLocale = true;
              watchAppLocale(appVm, i18n);
            }
          }
          return i18n.t(key2, values2);
        };
      }
      return t2(key, values);
    };
    return {
      i18n,
      f(message, values, delimiters) {
        return i18n.f(message, values, delimiters);
      },
      t(key, values) {
        return t2(key, values);
      },
      add(locale2, message, override = true) {
        return i18n.add(locale2, message, override);
      },
      watch(fn) {
        return i18n.watchLocale(fn);
      },
      getLocale() {
        return i18n.getLocale();
      },
      setLocale(newLocale) {
        return i18n.setLocale(newLocale);
      }
    };
  }
  var en = {
    "uni-datetime-picker.selectDate": "select date",
    "uni-datetime-picker.selectTime": "select time",
    "uni-datetime-picker.selectDateTime": "select datetime",
    "uni-datetime-picker.startDate": "start date",
    "uni-datetime-picker.endDate": "end date",
    "uni-datetime-picker.startTime": "start time",
    "uni-datetime-picker.endTime": "end time",
    "uni-datetime-picker.ok": "ok",
    "uni-datetime-picker.clear": "clear",
    "uni-datetime-picker.cancel": "cancel",
    "uni-calender.MON": "MON",
    "uni-calender.TUE": "TUE",
    "uni-calender.WED": "WED",
    "uni-calender.THU": "THU",
    "uni-calender.FRI": "FRI",
    "uni-calender.SAT": "SAT",
    "uni-calender.SUN": "SUN"
  };
  var zhHans = {
    "uni-datetime-picker.selectDate": "\u9009\u62E9\u65E5\u671F",
    "uni-datetime-picker.selectTime": "\u9009\u62E9\u65F6\u95F4",
    "uni-datetime-picker.selectDateTime": "\u9009\u62E9\u65E5\u671F\u65F6\u95F4",
    "uni-datetime-picker.startDate": "\u5F00\u59CB\u65E5\u671F",
    "uni-datetime-picker.endDate": "\u7ED3\u675F\u65E5\u671F",
    "uni-datetime-picker.startTime": "\u5F00\u59CB\u65F6\u95F4",
    "uni-datetime-picker.endTime": "\u7ED3\u675F\u65F6\u95F4",
    "uni-datetime-picker.ok": "\u786E\u5B9A",
    "uni-datetime-picker.clear": "\u6E05\u9664",
    "uni-datetime-picker.cancel": "\u53D6\u6D88",
    "uni-calender.SUN": "\u65E5",
    "uni-calender.MON": "\u4E00",
    "uni-calender.TUE": "\u4E8C",
    "uni-calender.WED": "\u4E09",
    "uni-calender.THU": "\u56DB",
    "uni-calender.FRI": "\u4E94",
    "uni-calender.SAT": "\u516D"
  };
  var zhHant = {
    "uni-datetime-picker.selectDate": "\u9078\u64C7\u65E5\u671F",
    "uni-datetime-picker.selectTime": "\u9078\u64C7\u6642\u9593",
    "uni-datetime-picker.selectDateTime": "\u9078\u64C7\u65E5\u671F\u6642\u9593",
    "uni-datetime-picker.startDate": "\u958B\u59CB\u65E5\u671F",
    "uni-datetime-picker.endDate": "\u7D50\u675F\u65E5\u671F",
    "uni-datetime-picker.startTime": "\u958B\u59CB\u65F6\u95F4",
    "uni-datetime-picker.endTime": "\u7D50\u675F\u65F6\u95F4",
    "uni-datetime-picker.ok": "\u78BA\u5B9A",
    "uni-datetime-picker.clear": "\u6E05\u9664",
    "uni-datetime-picker.cancel": "\u53D6\u6D88",
    "uni-calender.SUN": "\u65E5",
    "uni-calender.MON": "\u4E00",
    "uni-calender.TUE": "\u4E8C",
    "uni-calender.WED": "\u4E09",
    "uni-calender.THU": "\u56DB",
    "uni-calender.FRI": "\u4E94",
    "uni-calender.SAT": "\u516D"
  };
  var messages = {
    en,
    "zh-Hans": zhHans,
    "zh-Hant": zhHant
  };
  const { t: t$2 } = initVueI18n(messages);
  const _sfc_main$b = {
    name: "UniDatetimePicker",
    components: {},
    data() {
      return {
        indicatorStyle: `height: 50px;`,
        visible: false,
        fixNvueBug: {},
        dateShow: true,
        timeShow: true,
        title: "\u65E5\u671F\u548C\u65F6\u95F4",
        time: "",
        year: 1920,
        month: 0,
        day: 0,
        hour: 0,
        minute: 0,
        second: 0,
        startYear: 1920,
        startMonth: 1,
        startDay: 1,
        startHour: 0,
        startMinute: 0,
        startSecond: 0,
        endYear: 2120,
        endMonth: 12,
        endDay: 31,
        endHour: 23,
        endMinute: 59,
        endSecond: 59
      };
    },
    props: {
      type: {
        type: String,
        default: "datetime"
      },
      value: {
        type: [String, Number],
        default: ""
      },
      modelValue: {
        type: [String, Number],
        default: ""
      },
      start: {
        type: [Number, String],
        default: ""
      },
      end: {
        type: [Number, String],
        default: ""
      },
      returnType: {
        type: String,
        default: "string"
      },
      disabled: {
        type: [Boolean, String],
        default: false
      },
      border: {
        type: [Boolean, String],
        default: true
      },
      hideSecond: {
        type: [Boolean, String],
        default: false
      }
    },
    watch: {
      value: {
        handler(newVal, oldVal) {
          if (newVal) {
            this.parseValue(this.fixIosDateFormat(newVal));
            this.initTime(false);
          } else {
            this.time = "";
            this.parseValue(Date.now());
          }
        },
        immediate: true
      },
      type: {
        handler(newValue) {
          if (newValue === "date") {
            this.dateShow = true;
            this.timeShow = false;
            this.title = "\u65E5\u671F";
          } else if (newValue === "time") {
            this.dateShow = false;
            this.timeShow = true;
            this.title = "\u65F6\u95F4";
          } else {
            this.dateShow = true;
            this.timeShow = true;
            this.title = "\u65E5\u671F\u548C\u65F6\u95F4";
          }
        },
        immediate: true
      },
      start: {
        handler(newVal) {
          this.parseDatetimeRange(this.fixIosDateFormat(newVal), "start");
        },
        immediate: true
      },
      end: {
        handler(newVal) {
          this.parseDatetimeRange(this.fixIosDateFormat(newVal), "end");
        },
        immediate: true
      },
      months(newVal) {
        this.checkValue("month", this.month, newVal);
      },
      days(newVal) {
        this.checkValue("day", this.day, newVal);
      },
      hours(newVal) {
        this.checkValue("hour", this.hour, newVal);
      },
      minutes(newVal) {
        this.checkValue("minute", this.minute, newVal);
      },
      seconds(newVal) {
        this.checkValue("second", this.second, newVal);
      }
    },
    computed: {
      years() {
        return this.getCurrentRange("year");
      },
      months() {
        return this.getCurrentRange("month");
      },
      days() {
        return this.getCurrentRange("day");
      },
      hours() {
        return this.getCurrentRange("hour");
      },
      minutes() {
        return this.getCurrentRange("minute");
      },
      seconds() {
        return this.getCurrentRange("second");
      },
      ymd() {
        return [this.year - this.minYear, this.month - this.minMonth, this.day - this.minDay];
      },
      hms() {
        return [this.hour - this.minHour, this.minute - this.minMinute, this.second - this.minSecond];
      },
      currentDateIsStart() {
        return this.year === this.startYear && this.month === this.startMonth && this.day === this.startDay;
      },
      currentDateIsEnd() {
        return this.year === this.endYear && this.month === this.endMonth && this.day === this.endDay;
      },
      minYear() {
        return this.startYear;
      },
      maxYear() {
        return this.endYear;
      },
      minMonth() {
        if (this.year === this.startYear) {
          return this.startMonth;
        } else {
          return 1;
        }
      },
      maxMonth() {
        if (this.year === this.endYear) {
          return this.endMonth;
        } else {
          return 12;
        }
      },
      minDay() {
        if (this.year === this.startYear && this.month === this.startMonth) {
          return this.startDay;
        } else {
          return 1;
        }
      },
      maxDay() {
        if (this.year === this.endYear && this.month === this.endMonth) {
          return this.endDay;
        } else {
          return this.daysInMonth(this.year, this.month);
        }
      },
      minHour() {
        if (this.type === "datetime") {
          if (this.currentDateIsStart) {
            return this.startHour;
          } else {
            return 0;
          }
        }
        if (this.type === "time") {
          return this.startHour;
        }
      },
      maxHour() {
        if (this.type === "datetime") {
          if (this.currentDateIsEnd) {
            return this.endHour;
          } else {
            return 23;
          }
        }
        if (this.type === "time") {
          return this.endHour;
        }
      },
      minMinute() {
        if (this.type === "datetime") {
          if (this.currentDateIsStart && this.hour === this.startHour) {
            return this.startMinute;
          } else {
            return 0;
          }
        }
        if (this.type === "time") {
          if (this.hour === this.startHour) {
            return this.startMinute;
          } else {
            return 0;
          }
        }
      },
      maxMinute() {
        if (this.type === "datetime") {
          if (this.currentDateIsEnd && this.hour === this.endHour) {
            return this.endMinute;
          } else {
            return 59;
          }
        }
        if (this.type === "time") {
          if (this.hour === this.endHour) {
            return this.endMinute;
          } else {
            return 59;
          }
        }
      },
      minSecond() {
        if (this.type === "datetime") {
          if (this.currentDateIsStart && this.hour === this.startHour && this.minute === this.startMinute) {
            return this.startSecond;
          } else {
            return 0;
          }
        }
        if (this.type === "time") {
          if (this.hour === this.startHour && this.minute === this.startMinute) {
            return this.startSecond;
          } else {
            return 0;
          }
        }
      },
      maxSecond() {
        if (this.type === "datetime") {
          if (this.currentDateIsEnd && this.hour === this.endHour && this.minute === this.endMinute) {
            return this.endSecond;
          } else {
            return 59;
          }
        }
        if (this.type === "time") {
          if (this.hour === this.endHour && this.minute === this.endMinute) {
            return this.endSecond;
          } else {
            return 59;
          }
        }
      },
      selectTimeText() {
        return t$2("uni-datetime-picker.selectTime");
      },
      okText() {
        return t$2("uni-datetime-picker.ok");
      },
      clearText() {
        return t$2("uni-datetime-picker.clear");
      },
      cancelText() {
        return t$2("uni-datetime-picker.cancel");
      }
    },
    mounted() {
    },
    methods: {
      lessThanTen(item) {
        return item < 10 ? "0" + item : item;
      },
      parseTimeType(timeString) {
        if (timeString) {
          let timeArr = timeString.split(":");
          this.hour = Number(timeArr[0]);
          this.minute = Number(timeArr[1]);
          this.second = Number(timeArr[2]);
        }
      },
      initPickerValue(datetime) {
        let defaultValue = null;
        if (datetime) {
          defaultValue = this.compareValueWithStartAndEnd(datetime, this.start, this.end);
        } else {
          defaultValue = Date.now();
          defaultValue = this.compareValueWithStartAndEnd(defaultValue, this.start, this.end);
        }
        this.parseValue(defaultValue);
      },
      compareValueWithStartAndEnd(value, start, end) {
        let winner = null;
        value = this.superTimeStamp(value);
        start = this.superTimeStamp(start);
        end = this.superTimeStamp(end);
        if (start && end) {
          if (value < start) {
            winner = new Date(start);
          } else if (value > end) {
            winner = new Date(end);
          } else {
            winner = new Date(value);
          }
        } else if (start && !end) {
          winner = start <= value ? new Date(value) : new Date(start);
        } else if (!start && end) {
          winner = value <= end ? new Date(value) : new Date(end);
        } else {
          winner = new Date(value);
        }
        return winner;
      },
      superTimeStamp(value) {
        let dateBase = "";
        if (this.type === "time" && value && typeof value === "string") {
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth() + 1;
          const day = now.getDate();
          dateBase = year + "/" + month + "/" + day + " ";
        }
        if (Number(value) && typeof value !== NaN) {
          value = parseInt(value);
          dateBase = 0;
        }
        return this.createTimeStamp(dateBase + value);
      },
      parseValue(value) {
        if (!value) {
          return;
        }
        if (this.type === "time" && typeof value === "string") {
          this.parseTimeType(value);
        } else {
          let defaultDate = null;
          defaultDate = new Date(value);
          if (this.type !== "time") {
            this.year = defaultDate.getFullYear();
            this.month = defaultDate.getMonth() + 1;
            this.day = defaultDate.getDate();
          }
          if (this.type !== "date") {
            this.hour = defaultDate.getHours();
            this.minute = defaultDate.getMinutes();
            this.second = defaultDate.getSeconds();
          }
        }
        if (this.hideSecond) {
          this.second = 0;
        }
      },
      parseDatetimeRange(point, pointType) {
        if (!point) {
          if (pointType === "start") {
            this.startYear = 1920;
            this.startMonth = 1;
            this.startDay = 1;
            this.startHour = 0;
            this.startMinute = 0;
            this.startSecond = 0;
          }
          if (pointType === "end") {
            this.endYear = 2120;
            this.endMonth = 12;
            this.endDay = 31;
            this.endHour = 23;
            this.endMinute = 59;
            this.endSecond = 59;
          }
          return;
        }
        if (this.type === "time") {
          const pointArr = point.split(":");
          this[pointType + "Hour"] = Number(pointArr[0]);
          this[pointType + "Minute"] = Number(pointArr[1]);
          this[pointType + "Second"] = Number(pointArr[2]);
        } else {
          if (!point) {
            pointType === "start" ? this.startYear = this.year - 60 : this.endYear = this.year + 60;
            return;
          }
          if (Number(point) && Number(point) !== NaN) {
            point = parseInt(point);
          }
          const hasTime = /[0-9]:[0-9]/;
          if (this.type === "datetime" && pointType === "end" && typeof point === "string" && !hasTime.test(point)) {
            point = point + " 23:59:59";
          }
          const pointDate = new Date(point);
          this[pointType + "Year"] = pointDate.getFullYear();
          this[pointType + "Month"] = pointDate.getMonth() + 1;
          this[pointType + "Day"] = pointDate.getDate();
          if (this.type === "datetime") {
            this[pointType + "Hour"] = pointDate.getHours();
            this[pointType + "Minute"] = pointDate.getMinutes();
            this[pointType + "Second"] = pointDate.getSeconds();
          }
        }
      },
      getCurrentRange(value) {
        const range = [];
        for (let i = this["min" + this.capitalize(value)]; i <= this["max" + this.capitalize(value)]; i++) {
          range.push(i);
        }
        return range;
      },
      capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
      },
      checkValue(name, value, values) {
        if (values.indexOf(value) === -1) {
          this[name] = values[0];
        }
      },
      daysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
      },
      fixIosDateFormat(value) {
        if (typeof value === "string") {
          value = value.replace(/-/g, "/");
        }
        return value;
      },
      createTimeStamp(time) {
        if (!time)
          return;
        if (typeof time === "number") {
          return time;
        } else {
          time = time.replace(/-/g, "/");
          if (this.type === "date") {
            time = time + " 00:00:00";
          }
          return Date.parse(time);
        }
      },
      createDomSting() {
        const yymmdd = this.year + "-" + this.lessThanTen(this.month) + "-" + this.lessThanTen(this.day);
        let hhmmss = this.lessThanTen(this.hour) + ":" + this.lessThanTen(this.minute);
        if (!this.hideSecond) {
          hhmmss = hhmmss + ":" + this.lessThanTen(this.second);
        }
        if (this.type === "date") {
          return yymmdd;
        } else if (this.type === "time") {
          return hhmmss;
        } else {
          return yymmdd + " " + hhmmss;
        }
      },
      initTime(emit = true) {
        this.time = this.createDomSting();
        if (!emit)
          return;
        if (this.returnType === "timestamp" && this.type !== "time") {
          this.$emit("change", this.createTimeStamp(this.time));
          this.$emit("input", this.createTimeStamp(this.time));
          this.$emit("update:modelValue", this.createTimeStamp(this.time));
        } else {
          this.$emit("change", this.time);
          this.$emit("input", this.time);
          this.$emit("update:modelValue", this.time);
        }
      },
      bindDateChange(e) {
        const val = e.detail.value;
        this.year = this.years[val[0]];
        this.month = this.months[val[1]];
        this.day = this.days[val[2]];
      },
      bindTimeChange(e) {
        const val = e.detail.value;
        this.hour = this.hours[val[0]];
        this.minute = this.minutes[val[1]];
        this.second = this.seconds[val[2]];
      },
      initTimePicker() {
        if (this.disabled)
          return;
        const value = this.fixIosDateFormat(this.value);
        this.initPickerValue(value);
        this.visible = !this.visible;
      },
      tiggerTimePicker(e) {
        this.visible = !this.visible;
      },
      clearTime() {
        this.time = "";
        this.$emit("change", this.time);
        this.$emit("input", this.time);
        this.$emit("update:modelValue", this.time);
        this.tiggerTimePicker();
      },
      setTime() {
        this.initTime();
        this.tiggerTimePicker();
      }
    }
  };
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-datetime-picker" }, [
      vue.createElementVNode("view", {
        onClick: _cache[0] || (_cache[0] = (...args) => $options.initTimePicker && $options.initTimePicker(...args))
      }, [
        vue.renderSlot(_ctx.$slots, "default", {}, () => [
          vue.createElementVNode("view", {
            class: vue.normalizeClass(["uni-datetime-picker-timebox-pointer", { "uni-datetime-picker-disabled": $props.disabled, "uni-datetime-picker-timebox": $props.border }])
          }, [
            vue.createElementVNode("text", { class: "uni-datetime-picker-text" }, vue.toDisplayString($data.time), 1),
            !$data.time ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "uni-datetime-picker-time"
            }, [
              vue.createElementVNode("text", { class: "uni-datetime-picker-text" }, vue.toDisplayString($options.selectTimeText), 1)
            ])) : vue.createCommentVNode("v-if", true)
          ], 2)
        ], true)
      ]),
      $data.visible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        id: "mask",
        class: "uni-datetime-picker-mask",
        onClick: _cache[1] || (_cache[1] = (...args) => $options.tiggerTimePicker && $options.tiggerTimePicker(...args))
      })) : vue.createCommentVNode("v-if", true),
      $data.visible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: vue.normalizeClass(["uni-datetime-picker-popup", [$data.dateShow && $data.timeShow ? "" : "fix-nvue-height"]]),
        style: vue.normalizeStyle($data.fixNvueBug)
      }, [
        vue.createElementVNode("view", { class: "uni-title" }, [
          vue.createElementVNode("text", { class: "uni-datetime-picker-text" }, vue.toDisplayString($options.selectTimeText), 1)
        ]),
        $data.dateShow ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "uni-datetime-picker__container-box"
        }, [
          vue.createElementVNode("picker-view", {
            class: "uni-datetime-picker-view",
            "indicator-style": $data.indicatorStyle,
            value: $options.ymd,
            onChange: _cache[2] || (_cache[2] = (...args) => $options.bindDateChange && $options.bindDateChange(...args))
          }, [
            vue.createElementVNode("picker-view-column", null, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList($options.years, (item, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "uni-datetime-picker-item",
                  key: index
                }, [
                  vue.createElementVNode("text", { class: "uni-datetime-picker-item" }, vue.toDisplayString($options.lessThanTen(item)), 1)
                ]);
              }), 128))
            ]),
            vue.createElementVNode("picker-view-column", null, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList($options.months, (item, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "uni-datetime-picker-item",
                  key: index
                }, [
                  vue.createElementVNode("text", { class: "uni-datetime-picker-item" }, vue.toDisplayString($options.lessThanTen(item)), 1)
                ]);
              }), 128))
            ]),
            vue.createElementVNode("picker-view-column", null, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList($options.days, (item, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "uni-datetime-picker-item",
                  key: index
                }, [
                  vue.createElementVNode("text", { class: "uni-datetime-picker-item" }, vue.toDisplayString($options.lessThanTen(item)), 1)
                ]);
              }), 128))
            ])
          ], 40, ["indicator-style", "value"]),
          vue.createCommentVNode(" \u517C\u5BB9 nvue \u4E0D\u652F\u6301\u4F2A\u7C7B "),
          vue.createElementVNode("text", { class: "uni-datetime-picker-sign sign-left" }, "-"),
          vue.createElementVNode("text", { class: "uni-datetime-picker-sign sign-right" }, "-")
        ])) : vue.createCommentVNode("v-if", true),
        $data.timeShow ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "uni-datetime-picker__container-box"
        }, [
          vue.createElementVNode("picker-view", {
            class: vue.normalizeClass(["uni-datetime-picker-view", [$props.hideSecond ? "time-hide-second" : ""]]),
            "indicator-style": $data.indicatorStyle,
            value: $options.hms,
            onChange: _cache[3] || (_cache[3] = (...args) => $options.bindTimeChange && $options.bindTimeChange(...args))
          }, [
            vue.createElementVNode("picker-view-column", null, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList($options.hours, (item, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "uni-datetime-picker-item",
                  key: index
                }, [
                  vue.createElementVNode("text", { class: "uni-datetime-picker-item" }, vue.toDisplayString($options.lessThanTen(item)), 1)
                ]);
              }), 128))
            ]),
            vue.createElementVNode("picker-view-column", null, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList($options.minutes, (item, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "uni-datetime-picker-item",
                  key: index
                }, [
                  vue.createElementVNode("text", { class: "uni-datetime-picker-item" }, vue.toDisplayString($options.lessThanTen(item)), 1)
                ]);
              }), 128))
            ]),
            !$props.hideSecond ? (vue.openBlock(), vue.createElementBlock("picker-view-column", { key: 0 }, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList($options.seconds, (item, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "uni-datetime-picker-item",
                  key: index
                }, [
                  vue.createElementVNode("text", { class: "uni-datetime-picker-item" }, vue.toDisplayString($options.lessThanTen(item)), 1)
                ]);
              }), 128))
            ])) : vue.createCommentVNode("v-if", true)
          ], 42, ["indicator-style", "value"]),
          vue.createCommentVNode(" \u517C\u5BB9 nvue \u4E0D\u652F\u6301\u4F2A\u7C7B "),
          vue.createElementVNode("text", {
            class: vue.normalizeClass(["uni-datetime-picker-sign", [$props.hideSecond ? "sign-center" : "sign-left"]])
          }, ":", 2),
          !$props.hideSecond ? (vue.openBlock(), vue.createElementBlock("text", {
            key: 0,
            class: "uni-datetime-picker-sign sign-right"
          }, ":")) : vue.createCommentVNode("v-if", true)
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "uni-datetime-picker-btn" }, [
          vue.createElementVNode("view", {
            onClick: _cache[4] || (_cache[4] = (...args) => $options.clearTime && $options.clearTime(...args))
          }, [
            vue.createElementVNode("text", { class: "uni-datetime-picker-btn-text" }, vue.toDisplayString($options.clearText), 1)
          ]),
          vue.createElementVNode("view", { class: "uni-datetime-picker-btn-group" }, [
            vue.createElementVNode("view", {
              class: "uni-datetime-picker-cancel",
              onClick: _cache[5] || (_cache[5] = (...args) => $options.tiggerTimePicker && $options.tiggerTimePicker(...args))
            }, [
              vue.createElementVNode("text", { class: "uni-datetime-picker-btn-text" }, vue.toDisplayString($options.cancelText), 1)
            ]),
            vue.createElementVNode("view", {
              onClick: _cache[6] || (_cache[6] = (...args) => $options.setTime && $options.setTime(...args))
            }, [
              vue.createElementVNode("text", { class: "uni-datetime-picker-btn-text" }, vue.toDisplayString($options.okText), 1)
            ])
          ])
        ])
      ], 6)) : vue.createCommentVNode("v-if", true)
    ]);
  }
  var timePicker = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$8], ["__scopeId", "data-v-60a1244c"]]);
  const {
    t: t$1
  } = initVueI18n(messages);
  const _sfc_main$a = {
    components: {
      calendarItem,
      timePicker
    },
    props: {
      date: {
        type: String,
        default: ""
      },
      defTime: {
        type: [String, Object],
        default: ""
      },
      selectableTimes: {
        type: [Object],
        default() {
          return {};
        }
      },
      selected: {
        type: Array,
        default() {
          return [];
        }
      },
      lunar: {
        type: Boolean,
        default: false
      },
      startDate: {
        type: String,
        default: ""
      },
      endDate: {
        type: String,
        default: ""
      },
      range: {
        type: Boolean,
        default: false
      },
      typeHasTime: {
        type: Boolean,
        default: false
      },
      insert: {
        type: Boolean,
        default: true
      },
      showMonth: {
        type: Boolean,
        default: true
      },
      clearDate: {
        type: Boolean,
        default: true
      },
      left: {
        type: Boolean,
        default: true
      },
      right: {
        type: Boolean,
        default: true
      },
      checkHover: {
        type: Boolean,
        default: true
      },
      hideSecond: {
        type: [Boolean],
        default: false
      },
      pleStatus: {
        type: Object,
        default() {
          return {
            before: "",
            after: "",
            data: [],
            fulldate: ""
          };
        }
      }
    },
    data() {
      return {
        show: false,
        weeks: [],
        calendar: {},
        nowDate: "",
        aniMaskShow: false,
        firstEnter: true,
        time: "",
        timeRange: {
          startTime: "",
          endTime: ""
        },
        tempSingleDate: "",
        tempRange: {
          before: "",
          after: ""
        }
      };
    },
    watch: {
      date: {
        immediate: true,
        handler(newVal, oldVal) {
          if (!this.range) {
            this.tempSingleDate = newVal;
            setTimeout(() => {
              this.init(newVal);
            }, 100);
          }
        }
      },
      defTime: {
        immediate: true,
        handler(newVal, oldVal) {
          if (!this.range) {
            this.time = newVal;
          } else {
            this.timeRange.startTime = newVal.start;
            this.timeRange.endTime = newVal.end;
          }
        }
      },
      startDate(val) {
        this.cale.resetSatrtDate(val);
        this.cale.setDate(this.nowDate.fullDate);
        this.weeks = this.cale.weeks;
      },
      endDate(val) {
        this.cale.resetEndDate(val);
        this.cale.setDate(this.nowDate.fullDate);
        this.weeks = this.cale.weeks;
      },
      selected(newVal) {
        this.cale.setSelectInfo(this.nowDate.fullDate, newVal);
        this.weeks = this.cale.weeks;
      },
      pleStatus: {
        immediate: true,
        handler(newVal, oldVal) {
          const {
            before,
            after,
            fulldate,
            which
          } = newVal;
          this.tempRange.before = before;
          this.tempRange.after = after;
          setTimeout(() => {
            if (fulldate) {
              this.cale.setHoverMultiple(fulldate);
              if (before && after) {
                this.cale.lastHover = true;
                if (this.rangeWithinMonth(after, before))
                  return;
                this.setDate(before);
              } else {
                this.cale.setMultiple(fulldate);
                this.setDate(this.nowDate.fullDate);
                this.calendar.fullDate = "";
                this.cale.lastHover = false;
              }
            } else {
              this.cale.setDefaultMultiple(before, after);
              if (which === "left") {
                this.setDate(before);
                this.weeks = this.cale.weeks;
              } else {
                this.setDate(after);
                this.weeks = this.cale.weeks;
              }
              this.cale.lastHover = true;
            }
          }, 16);
        }
      }
    },
    computed: {
      reactStartTime() {
        const activeDate = this.range ? this.tempRange.before : this.calendar.fullDate;
        const res = activeDate === this.startDate ? this.selectableTimes.start : "";
        return res;
      },
      reactEndTime() {
        const activeDate = this.range ? this.tempRange.after : this.calendar.fullDate;
        const res = activeDate === this.endDate ? this.selectableTimes.end : "";
        return res;
      },
      selectDateText() {
        return t$1("uni-datetime-picker.selectDate");
      },
      startDateText() {
        return this.startPlaceholder || t$1("uni-datetime-picker.startDate");
      },
      endDateText() {
        return this.endPlaceholder || t$1("uni-datetime-picker.endDate");
      },
      okText() {
        return t$1("uni-datetime-picker.ok");
      },
      monText() {
        return t$1("uni-calender.MON");
      },
      TUEText() {
        return t$1("uni-calender.TUE");
      },
      WEDText() {
        return t$1("uni-calender.WED");
      },
      THUText() {
        return t$1("uni-calender.THU");
      },
      FRIText() {
        return t$1("uni-calender.FRI");
      },
      SATText() {
        return t$1("uni-calender.SAT");
      },
      SUNText() {
        return t$1("uni-calender.SUN");
      }
    },
    created() {
      this.cale = new Calendar({
        selected: this.selected,
        startDate: this.startDate,
        endDate: this.endDate,
        range: this.range
      });
      this.init(this.date);
    },
    methods: {
      leaveCale() {
        this.firstEnter = true;
      },
      handleMouse(weeks) {
        if (weeks.disable)
          return;
        if (this.cale.lastHover)
          return;
        let {
          before,
          after
        } = this.cale.multipleStatus;
        if (!before)
          return;
        this.calendar = weeks;
        this.cale.setHoverMultiple(this.calendar.fullDate);
        this.weeks = this.cale.weeks;
        if (this.firstEnter) {
          this.$emit("firstEnterCale", this.cale.multipleStatus);
          this.firstEnter = false;
        }
      },
      rangeWithinMonth(A, B) {
        const [yearA, monthA] = A.split("-");
        const [yearB, monthB] = B.split("-");
        return yearA === yearB && monthA === monthB;
      },
      clean() {
        this.close();
      },
      clearCalender() {
        if (this.range) {
          this.timeRange.startTime = "";
          this.timeRange.endTime = "";
          this.tempRange.before = "";
          this.tempRange.after = "";
          this.cale.multipleStatus.before = "";
          this.cale.multipleStatus.after = "";
          this.cale.multipleStatus.data = [];
          this.cale.lastHover = false;
        } else {
          this.time = "";
          this.tempSingleDate = "";
        }
        this.calendar.fullDate = "";
        this.setDate();
      },
      bindDateChange(e) {
        const value = e.detail.value + "-1";
        this.init(value);
      },
      init(date) {
        this.cale.setDate(date);
        this.weeks = this.cale.weeks;
        this.nowDate = this.calendar = this.cale.getInfo(date);
      },
      open() {
        if (this.clearDate && !this.insert) {
          this.cale.cleanMultipleStatus();
          this.init(this.date);
        }
        this.show = true;
        this.$nextTick(() => {
          setTimeout(() => {
            this.aniMaskShow = true;
          }, 50);
        });
      },
      close() {
        this.aniMaskShow = false;
        this.$nextTick(() => {
          setTimeout(() => {
            this.show = false;
            this.$emit("close");
          }, 300);
        });
      },
      confirm() {
        this.setEmit("confirm");
        this.close();
      },
      change() {
        if (!this.insert)
          return;
        this.setEmit("change");
      },
      monthSwitch() {
        let {
          year,
          month
        } = this.nowDate;
        this.$emit("monthSwitch", {
          year,
          month: Number(month)
        });
      },
      setEmit(name) {
        let {
          year,
          month,
          date,
          fullDate,
          lunar,
          extraInfo
        } = this.calendar;
        this.$emit(name, {
          range: this.cale.multipleStatus,
          year,
          month,
          date,
          time: this.time,
          timeRange: this.timeRange,
          fulldate: fullDate,
          lunar,
          extraInfo: extraInfo || {}
        });
      },
      choiceDate(weeks) {
        if (weeks.disable)
          return;
        this.calendar = weeks;
        this.calendar.userChecked = true;
        this.cale.setMultiple(this.calendar.fullDate, true);
        this.weeks = this.cale.weeks;
        this.tempSingleDate = this.calendar.fullDate;
        this.tempRange.before = this.cale.multipleStatus.before;
        this.tempRange.after = this.cale.multipleStatus.after;
        this.change();
      },
      backtoday() {
        let date = this.cale.getDate(new Date()).fullDate;
        this.init(date);
        this.change();
      },
      dateCompare(startDate, endDate) {
        startDate = new Date(startDate.replace("-", "/").replace("-", "/"));
        endDate = new Date(endDate.replace("-", "/").replace("-", "/"));
        if (startDate <= endDate) {
          return true;
        } else {
          return false;
        }
      },
      pre() {
        const preDate = this.cale.getDate(this.nowDate.fullDate, -1, "month").fullDate;
        this.setDate(preDate);
        this.monthSwitch();
      },
      next() {
        const nextDate = this.cale.getDate(this.nowDate.fullDate, 1, "month").fullDate;
        this.setDate(nextDate);
        this.monthSwitch();
      },
      setDate(date) {
        this.cale.setDate(date);
        this.weeks = this.cale.weeks;
        this.nowDate = this.cale.getInfo(date);
      }
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_calendar_item = vue.resolveComponent("calendar-item");
    const _component_time_picker = vue.resolveComponent("time-picker");
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$2);
    return vue.openBlock(), vue.createElementBlock("view", {
      class: "uni-calendar",
      onMouseleave: _cache[9] || (_cache[9] = (...args) => $options.leaveCale && $options.leaveCale(...args))
    }, [
      !$props.insert && $data.show ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: vue.normalizeClass(["uni-calendar__mask", { "uni-calendar--mask-show": $data.aniMaskShow }]),
        onClick: _cache[0] || (_cache[0] = (...args) => $options.clean && $options.clean(...args))
      }, null, 2)) : vue.createCommentVNode("v-if", true),
      $props.insert || $data.show ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: vue.normalizeClass(["uni-calendar__content", { "uni-calendar--fixed": !$props.insert, "uni-calendar--ani-show": $data.aniMaskShow, "uni-calendar__content-mobile": $data.aniMaskShow }])
      }, [
        vue.createElementVNode("view", {
          class: vue.normalizeClass(["uni-calendar__header", { "uni-calendar__header-mobile": !$props.insert }])
        }, [
          $props.left ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "uni-calendar__header-btn-box",
            onClick: _cache[1] || (_cache[1] = vue.withModifiers((...args) => $options.pre && $options.pre(...args), ["stop"]))
          }, [
            vue.createElementVNode("view", { class: "uni-calendar__header-btn uni-calendar--left" })
          ])) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("picker", {
            mode: "date",
            value: $props.date,
            fields: "month",
            onChange: _cache[2] || (_cache[2] = (...args) => $options.bindDateChange && $options.bindDateChange(...args))
          }, [
            vue.createElementVNode("text", { class: "uni-calendar__header-text" }, vue.toDisplayString(($data.nowDate.year || "") + " \u5E74 " + ($data.nowDate.month || "") + " \u6708"), 1)
          ], 40, ["value"]),
          $props.right ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "uni-calendar__header-btn-box",
            onClick: _cache[3] || (_cache[3] = vue.withModifiers((...args) => $options.next && $options.next(...args), ["stop"]))
          }, [
            vue.createElementVNode("view", { class: "uni-calendar__header-btn uni-calendar--right" })
          ])) : vue.createCommentVNode("v-if", true),
          !$props.insert ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 2,
            class: "dialog-close",
            onClick: _cache[4] || (_cache[4] = (...args) => $options.clean && $options.clean(...args))
          }, [
            vue.createElementVNode("view", {
              class: "dialog-close-plus",
              "data-id": "close"
            }),
            vue.createElementVNode("view", {
              class: "dialog-close-plus dialog-close-rotate",
              "data-id": "close"
            })
          ])) : vue.createCommentVNode("v-if", true),
          vue.createCommentVNode(' <text class="uni-calendar__backtoday" @click="backtoday">\u56DE\u5230\u4ECA\u5929</text> ')
        ], 2),
        vue.createElementVNode("view", { class: "uni-calendar__box" }, [
          $props.showMonth ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "uni-calendar__box-bg"
          }, [
            vue.createElementVNode("text", { class: "uni-calendar__box-bg-text" }, vue.toDisplayString($data.nowDate.month), 1)
          ])) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("view", {
            class: "uni-calendar__weeks",
            style: { "padding-bottom": "7px" }
          }, [
            vue.createElementVNode("view", { class: "uni-calendar__weeks-day" }, [
              vue.createElementVNode("text", { class: "uni-calendar__weeks-day-text" }, vue.toDisplayString($options.SUNText), 1)
            ]),
            vue.createElementVNode("view", { class: "uni-calendar__weeks-day" }, [
              vue.createElementVNode("text", { class: "uni-calendar__weeks-day-text" }, vue.toDisplayString($options.monText), 1)
            ]),
            vue.createElementVNode("view", { class: "uni-calendar__weeks-day" }, [
              vue.createElementVNode("text", { class: "uni-calendar__weeks-day-text" }, vue.toDisplayString($options.TUEText), 1)
            ]),
            vue.createElementVNode("view", { class: "uni-calendar__weeks-day" }, [
              vue.createElementVNode("text", { class: "uni-calendar__weeks-day-text" }, vue.toDisplayString($options.WEDText), 1)
            ]),
            vue.createElementVNode("view", { class: "uni-calendar__weeks-day" }, [
              vue.createElementVNode("text", { class: "uni-calendar__weeks-day-text" }, vue.toDisplayString($options.THUText), 1)
            ]),
            vue.createElementVNode("view", { class: "uni-calendar__weeks-day" }, [
              vue.createElementVNode("text", { class: "uni-calendar__weeks-day-text" }, vue.toDisplayString($options.FRIText), 1)
            ]),
            vue.createElementVNode("view", { class: "uni-calendar__weeks-day" }, [
              vue.createElementVNode("text", { class: "uni-calendar__weeks-day-text" }, vue.toDisplayString($options.SATText), 1)
            ])
          ]),
          (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList($data.weeks, (item, weekIndex) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              class: "uni-calendar__weeks",
              key: weekIndex
            }, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(item, (weeks, weeksIndex) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "uni-calendar__weeks-item",
                  key: weeksIndex
                }, [
                  vue.createVNode(_component_calendar_item, {
                    class: "uni-calendar-item--hook",
                    weeks,
                    calendar: $data.calendar,
                    selected: $props.selected,
                    lunar: $props.lunar,
                    checkHover: $props.range,
                    onChange: $options.choiceDate,
                    onHandleMouse: $options.handleMouse
                  }, null, 8, ["weeks", "calendar", "selected", "lunar", "checkHover", "onChange", "onHandleMouse"])
                ]);
              }), 128))
            ]);
          }), 128))
        ]),
        !$props.insert && !$props.range && $props.typeHasTime ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "uni-date-changed uni-calendar--fixed-top",
          style: { "padding": "0 80px" }
        }, [
          vue.createElementVNode("view", { class: "uni-date-changed--time-date" }, vue.toDisplayString($data.tempSingleDate ? $data.tempSingleDate : $options.selectDateText), 1),
          vue.createVNode(_component_time_picker, {
            type: "time",
            start: $options.reactStartTime,
            end: $options.reactEndTime,
            modelValue: $data.time,
            "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $data.time = $event),
            disabled: !$data.tempSingleDate,
            border: false,
            "hide-second": $props.hideSecond,
            class: "time-picker-style"
          }, null, 8, ["start", "end", "modelValue", "disabled", "hide-second"])
        ])) : vue.createCommentVNode("v-if", true),
        !$props.insert && $props.range && $props.typeHasTime ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "uni-date-changed uni-calendar--fixed-top"
        }, [
          vue.createElementVNode("view", { class: "uni-date-changed--time-start" }, [
            vue.createElementVNode("view", { class: "uni-date-changed--time-date" }, vue.toDisplayString($data.tempRange.before ? $data.tempRange.before : $options.startDateText), 1),
            vue.createVNode(_component_time_picker, {
              type: "time",
              start: $options.reactStartTime,
              modelValue: $data.timeRange.startTime,
              "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $data.timeRange.startTime = $event),
              border: false,
              "hide-second": $props.hideSecond,
              disabled: !$data.tempRange.before,
              class: "time-picker-style"
            }, null, 8, ["start", "modelValue", "hide-second", "disabled"])
          ]),
          vue.createVNode(_component_uni_icons, {
            type: "arrowthinright",
            color: "#999",
            style: { "line-height": "50px" }
          }),
          vue.createElementVNode("view", { class: "uni-date-changed--time-end" }, [
            vue.createElementVNode("view", { class: "uni-date-changed--time-date" }, vue.toDisplayString($data.tempRange.after ? $data.tempRange.after : $options.endDateText), 1),
            vue.createVNode(_component_time_picker, {
              type: "time",
              end: $options.reactEndTime,
              modelValue: $data.timeRange.endTime,
              "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => $data.timeRange.endTime = $event),
              border: false,
              "hide-second": $props.hideSecond,
              disabled: !$data.tempRange.after,
              class: "time-picker-style"
            }, null, 8, ["end", "modelValue", "hide-second", "disabled"])
          ])
        ])) : vue.createCommentVNode("v-if", true),
        !$props.insert ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 2,
          class: "uni-date-changed uni-date-btn--ok"
        }, [
          vue.createCommentVNode(' <view class="uni-calendar__header-btn-box">\n					<text class="uni-calendar__button-text uni-calendar--fixed-width">{{okText}}</text>\n				</view> '),
          vue.createElementVNode("view", {
            class: "uni-datetime-picker--btn",
            onClick: _cache[8] || (_cache[8] = (...args) => $options.confirm && $options.confirm(...args))
          }, "\u786E\u8BA4")
        ])) : vue.createCommentVNode("v-if", true)
      ], 2)) : vue.createCommentVNode("v-if", true)
    ], 32);
  }
  var calendar = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$7], ["__scopeId", "data-v-94becebc"]]);
  const {
    t
  } = initVueI18n(messages);
  const _sfc_main$9 = {
    name: "UniDatetimePicker",
    components: {
      calendar,
      timePicker
    },
    data() {
      return {
        isRange: false,
        hasTime: false,
        mobileRange: false,
        singleVal: "",
        tempSingleDate: "",
        defSingleDate: "",
        time: "",
        caleRange: {
          startDate: "",
          startTime: "",
          endDate: "",
          endTime: ""
        },
        range: {
          startDate: "",
          endDate: ""
        },
        tempRange: {
          startDate: "",
          startTime: "",
          endDate: "",
          endTime: ""
        },
        startMultipleStatus: {
          before: "",
          after: "",
          data: [],
          fulldate: ""
        },
        endMultipleStatus: {
          before: "",
          after: "",
          data: [],
          fulldate: ""
        },
        visible: false,
        popup: false,
        popover: null,
        isEmitValue: false,
        isPhone: false,
        isFirstShow: true
      };
    },
    props: {
      type: {
        type: String,
        default: "datetime"
      },
      value: {
        type: [String, Number, Array, Date],
        default: ""
      },
      modelValue: {
        type: [String, Number, Array, Date],
        default: ""
      },
      start: {
        type: [Number, String],
        default: ""
      },
      end: {
        type: [Number, String],
        default: ""
      },
      returnType: {
        type: String,
        default: "string"
      },
      placeholder: {
        type: String,
        default: ""
      },
      startPlaceholder: {
        type: String,
        default: ""
      },
      endPlaceholder: {
        type: String,
        default: ""
      },
      rangeSeparator: {
        type: String,
        default: "-"
      },
      border: {
        type: [Boolean],
        default: true
      },
      disabled: {
        type: [Boolean],
        default: false
      },
      clearIcon: {
        type: [Boolean],
        default: true
      },
      hideSecond: {
        type: [Boolean],
        default: false
      }
    },
    watch: {
      type: {
        immediate: true,
        handler(newVal, oldVal) {
          if (newVal.indexOf("time") !== -1) {
            this.hasTime = true;
          } else {
            this.hasTime = false;
          }
          if (newVal.indexOf("range") !== -1) {
            this.isRange = true;
          } else {
            this.isRange = false;
          }
        }
      },
      value: {
        immediate: true,
        handler(newVal, oldVal) {
          if (this.isEmitValue) {
            this.isEmitValue = false;
            return;
          }
          this.initPicker(newVal);
        }
      },
      start: {
        immediate: true,
        handler(newVal, oldVal) {
          if (!newVal)
            return;
          const {
            defDate,
            defTime
          } = this.parseDate(newVal);
          this.caleRange.startDate = defDate;
          if (this.hasTime) {
            this.caleRange.startTime = defTime;
          }
        }
      },
      end: {
        immediate: true,
        handler(newVal, oldVal) {
          if (!newVal)
            return;
          const {
            defDate,
            defTime
          } = this.parseDate(newVal);
          this.caleRange.endDate = defDate;
          if (this.hasTime) {
            this.caleRange.endTime = defTime;
          }
        }
      }
    },
    computed: {
      reactStartTime() {
        const activeDate = this.isRange ? this.tempRange.startDate : this.tempSingleDate;
        const res = activeDate === this.caleRange.startDate ? this.caleRange.startTime : "";
        return res;
      },
      reactEndTime() {
        const activeDate = this.isRange ? this.tempRange.endDate : this.tempSingleDate;
        const res = activeDate === this.caleRange.endDate ? this.caleRange.endTime : "";
        return res;
      },
      reactMobDefTime() {
        const times = {
          start: this.tempRange.startTime,
          end: this.tempRange.endTime
        };
        return this.isRange ? times : this.time;
      },
      mobSelectableTime() {
        return {
          start: this.caleRange.startTime,
          end: this.caleRange.endTime
        };
      },
      datePopupWidth() {
        return this.isRange ? 653 : 301;
      },
      singlePlaceholderText() {
        return this.placeholder || (this.type === "date" ? this.selectDateText : t("uni-datetime-picker.selectDateTime"));
      },
      startPlaceholderText() {
        return this.startPlaceholder || this.startDateText;
      },
      endPlaceholderText() {
        return this.endPlaceholder || this.endDateText;
      },
      selectDateText() {
        return t("uni-datetime-picker.selectDate");
      },
      selectTimeText() {
        return t("uni-datetime-picker.selectTime");
      },
      startDateText() {
        return this.startPlaceholder || t("uni-datetime-picker.startDate");
      },
      startTimeText() {
        return t("uni-datetime-picker.startTime");
      },
      endDateText() {
        return this.endPlaceholder || t("uni-datetime-picker.endDate");
      },
      endTimeText() {
        return t("uni-datetime-picker.endTime");
      },
      okText() {
        return t("uni-datetime-picker.ok");
      },
      clearText() {
        return t("uni-datetime-picker.clear");
      },
      showClearIcon() {
        const { clearIcon, disabled, singleVal, range } = this;
        const bool = clearIcon && !disabled && (singleVal || range.startDate && range.endDate);
        return bool;
      }
    },
    created() {
      this.form = this.getForm("uniForms");
      this.formItem = this.getForm("uniFormsItem");
    },
    mounted() {
      this.platform();
    },
    methods: {
      getForm(name = "uniForms") {
        let parent = this.$parent;
        let parentName = parent.$options.name;
        while (parentName !== name) {
          parent = parent.$parent;
          if (!parent)
            return false;
          parentName = parent.$options.name;
        }
        return parent;
      },
      initPicker(newVal) {
        if (!newVal || Array.isArray(newVal) && !newVal.length) {
          this.$nextTick(() => {
            this.clear(false);
          });
          return;
        }
        if (!Array.isArray(newVal) && !this.isRange) {
          const {
            defDate,
            defTime
          } = this.parseDate(newVal);
          this.singleVal = defDate;
          this.tempSingleDate = defDate;
          this.defSingleDate = defDate;
          if (this.hasTime) {
            this.singleVal = defDate + " " + defTime;
            this.time = defTime;
          }
        } else {
          const [before, after] = newVal;
          if (!before && !after)
            return;
          const defBefore = this.parseDate(before);
          const defAfter = this.parseDate(after);
          const startDate = defBefore.defDate;
          const endDate = defAfter.defDate;
          this.range.startDate = this.tempRange.startDate = startDate;
          this.range.endDate = this.tempRange.endDate = endDate;
          if (this.hasTime) {
            this.range.startDate = defBefore.defDate + " " + defBefore.defTime;
            this.range.endDate = defAfter.defDate + " " + defAfter.defTime;
            this.tempRange.startTime = defBefore.defTime;
            this.tempRange.endTime = defAfter.defTime;
          }
          const defaultRange = {
            before: defBefore.defDate,
            after: defAfter.defDate
          };
          this.startMultipleStatus = Object.assign({}, this.startMultipleStatus, defaultRange, {
            which: "right"
          });
          this.endMultipleStatus = Object.assign({}, this.endMultipleStatus, defaultRange, {
            which: "left"
          });
        }
      },
      updateLeftCale(e) {
        const left = this.$refs.left;
        left.cale.setHoverMultiple(e.after);
        left.setDate(this.$refs.left.nowDate.fullDate);
      },
      updateRightCale(e) {
        const right = this.$refs.right;
        right.cale.setHoverMultiple(e.after);
        right.setDate(this.$refs.right.nowDate.fullDate);
      },
      platform() {
        const systemInfo = uni.getSystemInfoSync();
        this.isPhone = systemInfo.windowWidth <= 500;
        this.windowWidth = systemInfo.windowWidth;
      },
      show(event) {
        if (this.disabled) {
          return;
        }
        this.platform();
        if (this.isPhone) {
          this.$refs.mobile.open();
          return;
        }
        this.popover = {
          top: "10px"
        };
        const dateEditor = uni.createSelectorQuery().in(this).select(".uni-date-editor");
        dateEditor.boundingClientRect((rect) => {
          if (this.windowWidth - rect.left < this.datePopupWidth) {
            this.popover.right = 0;
          }
        }).exec();
        setTimeout(() => {
          this.popup = !this.popup;
          if (!this.isPhone && this.isRange && this.isFirstShow) {
            this.isFirstShow = false;
            const {
              startDate,
              endDate
            } = this.range;
            if (startDate && endDate) {
              if (this.diffDate(startDate, endDate) < 30) {
                this.$refs.right.next();
              }
            } else {
              this.$refs.right.next();
              this.$refs.right.cale.lastHover = false;
            }
          }
        }, 50);
      },
      close() {
        setTimeout(() => {
          this.popup = false;
          this.$emit("maskClick", this.value);
        }, 20);
      },
      setEmit(value) {
        if (this.returnType === "timestamp" || this.returnType === "date") {
          if (!Array.isArray(value)) {
            if (!this.hasTime) {
              value = value + " 00:00:00";
            }
            value = this.createTimestamp(value);
            if (this.returnType === "date") {
              value = new Date(value);
            }
          } else {
            if (!this.hasTime) {
              value[0] = value[0] + " 00:00:00";
              value[1] = value[1] + " 00:00:00";
            }
            value[0] = this.createTimestamp(value[0]);
            value[1] = this.createTimestamp(value[1]);
            if (this.returnType === "date") {
              value[0] = new Date(value[0]);
              value[1] = new Date(value[1]);
            }
          }
        }
        this.formItem && this.formItem.setValue(value);
        this.$emit("change", value);
        this.$emit("input", value);
        this.$emit("update:modelValue", value);
        this.isEmitValue = true;
      },
      createTimestamp(date) {
        date = this.fixIosDateFormat(date);
        return Date.parse(new Date(date));
      },
      singleChange(e) {
        this.tempSingleDate = e.fulldate;
        if (this.hasTime)
          return;
        this.confirmSingleChange();
      },
      confirmSingleChange() {
        if (!this.tempSingleDate) {
          this.popup = false;
          return;
        }
        if (this.hasTime) {
          this.singleVal = this.tempSingleDate + " " + (this.time ? this.time : "00:00:00");
        } else {
          this.singleVal = this.tempSingleDate;
        }
        this.setEmit(this.singleVal);
        this.popup = false;
      },
      leftChange(e) {
        const {
          before,
          after
        } = e.range;
        this.rangeChange(before, after);
        const obj = {
          before: e.range.before,
          after: e.range.after,
          data: e.range.data,
          fulldate: e.fulldate
        };
        this.startMultipleStatus = Object.assign({}, this.startMultipleStatus, obj);
      },
      rightChange(e) {
        const {
          before,
          after
        } = e.range;
        this.rangeChange(before, after);
        const obj = {
          before: e.range.before,
          after: e.range.after,
          data: e.range.data,
          fulldate: e.fulldate
        };
        this.endMultipleStatus = Object.assign({}, this.endMultipleStatus, obj);
      },
      mobileChange(e) {
        if (this.isRange) {
          const {
            before,
            after
          } = e.range;
          this.handleStartAndEnd(before, after, true);
          if (this.hasTime) {
            const {
              startTime,
              endTime
            } = e.timeRange;
            this.tempRange.startTime = startTime;
            this.tempRange.endTime = endTime;
          }
          this.confirmRangeChange();
        } else {
          if (this.hasTime) {
            this.singleVal = e.fulldate + " " + e.time;
          } else {
            this.singleVal = e.fulldate;
          }
          this.setEmit(this.singleVal);
        }
        this.$refs.mobile.close();
      },
      rangeChange(before, after) {
        if (!(before && after))
          return;
        this.handleStartAndEnd(before, after, true);
        if (this.hasTime)
          return;
        this.confirmRangeChange();
      },
      confirmRangeChange() {
        if (!this.tempRange.startDate && !this.tempRange.endDate) {
          this.popup = false;
          return;
        }
        let start, end;
        if (!this.hasTime) {
          start = this.range.startDate = this.tempRange.startDate;
          end = this.range.endDate = this.tempRange.endDate;
        } else {
          start = this.range.startDate = this.tempRange.startDate + " " + (this.tempRange.startTime ? this.tempRange.startTime : "00:00:00");
          end = this.range.endDate = this.tempRange.endDate + " " + (this.tempRange.endTime ? this.tempRange.endTime : "00:00:00");
        }
        const displayRange = [start, end];
        this.setEmit(displayRange);
        this.popup = false;
      },
      handleStartAndEnd(before, after, temp = false) {
        if (!(before && after))
          return;
        const type = temp ? "tempRange" : "range";
        if (this.dateCompare(before, after)) {
          this[type].startDate = before;
          this[type].endDate = after;
        } else {
          this[type].startDate = after;
          this[type].endDate = before;
        }
      },
      dateCompare(startDate, endDate) {
        startDate = new Date(startDate.replace("-", "/").replace("-", "/"));
        endDate = new Date(endDate.replace("-", "/").replace("-", "/"));
        if (startDate <= endDate) {
          return true;
        } else {
          return false;
        }
      },
      diffDate(startDate, endDate) {
        startDate = new Date(startDate.replace("-", "/").replace("-", "/"));
        endDate = new Date(endDate.replace("-", "/").replace("-", "/"));
        const diff = (endDate - startDate) / (24 * 60 * 60 * 1e3);
        return Math.abs(diff);
      },
      clear(needEmit = true) {
        if (!this.isRange) {
          this.singleVal = "";
          this.tempSingleDate = "";
          this.time = "";
          if (this.isPhone) {
            this.$refs.mobile && this.$refs.mobile.clearCalender();
          } else {
            this.$refs.pcSingle && this.$refs.pcSingle.clearCalender();
          }
          if (needEmit) {
            this.formItem && this.formItem.setValue("");
            this.$emit("change", "");
            this.$emit("input", "");
            this.$emit("update:modelValue", "");
          }
        } else {
          this.range.startDate = "";
          this.range.endDate = "";
          this.tempRange.startDate = "";
          this.tempRange.startTime = "";
          this.tempRange.endDate = "";
          this.tempRange.endTime = "";
          if (this.isPhone) {
            this.$refs.mobile && this.$refs.mobile.clearCalender();
          } else {
            this.$refs.left && this.$refs.left.clearCalender();
            this.$refs.right && this.$refs.right.clearCalender();
            this.$refs.right && this.$refs.right.next();
          }
          if (needEmit) {
            this.formItem && this.formItem.setValue([]);
            this.$emit("change", []);
            this.$emit("input", []);
            this.$emit("update:modelValue", []);
          }
        }
      },
      parseDate(date) {
        date = this.fixIosDateFormat(date);
        const defVal = new Date(date);
        const year = defVal.getFullYear();
        const month = defVal.getMonth() + 1;
        const day = defVal.getDate();
        const hour = defVal.getHours();
        const minute = defVal.getMinutes();
        const second = defVal.getSeconds();
        const defDate = year + "-" + this.lessTen(month) + "-" + this.lessTen(day);
        const defTime = this.lessTen(hour) + ":" + this.lessTen(minute) + (this.hideSecond ? "" : ":" + this.lessTen(second));
        return {
          defDate,
          defTime
        };
      },
      lessTen(item) {
        return item < 10 ? "0" + item : item;
      },
      fixIosDateFormat(value) {
        if (typeof value === "string") {
          value = value.replace(/-/g, "/");
        }
        return value;
      },
      leftMonthSwitch(e) {
      },
      rightMonthSwitch(e) {
      }
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$2);
    const _component_time_picker = vue.resolveComponent("time-picker");
    const _component_calendar = vue.resolveComponent("calendar");
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-date" }, [
      vue.createElementVNode("view", {
        class: "uni-date-editor",
        onClick: _cache[4] || (_cache[4] = (...args) => $options.show && $options.show(...args))
      }, [
        vue.renderSlot(_ctx.$slots, "default", {}, () => [
          vue.createElementVNode("view", {
            class: vue.normalizeClass(["uni-date-editor--x", {
              "uni-date-editor--x__disabled": $props.disabled,
              "uni-date-x--border": $props.border
            }])
          }, [
            !$data.isRange ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "uni-date-x uni-date-single"
            }, [
              vue.createVNode(_component_uni_icons, {
                type: "calendar",
                color: "#e1e1e1",
                size: "22"
              }),
              vue.withDirectives(vue.createElementVNode("input", {
                class: "uni-date__x-input",
                type: "text",
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.singleVal = $event),
                placeholder: $options.singlePlaceholderText,
                disabled: true
              }, null, 8, ["placeholder"]), [
                [vue.vModelText, $data.singleVal]
              ])
            ])) : (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "uni-date-x uni-date-range"
            }, [
              vue.createVNode(_component_uni_icons, {
                type: "calendar",
                color: "#e1e1e1",
                size: "22"
              }),
              vue.withDirectives(vue.createElementVNode("input", {
                class: "uni-date__x-input t-c",
                type: "text",
                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.range.startDate = $event),
                placeholder: $options.startPlaceholderText,
                disabled: true
              }, null, 8, ["placeholder"]), [
                [vue.vModelText, $data.range.startDate]
              ]),
              vue.renderSlot(_ctx.$slots, "default", {}, () => [
                vue.createElementVNode("view", { class: "" }, vue.toDisplayString($props.rangeSeparator), 1)
              ], true),
              vue.withDirectives(vue.createElementVNode("input", {
                class: "uni-date__x-input t-c",
                type: "text",
                "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.range.endDate = $event),
                placeholder: $options.endPlaceholderText,
                disabled: true
              }, null, 8, ["placeholder"]), [
                [vue.vModelText, $data.range.endDate]
              ])
            ])),
            $options.showClearIcon ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 2,
              class: "uni-date__icon-clear",
              onClick: _cache[3] || (_cache[3] = vue.withModifiers((...args) => $options.clear && $options.clear(...args), ["stop"]))
            }, [
              vue.createVNode(_component_uni_icons, {
                type: "clear",
                color: "#e1e1e1",
                size: "18"
              })
            ])) : vue.createCommentVNode("v-if", true)
          ], 2)
        ], true)
      ]),
      vue.withDirectives(vue.createElementVNode("view", {
        class: "uni-date-mask",
        onClick: _cache[5] || (_cache[5] = (...args) => $options.close && $options.close(...args))
      }, null, 512), [
        [vue.vShow, $data.popup]
      ]),
      !$data.isPhone ? vue.withDirectives((vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        ref: "datePicker",
        class: "uni-date-picker__container"
      }, [
        !$data.isRange ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "uni-date-single--x",
          style: vue.normalizeStyle($data.popover)
        }, [
          vue.createElementVNode("view", { class: "uni-popper__arrow" }),
          $data.hasTime ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "uni-date-changed popup-x-header"
          }, [
            vue.withDirectives(vue.createElementVNode("input", {
              class: "uni-date__input t-c",
              type: "text",
              "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $data.tempSingleDate = $event),
              placeholder: $options.selectDateText
            }, null, 8, ["placeholder"]), [
              [vue.vModelText, $data.tempSingleDate]
            ]),
            vue.createVNode(_component_time_picker, {
              type: "time",
              modelValue: $data.time,
              "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => $data.time = $event),
              border: false,
              disabled: !$data.tempSingleDate,
              start: $options.reactStartTime,
              end: $options.reactEndTime,
              hideSecond: $props.hideSecond,
              style: { "width": "100%" }
            }, {
              default: vue.withCtx(() => [
                vue.withDirectives(vue.createElementVNode("input", {
                  class: "uni-date__input t-c",
                  type: "text",
                  "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => $data.time = $event),
                  placeholder: $options.selectTimeText,
                  disabled: !$data.tempSingleDate
                }, null, 8, ["placeholder", "disabled"]), [
                  [vue.vModelText, $data.time]
                ])
              ]),
              _: 1
            }, 8, ["modelValue", "disabled", "start", "end", "hideSecond"])
          ])) : vue.createCommentVNode("v-if", true),
          vue.createVNode(_component_calendar, {
            ref: "pcSingle",
            showMonth: false,
            "start-date": $data.caleRange.startDate,
            "end-date": $data.caleRange.endDate,
            date: $data.defSingleDate,
            onChange: $options.singleChange,
            style: { "padding": "0 8px" }
          }, null, 8, ["start-date", "end-date", "date", "onChange"]),
          $data.hasTime ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "popup-x-footer"
          }, [
            vue.createCommentVNode(' <text class="">\u6B64\u523B</text> '),
            vue.createElementVNode("text", {
              class: "confirm",
              onClick: _cache[9] || (_cache[9] = (...args) => $options.confirmSingleChange && $options.confirmSingleChange(...args))
            }, vue.toDisplayString($options.okText), 1)
          ])) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("view", { class: "uni-date-popper__arrow" })
        ], 4)) : (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "uni-date-range--x",
          style: vue.normalizeStyle($data.popover)
        }, [
          vue.createElementVNode("view", { class: "uni-popper__arrow" }),
          $data.hasTime ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "popup-x-header uni-date-changed"
          }, [
            vue.createElementVNode("view", { class: "popup-x-header--datetime" }, [
              vue.withDirectives(vue.createElementVNode("input", {
                class: "uni-date__input uni-date-range__input",
                type: "text",
                "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => $data.tempRange.startDate = $event),
                placeholder: $options.startDateText
              }, null, 8, ["placeholder"]), [
                [vue.vModelText, $data.tempRange.startDate]
              ]),
              vue.createVNode(_component_time_picker, {
                type: "time",
                modelValue: $data.tempRange.startTime,
                "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => $data.tempRange.startTime = $event),
                start: $options.reactStartTime,
                border: false,
                disabled: !$data.tempRange.startDate,
                hideSecond: $props.hideSecond
              }, {
                default: vue.withCtx(() => [
                  vue.withDirectives(vue.createElementVNode("input", {
                    class: "uni-date__input uni-date-range__input",
                    type: "text",
                    "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => $data.tempRange.startTime = $event),
                    placeholder: $options.startTimeText,
                    disabled: !$data.tempRange.startDate
                  }, null, 8, ["placeholder", "disabled"]), [
                    [vue.vModelText, $data.tempRange.startTime]
                  ])
                ]),
                _: 1
              }, 8, ["modelValue", "start", "disabled", "hideSecond"])
            ]),
            vue.createVNode(_component_uni_icons, {
              type: "arrowthinright",
              color: "#999",
              style: { "line-height": "40px" }
            }),
            vue.createElementVNode("view", { class: "popup-x-header--datetime" }, [
              vue.withDirectives(vue.createElementVNode("input", {
                class: "uni-date__input uni-date-range__input",
                type: "text",
                "onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => $data.tempRange.endDate = $event),
                placeholder: $options.endDateText
              }, null, 8, ["placeholder"]), [
                [vue.vModelText, $data.tempRange.endDate]
              ]),
              vue.createVNode(_component_time_picker, {
                type: "time",
                modelValue: $data.tempRange.endTime,
                "onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => $data.tempRange.endTime = $event),
                end: $options.reactEndTime,
                border: false,
                disabled: !$data.tempRange.endDate,
                hideSecond: $props.hideSecond
              }, {
                default: vue.withCtx(() => [
                  vue.withDirectives(vue.createElementVNode("input", {
                    class: "uni-date__input uni-date-range__input",
                    type: "text",
                    "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => $data.tempRange.endTime = $event),
                    placeholder: $options.endTimeText,
                    disabled: !$data.tempRange.endDate
                  }, null, 8, ["placeholder", "disabled"]), [
                    [vue.vModelText, $data.tempRange.endTime]
                  ])
                ]),
                _: 1
              }, 8, ["modelValue", "end", "disabled", "hideSecond"])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("view", { class: "popup-x-body" }, [
            vue.createVNode(_component_calendar, {
              ref: "left",
              showMonth: false,
              "start-date": $data.caleRange.startDate,
              "end-date": $data.caleRange.endDate,
              range: true,
              onChange: $options.leftChange,
              pleStatus: $data.endMultipleStatus,
              onFirstEnterCale: $options.updateRightCale,
              onMonthSwitch: $options.leftMonthSwitch,
              style: { "padding": "0 8px" }
            }, null, 8, ["start-date", "end-date", "onChange", "pleStatus", "onFirstEnterCale", "onMonthSwitch"]),
            vue.createVNode(_component_calendar, {
              ref: "right",
              showMonth: false,
              "start-date": $data.caleRange.startDate,
              "end-date": $data.caleRange.endDate,
              range: true,
              onChange: $options.rightChange,
              pleStatus: $data.startMultipleStatus,
              onFirstEnterCale: $options.updateLeftCale,
              onMonthSwitch: $options.rightMonthSwitch,
              style: { "padding": "0 8px", "border-left": "1px solid #F1F1F1" }
            }, null, 8, ["start-date", "end-date", "onChange", "pleStatus", "onFirstEnterCale", "onMonthSwitch"])
          ]),
          $data.hasTime ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "popup-x-footer"
          }, [
            vue.createElementVNode("text", {
              class: "",
              onClick: _cache[16] || (_cache[16] = (...args) => $options.clear && $options.clear(...args))
            }, vue.toDisplayString($options.clearText), 1),
            vue.createElementVNode("text", {
              class: "confirm",
              onClick: _cache[17] || (_cache[17] = (...args) => $options.confirmRangeChange && $options.confirmRangeChange(...args))
            }, vue.toDisplayString($options.okText), 1)
          ])) : vue.createCommentVNode("v-if", true)
        ], 4))
      ], 512)), [
        [vue.vShow, $data.popup]
      ]) : vue.createCommentVNode("v-if", true),
      vue.withDirectives(vue.createVNode(_component_calendar, {
        ref: "mobile",
        clearDate: false,
        date: $data.defSingleDate,
        defTime: $options.reactMobDefTime,
        "start-date": $data.caleRange.startDate,
        "end-date": $data.caleRange.endDate,
        selectableTimes: $options.mobSelectableTime,
        pleStatus: $data.endMultipleStatus,
        showMonth: false,
        range: $data.isRange,
        typeHasTime: $data.hasTime,
        insert: false,
        hideSecond: $props.hideSecond,
        onConfirm: $options.mobileChange
      }, null, 8, ["date", "defTime", "start-date", "end-date", "selectableTimes", "pleStatus", "range", "typeHasTime", "hideSecond", "onConfirm"]), [
        [vue.vShow, $data.isPhone]
      ])
    ]);
  }
  var __easycom_0$1 = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$6], ["__scopeId", "data-v-6e13d7e2"]]);
  const _sfc_main$8 = {
    name: "TableCheckbox",
    emits: ["checkboxSelected"],
    props: {
      indeterminate: {
        type: Boolean,
        default: false
      },
      checked: {
        type: [Boolean, String],
        default: false
      },
      disabled: {
        type: Boolean,
        default: false
      },
      index: {
        type: Number,
        default: -1
      },
      cellData: {
        type: Object,
        default() {
          return {};
        }
      }
    },
    watch: {
      checked(newVal) {
        if (typeof this.checked === "boolean") {
          this.isChecked = newVal;
        } else {
          this.isChecked = true;
        }
      },
      indeterminate(newVal) {
        this.isIndeterminate = newVal;
      }
    },
    data() {
      return {
        isChecked: false,
        isDisabled: false,
        isIndeterminate: false
      };
    },
    created() {
      if (typeof this.checked === "boolean") {
        this.isChecked = this.checked;
      }
      this.isDisabled = this.disabled;
    },
    methods: {
      selected() {
        if (this.isDisabled)
          return;
        this.isIndeterminate = false;
        this.isChecked = !this.isChecked;
        this.$emit("checkboxSelected", {
          checked: this.isChecked,
          data: this.cellData
        });
      }
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", {
      class: "uni-table-checkbox",
      onClick: _cache[0] || (_cache[0] = (...args) => $options.selected && $options.selected(...args))
    }, [
      !$props.indeterminate ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: vue.normalizeClass(["checkbox__inner", { "is-checked": $data.isChecked, "is-disable": $data.isDisabled }])
      }, [
        vue.createElementVNode("view", { class: "checkbox__inner-icon" })
      ], 2)) : (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "checkbox__inner checkbox--indeterminate"
      }, [
        vue.createElementVNode("view", { class: "checkbox__inner-icon" })
      ]))
    ]);
  }
  var tableCheckbox = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$5], ["__scopeId", "data-v-68100fa0"]]);
  const resource = {
    "reset": "\u91CD\u7F6E",
    "search": "\u641C\u7D22",
    "submit": "\u786E\u5B9A",
    "filter": "\u7B5B\u9009",
    "gt": "\u5927\u4E8E\u7B49\u4E8E",
    "lt": "\u5C0F\u4E8E\u7B49\u4E8E",
    "date": "\u65E5\u671F\u8303\u56F4"
  };
  const DropdownType = {
    Select: "select",
    Search: "search",
    Range: "range",
    Date: "date",
    Timestamp: "timestamp"
  };
  const _sfc_main$7 = {
    name: "FilterDropdown",
    emits: ["change"],
    components: {
      checkBox: tableCheckbox
    },
    options: {
      virtualHost: true
    },
    props: {
      filterType: {
        type: String,
        default: DropdownType.Select
      },
      filterData: {
        type: Array,
        default() {
          return [];
        }
      },
      mode: {
        type: String,
        default: "default"
      },
      map: {
        type: Object,
        default() {
          return {
            text: "text",
            value: "value"
          };
        }
      }
    },
    computed: {
      canReset() {
        if (this.isSearch) {
          return this.filterValue.length > 0;
        }
        if (this.isSelect) {
          return this.checkedValues.length > 0;
        }
        if (this.isRange) {
          return this.gtValue.length > 0 && this.ltValue.length > 0;
        }
        if (this.isDate) {
          return this.dateSelect.length > 0;
        }
        return false;
      },
      isSelect() {
        return this.filterType === DropdownType.Select;
      },
      isSearch() {
        return this.filterType === DropdownType.Search;
      },
      isRange() {
        return this.filterType === DropdownType.Range;
      },
      isDate() {
        return this.filterType === DropdownType.Date || this.filterType === DropdownType.Timestamp;
      }
    },
    watch: {
      filters(newVal) {
        this._copyFilters();
      },
      indeterminate(newVal) {
        this.isIndeterminate = newVal;
      }
    },
    data() {
      return {
        resource,
        enabled: true,
        isOpened: false,
        dataList: [],
        filterValue: "",
        checkedValues: [],
        gtValue: "",
        ltValue: "",
        dateRange: [],
        dateSelect: []
      };
    },
    created() {
      this._copyFilters();
    },
    methods: {
      _copyFilters() {
        let dl = JSON.parse(JSON.stringify(this.filterData));
        for (let i = 0; i < dl.length; i++) {
          if (dl[i].checked === void 0) {
            dl[i].checked = false;
          }
        }
        this.dataList = dl;
      },
      openPopup() {
        this.isOpened = true;
        if (this.isDate) {
          this.$nextTick(() => {
            if (!this.dateRange.length) {
              this.resetDate();
            }
            this.$refs.datetimepicker.show();
          });
        }
      },
      closePopup() {
        this.isOpened = false;
      },
      handleClose(e) {
        this.closePopup();
      },
      resetDate() {
        let date = new Date();
        let dateText = date.toISOString().split("T")[0];
        this.dateRange = [dateText + " 0:00:00", dateText + " 23:59:59"];
      },
      onDropdown(e) {
        this.openPopup();
      },
      onItemClick(e, index) {
        let items = this.dataList;
        let listItem = items[index];
        if (listItem.checked === void 0) {
          items[index].checked = true;
        } else {
          items[index].checked = !listItem.checked;
        }
        let checkvalues = [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.checked) {
            checkvalues.push(item.value);
          }
        }
        this.checkedValues = checkvalues;
      },
      datetimechange(e) {
        this.closePopup();
        this.dateRange = e;
        this.dateSelect = e;
        this.$emit("change", {
          filterType: this.filterType,
          filter: e
        });
      },
      timepickerclose(e) {
        this.closePopup();
      },
      handleSelectSubmit() {
        this.closePopup();
        this.$emit("change", {
          filterType: this.filterType,
          filter: this.checkedValues
        });
      },
      handleSelectReset() {
        if (!this.canReset) {
          return;
        }
        var items = this.dataList;
        for (let i = 0; i < items.length; i++) {
          let item = items[i];
          this.$set(item, "checked", false);
        }
        this.checkedValues = [];
        this.handleSelectSubmit();
      },
      handleSearchSubmit() {
        this.closePopup();
        this.$emit("change", {
          filterType: this.filterType,
          filter: this.filterValue
        });
      },
      handleSearchReset() {
        if (!this.canReset) {
          return;
        }
        this.filterValue = "";
        this.handleSearchSubmit();
      },
      handleRangeSubmit(isReset) {
        this.closePopup();
        this.$emit("change", {
          filterType: this.filterType,
          filter: isReset === true ? [] : [parseInt(this.gtValue), parseInt(this.ltValue)]
        });
      },
      handleRangeReset() {
        if (!this.canReset) {
          return;
        }
        this.gtValue = "";
        this.ltValue = "";
        this.handleRangeSubmit(true);
      }
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_check_box = vue.resolveComponent("check-box");
    const _component_uni_datetime_picker = resolveEasycom(vue.resolveDynamicComponent("uni-datetime-picker"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-filter-dropdown" }, [
      vue.createElementVNode("view", {
        class: "dropdown-btn",
        onClick: _cache[0] || (_cache[0] = (...args) => $options.onDropdown && $options.onDropdown(...args))
      }, [
        $options.isSelect || $options.isRange ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: vue.normalizeClass(["icon-select", { active: $options.canReset }])
        }, null, 2)) : vue.createCommentVNode("v-if", true),
        $options.isSearch ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: vue.normalizeClass(["icon-search", { active: $options.canReset }])
        }, [
          vue.createElementVNode("view", { class: "icon-search-0" }),
          vue.createElementVNode("view", { class: "icon-search-1" })
        ], 2)) : vue.createCommentVNode("v-if", true),
        $options.isDate ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 2,
          class: vue.normalizeClass(["icon-calendar", { active: $options.canReset }])
        }, [
          vue.createElementVNode("view", { class: "icon-calendar-0" }),
          vue.createElementVNode("view", { class: "icon-calendar-1" })
        ], 2)) : vue.createCommentVNode("v-if", true)
      ]),
      $data.isOpened ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "uni-dropdown-cover",
        onClick: _cache[1] || (_cache[1] = (...args) => $options.handleClose && $options.handleClose(...args))
      })) : vue.createCommentVNode("v-if", true),
      $data.isOpened ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "dropdown-popup dropdown-popup-right",
        onClick: _cache[11] || (_cache[11] = vue.withModifiers(() => {
        }, ["stop"]))
      }, [
        vue.createCommentVNode(" select"),
        $options.isSelect ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "list"
        }, [
          (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList($data.dataList, (item, index) => {
            return vue.openBlock(), vue.createElementBlock("label", {
              class: "flex-r a-i-c list-item",
              key: index,
              onClick: ($event) => $options.onItemClick($event, index)
            }, [
              vue.createVNode(_component_check_box, {
                class: "check",
                checked: item.checked
              }, null, 8, ["checked"]),
              vue.createElementVNode("view", { class: "checklist-content" }, [
                vue.createElementVNode("text", {
                  class: "checklist-text",
                  style: vue.normalizeStyle(item.styleIconText)
                }, vue.toDisplayString(item[$props.map.text]), 5)
              ])
            ], 8, ["onClick"]);
          }), 128))
        ])) : vue.createCommentVNode("v-if", true),
        $options.isSelect ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "flex-r opera-area"
        }, [
          vue.createElementVNode("view", {
            class: vue.normalizeClass(["flex-f btn btn-default", { disable: !$options.canReset }]),
            onClick: _cache[2] || (_cache[2] = (...args) => $options.handleSelectReset && $options.handleSelectReset(...args))
          }, vue.toDisplayString($data.resource.reset), 3),
          vue.createElementVNode("view", {
            class: "flex-f btn btn-submit",
            onClick: _cache[3] || (_cache[3] = (...args) => $options.handleSelectSubmit && $options.handleSelectSubmit(...args))
          }, vue.toDisplayString($data.resource.submit), 1)
        ])) : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" search "),
        $options.isSearch ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 2,
          class: "search-area"
        }, [
          vue.withDirectives(vue.createElementVNode("input", {
            class: "search-input",
            "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.filterValue = $event)
          }, null, 512), [
            [vue.vModelText, $data.filterValue]
          ])
        ])) : vue.createCommentVNode("v-if", true),
        $options.isSearch ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 3,
          class: "flex-r opera-area"
        }, [
          vue.createElementVNode("view", {
            class: "flex-f btn btn-submit",
            onClick: _cache[5] || (_cache[5] = (...args) => $options.handleSearchSubmit && $options.handleSearchSubmit(...args))
          }, vue.toDisplayString($data.resource.search), 1),
          vue.createElementVNode("view", {
            class: vue.normalizeClass(["flex-f btn btn-default", { disable: !$options.canReset }]),
            onClick: _cache[6] || (_cache[6] = (...args) => $options.handleSearchReset && $options.handleSearchReset(...args))
          }, vue.toDisplayString($data.resource.reset), 3)
        ])) : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" range "),
        $options.isRange ? (vue.openBlock(), vue.createElementBlock("view", { key: 4 }, [
          vue.createElementVNode("view", { class: "input-label" }, vue.toDisplayString($data.resource.gt), 1),
          vue.withDirectives(vue.createElementVNode("input", {
            class: "input",
            "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => $data.gtValue = $event)
          }, null, 512), [
            [vue.vModelText, $data.gtValue]
          ]),
          vue.createElementVNode("view", { class: "input-label" }, vue.toDisplayString($data.resource.lt), 1),
          vue.withDirectives(vue.createElementVNode("input", {
            class: "input",
            "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => $data.ltValue = $event)
          }, null, 512), [
            [vue.vModelText, $data.ltValue]
          ])
        ])) : vue.createCommentVNode("v-if", true),
        $options.isRange ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 5,
          class: "flex-r opera-area"
        }, [
          vue.createElementVNode("view", {
            class: vue.normalizeClass(["flex-f btn btn-default", { disable: !$options.canReset }]),
            onClick: _cache[9] || (_cache[9] = (...args) => $options.handleRangeReset && $options.handleRangeReset(...args))
          }, vue.toDisplayString($data.resource.reset), 3),
          vue.createElementVNode("view", {
            class: "flex-f btn btn-submit",
            onClick: _cache[10] || (_cache[10] = (...args) => $options.handleRangeSubmit && $options.handleRangeSubmit(...args))
          }, vue.toDisplayString($data.resource.submit), 1)
        ])) : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" date "),
        $options.isDate ? (vue.openBlock(), vue.createElementBlock("view", { key: 6 }, [
          vue.createVNode(_component_uni_datetime_picker, {
            ref: "datetimepicker",
            value: $data.dateRange,
            type: "datetimerange",
            "return-type": "timestamp",
            onChange: $options.datetimechange,
            onMaskClick: $options.timepickerclose
          }, {
            default: vue.withCtx(() => [
              vue.createElementVNode("view")
            ]),
            _: 1
          }, 8, ["value", "onChange", "onMaskClick"])
        ])) : vue.createCommentVNode("v-if", true)
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  var dropdown = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$4], ["__scopeId", "data-v-609c3cee"]]);
  const _sfc_main$6 = {
    name: "uniTh",
    options: {
      virtualHost: true
    },
    components: {
      dropdown
    },
    emits: ["sort-change", "filter-change"],
    props: {
      width: {
        type: [String, Number],
        default: ""
      },
      align: {
        type: String,
        default: "left"
      },
      rowspan: {
        type: [Number, String],
        default: 1
      },
      colspan: {
        type: [Number, String],
        default: 1
      },
      sortable: {
        type: Boolean,
        default: false
      },
      filterType: {
        type: String,
        default: ""
      },
      filterData: {
        type: Array,
        default() {
          return [];
        }
      }
    },
    data() {
      return {
        border: false,
        ascending: false,
        descending: false
      };
    },
    computed: {
      contentAlign() {
        let align = "left";
        switch (this.align) {
          case "left":
            align = "flex-start";
            break;
          case "center":
            align = "center";
            break;
          case "right":
            align = "flex-end";
            break;
        }
        return align;
      }
    },
    created() {
      this.root = this.getTable("uniTable");
      this.rootTr = this.getTable("uniTr");
      this.rootTr.minWidthUpdate(this.width ? this.width : 140);
      this.border = this.root.border;
      this.root.thChildren.push(this);
    },
    methods: {
      sort() {
        if (!this.sortable)
          return;
        this.clearOther();
        if (!this.ascending && !this.descending) {
          this.ascending = true;
          this.$emit("sort-change", { order: "ascending" });
          return;
        }
        if (this.ascending && !this.descending) {
          this.ascending = false;
          this.descending = true;
          this.$emit("sort-change", { order: "descending" });
          return;
        }
        if (!this.ascending && this.descending) {
          this.ascending = false;
          this.descending = false;
          this.$emit("sort-change", { order: null });
        }
      },
      ascendingFn() {
        this.clearOther();
        this.ascending = !this.ascending;
        this.descending = false;
        this.$emit("sort-change", { order: this.ascending ? "ascending" : null });
      },
      descendingFn() {
        this.clearOther();
        this.descending = !this.descending;
        this.ascending = false;
        this.$emit("sort-change", { order: this.descending ? "descending" : null });
      },
      clearOther() {
        this.root.thChildren.map((item) => {
          if (item !== this) {
            item.ascending = false;
            item.descending = false;
          }
          return item;
        });
      },
      ondropdown(e) {
        this.$emit("filter-change", e);
      },
      getTable(name) {
        let parent = this.$parent;
        let parentName = parent.$options.name;
        while (parentName !== name) {
          parent = parent.$parent;
          if (!parent)
            return false;
          parentName = parent.$options.name;
        }
        return parent;
      }
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", {
      class: vue.normalizeClass(["uni-table-th", { "table--border": $data.border }]),
      style: vue.normalizeStyle({ width: $props.width + "px", "text-align": $props.align })
    }, [
      vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
    ], 6);
  }
  var __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$3], ["__scopeId", "data-v-511e81f9"]]);
  const _sfc_main$5 = {
    name: "uniTr",
    components: { tableCheckbox },
    props: {
      disabled: {
        type: Boolean,
        default: false
      },
      keyValue: {
        type: [String, Number],
        default: ""
      }
    },
    options: {
      virtualHost: true
    },
    data() {
      return {
        value: false,
        border: false,
        selection: false,
        widthThArr: [],
        ishead: true,
        checked: false,
        indeterminate: false
      };
    },
    created() {
      this.root = this.getTable();
      this.head = this.getTable("uniThead");
      if (this.head) {
        this.ishead = false;
        this.head.init(this);
      }
      this.border = this.root.border;
      this.selection = this.root.type;
      this.root.trChildren.push(this);
      const rowData = this.root.data.find((v) => v[this.root.rowKey] === this.keyValue);
      if (rowData) {
        this.rowData = rowData;
      }
      this.root.isNodata();
    },
    mounted() {
      if (this.widthThArr.length > 0) {
        const selectionWidth = this.selection === "selection" ? 50 : 0;
        this.root.minWidth = this.widthThArr.reduce((a, b) => Number(a) + Number(b)) + selectionWidth;
      }
    },
    unmounted() {
      const index = this.root.trChildren.findIndex((i) => i === this);
      this.root.trChildren.splice(index, 1);
      this.root.isNodata();
    },
    methods: {
      minWidthUpdate(width) {
        this.widthThArr.push(width);
      },
      checkboxSelected(e) {
        let rootData = this.root.data.find((v) => v[this.root.rowKey] === this.keyValue);
        this.checked = e.checked;
        this.root.check(rootData || this, e.checked, rootData ? this.keyValue : null);
      },
      change(e) {
        this.root.trChildren.forEach((item) => {
          if (item === this) {
            this.root.check(this, e.detail.value.length > 0 ? true : false);
          }
        });
      },
      getTable(name = "uniTable") {
        let parent = this.$parent;
        let parentName = parent.$options.name;
        while (parentName !== name) {
          parent = parent.$parent;
          if (!parent)
            return false;
          parentName = parent.$options.name;
        }
        return parent;
      }
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_table_checkbox = vue.resolveComponent("table-checkbox");
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-table-tr" }, [
      $data.selection === "selection" ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: vue.normalizeClass(["checkbox", { "tr-table--border": $data.border }])
      }, [
        vue.createVNode(_component_table_checkbox, {
          checked: $data.checked,
          indeterminate: $data.indeterminate,
          disabled: $props.disabled,
          onCheckboxSelected: $options.checkboxSelected
        }, null, 8, ["checked", "indeterminate", "disabled", "onCheckboxSelected"])
      ], 2)) : vue.createCommentVNode("v-if", true),
      vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
    ]);
  }
  var __easycom_1 = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$2], ["__scopeId", "data-v-c2c83a8e"]]);
  const _sfc_main$4 = {
    name: "uniTd",
    options: {
      virtualHost: true
    },
    props: {
      width: {
        type: [String, Number],
        default: ""
      },
      align: {
        type: String,
        default: "left"
      },
      rowspan: {
        type: [Number, String],
        default: 1
      },
      colspan: {
        type: [Number, String],
        default: 1
      }
    },
    data() {
      return {
        border: false
      };
    },
    created() {
      this.root = this.getTable();
      this.border = this.root.border;
    },
    methods: {
      getTable() {
        let parent = this.$parent;
        let parentName = parent.$options.name;
        while (parentName !== "uniTable") {
          parent = parent.$parent;
          if (!parent)
            return false;
          parentName = parent.$options.name;
        }
        return parent;
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(vue.Fragment, null, [
      vue.createCommentVNode(` :class="{'table--border':border}"  `),
      vue.createElementVNode("view", {
        class: vue.normalizeClass(["uni-table-td", { "table--border": $data.border }]),
        style: vue.normalizeStyle({ width: $props.width + "px", "text-align": $props.align })
      }, [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ], 6)
    ], 2112);
  }
  var __easycom_2 = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$1], ["__scopeId", "data-v-321f8e79"]]);
  const _sfc_main$3 = {
    name: "uniTable",
    options: {
      virtualHost: true
    },
    emits: ["selection-change"],
    props: {
      data: {
        type: Array,
        default() {
          return [];
        }
      },
      border: {
        type: Boolean,
        default: false
      },
      stripe: {
        type: Boolean,
        default: false
      },
      type: {
        type: String,
        default: ""
      },
      emptyText: {
        type: String,
        default: "\u6CA1\u6709\u66F4\u591A\u6570\u636E"
      },
      loading: {
        type: Boolean,
        default: false
      },
      rowKey: {
        type: String,
        default: ""
      }
    },
    data() {
      return {
        noData: true,
        minWidth: 0,
        multiTableHeads: []
      };
    },
    watch: {
      loading(val) {
      },
      data(newVal) {
        this.theadChildren;
        if (this.theadChildren) {
          this.theadChildren.rowspan;
        }
        this.noData = false;
      }
    },
    created() {
      this.trChildren = [];
      this.thChildren = [];
      this.theadChildren = null;
      this.backData = [];
      this.backIndexData = [];
    },
    methods: {
      isNodata() {
        this.theadChildren;
        let rowspan = 1;
        if (this.theadChildren) {
          rowspan = this.theadChildren.rowspan;
        }
        this.noData = this.trChildren.length - rowspan <= 0;
      },
      selectionAll() {
        let startIndex = 1;
        let theadChildren = this.theadChildren;
        if (!this.theadChildren) {
          theadChildren = this.trChildren[0];
        } else {
          startIndex = theadChildren.rowspan - 1;
        }
        let isHaveData = this.data && this.data.length.length > 0;
        theadChildren.checked = true;
        theadChildren.indeterminate = false;
        this.trChildren.forEach((item, index) => {
          if (!item.disabled) {
            item.checked = true;
            if (isHaveData && item.keyValue) {
              const row = this.data.find((v) => v[this.rowKey] === item.keyValue);
              if (!this.backData.find((v) => v[this.rowKey] === row[this.rowKey])) {
                this.backData.push(row);
              }
            }
            if (index > startIndex - 1 && this.backIndexData.indexOf(index - startIndex) === -1) {
              this.backIndexData.push(index - startIndex);
            }
          }
        });
        this.$emit("selection-change", {
          detail: {
            value: this.backData,
            index: this.backIndexData
          }
        });
      },
      toggleRowSelection(row, selected) {
        row = [].concat(row);
        this.trChildren.forEach((item, index) => {
          const select = row.findIndex((v) => {
            if (typeof v === "number") {
              return v === index - 1;
            } else {
              return v[this.rowKey] === item.keyValue;
            }
          });
          let ischeck = item.checked;
          if (select !== -1) {
            if (typeof selected === "boolean") {
              item.checked = selected;
            } else {
              item.checked = !item.checked;
            }
            if (ischeck !== item.checked) {
              this.check(item.rowData || item, item.checked, item.rowData ? item.keyValue : null, true);
            }
          }
        });
        this.$emit("selection-change", {
          detail: {
            value: this.backData,
            index: this.backIndexData
          }
        });
      },
      clearSelection() {
        let theadChildren = this.theadChildren;
        if (!this.theadChildren) {
          theadChildren = this.trChildren[0];
        }
        theadChildren.checked = false;
        theadChildren.indeterminate = false;
        this.trChildren.forEach((item) => {
          item.checked = false;
        });
        this.backData = [];
        this.backIndexData = [];
        this.$emit("selection-change", {
          detail: {
            value: [],
            index: []
          }
        });
      },
      toggleAllSelection() {
        let list = [];
        let startIndex = 1;
        let theadChildren = this.theadChildren;
        if (!this.theadChildren) {
          theadChildren = this.trChildren[0];
        } else {
          startIndex = theadChildren.rowspan - 1;
        }
        this.trChildren.forEach((item, index) => {
          if (!item.disabled) {
            if (index > startIndex - 1) {
              list.push(index - startIndex);
            }
          }
        });
        this.toggleRowSelection(list);
      },
      check(child, check, keyValue, emit) {
        let theadChildren = this.theadChildren;
        if (!this.theadChildren) {
          theadChildren = this.trChildren[0];
        }
        let childDomIndex = this.trChildren.findIndex((item, index) => child === item);
        if (childDomIndex < 0) {
          childDomIndex = this.data.findIndex((v) => v[this.rowKey] === keyValue) + 1;
        }
        this.trChildren.filter((v) => !v.disabled && v.keyValue).length;
        if (childDomIndex === 0) {
          check ? this.selectionAll() : this.clearSelection();
          return;
        }
        if (check) {
          if (keyValue) {
            this.backData.push(child);
          }
          this.backIndexData.push(childDomIndex - 1);
        } else {
          const index = this.backData.findIndex((v) => v[this.rowKey] === keyValue);
          const idx = this.backIndexData.findIndex((item) => item === childDomIndex - 1);
          if (keyValue) {
            this.backData.splice(index, 1);
          }
          this.backIndexData.splice(idx, 1);
        }
        const domCheckAll = this.trChildren.find((item, index) => index > 0 && !item.checked && !item.disabled);
        if (!domCheckAll) {
          theadChildren.indeterminate = false;
          theadChildren.checked = true;
        } else {
          theadChildren.indeterminate = true;
          theadChildren.checked = false;
        }
        if (this.backIndexData.length === 0) {
          theadChildren.indeterminate = false;
        }
        if (!emit) {
          this.$emit("selection-change", {
            detail: {
              value: this.backData,
              index: this.backIndexData
            }
          });
        }
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", {
      class: vue.normalizeClass(["uni-table-scroll", { "table--border": $props.border, "border-none": !$data.noData }])
    }, [
      vue.createElementVNode("view", {
        class: vue.normalizeClass(["uni-table", { "table--stripe": $props.stripe }]),
        style: vue.normalizeStyle({ "min-width": $data.minWidth + "px" })
      }, [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true),
        $data.noData ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "uni-table-loading"
        }, [
          vue.createElementVNode("view", {
            class: vue.normalizeClass(["uni-table-text", { "empty-border": $props.border }])
          }, vue.toDisplayString($props.emptyText), 3)
        ])) : vue.createCommentVNode("v-if", true),
        $props.loading ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: vue.normalizeClass(["uni-table-mask", { "empty-border": $props.border }])
        }, [
          vue.createElementVNode("div", { class: "uni-table--loader" })
        ], 2)) : vue.createCommentVNode("v-if", true)
      ], 6)
    ], 2);
  }
  var __easycom_3 = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render], ["__scopeId", "data-v-6cd49106"]]);
  const _sfc_main$2 = /* @__PURE__ */ vue.defineComponent({
    setup(__props) {
      const defaultImg = "http://preferyou.cn/freed/icon.png";
      const loadingRef = vue.ref(null);
      const loading = vue.ref(false);
      const platform2 = vue.ref();
      const albumId = vue.ref();
      const isRank = vue.ref(false);
      const $filters = vue.inject("$filters");
      const $eventBus = vue.inject("$eventBus");
      const albumInfo = vue.ref({
        name: "",
        updateTime: "",
        pic: "",
        desc: "",
        nickname: "",
        avatar: ""
      });
      const songList = vue.ref([]);
      const store2 = useStore();
      onLoad((params) => {
        platform2.value = +params.type;
        isRank.value = Boolean(+params.rank);
        albumId.value = +params.id;
      });
      const getWyAlbum = async (id) => {
        loading.value = true;
        try {
          const res = await getAlbumDetailWy(id);
          if (res.data.code === 200) {
            const { name, updateTime, description: desc, coverImgUrl: pic } = res.data.playlist;
            const { nickname, avatarUrl: avatar } = res.data.playlist.creator;
            albumInfo.value = {
              name,
              updateTime,
              pic,
              desc,
              nickname,
              avatar
            };
            songList.value = res.data.playlist.tracks.map((ele) => ({
              name: ele.name,
              time: ele.dt,
              id: ele.id,
              mv: ele.mv,
              album: ele.al.name || ele.name,
              author: ele.ar.map((e) => ({
                nickname: e.name,
                id: e.id
              }))
            }));
          }
          loading.value = false;
        } catch {
          loading.value = false;
        }
      };
      const getQQAlbum = async (id) => {
        loading.value = true;
        const result = await getAlbumDetailQQ(id);
        if (result.data.response.code === 0) {
          let { dissname: name, desc, logo: pic, ctime: updateTime, headurl: avatar, nickname } = result.data.response.cdlist[0];
          updateTime *= 1e3;
          albumInfo.value = {
            name,
            id,
            desc,
            pic,
            updateTime,
            avatar,
            nickname
          };
          songList.value = result.data.response.cdlist[0].songlist.map((ele) => ({
            name: ele.name,
            id: ele.mid,
            mv: ele.mv.vid || void 0,
            time: ele.interval * 1e3,
            album: ele.album.name,
            pic: ele.album.picUrl,
            author: ele.singer.map((el) => ({
              nickname: el.name,
              id: el.id
            }))
          }));
        }
      };
      const getKWAlbum = async (id) => {
        const res = await getAlbumDetailKW(id);
        if (res.data.code === 200) {
          const { name, info: desc, img: pic, updateTime, uPic: avatar, userName: nickname } = res.data.data;
          albumInfo.value = {
            name,
            desc,
            pic,
            updateTime,
            avatar,
            nickname
          };
          songList.value = res.data.data.musicList.map((ele) => {
            return {
              name: ele.name,
              id: ele.rid,
              mv: ele.mvpayinfo.vid,
              time: ele.duration * 1e3,
              album: ele.album,
              pic: ele.pic,
              author: [
                {
                  nickname: ele.artist,
                  id: ele.artistid
                }
              ]
            };
          });
        }
      };
      const getKGAlbum = async (id) => {
        const result = await getAlbumDetailKG(id);
        if (result.data.info.list) {
          let { specialname: name, intro: desc, imgurl: pic, publishtime: updateTime, user_avatar: avatar, nickname } = result.data.info.list;
          pic = pic.replace("{size}", "400");
          albumInfo.value = { name, desc, pic, updateTime, avatar, nickname };
        }
        if (result.data.list.list.info) {
          songList.value = result.data.list.list.info.map((ele) => ({
            name: ele.filename.split("-")[1].trim(),
            id: ele.hash,
            mv: ele.mvhash || void 0,
            time: ele.duration * 1e3,
            album: "",
            pic: "",
            author: [
              {
                nickname: ele.filename.split("-")[0],
                id: 0
              }
            ]
          }));
        }
      };
      const getKWRankDetail = async (id) => {
        try {
          loading.value = true;
          const result = await getRankMusicListKW(id);
          if (result.data.code === 200) {
            songList.value = result.data.data.musicList.map((ele) => ({
              name: ele.name,
              id: ele.musicrid,
              mv: ele.mvpayinfo.vid,
              time: ele.duration * 1e3,
              album: ele.album,
              pic: ele.pic,
              author: [
                {
                  nickname: ele.artist,
                  id: ele.artistid
                }
              ]
            }));
          }
          const rankListResult = await getRankListKW();
          if (rankListResult.data.code === 200) {
            let rankList = rankListResult.data.data.reduce((prev, cur) => {
              return prev.concat(cur.list);
            }, []);
            let rank = rankList.find((ele) => ele.sourceid == id);
            let { name, intro: desc, pic, updateTime, pic: avatar, nickname } = rank;
            albumInfo.value = {
              name,
              desc,
              pic,
              updateTime,
              avatar,
              nickname
            };
          }
          loading.value = false;
        } catch {
          loading.value = false;
        }
      };
      const getQQRankDetail = async (id) => {
        try {
          loading.value = true;
          const result = await getRankDetailQQ(id);
          if (result.data.response.code === 0) {
            let { title: name, titleShare: desc, frontPicUrl: pic, updateTime, topAlbumURL: avatar, AdShareContent: nickname } = result.data.response.req_1.data.data;
            albumInfo.value = { name, desc, pic, updateTime, avatar, nickname };
            let list = [];
            if (result.data.response.req_1.data.songInfoList.length > 0) {
              list = result.data.response.req_1.data.songInfoList.map((ele) => ({
                name: ele.name,
                id: ele.mid,
                mv: ele.mv.vid || void 0,
                time: ele.interval * 1e3,
                album: ele.album.name,
                pic: ele.album.picUrl,
                author: ele.singer.map((el) => ({
                  nickname: el.name,
                  id: el.id
                }))
              }));
            } else {
              list = result.data.response.req_1.data.data.song.map((ele) => ({
                name: ele.title,
                id: ele.songId,
                albumMid: ele.albumMid,
                mv: ele.vid || void 0,
                time: null,
                album: ele.title,
                pic: ele.cover,
                author: [
                  {
                    nickname: ele.singerName,
                    id: ele.singerMid
                  }
                ]
              }));
            }
            songList.value = list;
          }
          loading.value = false;
        } catch {
          loading.value = false;
        }
      };
      const getKGRankDetail = async (id) => {
        const result = await getRankMusicListKG(id);
        if (result.data.info) {
          let { rankname: name, intro: desc, imgurl: pic, updateTime, img_cover: avatar, nickname } = result.data.info;
          pic = pic.replace("{size}", "400");
          avatar = avatar.replace("{size}", "400");
          albumInfo.value = { name, desc, pic, updateTime, avatar, nickname };
          let list = [];
          if (result.data.songs.list) {
            list = result.data.songs.list.map((ele) => ({
              name: ele.filename.split("-")[1].trim(),
              id: ele.hash,
              mv: ele.mvhash || void 0,
              time: ele.duration * 1e3,
              album: ele.filename.split("-")[1].trim(),
              pic: "",
              author: [
                {
                  nickname: ele.filename.split("-")[0],
                  id: Math.random().toString(36).substr(2)
                }
              ]
            }));
          }
          songList.value = list;
        }
      };
      const getAlbumInfo = async () => {
        if (platform2.value == 1) {
          await getWyAlbum(albumId.value);
        } else if (platform2.value == 2) {
          if (isRank.value) {
            await getQQRankDetail(albumId.value);
          } else {
            await getQQAlbum(albumId.value);
          }
        } else if (platform2.value == 3) {
          if (isRank.value) {
            await getKWRankDetail(albumId.value);
          } else {
            await getKWAlbum(albumId.value);
          }
        } else if (platform2.value == 4) {
          if (isRank.value) {
            await getKGRankDetail(albumId.value);
          } else {
            await getKGAlbum(albumId.value);
          }
        }
      };
      const playSong = (song) => {
        $eventBus.emit("playSong", {
          id: song.id,
          platform: platform2.value
        });
      };
      const addLike = (song) => {
        const { name, id, author } = song;
        $eventBus.emit("addLike", {
          name,
          id,
          author,
          platform: platform2.value
        });
      };
      const unlike = (song) => {
        $eventBus.emit("unlike", {
          id: song.id,
          platform: platform2.value
        });
      };
      const collect = () => {
        $eventBus.emit("addCollect", {
          id: albumId.value,
          pic: albumInfo.value.pic,
          name: albumInfo.value.name,
          platform: platform2.value
        });
      };
      const unCollect = () => {
        $eventBus.emit("unCollect", {
          id: albumId.value,
          platform: platform2.value
        });
      };
      const playAll = () => {
        promisify(uni.showModal)({
          title: "\u5168\u90E8\u64AD\u653E",
          content: "\u64AD\u653E\u5168\u90E8\u4F1A\u66FF\u6362\u5F53\u524D\u64AD\u653E\u5217\u8868\uFF0C\u662F\u5426\u7EE7\u7EED?",
          showCancel: true,
          confirmText: "\u7EE7\u7EED"
        }).then((res) => {
          if (res.confirm) {
            $eventBus.emit("playAll", songList.value.map((ele) => ({
              id: ele.id,
              platform: platform2.value,
              author: vue.toRaw(ele.author).map((ele2) => ({ name: ele2.nickname, id: ele2.id })),
              name: ele.name
            })));
          }
        });
      };
      vue.watch([() => albumId.value], () => {
        getAlbumInfo();
      });
      vue.watch(() => loading.value, () => {
        if (loading.value) {
          loadingRef.value && loadingRef.value.open();
        } else {
          loadingRef.value && loadingRef.value.close();
        }
      });
      return (_ctx, _cache) => {
        const _component_uni_th = resolveEasycom(vue.resolveDynamicComponent("uni-th"), __easycom_0);
        const _component_uni_tr = resolveEasycom(vue.resolveDynamicComponent("uni-tr"), __easycom_1);
        const _component_uni_td = resolveEasycom(vue.resolveDynamicComponent("uni-td"), __easycom_2);
        const _component_uni_table = resolveEasycom(vue.resolveDynamicComponent("uni-table"), __easycom_3);
        return vue.openBlock(), vue.createElementBlock("view", { class: "h-full flex flex-col" }, [
          vue.createVNode(wLoading, {
            mask: "true",
            click: "true",
            ref_key: "loadingRef",
            ref: loadingRef
          }, null, 512),
          vue.createElementVNode("view", { class: "p-4 flex" }, [
            vue.createElementVNode("image", {
              class: "w-32 h-32 rounded mr-3 flex-shrink-0",
              src: albumInfo.value.pic || defaultImg
            }, null, 8, ["src"]),
            vue.createElementVNode("view", { class: "h-32 overflow-hidden flex flex-col" }, [
              vue.createElementVNode("text", { class: "text-base font-bold flex-shrink-0" }, vue.toDisplayString(albumInfo.value.name), 1),
              vue.createElementVNode("view", { class: "flex flex-shrink-0 items-center mt-2 justify-between" }, [
                vue.createElementVNode("view", { class: "flex items-center" }, [
                  vue.createElementVNode("image", {
                    class: "w-6 h-6 mr-2 rounded-full",
                    src: albumInfo.value.avatar || defaultImg
                  }, null, 8, ["src"]),
                  vue.createElementVNode("text", { class: "text-xs text-purple-500 truncate" }, vue.toDisplayString(albumInfo.value.nickname), 1)
                ]),
                vue.createElementVNode("text", { class: "text-xs text-gray-400 truncate" }, vue.toDisplayString(vue.unref($filters).dateFormat(albumInfo.value.updateTime)), 1)
              ]),
              vue.createElementVNode("scroll-view", {
                "scroll-y": "",
                class: "text-xs flex-1 h-14 text-gray-500 mt-2"
              }, [
                vue.createElementVNode("text", null, vue.toDisplayString(albumInfo.value.desc), 1)
              ])
            ])
          ]),
          vue.createElementVNode("view", { class: "px-4 text-sm flex mb-4" }, [
            vue.createElementVNode("text", {
              onClick: playAll,
              class: "rounded bg-red-500 hover:bg-red-600 text-white py-1 px-4 mr-5"
            }, "\u64AD\u653E\u5168\u90E8"),
            vue.unref(store2).state.collectList.some((ele) => ele.id == albumId.value && ele.platform == platform2.value) ? (vue.openBlock(), vue.createElementBlock("text", {
              key: 0,
              onClick: unCollect,
              class: "rounded bg-gray-600 hover:bg-gray-700 text-white py-1 px-4"
            }, " \u53D6\u6D88\u6536\u85CF ")) : (vue.openBlock(), vue.createElementBlock("text", {
              key: 1,
              onClick: collect,
              class: "rounded bg-gray-600 hover:bg-gray-700 text-white py-1 px-4"
            }, "\u6536\u85CF\u6B4C\u5355"))
          ]),
          vue.createElementVNode("view", { class: "flex-1 overflow-y-scroll" }, [
            vue.createVNode(_component_uni_table, {
              stripe: "",
              emptyText: "\u6682\u65E0\u66F4\u591A\u6570\u636E"
            }, {
              default: vue.withCtx(() => [
                vue.createVNode(_component_uni_tr, null, {
                  default: vue.withCtx(() => [
                    vue.createVNode(_component_uni_th, { align: "left" }, {
                      default: vue.withCtx(() => [
                        vue.createTextVNode("\u6B4C\u66F2")
                      ]),
                      _: 1
                    }),
                    vue.createVNode(_component_uni_th, {
                      align: "right",
                      class: "w-24"
                    }, {
                      default: vue.withCtx(() => [
                        vue.createTextVNode("\u64CD\u4F5C")
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                }),
                (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(songList.value, (song) => {
                  return vue.openBlock(), vue.createBlock(_component_uni_tr, {
                    key: song.id
                  }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_td, null, {
                        default: vue.withCtx(() => [
                          vue.createElementVNode("view", {
                            class: "flex flex-col",
                            onClick: ($event) => playSong(song)
                          }, [
                            vue.createElementVNode("view", { class: "text-sm font-bold" }, vue.toDisplayString(song.name), 1),
                            vue.createElementVNode("text", { class: "text-xs text-gray-400" }, vue.toDisplayString(song.author.map((ele) => ele.nickname).join("/")) + " - " + vue.toDisplayString(song.album), 1)
                          ], 8, ["onClick"])
                        ]),
                        _: 2
                      }, 1024),
                      vue.createVNode(_component_uni_td, { align: "right" }, {
                        default: vue.withCtx(() => [
                          vue.unref(store2).state.likeList.some((ele) => ele.id == song.id && ele.platform == platform2.value) ? (vue.openBlock(), vue.createElementBlock("text", {
                            key: 0,
                            onClick: ($event) => unlike(song),
                            class: "inline-block text-xl iconfont icon-chuangyikongjianICON_fuzhi- text-red-500 mr-2"
                          }, null, 8, ["onClick"])) : (vue.openBlock(), vue.createElementBlock("text", {
                            key: 1,
                            onClick: ($event) => addLike(song),
                            class: "inline-block iconfont icon-xihuan text-xl mr-2"
                          }, null, 8, ["onClick"])),
                          vue.createElementVNode("text", { class: "inline-block iconfont icon-plus text-xl mr-2" })
                        ]),
                        _: 2
                      }, 1024)
                    ]),
                    _: 2
                  }, 1024);
                }), 128))
              ]),
              _: 1
            })
          ])
        ]);
      };
    }
  });
  const _sfc_main$1 = {
    setup(__props) {
      const store2 = useStore();
      const $eventBus = vue.inject("$eventBus");
      const next = () => {
        $eventBus.emit("playNext");
      };
      const prev = () => {
        $eventBus.emit("playPrev");
      };
      const currentTime = vue.ref(store2.state.currentTime);
      store2.state.audioManager.onPlay && store2.state.audioManager.onPlay(() => {
        currentTime.value = store2.state.audioManager.currentTime;
      });
      store2.state.audioManager.ontimeupdate = () => {
        currentTime.value = store2.state.audioManager.currentTime;
      };
      store2.state.audioManager.onTimeUpdate && store2.state.audioManager.onTimeUpdate(() => {
        currentTime.value = store2.state.audioManager.currentTime;
      });
      const lyric = store2.state.lyric;
      vue.ref(store2.state.audioInfo.time);
      const highlightLine = vue.computed(() => {
        let index = lyric.findIndex((ele, index2) => {
          return currentTime.value > ele.time && (lyric[index2 + 1] ? currentTime.value < lyric[index2 + 1].time : true);
        });
        return index;
      });
      const toggleMode = () => {
        store2.commit("changeMode");
      };
      const togglePlay = () => {
        $eventBus.emit(store2.state.audioPlaying ? "pause" : "play");
      };
      const setCurrentTime = (e) => {
        const query = uni.createSelectorQuery().in(this);
        query.select("#progress").boundingClientRect((data) => {
          const percent = e.detail.x / data.width;
          store2.state.audioManager.startTime = store2.state.audioInfo.time / 1e3 * percent;
        }).exec();
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "bg-gray-800 bg-opacity-50 h_full relative w-full flex flex-col text-gray-300 p-4 pt-24 border-red-500" }, [
          vue.createElementVNode("view", { class: "flex justify-around items-center px-8" }, [
            vue.createElementVNode("image", {
              class: "w-24 h-24 rounded",
              src: vue.unref(store2).state.audioInfo.picUrl
            }, null, 8, ["src"]),
            vue.createElementVNode("view", { class: "flex-1 truncate ml-5 flex flex-col justify-around" }, [
              vue.createElementVNode("text", { class: "text-xl" }, vue.toDisplayString(vue.unref(store2).state.audioInfo.name), 1),
              vue.createElementVNode("text", { class: "text-sm mt-3" }, vue.toDisplayString(vue.unref(store2).state.audioInfo.author && vue.unref(store2).state.audioInfo.author.map((ele) => ele.name).join("&")), 1)
            ])
          ]),
          vue.createElementVNode("scroll-view", {
            "scroll-into-view": "lyric" + (vue.unref(highlightLine) - 5),
            "scroll-with-animation": "",
            "scroll-y": "",
            class: "gap-top lyric-container text-center text-base"
          }, [
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(store2).state.lyric, (item, index) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                class: vue.normalizeClass([{ "linear-text highlight-line font-bold": vue.unref(highlightLine) == index }, "text-center leading-8"]),
                id: "lyric" + index,
                key: item.time + index
              }, vue.toDisplayString(item.words), 11, ["id"]);
            }), 128))
          ], 8, ["scroll-into-view"]),
          vue.createElementVNode("view", { class: "mt-5 flex-1 flex flex-col" }, [
            vue.createElementVNode("view", { class: "h-1" }, [
              vue.createCommentVNode(' <movable-area class="h-1 px-1 bg-gray-400 w-full relative overflow-x-hidden">\n					<movable-view style="left:0" class="absolute top-0 h-full w-full bg-white rounded">\n						<text class="absolute w-3 h-3 rounded-full -right-1 -top-1 bg-white"></text>\n					</movable-view>\n				</movable-area> '),
              vue.createElementVNode("view", {
                id: "progress",
                class: "h-1 bg-gray-400 w-full relative",
                onClick: setCurrentTime
              }, [
                vue.createElementVNode("view", {
                  style: vue.normalizeStyle({ width: currentTime.value * 1e3 / vue.unref(store2).state.audioInfo.time * 100 + "%" }),
                  class: "absolute top-0 h-full w-0 bg-white rounded"
                }, [
                  vue.createElementVNode("text", { class: "absolute w-3 h-3 rounded-full -right-1 -top-1 bg-white" })
                ], 4)
              ])
            ]),
            vue.createElementVNode("view", { class: "flex flex-1 items-center justify-around" }, [
              vue.createElementVNode("text", {
                onClick: prev,
                class: "iconfont icon-shangyishou"
              }),
              vue.unref(store2).state.audioPlaying ? (vue.openBlock(), vue.createElementBlock("text", {
                key: 0,
                onClick: togglePlay,
                class: "iconfont icon-zantingtingzhi"
              })) : (vue.openBlock(), vue.createElementBlock("text", {
                key: 1,
                onClick: togglePlay,
                class: "iconfont icon-bofang"
              })),
              vue.createElementVNode("text", {
                onClick: next,
                class: "iconfont icon-xiayishou"
              }),
              vue.unref(store2).state.playMode == 0 ? (vue.openBlock(), vue.createElementBlock("text", {
                key: 2,
                onClick: toggleMode,
                class: "iconfont icon-xunhuan"
              })) : vue.unref(store2).state.playMode == 1 ? (vue.openBlock(), vue.createElementBlock("text", {
                key: 3,
                onClick: toggleMode,
                class: "iconfont icon-suijibofang"
              })) : vue.unref(store2).state.playMode == 2 ? (vue.openBlock(), vue.createElementBlock("text", {
                key: 4,
                onClick: toggleMode,
                class: "iconfont icon-danquxunhuan"
              })) : vue.createCommentVNode("v-if", true)
            ])
          ]),
          vue.createCommentVNode(` <image mode="heightFix" :src="store.state.audioInfo.picUrl" :style="{
				'z-index':-1,
				filter:'blur(1px)',
				opacity:0.8
				}" 
			class="absolute left-0 top-0 w-full h-full">
		</image> `),
          vue.createElementVNode("view", {
            style: vue.normalizeStyle({
              "z-index": -1,
              filter: "blur(15px)",
              opacity: 0.8,
              "background-image": `url(${vue.unref(store2).state.audioInfo.picUrl})`,
              "background-size": "auto 100%"
            }),
            class: "absolute left-0 top-0 w-full h-full"
          }, null, 4)
        ]);
      };
    }
  };
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
  __definePage("pages/index/index", _sfc_main$e);
  __definePage("pages/album/album", _sfc_main$2);
  __definePage("pages/lyric/lyric", _sfc_main$1);
  var platform;
  (function(platform2) {
    platform2[platform2["wy"] = 1] = "wy";
    platform2[platform2["qq"] = 2] = "qq";
    platform2[platform2["kg"] = 4] = "kg";
    platform2[platform2["kw"] = 3] = "kw";
    platform2[platform2["mg"] = 5] = "mg";
  })(platform || (platform = {}));
  function durationTransSec(value) {
    if (!value)
      return 0;
    const temp = value.split(":");
    const minute = temp[0];
    const second = temp[1];
    return +minute * 60 + +second;
  }
  const getSongInfo = async (id, platformType) => {
    var _a, _b, _c, _d;
    let songInfo = {
      name: "",
      author: [],
      time: 0,
      picUrl: "",
      albumId: ""
    };
    if (platformType == 1) {
      const result = await getSongDetailWy(id);
      if (result.data.code === 200) {
        songInfo.name = result.data.songs[0].name;
        songInfo.author = result.data.songs[0].ar;
        songInfo.picUrl = result.data.songs[0].al.picUrl;
        songInfo.time = result.data.songs[0].dt;
      }
    } else if (platformType == 2) {
      const infoResult = await getSongInfoQQ(id);
      if (infoResult.data.response.code === 0) {
        songInfo.author = infoResult.data.response.songinfo.data.track_info.singer.map((ele) => {
          return {
            name: ele.name,
            id: ele.mid
          };
        });
        songInfo.name = infoResult.data.response.songinfo.data.track_info.title;
        songInfo.time = infoResult.data.response.songinfo.data.track_info.interval * 1e3;
        songInfo.albumId = infoResult.data.response.songinfo.data.track_info.album.mid;
      }
      const picResult = await getSongPicQQ(songInfo.albumId);
      if (picResult.data.response.code === 0) {
        songInfo.picUrl = picResult.data.response.data.imageUrl;
      }
    } else if (platformType === 3) {
      let mid = (_a = id.toString().match(/\d+/)) == null ? void 0 : _a[0];
      const result = await getSongDetailKW(mid);
      if (result.data.code === 200) {
        songInfo = {
          name: result.data.data.name,
          author: [{
            name: result.data.data.artist,
            id: result.data.data.artistid
          }],
          time: result.data.data.duration * 1e3,
          picUrl: result.data.data.pic
        };
      }
    } else if (platformType === 4) {
      const result = await getSongDetailKG(id);
      songInfo = {
        name: result.data.songName,
        time: result.data.timeLength * 1e3,
        picUrl: (_c = (_b = result.data) == null ? void 0 : _b.imgUrl) == null ? void 0 : _c.replace("{size}", "400"),
        author: Array.isArray(result.data.authors) ? (_d = result.data.authors) == null ? void 0 : _d.map((ele) => ({
          name: ele.author_name,
          id: ele.author_id
        })) : [{
          name: result.data.singerName || result.data.author_name,
          id: result.data.singerId
        }]
      };
    }
    return songInfo;
  };
  const getSongUrl = async (id, platformType) => {
    if (platformType == 1) {
      const result = await getSongUrlWy(id);
      if (result.data.code == 200 && result.data.data[0].url) {
        return result.data.data[0].url;
      } else {
        return false;
      }
    } else if (platformType == 2) {
      const result = await getSongUrlQQ(id);
      if (!result.data.data.playUrl[id].error) {
        return result.data.data.playUrl[id].url;
      } else {
        return false;
      }
    } else if (platformType == 3) {
      const result = await getMusicUrlKW(id);
      if (result.data.code === 200) {
        return result.data.data;
      } else {
        return false;
      }
    } else if (platformType == 4) {
      const result = await getSongDetailKG(id);
      return result.data.url || result.data.backup_url[0];
    }
  };
  const getLyric = async (id, platformType) => {
    let list = [{
      time: 0,
      words: "\u6B4C\u8BCD\u83B7\u53D6\u5931\u8D25!"
    }];
    if (platformType === 1) {
      const result = await getLyricWy(id);
      if (result.data.code == 200) {
        let lyricArr = result.data.lrc.lyric.split("\n").filter((ele) => ele.trim());
        list = lyricArr.map((ele) => {
          let temp = ele.split("]");
          let words = temp[1].trim();
          let time = temp[0].replace("[", "").trim();
          return {
            time: durationTransSec(time),
            words
          };
        });
      }
    } else if (platformType === 2) {
      const result = await getLyricQQ(id);
      if (result.data.response.code === 0) {
        let lyricArr = result.data.response.lyric.split("\n").filter((ele) => ele.trim());
        list = lyricArr.map((ele) => {
          let temp = ele.split("]");
          let words = temp[1].trim();
          let time = temp[0].replace("[", "").trim();
          return {
            time: durationTransSec(time),
            words
          };
        });
      }
    } else if (platformType === 3) {
      const result = await getLyricKW(id);
      if (result.data.status === 200) {
        list = result.data.data.lrclist.map((ele) => {
          return {
            time: +ele.time,
            words: ele.lineLyric
          };
        });
      }
    } else if (platformType === 4) {
      const result = await getKGLyric(id);
      if (result.data.code === 200) {
        let lyricArr = result.data.result.split("\r\n").filter((ele) => ele[ele.length - 1] !== "]" && ele.trim());
        list = lyricArr.map((ele) => {
          let temp = ele.split("]");
          let words = temp[1].trim();
          let time = temp[0].replace("[", "").trim();
          return {
            time: durationTransSec(time),
            words
          };
        });
      }
    }
    return list;
  };
  const _sfc_main = {
    globalData: {
      audioSrc: "",
      audioInfo: {
        name: "ss",
        pic: "https://p2.music.126.net/qpvBqYIqkRhO9Ry2qOCdJQ==/2942293117852634.jpg"
      },
      audioName: "yyyy"
    },
    onLaunch: function() {
      const store2 = useStore();
      const $eventBus = vue.inject("$eventBus");
      formatAppLog("log", "at App.vue:20", "App Launch");
      const bgAudioManager = uni.getBackgroundAudioManager();
      store2.commit("setAudioManager", bgAudioManager);
      bgAudioManager.onCanplay(() => {
        bgAudioManager.play();
        store2.commit("changeAudioPlaying", true);
      });
      bgAudioManager.onPause(() => {
        store2.commit("changeAudioPlaying", false);
      });
      bgAudioManager.onStop(() => {
        store2.commit("changeAudioPlaying", false);
      });
      bgAudioManager.onEnded(() => {
        store2.commit("changeAudioPlaying", false);
        $eventBus.emit("playNext");
      });
      bgAudioManager.onTimeUpdate(() => {
        store2.commit("changeCurrentTime", bgAudioManager.currentTime);
      });
      store2.commit("setPlayList", uni.getStorageSync("playList"));
      store2.commit("setLikeList", uni.getStorageSync("likeList"));
      store2.commit("setAlbumList", uni.getStorageSync("albumList"));
      store2.commit("setCollectList", uni.getStorageSync("collectList"));
      $eventBus.on("addLike", (song) => {
        formatAppLog("log", "at App.vue:97", 1);
        if (store2.state.likeList.some((ele) => ele.id == song.id && ele.platform == song.platform)) {
          uni.showToast({
            title: "\u6B4C\u66F2\u5DF2\u5B58\u5728",
            icon: "none"
          });
          return;
        }
        const list = [...store2.state.likeList, song];
        uni.setStorageSync("likeList", list);
        store2.commit("setLikeList", list);
      });
      $eventBus.on("unlike", (song) => {
        let list = store2.state.likeList.slice(0);
        let index = list.findIndex((ele) => ele.id == song.id && ele.platform == song.platform);
        if (index == -1) {
          return uni.showToast({
            title: "\u5217\u8868\u4E2D\u65E0\u6B64\u6B4C\u66F2",
            icon: "none"
          });
        } else {
          list.splice(index, 1);
          uni.setStorageSync("likeList", list);
          store2.commit("setLikeList", list);
        }
      });
      $eventBus.on("addCollect", (album) => {
        formatAppLog("log", "at App.vue:130", vue.toRaw(store2.state.collectList), album);
        if (store2.state.collectList.some((ele) => ele.id == album.id && ele.platform == album.platform)) {
          return uni.showToast({
            title: "\u91CD\u590D\u6536\u85CF!",
            icon: "none"
          });
        } else {
          let list = [...store2.state.collectList, album];
          uni.setStorageSync("collectList", list);
          store2.commit("setCollectList", list);
          uni.showToast({
            title: "\u6536\u85CF\u6210\u529F",
            icon: "none"
          });
        }
      });
      $eventBus.on("unCollect", (album) => {
        let list = store2.state.collectList;
        let index = list.findIndex((ele) => ele.id == album.id && ele.platform == album.platform);
        if (index == -1) {
          return uni.showToast({
            title: "\u5217\u8868\u4E2D\u65E0\u6B64\u6B4C\u5355",
            icon: "none"
          });
        } else {
          list.splice(index, 1);
          uni.setStorageSync("collectList", list);
          store2.commit("setCollectList", list);
          uni.showToast({
            title: "\u5DF2\u53D6\u6D88\u6536\u85CF",
            icon: "none"
          });
        }
      });
      $eventBus.on("playSong", async ({ id, platform: platform2, auto = false, force = false }) => {
        if (!id)
          return;
        if (store2.state.audioIdBaseInfo.id == id && !force) {
          return;
        }
        const songUrl = await getSongUrl(id, platform2);
        if (!songUrl) {
          uni.showToast({
            title: "\u6682\u65E0\u64AD\u653E\u5730\u5740",
            icon: "none"
          });
          if (auto) {
            store2.commit("setAudioBaseInfo", {
              id,
              platform: platform2
            });
            $eventBus.emit("playNext");
          }
          return;
        }
        store2.state.audioManager.startTime = 0;
        const songInfo = await getSongInfo(id, platform2);
        songInfo.src = songUrl;
        store2.commit("setAudioInfo", {
          id,
          platform: platform2,
          songInfo
        });
        const lyric = await getLyric(id, platform2);
        store2.commit("setLyric", lyric);
        if (!auto) {
          let list = store2.state.playList.slice(0);
          let index = list.findIndex((ele) => ele.id == id && ele.platform == platform2);
          if (index !== -1) {
            list.splice(index, 1);
          }
          list.unshift({
            id,
            platform: platform2,
            name: songInfo.name,
            author: songInfo.author
          });
          uni.setStorageSync("playList", list);
          store2.commit("setPlayList", list);
        }
      });
      $eventBus.on("playAll", async (songList) => {
        uni.setStorageSync("playList", songList);
        store2.commit("setPlayList", songList);
        $eventBus.emit("playSong", {
          id: songList[0].id,
          platform: songList[0].platform
        });
      });
      $eventBus.on("playNext", () => {
        let playList = store2.state.playList;
        let current = store2.state.audioIdBaseInfo;
        let playMode = store2.state.playMode;
        let index = playList.findIndex((ele) => ele.id == current.id && ele.platform == current.platform);
        if (playMode == 0) {
          index = index == playList.length - 1 ? 0 : index + 1;
        } else if (playMode == 1) {
          index = Math.floor(Math.random() * (playList.length + 1));
        }
        $eventBus.emit("playSong", {
          id: playList[index].id,
          platform: playList[index].platform,
          auto: true,
          force: playMode == 2
        });
      });
      $eventBus.on("playPrev", () => {
        let playList = store2.state.playList;
        let current = store2.state.audioIdBaseInfo;
        let playMode = store2.state.playMode;
        let index = playList.findIndex((ele) => ele.id == current.id && ele.platform == current.platform);
        if (playMode == 0) {
          index = index == 0 ? playList.length - 1 : index - 1;
        } else if (playMode == 1) {
          index = Math.floor(Math.random() * (playList.length + 1));
        }
        $eventBus.emit("playSong", {
          id: playList[index].id,
          platform: playList[index].platform,
          auto: true,
          force: playMode == 2
        });
      });
      $eventBus.on("pause", () => {
        if (!store2.state.audioIdBaseInfo.id)
          return;
        store2.state.audioManager.pause();
        store2.commit("changeAudioPlaying", false);
      });
      $eventBus.on("play", () => {
        if (!store2.state.audioIdBaseInfo.id)
          return;
        store2.state.audioManager.play();
        store2.commit("changeAudioPlaying", true);
      });
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:305", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:308", "App Hide");
    },
    onLoad: function() {
      formatAppLog("log", "at App.vue:311", 9999);
    }
  };
  function mitt(n) {
    return { all: n = n || new Map(), on: function(t2, e) {
      var i = n.get(t2);
      i ? i.push(e) : n.set(t2, [e]);
    }, off: function(t2, e) {
      var i = n.get(t2);
      i && (e ? i.splice(i.indexOf(e) >>> 0, 1) : n.set(t2, []));
    }, emit: function(t2, e) {
      var i = n.get(t2);
      i && i.slice().map(function(n2) {
        n2(e);
      }), (i = n.get("*")) && i.slice().map(function(n2) {
        n2(t2, e);
      });
    } };
  }
  const store = createStore({
    state() {
      return {
        audioManager: null,
        currentTime: 0,
        audioInfo: {
          name: "",
          art: [],
          time: 0,
          picUrl: "",
          albumId: "",
          src: ""
        },
        audioIdBaseInfo: {
          id: "",
          platform: ""
        },
        audioPlaying: false,
        playList: [],
        likeList: [],
        albumList: [],
        collectList: [],
        playMode: 0,
        lyric: []
      };
    },
    mutations: {
      setAudioManager(state, manager) {
        state.audioManager = manager;
      },
      setPlayMode(state, mode) {
        state.playMode = mode;
      },
      changeCurrentTime(state, time) {
        state.currentTime = time;
      },
      setLyric(state, lyric) {
        state.lyric = lyric;
      },
      changeMode(state) {
        state.playMode = (state.playMode + 1) % 3;
      },
      setAduioInfo(state, info) {
        state.audioInfo = info;
        state.audioManager.src = info.src;
        state.audioManager.title = info.name;
      },
      setAudioBaseInfo(state, info) {
        state.audioIdBaseInfo = info;
      },
      setPlayList(state, list) {
        state.playList = list || [];
      },
      setLikeList(state, list) {
        state.likeList = list || [];
      },
      setAlbumList(state, list) {
        state.albumList = list || [];
      },
      setCollectList(state, list) {
        state.collectList = list || [];
      },
      setAudioInfo(state, info) {
        state.audioIdBaseInfo = { id: info.id, platform: info.platform };
        state.audioInfo = info.songInfo;
        state.audioManager.src = info.songInfo.src;
        state.audioManager.title = info.songInfo.name;
      },
      changeAudioPlaying(state, playing) {
        state.audioPlaying = playing;
      }
    },
    actions: {}
  });
  const filters = {
    timeFormat: (value) => {
      if (!value)
        return "-";
      const date = new Date(value);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();
      const seconds = date.getSeconds();
      const addZero = (num) => num < 10 ? "0" + num : num;
      return `${year}-${addZero(month)}-${addZero(day)} ${addZero(hour)}:${addZero(minute)}:${addZero(seconds)}`;
    },
    dateFormat: (value) => {
      if (!value)
        return "-";
      const date = new Date(value);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const addZero = (num) => num < 10 ? "0" + num : num;
      return `${year}-${addZero(month)}-${addZero(day)}`;
    },
    durationFormat: (value) => {
      if (!value)
        return "--:--";
      const minute = Math.floor(value / 6e4);
      const second = Math.floor(value % 6e4 / 1e3);
      const addZero = (num) => num < 10 ? "0" + num : num;
      return `${addZero(minute)}:${addZero(second)}`;
    },
    secToMin: (value) => {
      const minute = Math.floor(value / 60);
      const second = Math.floor(value % 60);
      const addZero = (num) => num < 10 ? "0" + num : num;
      return `${addZero(minute)}:${addZero(second)}`;
    },
    countFormat: (value) => {
      if (isNaN(+value))
        return 0;
      if (value < 1e4)
        return value;
      if (value < 1e8)
        return Math.floor(value / 1e4) + "\u4E07";
      return Math.floor(value / 1e8) + "\u4EBF";
    },
    durationTransSec: (value) => {
      if (!value)
        return 0;
      const temp = value.split(":");
      const minute = temp[0];
      const second = temp[1];
      return +minute * 60 + +second;
    }
  };
  function createApp() {
    const app = vue.createVueApp(_sfc_main);
    app.use(store);
    app.provide("$filters", filters);
    app.provide("$eventBus", mitt());
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
