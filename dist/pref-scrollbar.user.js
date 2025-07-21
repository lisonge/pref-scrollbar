// ==UserScript==
// @name       pref-scrollbar
// @namespace  npm/vite-plugin-monkey
// @version    0.0.0
// @icon       https://vitejs.dev/logo.svg
// @match      http://*/*
// @match      https://*/*
// @grant      GM_addStyle
// @grant      GM_getValue
// @grant      GM_registerMenuCommand
// @grant      GM_setValue
// @grant      GM_unregisterMenuCommand
// @run-at     document-start
// ==/UserScript==

(t=>{if(typeof GM_addStyle=="function"){GM_addStyle(t);return}const o=document.createElement("style");o.textContent=t,document.head.append(o)})(" .BodyScrollbar[data-v-963bff90]{position:fixed;z-index:100}.BodyScrollbar .y-track[data-v-963bff90]{position:fixed;right:2px;top:0;bottom:0;width:8px}.BodyScrollbar .x-track[data-v-963bff90]{position:fixed;left:0;right:0;bottom:2px;height:8px}.BodyScrollbar .slider[data-v-963bff90]{height:100%;background:#909399;transition:opacity .2s;border-radius:4px}.BodyScrollbar .slider[data-v-963bff90]:not(.dragging){opacity:.3}.BodyScrollbar .slider[data-v-963bff90]:hover,.BodyScrollbar .slider.dragging[data-v-963bff90]{opacity:.5} ");

(function () {
  'use strict';

  var _GM_getValue = /* @__PURE__ */ (() => typeof GM_getValue != "undefined" ? GM_getValue : void 0)();
  var _GM_registerMenuCommand = /* @__PURE__ */ (() => typeof GM_registerMenuCommand != "undefined" ? GM_registerMenuCommand : void 0)();
  var _GM_setValue = /* @__PURE__ */ (() => typeof GM_setValue != "undefined" ? GM_setValue : void 0)();
  var _GM_unregisterMenuCommand = /* @__PURE__ */ (() => typeof GM_unregisterMenuCommand != "undefined" ? GM_unregisterMenuCommand : void 0)();
  // @__NO_SIDE_EFFECTS__
  function makeMap(str) {
    const map = /* @__PURE__ */ Object.create(null);
    for (const key of str.split(",")) map[key] = 1;
    return (val) => val in map;
  }
  const EMPTY_OBJ = {};
  const EMPTY_ARR = [];
  const NOOP = () => {
  };
  const YES = () => true;
  const NO = () => false;
  const isOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && // uppercase letter
  (key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97);
  const isNativeOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && // lowercase letter
  key.charCodeAt(2) > 96 && key.charCodeAt(2) < 123;
  const extend = Object.assign;
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const hasOwn = (val, key) => hasOwnProperty.call(val, key);
  const isArray = Array.isArray;
  const isMap = (val) => toTypeString(val) === "[object Map]";
  const isSet = (val) => toTypeString(val) === "[object Set]";
  const isFunction = (val) => typeof val === "function";
  const isString = (val) => typeof val === "string";
  const isSymbol = (val) => typeof val === "symbol";
  const isObject$1 = (val) => val !== null && typeof val === "object";
  const isPromise = (val) => {
    return (isObject$1(val) || isFunction(val)) && isFunction(val.then) && isFunction(val.catch);
  };
  const objectToString = Object.prototype.toString;
  const toTypeString = (value) => objectToString.call(value);
  const isPlainObject = (val) => toTypeString(val) === "[object Object]";
  const isReservedProp = /* @__PURE__ */ makeMap(
    // the leading comma is intentional so empty string "" is also included
    ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
  );
  const cacheStringFunction = (fn) => {
    const cache = /* @__PURE__ */ Object.create(null);
    return (str) => {
      const hit = cache[str];
      return hit || (cache[str] = fn(str));
    };
  };
  const camelizeRE = /-(\w)/g;
  const camelizeReplacer = (_, c) => c ? c.toUpperCase() : "";
  const camelize = cacheStringFunction(
    (str) => str.replace(camelizeRE, camelizeReplacer)
  );
  const hyphenateRE = /\B([A-Z])/g;
  const hyphenate = cacheStringFunction(
    (str) => str.replace(hyphenateRE, "-$1").toLowerCase()
  );
  const capitalize = cacheStringFunction((str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  });
  const toHandlerKey = cacheStringFunction(
    (str) => {
      const s = str ? `on${capitalize(str)}` : ``;
      return s;
    }
  );
  const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
  const invokeArrayFns = (fns, ...arg) => {
    for (let i = 0; i < fns.length; i++) {
      fns[i](...arg);
    }
  };
  const def = (obj, key, value, writable = false) => {
    Object.defineProperty(obj, key, {
      configurable: true,
      enumerable: false,
      writable,
      value
    });
  };
  const looseToNumber = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? val : n;
  };
  let _globalThis;
  const getGlobalThis = () => {
    return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
  };
  function canSetValueDirectly(tagName) {
    return tagName !== "PROGRESS" && // custom elements may use _value internally
    !tagName.includes("-");
  }
  function normalizeStyle(value) {
    if (isArray(value)) {
      const res = {};
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        const normalized = isString(item) ? parseStringStyle(item) : normalizeStyle(item);
        if (normalized) {
          for (const key in normalized) {
            res[key] = normalized[key];
          }
        }
      }
      return res;
    } else if (isString(value) || isObject$1(value)) {
      return value;
    }
  }
  const listDelimiterRE = /;(?![^(]*\))/g;
  const propertyDelimiterRE = /:([^]+)/;
  const styleCommentRE = /\/\*[^]*?\*\//g;
  function parseStringStyle(cssText) {
    const ret = {};
    cssText.replace(styleCommentRE, "").split(listDelimiterRE).forEach((item) => {
      if (item) {
        const tmp = item.split(propertyDelimiterRE);
        tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
      }
    });
    return ret;
  }
  function normalizeClass(value) {
    let res = "";
    if (isString(value)) {
      res = value;
    } else if (isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const normalized = normalizeClass(value[i]);
        if (normalized) {
          res += normalized + " ";
        }
      }
    } else if (isObject$1(value)) {
      for (const name in value) {
        if (value[name]) {
          res += name + " ";
        }
      }
    }
    return res.trim();
  }
  function shouldSetAsAttr(tagName, key) {
    if (key === "spellcheck" || key === "draggable" || key === "translate" || key === "autocorrect") {
      return true;
    }
    if (key === "form") {
      return true;
    }
    if (key === "list" && tagName === "INPUT") {
      return true;
    }
    if (key === "type" && tagName === "TEXTAREA") {
      return true;
    }
    if ((key === "width" || key === "height") && (tagName === "IMG" || tagName === "VIDEO" || tagName === "CANVAS" || tagName === "SOURCE")) {
      return true;
    }
    return false;
  }
  const isRef$1 = (val) => {
    return !!(val && val["__v_isRef"] === true);
  };
  const toDisplayString = (val) => {
    switch (typeof val) {
      case "string":
        return val;
      case "object":
        if (val) {
          if (isRef$1(val)) {
            return toDisplayString(val.value);
          } else if (isArray(val) || val.toString === objectToString || !isFunction(val.toString)) {
            return JSON.stringify(val, replacer, 2);
          }
        }
      default:
        return val == null ? "" : String(val);
    }
  };
  const replacer = (_key, val) => {
    if (isRef$1(val)) {
      return replacer(_key, val.value);
    } else if (isMap(val)) {
      return {
        [`Map(${val.size})`]: [...val.entries()].reduce(
          (entries, [key, val2], i) => {
            entries[stringifySymbol(key, i) + " =>"] = val2;
            return entries;
          },
          {}
        )
      };
    } else if (isSet(val)) {
      return {
        [`Set(${val.size})`]: [...val.values()].map((v) => stringifySymbol(v))
      };
    } else if (isSymbol(val)) {
      return stringifySymbol(val);
    } else if (isObject$1(val) && !isArray(val) && !isPlainObject(val)) {
      return String(val);
    }
    return val;
  };
  const stringifySymbol = (v, i = "") => {
    var _a;
    return (
      // Symbol.description in es2019+ so we need to cast here to pass
      // the lib: es2016 check
      isSymbol(v) ? `Symbol(${(_a = v.description) != null ? _a : i})` : v
    );
  };
  var ReactiveFlags$1 = /* @__PURE__ */ ((ReactiveFlags2) => {
    ReactiveFlags2[ReactiveFlags2["None"] = 0] = "None";
    ReactiveFlags2[ReactiveFlags2["Mutable"] = 1] = "Mutable";
    ReactiveFlags2[ReactiveFlags2["Watching"] = 2] = "Watching";
    ReactiveFlags2[ReactiveFlags2["RecursedCheck"] = 4] = "RecursedCheck";
    ReactiveFlags2[ReactiveFlags2["Recursed"] = 8] = "Recursed";
    ReactiveFlags2[ReactiveFlags2["Dirty"] = 16] = "Dirty";
    ReactiveFlags2[ReactiveFlags2["Pending"] = 32] = "Pending";
    return ReactiveFlags2;
  })(ReactiveFlags$1 || {});
  const notifyBuffer = [];
  let activeSub = void 0;
  let notifyIndex = 0;
  let notifyBufferLength = 0;
  function setActiveSub(sub) {
    try {
      return activeSub;
    } finally {
      activeSub = sub;
    }
  }
  function link(dep, sub) {
    const prevDep = sub.depsTail;
    if (prevDep !== void 0 && prevDep.dep === dep) {
      return;
    }
    let nextDep = void 0;
    const recursedCheck = sub.flags & 4;
    if (recursedCheck) {
      nextDep = prevDep !== void 0 ? prevDep.nextDep : sub.deps;
      if (nextDep !== void 0 && nextDep.dep === dep) {
        sub.depsTail = nextDep;
        return;
      }
    }
    const prevSub = dep.subsTail;
    const newLink = sub.depsTail = dep.subsTail = {
      dep,
      sub,
      prevDep,
      nextDep,
      prevSub,
      nextSub: void 0
    };
    if (nextDep !== void 0) {
      nextDep.prevDep = newLink;
    }
    if (prevDep !== void 0) {
      prevDep.nextDep = newLink;
    } else {
      sub.deps = newLink;
    }
    if (prevSub !== void 0) {
      prevSub.nextSub = newLink;
    } else {
      dep.subs = newLink;
    }
  }
  function unlink(link2, sub = link2.sub) {
    const dep = link2.dep;
    const prevDep = link2.prevDep;
    const nextDep = link2.nextDep;
    const nextSub = link2.nextSub;
    const prevSub = link2.prevSub;
    if (nextDep !== void 0) {
      nextDep.prevDep = prevDep;
    } else {
      sub.depsTail = prevDep;
    }
    if (prevDep !== void 0) {
      prevDep.nextDep = nextDep;
    } else {
      sub.deps = nextDep;
    }
    if (nextSub !== void 0) {
      nextSub.prevSub = prevSub;
    } else {
      dep.subsTail = prevSub;
    }
    if (prevSub !== void 0) {
      prevSub.nextSub = nextSub;
    } else if ((dep.subs = nextSub) === void 0) {
      let toRemove = dep.deps;
      if (toRemove !== void 0) {
        do {
          toRemove = unlink(toRemove, dep);
        } while (toRemove !== void 0);
        dep.flags |= 16;
      }
    }
    return nextDep;
  }
  function propagate(link2) {
    let next = link2.nextSub;
    let stack;
    top: do {
      const sub = link2.sub;
      let flags = sub.flags;
      if (flags & (1 | 2)) {
        if (!(flags & (4 | 8 | 16 | 32))) {
          sub.flags = flags | 32;
        } else if (!(flags & (4 | 8))) {
          flags = 0;
        } else if (!(flags & 4)) {
          sub.flags = flags & -9 | 32;
        } else if (!(flags & (16 | 32)) && isValidLink(link2, sub)) {
          sub.flags = flags | 8 | 32;
          flags &= 1;
        } else {
          flags = 0;
        }
        if (flags & 2) {
          notifyBuffer[notifyBufferLength++] = sub;
        }
        if (flags & 1) {
          const subSubs = sub.subs;
          if (subSubs !== void 0) {
            link2 = subSubs;
            if (subSubs.nextSub !== void 0) {
              stack = { value: next, prev: stack };
              next = link2.nextSub;
            }
            continue;
          }
        }
      }
      if ((link2 = next) !== void 0) {
        next = link2.nextSub;
        continue;
      }
      while (stack !== void 0) {
        link2 = stack.value;
        stack = stack.prev;
        if (link2 !== void 0) {
          next = link2.nextSub;
          continue top;
        }
      }
      break;
    } while (true);
  }
  function startTracking(sub) {
    sub.depsTail = void 0;
    sub.flags = sub.flags & -57 | 4;
    return setActiveSub(sub);
  }
  function endTracking(sub, prevSub) {
    activeSub = prevSub;
    const depsTail = sub.depsTail;
    let toRemove = depsTail !== void 0 ? depsTail.nextDep : sub.deps;
    while (toRemove !== void 0) {
      toRemove = unlink(toRemove, sub);
    }
    sub.flags &= -5;
  }
  function flush() {
    while (notifyIndex < notifyBufferLength) {
      const effect2 = notifyBuffer[notifyIndex];
      notifyBuffer[notifyIndex++] = void 0;
      effect2.notify();
    }
    notifyIndex = 0;
    notifyBufferLength = 0;
  }
  function checkDirty(link2, sub) {
    let stack;
    let checkDepth = 0;
    top: do {
      const dep = link2.dep;
      const depFlags = dep.flags;
      let dirty = false;
      if (sub.flags & 16) {
        dirty = true;
      } else if ((depFlags & (1 | 16)) === (1 | 16)) {
        if (dep.update()) {
          const subs = dep.subs;
          if (subs.nextSub !== void 0) {
            shallowPropagate(subs);
          }
          dirty = true;
        }
      } else if ((depFlags & (1 | 32)) === (1 | 32)) {
        if (link2.nextSub !== void 0 || link2.prevSub !== void 0) {
          stack = { value: link2, prev: stack };
        }
        link2 = dep.deps;
        sub = dep;
        ++checkDepth;
        continue;
      }
      if (!dirty && link2.nextDep !== void 0) {
        link2 = link2.nextDep;
        continue;
      }
      while (checkDepth) {
        --checkDepth;
        const firstSub = sub.subs;
        const hasMultipleSubs = firstSub.nextSub !== void 0;
        if (hasMultipleSubs) {
          link2 = stack.value;
          stack = stack.prev;
        } else {
          link2 = firstSub;
        }
        if (dirty) {
          if (sub.update()) {
            if (hasMultipleSubs) {
              shallowPropagate(firstSub);
            }
            sub = link2.sub;
            continue;
          }
        } else {
          sub.flags &= -33;
        }
        sub = link2.sub;
        if (link2.nextDep !== void 0) {
          link2 = link2.nextDep;
          continue top;
        }
        dirty = false;
      }
      return dirty;
    } while (true);
  }
  function shallowPropagate(link2) {
    do {
      const sub = link2.sub;
      const nextSub = link2.nextSub;
      const subFlags = sub.flags;
      if ((subFlags & (32 | 16)) === 32) {
        sub.flags = subFlags | 16;
      }
      link2 = nextSub;
    } while (link2 !== void 0);
  }
  function isValidLink(checkLink, sub) {
    const depsTail = sub.depsTail;
    if (depsTail !== void 0) {
      let link2 = sub.deps;
      do {
        if (link2 === checkLink) {
          return true;
        }
        if (link2 === depsTail) {
          break;
        }
        link2 = link2.nextDep;
      } while (link2 !== void 0);
    }
    return false;
  }
  new Set(
    /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(isSymbol)
  );
  function isReactive(value) {
    if (isReadonly(value)) {
      return isReactive(value["__v_raw"]);
    }
    return !!(value && value["__v_isReactive"]);
  }
  function isReadonly(value) {
    return !!(value && value["__v_isReadonly"]);
  }
  function isShallow(value) {
    return !!(value && value["__v_isShallow"]);
  }
  function toRaw(observed) {
    const raw = observed && observed["__v_raw"];
    return raw ? toRaw(raw) : observed;
  }
  function markRaw(value) {
    if (!hasOwn(value, "__v_skip") && Object.isExtensible(value)) {
      def(value, "__v_skip", true);
    }
    return value;
  }
  function isRef(r) {
    return r ? r["__v_isRef"] === true : false;
  }
  function shallowRef(value) {
    return createRef(value);
  }
  function createRef(rawValue, wrap) {
    if (isRef(rawValue)) {
      return rawValue;
    }
    return new RefImpl(rawValue, wrap);
  }
  class RefImpl {
    // TODO isolatedDeclarations "__v_isShallow"
    constructor(value, wrap) {
      this.subs = void 0;
      this.subsTail = void 0;
      this.flags = ReactiveFlags$1.Mutable;
      this.__v_isRef = true;
      this.__v_isShallow = false;
      this._oldValue = this._rawValue = wrap ? toRaw(value) : value;
      this._value = wrap ? wrap(value) : value;
      this._wrap = wrap;
      this["__v_isShallow"] = !wrap;
    }
    get dep() {
      return this;
    }
    get value() {
      trackRef(this);
      if (this.flags & ReactiveFlags$1.Dirty && this.update()) {
        const subs = this.subs;
        if (subs !== void 0) {
          shallowPropagate(subs);
        }
      }
      return this._value;
    }
    set value(newValue) {
      const oldValue = this._rawValue;
      const useDirectValue = this["__v_isShallow"] || isShallow(newValue) || isReadonly(newValue);
      newValue = useDirectValue ? newValue : toRaw(newValue);
      if (hasChanged(newValue, oldValue)) {
        this.flags |= ReactiveFlags$1.Dirty;
        this._rawValue = newValue;
        this._value = !useDirectValue && this._wrap ? this._wrap(newValue) : newValue;
        const subs = this.subs;
        if (subs !== void 0) {
          propagate(subs);
          {
            flush();
          }
        }
      }
    }
    update() {
      this.flags &= ~ReactiveFlags$1.Dirty;
      return hasChanged(this._oldValue, this._oldValue = this._rawValue);
    }
  }
  function trackRef(dep) {
    if (activeSub !== void 0) {
      link(dep, activeSub);
    }
  }
  function unref(ref2) {
    return isRef(ref2) ? ref2.value : ref2;
  }
  function toValue(source) {
    return isFunction(source) ? source() : unref(source);
  }
  class ReactiveEffect {
    constructor(fn) {
      this.deps = void 0;
      this.depsTail = void 0;
      this.subs = void 0;
      this.subsTail = void 0;
      this.flags = ReactiveFlags$1.Watching | ReactiveFlags$1.Dirty;
      this.cleanups = [];
      this.cleanupsLength = 0;
      if (fn !== void 0) {
        this.fn = fn;
      }
      if (activeEffectScope) {
        link(this, activeEffectScope);
      }
    }
    // @ts-expect-error
    fn() {
    }
    get active() {
      return !(this.flags & 1024);
    }
    pause() {
      this.flags |= 256;
    }
    resume() {
      const flags = this.flags &= -257;
      if (flags & (ReactiveFlags$1.Dirty | ReactiveFlags$1.Pending)) {
        this.notify();
      }
    }
    notify() {
      if (!(this.flags & 256) && this.dirty) {
        this.run();
      }
    }
    run() {
      if (!this.active) {
        return this.fn();
      }
      cleanup(this);
      const prevSub = startTracking(this);
      try {
        return this.fn();
      } finally {
        endTracking(this, prevSub);
        const flags = this.flags;
        if ((flags & (ReactiveFlags$1.Recursed | 128)) === (ReactiveFlags$1.Recursed | 128)) {
          this.flags = flags & ~ReactiveFlags$1.Recursed;
          this.notify();
        }
      }
    }
    stop() {
      if (!this.active) {
        return;
      }
      this.flags = 1024;
      let dep = this.deps;
      while (dep !== void 0) {
        dep = unlink(dep, this);
      }
      const sub = this.subs;
      if (sub !== void 0) {
        unlink(sub);
      }
      cleanup(this);
    }
    get dirty() {
      const flags = this.flags;
      if (flags & ReactiveFlags$1.Dirty) {
        return true;
      }
      if (flags & ReactiveFlags$1.Pending) {
        if (checkDirty(this.deps, this)) {
          this.flags = flags | ReactiveFlags$1.Dirty;
          return true;
        } else {
          this.flags = flags & ~ReactiveFlags$1.Pending;
        }
      }
      return false;
    }
  }
  function cleanup(sub) {
    const l = sub.cleanupsLength;
    if (l) {
      for (let i = 0; i < l; i++) {
        sub.cleanups[i]();
      }
      sub.cleanupsLength = 0;
    }
  }
  function onEffectCleanup(fn, failSilently = false) {
    if (activeSub instanceof ReactiveEffect) {
      activeSub.cleanups[activeSub.cleanupsLength++] = () => cleanupEffect(fn);
    }
  }
  function cleanupEffect(fn) {
    const prevSub = setActiveSub();
    try {
      fn();
    } finally {
      setActiveSub(prevSub);
    }
  }
  let activeEffectScope;
  class EffectScope {
    constructor(detached = false) {
      this.deps = void 0;
      this.depsTail = void 0;
      this.subs = void 0;
      this.subsTail = void 0;
      this.flags = 0;
      this.cleanups = [];
      this.cleanupsLength = 0;
      if (!detached && activeEffectScope) {
        link(this, activeEffectScope);
      }
    }
    get active() {
      return !(this.flags & 1024);
    }
    pause() {
      if (!(this.flags & 256)) {
        this.flags |= 256;
        for (let link2 = this.deps; link2 !== void 0; link2 = link2.nextDep) {
          const dep = link2.dep;
          if ("pause" in dep) {
            dep.pause();
          }
        }
      }
    }
    /**
     * Resumes the effect scope, including all child scopes and effects.
     */
    resume() {
      const flags = this.flags;
      if (flags & 256) {
        this.flags = flags & -257;
        for (let link2 = this.deps; link2 !== void 0; link2 = link2.nextDep) {
          const dep = link2.dep;
          if ("resume" in dep) {
            dep.resume();
          }
        }
      }
    }
    run(fn) {
      const prevScope = activeEffectScope;
      try {
        activeEffectScope = this;
        return fn();
      } finally {
        activeEffectScope = prevScope;
      }
    }
    stop() {
      if (!this.active) {
        return;
      }
      this.flags = 1024;
      let dep = this.deps;
      while (dep !== void 0) {
        const node = dep.dep;
        if ("stop" in node) {
          dep = dep.nextDep;
          node.stop();
        } else {
          dep = unlink(dep, this);
        }
      }
      const sub = this.subs;
      if (sub !== void 0) {
        unlink(sub);
      }
      cleanup(this);
    }
  }
  function getCurrentScope() {
    return activeEffectScope;
  }
  function setCurrentScope(scope) {
    try {
      return activeEffectScope;
    } finally {
      activeEffectScope = scope;
    }
  }
  function onScopeDispose(fn, failSilently = false) {
    if (activeEffectScope !== void 0) {
      activeEffectScope.cleanups[activeEffectScope.cleanupsLength++] = fn;
    }
  }
  class ComputedRefImpl {
    constructor(fn, setter) {
      this.fn = fn;
      this.setter = setter;
      this._value = void 0;
      this.subs = void 0;
      this.subsTail = void 0;
      this.deps = void 0;
      this.depsTail = void 0;
      this.flags = ReactiveFlags$1.Mutable | ReactiveFlags$1.Dirty;
      this.__v_isRef = true;
      this["__v_isReadonly"] = !setter;
    }
    // TODO isolatedDeclarations "__v_isReadonly"
    // for backwards compat
    get effect() {
      return this;
    }
    // for backwards compat
    get dep() {
      return this;
    }
    /**
     * @internal
     * for backwards compat
     */
    get _dirty() {
      const flags = this.flags;
      if (flags & ReactiveFlags$1.Dirty) {
        return true;
      }
      if (flags & ReactiveFlags$1.Pending) {
        if (checkDirty(this.deps, this)) {
          this.flags = flags | ReactiveFlags$1.Dirty;
          return true;
        } else {
          this.flags = flags & ~ReactiveFlags$1.Pending;
        }
      }
      return false;
    }
    /**
     * @internal
     * for backwards compat
     */
    set _dirty(v) {
      if (v) {
        this.flags |= ReactiveFlags$1.Dirty;
      } else {
        this.flags &= ~(ReactiveFlags$1.Dirty | ReactiveFlags$1.Pending);
      }
    }
    get value() {
      const flags = this.flags;
      if (flags & ReactiveFlags$1.Dirty || flags & ReactiveFlags$1.Pending && checkDirty(this.deps, this)) {
        if (this.update()) {
          const subs = this.subs;
          if (subs !== void 0) {
            shallowPropagate(subs);
          }
        }
      } else if (flags & ReactiveFlags$1.Pending) {
        this.flags = flags & ~ReactiveFlags$1.Pending;
      }
      if (activeSub !== void 0) {
        link(this, activeSub);
      } else if (activeEffectScope !== void 0) {
        link(this, activeEffectScope);
      }
      return this._value;
    }
    set value(newValue) {
      if (this.setter) {
        this.setter(newValue);
      }
    }
    update() {
      const prevSub = startTracking(this);
      try {
        const oldValue = this._value;
        const newValue = this.fn(oldValue);
        if (hasChanged(oldValue, newValue)) {
          this._value = newValue;
          return true;
        }
        return false;
      } finally {
        endTracking(this, prevSub);
      }
    }
  }
  function computed$1(getterOrOptions, debugOptions, isSSR = false) {
    let getter;
    let setter;
    if (isFunction(getterOrOptions)) {
      getter = getterOrOptions;
    } else {
      getter = getterOrOptions.get;
      setter = getterOrOptions.set;
    }
    const cRef = new ComputedRefImpl(getter, setter);
    return cRef;
  }
  const INITIAL_WATCHER_VALUE = {};
  let activeWatcher = void 0;
  function onWatcherCleanup(cleanupFn, failSilently = false, owner = activeWatcher) {
    if (owner) {
      const { call } = owner.options;
      if (call) {
        owner.cleanups[owner.cleanupsLength++] = () => call(cleanupFn, 4);
      } else {
        owner.cleanups[owner.cleanupsLength++] = cleanupFn;
      }
    }
  }
  class WatcherEffect extends ReactiveEffect {
    constructor(source, cb, options = EMPTY_OBJ) {
      const { deep, once, call, onWarn } = options;
      let getter;
      let forceTrigger = false;
      let isMultiSource = false;
      if (isRef(source)) {
        getter = () => source.value;
        forceTrigger = isShallow(source);
      } else if (isReactive(source)) {
        getter = () => reactiveGetter(source, deep);
        forceTrigger = true;
      } else if (isArray(source)) {
        isMultiSource = true;
        forceTrigger = source.some((s) => isReactive(s) || isShallow(s));
        getter = () => source.map((s) => {
          if (isRef(s)) {
            return s.value;
          } else if (isReactive(s)) {
            return reactiveGetter(s, deep);
          } else if (isFunction(s)) {
            return call ? call(s, 2) : s();
          } else ;
        });
      } else if (isFunction(source)) {
        if (cb) {
          getter = call ? () => call(source, 2) : source;
        } else {
          getter = () => {
            if (this.cleanupsLength) {
              const prevSub = setActiveSub();
              try {
                cleanup(this);
              } finally {
                setActiveSub(prevSub);
              }
            }
            const currentEffect = activeWatcher;
            activeWatcher = this;
            try {
              return call ? call(source, 3, [
                this.boundCleanup
              ]) : source(this.boundCleanup);
            } finally {
              activeWatcher = currentEffect;
            }
          };
        }
      } else {
        getter = NOOP;
      }
      if (cb && deep) {
        const baseGetter = getter;
        const depth = deep === true ? Infinity : deep;
        getter = () => traverse(baseGetter(), depth);
      }
      super(getter);
      this.cb = cb;
      this.options = options;
      this.boundCleanup = (fn) => onWatcherCleanup(fn, false, this);
      this.forceTrigger = forceTrigger;
      this.isMultiSource = isMultiSource;
      if (once && cb) {
        const _cb = cb;
        cb = (...args) => {
          _cb(...args);
          this.stop();
        };
      }
      this.cb = cb;
      this.oldValue = isMultiSource ? new Array(source.length).fill(INITIAL_WATCHER_VALUE) : INITIAL_WATCHER_VALUE;
    }
    run(initialRun = false) {
      const oldValue = this.oldValue;
      const newValue = this.oldValue = super.run();
      if (!this.cb) {
        return;
      }
      const { immediate, deep, call } = this.options;
      if (initialRun && !immediate) {
        return;
      }
      if (deep || this.forceTrigger || (this.isMultiSource ? newValue.some((v, i) => hasChanged(v, oldValue[i])) : hasChanged(newValue, oldValue))) {
        cleanup(this);
        const currentWatcher = activeWatcher;
        activeWatcher = this;
        try {
          const args = [
            newValue,
            // pass undefined as the old value when it's changed for the first time
            oldValue === INITIAL_WATCHER_VALUE ? void 0 : this.isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE ? [] : oldValue,
            this.boundCleanup
          ];
          call ? call(this.cb, 3, args) : (
            // @ts-expect-error
            this.cb(...args)
          );
        } finally {
          activeWatcher = currentWatcher;
        }
      }
    }
  }
  function reactiveGetter(source, deep) {
    if (deep) return source;
    if (isShallow(source) || deep === false || deep === 0)
      return traverse(source, 1);
    return traverse(source);
  }
  function traverse(value, depth = Infinity, seen) {
    if (depth <= 0 || !isObject$1(value) || value["__v_skip"]) {
      return value;
    }
    seen = seen || /* @__PURE__ */ new Set();
    if (seen.has(value)) {
      return value;
    }
    seen.add(value);
    depth--;
    if (isRef(value)) {
      traverse(value.value, depth, seen);
    } else if (isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        traverse(value[i], depth, seen);
      }
    } else if (isSet(value) || isMap(value)) {
      value.forEach((v) => {
        traverse(v, depth, seen);
      });
    } else if (isPlainObject(value)) {
      for (const key in value) {
        traverse(value[key], depth, seen);
      }
      for (const key of Object.getOwnPropertySymbols(value)) {
        if (Object.prototype.propertyIsEnumerable.call(value, key)) {
          traverse(value[key], depth, seen);
        }
      }
    }
    return value;
  }
  function callWithErrorHandling(fn, instance, type, args) {
    try {
      return args ? fn(...args) : fn();
    } catch (err) {
      handleError(err, instance, type);
    }
  }
  function callWithAsyncErrorHandling(fn, instance, type, args) {
    if (isFunction(fn)) {
      const res = callWithErrorHandling(fn, instance, type, args);
      if (res && isPromise(res)) {
        res.catch((err) => {
          handleError(err, instance, type);
        });
      }
      return res;
    }
    if (isArray(fn)) {
      const values = [];
      for (let i = 0; i < fn.length; i++) {
        values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
      }
      return values;
    }
  }
  function handleError(err, instance, type, throwInDev = true) {
    const { errorHandler, throwUnhandledErrorInProduction } = instance && instance.appContext.config || EMPTY_OBJ;
    if (instance) {
      let cur = instance.parent;
      const exposedInstance = instance.proxy || instance;
      const errorInfo = `https://vuejs.org/error-reference/#runtime-${type}`;
      while (cur) {
        const errorCapturedHooks = cur.ec;
        if (errorCapturedHooks) {
          for (let i = 0; i < errorCapturedHooks.length; i++) {
            if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) {
              return;
            }
          }
        }
        cur = cur.parent;
      }
      if (errorHandler) {
        const prevSub = setActiveSub();
        callWithErrorHandling(errorHandler, null, 10, [
          err,
          exposedInstance,
          errorInfo
        ]);
        setActiveSub(prevSub);
        return;
      }
    }
    logError(err, type, instance, throwInDev, throwUnhandledErrorInProduction);
  }
  function logError(err, type, instance, throwInDev = true, throwInProd = false) {
    if (throwInProd) {
      throw err;
    } else {
      console.error(err);
    }
  }
  const jobs = [];
  let postJobs = [];
  let activePostJobs = null;
  let currentFlushPromise = null;
  let jobsLength = 0;
  let flushIndex = 0;
  let postFlushIndex = 0;
  const resolvedPromise = /* @__PURE__ */ Promise.resolve();
  function nextTick(fn) {
    const p2 = currentFlushPromise || resolvedPromise;
    return fn ? p2.then(this ? fn.bind(this) : fn) : p2;
  }
  function findInsertionIndex(order, queue, start, end) {
    while (start < end) {
      const middle = start + end >>> 1;
      if (queue[middle].order <= order) {
        start = middle + 1;
      } else {
        end = middle;
      }
    }
    return start;
  }
  function queueJob(job, id, isPre = false) {
    if (queueJobWorker(
      job,
      id === void 0 ? isPre ? -2 : Infinity : isPre ? id * 2 : id * 2 + 1,
      jobs,
      jobsLength,
      flushIndex
    )) {
      jobsLength++;
      queueFlush();
    }
  }
  function queueJobWorker(job, order, queue, length, flushIndex2) {
    const flags = job.flags;
    if (!(flags & 1)) {
      job.flags = flags | 1;
      job.order = order;
      if (flushIndex2 === length || // fast path when the job id is larger than the tail
      order >= queue[length - 1].order) {
        queue[length] = job;
      } else {
        queue.splice(findInsertionIndex(order, queue, flushIndex2, length), 0, job);
      }
      return true;
    }
    return false;
  }
  const doFlushJobs = () => {
    try {
      flushJobs();
    } catch (e) {
      currentFlushPromise = null;
      throw e;
    }
  };
  function queueFlush() {
    if (!currentFlushPromise) {
      currentFlushPromise = resolvedPromise.then(doFlushJobs);
    }
  }
  function queuePostFlushCb(jobs2, id = Infinity) {
    if (!isArray(jobs2)) {
      if (activePostJobs && id === -1) {
        activePostJobs.splice(postFlushIndex, 0, jobs2);
      } else {
        queueJobWorker(jobs2, id, postJobs, postJobs.length, 0);
      }
    } else {
      for (const job of jobs2) {
        queueJobWorker(job, id, postJobs, postJobs.length, 0);
      }
    }
    queueFlush();
  }
  function flushPreFlushCbs(instance, seen) {
    for (let i = flushIndex; i < jobsLength; i++) {
      const cb = jobs[i];
      if (cb.order & 1 || cb.order === Infinity) {
        continue;
      }
      jobs.splice(i, 1);
      i--;
      jobsLength--;
      if (cb.flags & 2) {
        cb.flags &= -2;
      }
      cb();
      if (!(cb.flags & 2)) {
        cb.flags &= -2;
      }
    }
  }
  function flushPostFlushCbs(seen) {
    if (postJobs.length) {
      if (activePostJobs) {
        activePostJobs.push(...postJobs);
        postJobs.length = 0;
        return;
      }
      activePostJobs = postJobs;
      postJobs = [];
      while (postFlushIndex < activePostJobs.length) {
        const cb = activePostJobs[postFlushIndex++];
        if (cb.flags & 2) {
          cb.flags &= -2;
        }
        if (!(cb.flags & 4)) {
          try {
            cb();
          } finally {
            cb.flags &= -2;
          }
        }
      }
      activePostJobs = null;
      postFlushIndex = 0;
    }
  }
  let isFlushing = false;
  function flushOnAppMount() {
    if (!isFlushing) {
      isFlushing = true;
      flushPreFlushCbs();
      flushPostFlushCbs();
      isFlushing = false;
    }
  }
  function flushJobs(seen) {
    try {
      while (flushIndex < jobsLength) {
        const job = jobs[flushIndex];
        jobs[flushIndex++] = void 0;
        if (!(job.flags & 4)) {
          if (false) ;
          if (job.flags & 2) {
            job.flags &= ~1;
          }
          try {
            job();
          } catch (err) {
            handleError(
              err,
              job.i,
              job.i ? 15 : 14
            );
          } finally {
            if (!(job.flags & 2)) {
              job.flags &= ~1;
            }
          }
        }
      }
    } finally {
      while (flushIndex < jobsLength) {
        jobs[flushIndex].flags &= -2;
        jobs[flushIndex++] = void 0;
      }
      flushIndex = 0;
      jobsLength = 0;
      flushPostFlushCbs();
      currentFlushPromise = null;
      if (jobsLength || postJobs.length) {
        flushJobs();
      }
    }
  }
  let currentRenderingInstance = null;
  getGlobalThis().requestIdleCallback || ((cb) => setTimeout(cb, 1));
  getGlobalThis().cancelIdleCallback || ((id) => clearTimeout(id));
  function injectHook(type, hook, target = currentInstance, prepend = false) {
    if (target) {
      const hooks = target[type] || (target[type] = []);
      const wrappedHook = hook.__weh || (hook.__weh = (...args) => {
        const prevSub = setActiveSub();
        const prev = setCurrentInstance(target);
        try {
          return callWithAsyncErrorHandling(hook, target, type, args);
        } finally {
          setCurrentInstance(...prev);
          setActiveSub(prevSub);
        }
      });
      if (prepend) {
        hooks.unshift(wrappedHook);
      } else {
        hooks.push(wrappedHook);
      }
      return wrappedHook;
    }
  }
  const createHook = (lifecycle) => (hook, target = currentInstance) => {
    if (!isInSSRComponentSetup || lifecycle === "sp") {
      injectHook(lifecycle, (...args) => hook(...args), target);
    }
  };
  const onMounted = createHook("m");
  const onUnmounted = createHook("um");
  function createAppContext() {
    return {
      app: null,
      config: {
        isNativeTag: NO,
        performance: false,
        globalProperties: {},
        optionMergeStrategies: {},
        errorHandler: void 0,
        warnHandler: void 0,
        compilerOptions: {}
      },
      mixins: [],
      components: {},
      directives: {},
      provides: /* @__PURE__ */ Object.create(null),
      optionsCache: /* @__PURE__ */ new WeakMap(),
      propsCache: /* @__PURE__ */ new WeakMap(),
      emitsCache: /* @__PURE__ */ new WeakMap()
    };
  }
  let uid$1 = 0;
  function createAppAPI(mount2, unmount2, getPublicInstance2, render) {
    return function createApp(rootComponent, rootProps = null) {
      if (!isFunction(rootComponent)) {
        rootComponent = extend({}, rootComponent);
      }
      if (rootProps != null && !isObject$1(rootProps)) {
        rootProps = null;
      }
      const context = createAppContext();
      const installedPlugins = /* @__PURE__ */ new WeakSet();
      const pluginCleanupFns = [];
      let isMounted = false;
      const app = context.app = {
        _uid: uid$1++,
        _component: rootComponent,
        _props: rootProps,
        _container: null,
        _context: context,
        _instance: null,
        version,
        get config() {
          return context.config;
        },
        set config(v) {
        },
        use(plugin, ...options) {
          if (installedPlugins.has(plugin)) ;
          else if (plugin && isFunction(plugin.install)) {
            installedPlugins.add(plugin);
            plugin.install(app, ...options);
          } else if (isFunction(plugin)) {
            installedPlugins.add(plugin);
            plugin(app, ...options);
          } else ;
          return app;
        },
        mixin(mixin) {
          {
            if (!context.mixins.includes(mixin)) {
              context.mixins.push(mixin);
            }
          }
          return app;
        },
        component(name, component) {
          if (!component) {
            return context.components[name];
          }
          context.components[name] = component;
          return app;
        },
        directive(name, directive) {
          if (!directive) {
            return context.directives[name];
          }
          context.directives[name] = directive;
          return app;
        },
        mount(rootContainer, isHydrate, namespace) {
          if (!isMounted) {
            const instance = mount2(app, rootContainer, isHydrate, namespace);
            isMounted = true;
            app._container = rootContainer;
            rootContainer.__vue_app__ = app;
            return getPublicInstance2(instance);
          }
        },
        onUnmount(cleanupFn) {
          pluginCleanupFns.push(cleanupFn);
        },
        unmount() {
          if (isMounted) {
            callWithAsyncErrorHandling(
              pluginCleanupFns,
              app._instance,
              16
            );
            unmount2(app);
            delete app._container.__vue_app__;
          }
        },
        provide(key, value) {
          context.provides[key] = value;
          return app;
        },
        runWithContext(fn) {
          const lastApp = currentApp;
          currentApp = app;
          try {
            return fn();
          } finally {
            currentApp = lastApp;
          }
        }
      };
      return app;
    };
  }
  let currentApp = null;
  function inject(key, defaultValue, treatDefaultAsFactory = false) {
    const instance = getCurrentGenericInstance();
    if (instance || currentApp) {
      let provides = currentApp ? currentApp._context.provides : instance ? instance.parent == null || instance.ce ? instance.appContext && instance.appContext.provides : instance.parent.provides : void 0;
      if (provides && key in provides) {
        return provides[key];
      } else if (arguments.length > 1) {
        return treatDefaultAsFactory && isFunction(defaultValue) ? defaultValue.call(instance && instance.proxy) : defaultValue;
      } else ;
    }
  }
  function hasInjectionContext() {
    return !!(getCurrentGenericInstance() || currentApp);
  }
  function resolvePropValue(options, key, value, instance, resolveDefault2, isAbsent = false) {
    const opt = options[key];
    if (opt != null) {
      const hasDefault = hasOwn(opt, "default");
      if (hasDefault && value === void 0) {
        const defaultValue = opt.default;
        if (opt.type !== Function && !opt.skipFactory && isFunction(defaultValue)) {
          const cachedDefaults = instance.propsDefaults || (instance.propsDefaults = {});
          if (hasOwn(cachedDefaults, key)) {
            value = cachedDefaults[key];
          } else {
            value = cachedDefaults[key] = resolveDefault2(
              defaultValue,
              instance,
              key
            );
          }
        } else {
          value = defaultValue;
        }
        if (instance.ce) {
          instance.ce._setProp(key, value);
        }
      }
      if (opt[
        0
        /* shouldCast */
      ]) {
        if (isAbsent && !hasDefault) {
          value = false;
        } else if (opt[
          1
          /* shouldCastTrue */
        ] && (value === "" || value === hyphenate(key))) {
          value = true;
        }
      }
    }
    return value;
  }
  function baseNormalizePropsOptions(raw, normalized, needCastKeys) {
    if (isArray(raw)) {
      for (let i = 0; i < raw.length; i++) {
        const normalizedKey = camelize(raw[i]);
        if (validatePropName(normalizedKey)) {
          normalized[normalizedKey] = EMPTY_OBJ;
        }
      }
    } else if (raw) {
      for (const key in raw) {
        const normalizedKey = camelize(key);
        if (validatePropName(normalizedKey)) {
          const opt = raw[key];
          const prop = normalized[normalizedKey] = isArray(opt) || isFunction(opt) ? { type: opt } : extend({}, opt);
          const propType = prop.type;
          let shouldCast = false;
          let shouldCastTrue = true;
          if (isArray(propType)) {
            for (let index = 0; index < propType.length; ++index) {
              const type = propType[index];
              const typeName = isFunction(type) && type.name;
              if (typeName === "Boolean") {
                shouldCast = true;
                break;
              } else if (typeName === "String") {
                shouldCastTrue = false;
              }
            }
          } else {
            shouldCast = isFunction(propType) && propType.name === "Boolean";
          }
          prop[
            0
            /* shouldCast */
          ] = shouldCast;
          prop[
            1
            /* shouldCastTrue */
          ] = shouldCastTrue;
          if (shouldCast || hasOwn(prop, "default")) {
            needCastKeys.push(normalizedKey);
          }
        }
      }
    }
  }
  function validatePropName(key) {
    if (key[0] !== "$" && !isReservedProp(key)) {
      return true;
    }
    return false;
  }
  const queuePostRenderEffect = queueEffectWithSuspense;
  const ssrContextKey = Symbol.for("v-scx");
  const useSSRContext = () => {
    {
      const ctx = inject(ssrContextKey);
      return ctx;
    }
  };
  function watchEffect(effect2, options) {
    return doWatch(effect2, null, options);
  }
  function watch(source, cb, options) {
    return doWatch(source, cb, options);
  }
  class RenderWatcherEffect extends WatcherEffect {
    constructor(instance, source, cb, options, flush2) {
      super(source, cb, options);
      this.flush = flush2;
      const job = () => {
        if (this.dirty) {
          this.run();
        }
      };
      if (cb) {
        this.flags |= 128;
        job.flags |= 2;
      }
      if (instance) {
        job.i = instance;
      }
      this.job = job;
    }
    notify() {
      const flags = this.flags;
      if (!(flags & 256)) {
        const flush2 = this.flush;
        const job = this.job;
        if (flush2 === "post") {
          queuePostRenderEffect(job, void 0, job.i ? job.i.suspense : null);
        } else if (flush2 === "pre") {
          queueJob(job, job.i ? job.i.uid : void 0, true);
        } else {
          job();
        }
      }
    }
  }
  function doWatch(source, cb, options = EMPTY_OBJ) {
    const { immediate, deep, flush: flush2 = "pre", once } = options;
    const baseWatchOptions = extend({}, options);
    const runsImmediately = cb && immediate || !cb && flush2 !== "post";
    let ssrCleanup;
    if (isInSSRComponentSetup) {
      if (flush2 === "sync") {
        const ctx = useSSRContext();
        ssrCleanup = ctx.__watcherHandles || (ctx.__watcherHandles = []);
      } else if (!runsImmediately) {
        const watchStopHandle = () => {
        };
        watchStopHandle.stop = NOOP;
        watchStopHandle.resume = NOOP;
        watchStopHandle.pause = NOOP;
        return watchStopHandle;
      }
    }
    const instance = currentInstance;
    baseWatchOptions.call = (fn, type, args) => callWithAsyncErrorHandling(fn, instance, type, args);
    const effect2 = new RenderWatcherEffect(
      instance,
      source,
      cb,
      baseWatchOptions,
      flush2
    );
    if (cb) {
      effect2.run(true);
    } else if (flush2 === "post") {
      queuePostRenderEffect(effect2.job, void 0, instance && instance.suspense);
    } else {
      effect2.run(true);
    }
    const stop2 = effect2.stop.bind(effect2);
    stop2.pause = effect2.pause.bind(effect2);
    stop2.resume = effect2.resume.bind(effect2);
    stop2.stop = stop2;
    if (isInSSRComponentSetup) {
      if (ssrCleanup) {
        ssrCleanup.push(stop2);
      } else if (runsImmediately) {
        stop2();
      }
    }
    return stop2;
  }
  const getModelModifiers = (props, modelName, getter) => {
    return modelName === "modelValue" || modelName === "model-value" ? getter(props, "modelModifiers") : getter(props, `${modelName}Modifiers`) || getter(props, `${camelize(modelName)}Modifiers`) || getter(props, `${hyphenate(modelName)}Modifiers`);
  };
  function baseEmit(instance, props, getter, event, ...rawArgs) {
    if (instance.isUnmounted) return;
    let args = rawArgs;
    const isModelListener2 = event.startsWith("update:");
    const modifiers = isModelListener2 && getModelModifiers(props, event.slice(7), getter);
    if (modifiers) {
      if (modifiers.trim) {
        args = rawArgs.map((a) => isString(a) ? a.trim() : a);
      }
      if (modifiers.number) {
        args = rawArgs.map(looseToNumber);
      }
    }
    let handlerName;
    let handler = getter(props, handlerName = toHandlerKey(event)) || // also try camelCase event handler (#2249)
    getter(props, handlerName = toHandlerKey(camelize(event)));
    if (!handler && isModelListener2) {
      handler = getter(props, handlerName = toHandlerKey(hyphenate(event)));
    }
    if (handler) {
      callWithAsyncErrorHandling(
        handler,
        instance,
        6,
        args
      );
    }
    const onceHandler = getter(props, handlerName + `Once`);
    if (onceHandler) {
      if (!instance.emitted) {
        instance.emitted = {};
      } else if (instance.emitted[handlerName]) {
        return;
      }
      instance.emitted[handlerName] = true;
      callWithAsyncErrorHandling(
        onceHandler,
        instance,
        6,
        args
      );
    }
  }
  function isEmitListener(options, key) {
    if (!options || !isOn(key)) {
      return false;
    }
    key = key.slice(2).replace(/Once$/, "");
    return hasOwn(options, key[0].toLowerCase() + key.slice(1)) || hasOwn(options, hyphenate(key)) || hasOwn(options, key);
  }
  function queueEffectWithSuspense(fn, id, suspense) {
    if (suspense && suspense.pendingBranch) {
      if (isArray(fn)) {
        suspense.effects.push(...fn);
      } else {
        suspense.effects.push(fn);
      }
    } else {
      queuePostFlushCb(fn, id);
    }
  }
  function mergeProps(...args) {
    const ret = {};
    for (let i = 0; i < args.length; i++) {
      const toMerge = args[i];
      for (const key in toMerge) {
        if (key === "class") {
          if (ret.class !== toMerge.class) {
            ret.class = normalizeClass([ret.class, toMerge.class]);
          }
        } else if (key === "style") {
          ret.style = normalizeStyle([ret.style, toMerge.style]);
        } else if (isOn(key)) {
          const existing = ret[key];
          const incoming = toMerge[key];
          if (incoming && existing !== incoming && !(isArray(existing) && existing.includes(incoming))) {
            ret[key] = existing ? [].concat(existing, incoming) : incoming;
          }
        } else if (key !== "") {
          ret[key] = toMerge[key];
        }
      }
    }
    return ret;
  }
  let currentInstance = null;
  const getCurrentGenericInstance = () => currentInstance || currentRenderingInstance;
  const getCurrentInstance = () => currentInstance && !currentInstance.vapor ? currentInstance : currentRenderingInstance;
  let isInSSRComponentSetup = false;
  let simpleSetCurrentInstance;
  {
    const g = getGlobalThis();
    const registerGlobalSetter = (key, setter) => {
      let setters;
      if (!(setters = g[key])) setters = g[key] = [];
      setters.push(setter);
      return (v) => {
        if (setters.length > 1) setters.forEach((set) => set(v));
        else setters[0](v);
      };
    };
    simpleSetCurrentInstance = registerGlobalSetter(
      `__VUE_INSTANCE_SETTERS__`,
      (v) => currentInstance = v
    );
    registerGlobalSetter(
      `__VUE_SSR_SETTERS__`,
      (v) => isInSSRComponentSetup = v
    );
  }
  const setCurrentInstance = (instance, scope = instance !== null ? instance.scope : void 0) => {
    try {
      return [currentInstance, setCurrentScope(scope)];
    } finally {
      simpleSetCurrentInstance(instance);
    }
  };
  let uid = 0;
  function nextUid() {
    return uid++;
  }
  function expose(instance, exposed) {
    instance.exposed = exposed || {};
  }
  const computed = (getterOrOptions, debugOptions) => {
    return computed$1(getterOrOptions, debugOptions, isInSSRComponentSetup);
  };
  const version = "3.6.0-alpha.2";
  let policy = void 0;
  const tt = typeof window !== "undefined" && window.trustedTypes;
  if (tt) {
    try {
      policy = /* @__PURE__ */ tt.createPolicy("vue", {
        createHTML: (val) => val
      });
    } catch (e) {
    }
  }
  const vShowOriginalDisplay = Symbol("_vod");
  const vShowHidden = Symbol("_vsh");
  const CSS_VAR_TEXT = Symbol("");
  const displayRE = /(^|;)\s*display\s*:/;
  function patchStyle(el, prev, next) {
    const style = el.style;
    const isCssString = isString(next);
    let hasControlledDisplay = false;
    if (next && !isCssString) {
      if (prev) {
        if (!isString(prev)) {
          for (const key in prev) {
            if (next[key] == null) {
              setStyle$1(style, key, "");
            }
          }
        } else {
          for (const prevStyle of prev.split(";")) {
            const key = prevStyle.slice(0, prevStyle.indexOf(":")).trim();
            if (next[key] == null) {
              setStyle$1(style, key, "");
            }
          }
        }
      }
      for (const key in next) {
        if (key === "display") {
          hasControlledDisplay = true;
        }
        setStyle$1(style, key, next[key]);
      }
    } else {
      if (isCssString) {
        if (prev !== next) {
          const cssVarText = style[CSS_VAR_TEXT];
          if (cssVarText) {
            next += ";" + cssVarText;
          }
          style.cssText = next;
          hasControlledDisplay = displayRE.test(next);
        }
      } else if (prev) {
        el.removeAttribute("style");
      }
    }
    if (vShowOriginalDisplay in el) {
      el[vShowOriginalDisplay] = hasControlledDisplay ? style.display : "";
      if (el[vShowHidden]) {
        style.display = "none";
      }
    }
  }
  const importantRE = /\s*!important$/;
  function setStyle$1(style, name, rawVal) {
    if (isArray(rawVal)) {
      rawVal.forEach((v) => setStyle$1(style, name, v));
    } else {
      const val = rawVal == null ? "" : String(rawVal);
      if (name.startsWith("--")) {
        style.setProperty(name, val);
      } else {
        const prefixed = autoPrefix(style, name);
        if (importantRE.test(val)) {
          style.setProperty(
            hyphenate(prefixed),
            val.replace(importantRE, ""),
            "important"
          );
        } else {
          style[prefixed] = val;
        }
      }
    }
  }
  const prefixes = ["Webkit", "Moz", "ms"];
  const prefixCache = {};
  function autoPrefix(style, rawName) {
    const cached = prefixCache[rawName];
    if (cached) {
      return cached;
    }
    let name = camelize(rawName);
    if (name !== "filter" && name in style) {
      return prefixCache[rawName] = name;
    }
    name = capitalize(name);
    for (let i = 0; i < prefixes.length; i++) {
      const prefixed = prefixes[i] + name;
      if (prefixed in style) {
        return prefixCache[rawName] = prefixed;
      }
    }
    return rawName;
  }
  function shouldSetAsProp(el, key, value, isSVG) {
    if (shouldSetAsAttr(el.tagName, key)) {
      return false;
    }
    if (isNativeOn(key) && isString(value)) {
      return false;
    }
    return key in el;
  }
  const systemModifiers = ["ctrl", "shift", "alt", "meta"];
  const modifierGuards = {
    stop: (e) => e.stopPropagation(),
    prevent: (e) => e.preventDefault(),
    self: (e) => e.target !== e.currentTarget,
    ctrl: (e) => !e.ctrlKey,
    shift: (e) => !e.shiftKey,
    alt: (e) => !e.altKey,
    meta: (e) => !e.metaKey,
    left: (e) => "button" in e && e.button !== 0,
    middle: (e) => "button" in e && e.button !== 1,
    right: (e) => "button" in e && e.button !== 2,
    exact: (e, modifiers) => systemModifiers.some((m) => e[`${m}Key`] && !modifiers.includes(m))
  };
  const withModifiers = (fn, modifiers) => {
    const cache = fn._withMods || (fn._withMods = {});
    const cacheKey = modifiers.join(".");
    return cache[cacheKey] || (cache[cacheKey] = (event, ...args) => {
      for (let i = 0; i < modifiers.length; i++) {
        const guard = modifierGuards[modifiers[i]];
        if (guard && guard(event, modifiers)) return;
      }
      return fn(event, ...args);
    });
  };
  function normalizeContainer(container) {
    if (isString(container)) {
      const res = document.querySelector(container);
      return res;
    }
    return container;
  }
  // @__NO_SIDE_EFFECTS__
  function createTextNode(value = "") {
    return document.createTextNode(value);
  }
  // @__NO_SIDE_EFFECTS__
  function child(node) {
    return node.firstChild;
  }
  let insertionParent;
  let insertionAnchor;
  function setInsertionState(parent, anchor) {
    insertionParent = parent;
    insertionAnchor = anchor;
  }
  function resetInsertionState() {
    insertionParent = insertionAnchor = void 0;
  }
  class VaporFragment {
    constructor(nodes) {
      this.nodes = nodes;
    }
  }
  class DynamicFragment extends VaporFragment {
    constructor(anchorLabel) {
      super([]);
      this.anchor = /* @__PURE__ */ createTextNode();
    }
    update(render, key = render) {
      if (key === this.current) {
        return;
      }
      this.current = key;
      const prevSub = setActiveSub();
      const parent = this.anchor.parentNode;
      if (this.scope) {
        this.scope.stop();
        parent && remove(this.nodes, parent);
      }
      if (render) {
        this.scope = new EffectScope();
        this.nodes = this.scope.run(render) || [];
        if (parent) insert(this.nodes, parent, this.anchor);
      } else {
        this.scope = void 0;
        this.nodes = [];
      }
      if (this.fallback && !isValidBlock(this.nodes)) {
        parent && remove(this.nodes, parent);
        this.nodes = (this.scope || (this.scope = new EffectScope())).run(this.fallback) || [];
        parent && insert(this.nodes, parent, this.anchor);
      }
      setActiveSub(prevSub);
    }
  }
  function isValidBlock(block) {
    if (block instanceof Node) {
      return !(block instanceof Comment);
    } else if (isVaporComponent(block)) {
      return isValidBlock(block.block);
    } else if (isArray(block)) {
      return block.length > 0 && block.every(isValidBlock);
    } else {
      return isValidBlock(block.nodes);
    }
  }
  function insert(block, parent, anchor = null) {
    anchor = anchor === 0 ? parent.firstChild : anchor;
    if (block instanceof Node) {
      {
        parent.insertBefore(block, anchor);
      }
    } else if (isVaporComponent(block)) {
      if (block.isMounted) {
        insert(block.block, parent, anchor);
      } else {
        mountComponent(block, parent, anchor);
      }
    } else if (isArray(block)) {
      for (const b of block) {
        insert(b, parent, anchor);
      }
    } else {
      if (block.insert) {
        block.insert(parent, anchor);
      } else {
        insert(block.nodes, parent, anchor);
      }
      if (block.anchor) insert(block.anchor, parent, anchor);
    }
  }
  function remove(block, parent) {
    if (block instanceof Node) {
      parent && parent.removeChild(block);
    } else if (isVaporComponent(block)) {
      unmountComponent(block, parent);
    } else if (isArray(block)) {
      for (let i = 0; i < block.length; i++) {
        remove(block[i], parent);
      }
    } else {
      if (block.remove) {
        block.remove(parent);
      } else {
        remove(block.nodes, parent);
      }
      if (block.anchor) remove(block.anchor, parent);
      if (block.scope) {
        block.scope.stop();
      }
    }
  }
  class RenderEffect extends ReactiveEffect {
    constructor(render) {
      super();
      this.render = render;
      const instance = currentInstance;
      const job = () => {
        if (this.dirty) {
          this.run();
        }
      };
      this.updateJob = () => {
        instance.isUpdating = false;
        instance.u && invokeArrayFns(instance.u);
      };
      if (instance) {
        job.i = instance;
      }
      this.job = job;
      this.i = instance;
    }
    fn() {
      const instance = this.i;
      const scope = this.subs ? this.subs.sub : void 0;
      const hasUpdateHooks = instance && (instance.bu || instance.u);
      const prev = setCurrentInstance(instance, scope);
      if (hasUpdateHooks && instance.isMounted && !instance.isUpdating) {
        instance.isUpdating = true;
        instance.bu && invokeArrayFns(instance.bu);
        this.render();
        queuePostFlushCb(this.updateJob);
      } else {
        this.render();
      }
      setCurrentInstance(...prev);
    }
    notify() {
      const flags = this.flags;
      if (!(flags & 256)) {
        queueJob(this.job, this.i ? this.i.uid : void 0);
      }
    }
  }
  function renderEffect(fn, noLifecycle = false) {
    const effect = new RenderEffect(fn);
    if (noLifecycle) {
      effect.fn = fn;
    }
    effect.run();
  }
  function addEventListener(el, event, handler, options) {
    el.addEventListener(event, handler, options);
    return () => el.removeEventListener(event, handler, options);
  }
  function on(el, event, handler, options = {}) {
    addEventListener(el, event, handler, options);
    if (options.effect) {
      onEffectCleanup(() => {
        el.removeEventListener(event, handler, options);
      });
    }
  }
  const delegatedEvents = /* @__PURE__ */ Object.create(null);
  const delegateEvents = (...names) => {
    for (const name of names) {
      if (!delegatedEvents[name]) {
        delegatedEvents[name] = true;
        document.addEventListener(name, delegatedEventHandler);
      }
    }
  };
  const delegatedEventHandler = (e) => {
    let node = e.composedPath && e.composedPath()[0] || e.target;
    if (e.target !== node) {
      Object.defineProperty(e, "target", {
        configurable: true,
        value: node
      });
    }
    Object.defineProperty(e, "currentTarget", {
      configurable: true,
      get() {
        return node || document;
      }
    });
    while (node !== null) {
      const handlers = node[`$evt${e.type}`];
      if (handlers) {
        if (isArray(handlers)) {
          for (const handler of handlers) {
            if (!node.disabled) {
              handler(e);
              if (e.cancelBubble) return;
            }
          }
        } else {
          handlers(e);
          if (e.cancelBubble) return;
        }
      }
      node = node.host && node.host !== node && node.host instanceof Node ? node.host : node.parentNode;
    }
  };
  const hasFallthroughKey = (key) => currentInstance.hasFallthrough && key in currentInstance.attrs;
  function setAttr(el, key, value) {
    if (!isApplyingFallthroughProps && el.$root && hasFallthroughKey(key)) {
      return;
    }
    if (key === "true-value") {
      el._trueValue = value;
    } else if (key === "false-value") {
      el._falseValue = value;
    }
    if (value !== el[`$${key}`]) {
      el[`$${key}`] = value;
      if (value != null) {
        el.setAttribute(key, value);
      } else {
        el.removeAttribute(key);
      }
    }
  }
  function setDOMProp(el, key, value) {
    if (!isApplyingFallthroughProps && el.$root && hasFallthroughKey(key)) {
      return;
    }
    const prev = el[key];
    if (value === prev) {
      return;
    }
    let needRemove = false;
    if (value === "" || value == null) {
      const type = typeof prev;
      if (value == null && type === "string") {
        value = "";
        needRemove = true;
      } else if (type === "number") {
        value = 0;
        needRemove = true;
      }
    }
    try {
      el[key] = value;
    } catch (e) {
    }
    needRemove && el.removeAttribute(key);
  }
  function setClass(el, value) {
    if (el.$root) {
      setClassIncremental(el, value);
    } else if ((value = normalizeClass(value)) !== el.$cls) {
      el.className = el.$cls = value;
    }
  }
  function setClassIncremental(el, value) {
    const cacheKey = `$clsi${isApplyingFallthroughProps ? "$" : ""}`;
    const prev = el[cacheKey];
    if ((value = el[cacheKey] = normalizeClass(value)) !== prev) {
      const nextList = value.split(/\s+/);
      if (value) {
        el.classList.add(...nextList);
      }
      if (prev) {
        for (const cls of prev.split(/\s+/)) {
          if (!nextList.includes(cls)) el.classList.remove(cls);
        }
      }
    }
  }
  function setStyle(el, value) {
    if (el.$root) {
      setStyleIncremental(el, value);
    } else {
      const prev = el.$sty;
      value = el.$sty = normalizeStyle(value);
      patchStyle(el, prev, value);
    }
  }
  function setStyleIncremental(el, value) {
    const cacheKey = `$styi${isApplyingFallthroughProps ? "$" : ""}`;
    const prev = el[cacheKey];
    value = el[cacheKey] = isString(value) ? parseStringStyle(value) : normalizeStyle(value);
    patchStyle(el, prev, value);
    return value;
  }
  function setValue(el, value) {
    if (!isApplyingFallthroughProps && el.$root && hasFallthroughKey("value")) {
      return;
    }
    el._value = value;
    const oldValue = el.tagName === "OPTION" ? el.getAttribute("value") : el.value;
    const newValue = value == null ? "" : value;
    if (oldValue !== newValue) {
      el.value = newValue;
    }
    if (value == null) {
      el.removeAttribute("value");
    }
  }
  function setElementText(el, value) {
    if (el.$txt !== (value = toDisplayString(value))) {
      el.textContent = el.$txt = value;
    }
  }
  function setHtml(el, value) {
    value = value == null ? "" : value;
    if (el.$html !== value) {
      el.innerHTML = el.$html = value;
    }
  }
  function setDynamicProps(el, args) {
    const props = args.length > 1 ? mergeProps(...args) : args[0];
    const cacheKey = `$dprops${isApplyingFallthroughProps ? "$" : ""}`;
    const prevKeys = el[cacheKey];
    if (prevKeys) {
      for (const key of prevKeys) {
        if (!(key in props)) {
          setDynamicProp(el, key, null);
        }
      }
    }
    for (const key of el[cacheKey] = Object.keys(props)) {
      setDynamicProp(el, key, props[key]);
    }
  }
  function setDynamicProp(el, key, value) {
    if (key === "class") {
      setClass(el, value);
    } else if (key === "style") {
      setStyle(el, value);
    } else if (isOn(key)) {
      on(el, key[2].toLowerCase() + key.slice(3), value, { effect: true });
    } else if (key[0] === "." ? (key = key.slice(1), true) : key[0] === "^" ? (key = key.slice(1), false) : shouldSetAsProp(el, key, value)) {
      if (key === "innerHTML") {
        setHtml(el, value);
      } else if (key === "textContent") {
        setElementText(el, value);
      } else if (key === "value" && canSetValueDirectly(el.tagName)) {
        setValue(el, value);
      } else {
        setDOMProp(el, key, value);
      }
    } else {
      setAttr(el, key, value);
    }
    return value;
  }
  let isOptimized = false;
  function optimizePropertyLookup() {
    if (isOptimized) return;
    isOptimized = true;
    const proto = Element.prototype;
    proto.$evtclick = void 0;
    proto.$root = false;
    proto.$html = proto.$txt = proto.$cls = proto.$sty = Text.prototype.$txt = "";
  }
  const interopKey = Symbol(`interop`);
  function normalizeEmitsOptions(comp) {
    const cached = comp.__emitsOptions;
    if (cached) return cached;
    const raw = comp.emits;
    if (!raw) return null;
    let normalized;
    if (isArray(raw)) {
      normalized = {};
      for (const key of raw) normalized[key] = null;
    } else {
      normalized = raw;
    }
    return comp.__emitsOptions = normalized;
  }
  function emit(instance, event, ...rawArgs) {
    baseEmit(
      instance,
      instance.rawProps || EMPTY_OBJ,
      propGetter,
      event,
      ...rawArgs
    );
  }
  function propGetter(rawProps, key) {
    const dynamicSources = rawProps.$;
    if (dynamicSources) {
      let i = dynamicSources.length;
      while (i--) {
        const source = resolveSource(dynamicSources[i]);
        if (hasOwn(source, key))
          return dynamicSources[interopKey] ? source[key] : resolveSource(source[key]);
      }
    }
    return rawProps[key] && resolveSource(rawProps[key]);
  }
  function resolveSource(source) {
    return isFunction(source) ? source() : source;
  }
  function getPropsProxyHandlers(comp) {
    if (comp.__propsHandlers) {
      return comp.__propsHandlers;
    }
    const propsOptions = normalizePropsOptions(comp)[0];
    const emitsOptions = normalizeEmitsOptions(comp);
    const isProp = propsOptions ? (key) => isString(key) && hasOwn(propsOptions, camelize(key)) : NO;
    const isAttr = propsOptions ? (key) => key !== "$" && !isProp(key) && !isEmitListener(emitsOptions, key) : YES;
    const getProp = (instance, key) => {
      if (key === "__v_isReactive") return true;
      if (!isProp(key)) return;
      const rawProps = instance.rawProps;
      const dynamicSources = rawProps.$;
      if (dynamicSources) {
        let i = dynamicSources.length;
        let source, isDynamic, rawKey;
        while (i--) {
          source = dynamicSources[i];
          isDynamic = isFunction(source);
          source = isDynamic ? source() : source;
          for (rawKey in source) {
            if (camelize(rawKey) === key) {
              return resolvePropValue(
                propsOptions,
                key,
                isDynamic ? source[rawKey] : source[rawKey](),
                instance,
                resolveDefault
              );
            }
          }
        }
      }
      for (const rawKey in rawProps) {
        if (camelize(rawKey) === key) {
          return resolvePropValue(
            propsOptions,
            key,
            rawProps[rawKey](),
            instance,
            resolveDefault
          );
        }
      }
      return resolvePropValue(
        propsOptions,
        key,
        void 0,
        instance,
        resolveDefault,
        true
      );
    };
    const propsHandlers = propsOptions ? {
      get: (target, key) => getProp(target, key),
      has: (_, key) => isProp(key),
      ownKeys: () => Object.keys(propsOptions),
      getOwnPropertyDescriptor(target, key) {
        if (isProp(key)) {
          return {
            configurable: true,
            enumerable: true,
            get: () => getProp(target, key)
          };
        }
      }
    } : null;
    const getAttr = (target, key) => {
      if (!isProp(key) && !isEmitListener(emitsOptions, key)) {
        return getAttrFromRawProps(target, key);
      }
    };
    const hasAttr = (target, key) => {
      if (isAttr(key)) {
        return hasAttrFromRawProps(target, key);
      } else {
        return false;
      }
    };
    const attrsHandlers = {
      get: (target, key) => getAttr(target.rawProps, key),
      has: (target, key) => hasAttr(target.rawProps, key),
      ownKeys: (target) => getKeysFromRawProps(target.rawProps).filter(isAttr),
      getOwnPropertyDescriptor(target, key) {
        if (hasAttr(target.rawProps, key)) {
          return {
            configurable: true,
            enumerable: true,
            get: () => getAttr(target.rawProps, key)
          };
        }
      }
    };
    return comp.__propsHandlers = [propsHandlers, attrsHandlers];
  }
  function getAttrFromRawProps(rawProps, key) {
    if (key === "$") return;
    const merged = key === "class" || key === "style" ? [] : void 0;
    const dynamicSources = rawProps.$;
    if (dynamicSources) {
      let i = dynamicSources.length;
      let source, isDynamic;
      while (i--) {
        source = dynamicSources[i];
        isDynamic = isFunction(source);
        source = isDynamic ? source() : source;
        if (source && hasOwn(source, key)) {
          const value = isDynamic ? source[key] : source[key]();
          if (merged) {
            merged.push(value);
          } else {
            return value;
          }
        }
      }
    }
    if (hasOwn(rawProps, key)) {
      if (merged) {
        merged.push(rawProps[key]());
      } else {
        return rawProps[key]();
      }
    }
    if (merged && merged.length) {
      return merged;
    }
  }
  function hasAttrFromRawProps(rawProps, key) {
    if (key === "$") return false;
    const dynamicSources = rawProps.$;
    if (dynamicSources) {
      let i = dynamicSources.length;
      while (i--) {
        const source = resolveSource(dynamicSources[i]);
        if (source && hasOwn(source, key)) {
          return true;
        }
      }
    }
    return hasOwn(rawProps, key);
  }
  function getKeysFromRawProps(rawProps) {
    const keys = [];
    for (const key in rawProps) {
      if (key !== "$") keys.push(key);
    }
    const dynamicSources = rawProps.$;
    if (dynamicSources) {
      let i = dynamicSources.length;
      let source;
      while (i--) {
        source = resolveSource(dynamicSources[i]);
        for (const key in source) {
          keys.push(key);
        }
      }
    }
    return Array.from(new Set(keys));
  }
  function normalizePropsOptions(comp) {
    const cached = comp.__propsOptions;
    if (cached) return cached;
    const raw = comp.props;
    if (!raw) return EMPTY_ARR;
    const normalized = {};
    const needCastKeys = [];
    baseNormalizePropsOptions(raw, normalized, needCastKeys);
    return comp.__propsOptions = [normalized, needCastKeys];
  }
  function resolveDefault(factory, instance) {
    const prev = setCurrentInstance(instance);
    const res = factory.call(null, instance.props);
    setCurrentInstance(...prev);
    return res;
  }
  function hasFallthroughAttrs(comp, rawProps) {
    if (rawProps) {
      if (rawProps.$ || !comp.props) {
        return true;
      } else {
        const propsOptions = normalizePropsOptions(comp)[0];
        for (const key in rawProps) {
          if (!hasOwn(propsOptions, camelize(key))) {
            return true;
          }
        }
      }
    }
    return false;
  }
  const dynamicSlotsProxyHandlers = {
    get: getSlot,
    has: (target, key) => !!getSlot(target, key),
    getOwnPropertyDescriptor(target, key) {
      const slot = getSlot(target, key);
      if (slot) {
        return {
          configurable: true,
          enumerable: true,
          value: slot
        };
      }
    },
    ownKeys(target) {
      let keys = Object.keys(target);
      const dynamicSources = target.$;
      if (dynamicSources) {
        keys = keys.filter((k) => k !== "$");
        for (const source of dynamicSources) {
          if (isFunction(source)) {
            const slot = source();
            if (isArray(slot)) {
              for (const s of slot) keys.push(String(s.name));
            } else {
              keys.push(String(slot.name));
            }
          } else {
            keys.push(...Object.keys(source));
          }
        }
      }
      return keys;
    },
    set: NO,
    deleteProperty: NO
  };
  function getSlot(target, key) {
    if (key === "$") return;
    const dynamicSources = target.$;
    if (dynamicSources) {
      let i = dynamicSources.length;
      let source;
      while (i--) {
        source = dynamicSources[i];
        if (isFunction(source)) {
          const slot = source();
          if (slot) {
            if (isArray(slot)) {
              for (const s of slot) {
                if (String(s.name) === key) return s.fn;
              }
            } else if (String(slot.name) === key) {
              return slot.fn;
            }
          }
        } else if (hasOwn(source, key)) {
          return source[key];
        }
      }
    }
    if (hasOwn(target, key)) {
      return target[key];
    }
  }
  function createComponent(component, rawProps, rawSlots, isSingleRoot, appContext = currentInstance && currentInstance.appContext || emptyContext) {
    const _insertionParent = insertionParent;
    const _insertionAnchor = insertionAnchor;
    {
      resetInsertionState();
    }
    if (appContext.vapor && !component.__vapor) {
      const frag = appContext.vapor.vdomMount(
        component,
        rawProps,
        rawSlots
      );
      if (_insertionParent) {
        insert(frag, _insertionParent, _insertionAnchor);
      }
      return frag;
    }
    const instance = new VaporComponentInstance(
      component,
      rawProps,
      rawSlots,
      appContext
    );
    const prevInstance = setCurrentInstance(instance);
    const prevSub = setActiveSub();
    const setupFn = isFunction(component) ? component : component.setup;
    const setupResult = setupFn ? callWithErrorHandling(setupFn, instance, 0, [
      instance.props,
      instance
    ]) || EMPTY_OBJ : EMPTY_OBJ;
    {
      if (!setupFn && component.render) {
        instance.block = callWithErrorHandling(
          component.render,
          instance,
          1
        );
      } else {
        instance.block = setupResult;
      }
    }
    if (instance.hasFallthrough && component.inheritAttrs !== false && Object.keys(instance.attrs).length) {
      const el = getRootElement(instance);
      if (el) {
        renderEffect(() => {
          isApplyingFallthroughProps = true;
          setDynamicProps(el, [instance.attrs]);
          isApplyingFallthroughProps = false;
        });
      }
    }
    setActiveSub(prevSub);
    setCurrentInstance(...prevInstance);
    onScopeDispose(() => unmountComponent(instance), true);
    if (_insertionParent) {
      mountComponent(instance, _insertionParent, _insertionAnchor);
    }
    return instance;
  }
  let isApplyingFallthroughProps = false;
  const emptyContext = {
    app: null,
    config: {},
    provides: /* @__PURE__ */ Object.create(null)
  };
  class VaporComponentInstance {
    constructor(comp, rawProps, rawSlots, appContext) {
      this.vapor = true;
      this.uid = nextUid();
      this.type = comp;
      this.parent = currentInstance;
      this.root = currentInstance ? currentInstance.root : this;
      if (currentInstance) {
        this.appContext = currentInstance.appContext;
        this.provides = currentInstance.provides;
        this.ids = currentInstance.ids;
      } else {
        this.appContext = appContext || emptyContext;
        this.provides = Object.create(this.appContext.provides);
        this.ids = ["", 0, 0];
      }
      this.block = null;
      this.scope = new EffectScope(true);
      this.emit = emit.bind(null, this);
      this.expose = expose.bind(null, this);
      this.refs = EMPTY_OBJ;
      this.emitted = this.exposed = this.exposeProxy = this.propsDefaults = this.suspense = null;
      this.isMounted = this.isUnmounted = this.isUpdating = this.isDeactivated = false;
      this.rawProps = rawProps || EMPTY_OBJ;
      this.hasFallthrough = hasFallthroughAttrs(comp, rawProps);
      if (rawProps || comp.props) {
        const [propsHandlers, attrsHandlers] = getPropsProxyHandlers(comp);
        this.attrs = new Proxy(this, attrsHandlers);
        this.props = comp.props ? new Proxy(this, propsHandlers) : isFunction(comp) ? this.attrs : EMPTY_OBJ;
      } else {
        this.props = this.attrs = EMPTY_OBJ;
      }
      this.rawSlots = rawSlots || EMPTY_OBJ;
      this.slots = rawSlots ? rawSlots.$ ? new Proxy(rawSlots, dynamicSlotsProxyHandlers) : rawSlots : EMPTY_OBJ;
    }
    /**
     * Expose `getKeysFromRawProps` on the instance so it can be used in code
     * paths where it's needed, e.g. `useModel`
     */
    rawKeys() {
      return getKeysFromRawProps(this.rawProps);
    }
  }
  function isVaporComponent(value) {
    return value instanceof VaporComponentInstance;
  }
  function mountComponent(instance, parent, anchor) {
    if (instance.bm) invokeArrayFns(instance.bm);
    insert(instance.block, parent, anchor);
    if (instance.m) queuePostFlushCb(() => invokeArrayFns(instance.m));
    instance.isMounted = true;
  }
  function unmountComponent(instance, parentNode) {
    if (instance.isMounted && !instance.isUnmounted) {
      if (instance.bum) {
        invokeArrayFns(instance.bum);
      }
      instance.scope.stop();
      if (instance.um) {
        queuePostFlushCb(() => invokeArrayFns(instance.um));
      }
      instance.isUnmounted = true;
    }
    if (parentNode) {
      remove(instance.block, parentNode);
    }
  }
  function getExposed(instance) {
    if (instance.exposed) {
      return instance.exposeProxy || (instance.exposeProxy = new Proxy(markRaw(instance.exposed), {
        get: (target, key) => unref(target[key])
      }));
    }
  }
  function getRootElement({
    block
  }) {
    if (block instanceof Element) {
      return block;
    }
    if (block instanceof DynamicFragment) {
      const { nodes } = block;
      if (nodes instanceof Element && nodes.$root) {
        return nodes;
      }
    }
  }
  let _createApp;
  const mountApp = (app, container) => {
    optimizePropertyLookup();
    if (container.nodeType === 1) {
      container.textContent = "";
    }
    const instance = createComponent(
      app._component,
      app._props,
      null,
      false,
      app._context
    );
    mountComponent(instance, container);
    flushOnAppMount();
    return instance;
  };
  const unmountApp = (app) => {
    unmountComponent(app._instance, app._container);
  };
  function prepareApp() {
    const target = getGlobalThis();
    target.__VUE__ = true;
  }
  function postPrepareApp(app) {
    app.vapor = true;
    const mount2 = app.mount;
    app.mount = (container, ...args) => {
      container = normalizeContainer(container);
      return mount2(container, ...args);
    };
  }
  const createVaporApp = (comp, props) => {
    prepareApp();
    if (!_createApp) _createApp = createAppAPI(mountApp, unmountApp, getExposed);
    const app = _createApp(comp, props);
    postPrepareApp(app);
    return app;
  };
  // @__NO_SIDE_EFFECTS__
  function defineVaporComponent(comp, extraOptions) {
    if (isFunction(comp)) {
      return /* @__PURE__ */ (() => extend({ name: comp.name }, extraOptions, {
        setup: comp,
        __vapor: true
      }))();
    }
    comp.__vapor = true;
    return comp;
  }
  let t;
  // @__NO_SIDE_EFFECTS__
  function template(html, root) {
    let node;
    return () => {
      if (html[0] !== "<") {
        return /* @__PURE__ */ createTextNode(html);
      }
      if (!node) {
        t = t || document.createElement("template");
        t.innerHTML = html;
        node = /* @__PURE__ */ child(t.content);
      }
      const ret = node.cloneNode(true);
      if (root) ret.$root = true;
      return ret;
    };
  }
  function createIf(condition, b1, b2, once) {
    const _insertionParent = insertionParent;
    const _insertionAnchor = insertionAnchor;
    {
      resetInsertionState();
    }
    let frag;
    {
      frag = new DynamicFragment();
      renderEffect(() => frag.update(condition() ? b1 : b2));
    }
    if (_insertionParent) {
      insert(frag, _insertionParent, _insertionAnchor);
    }
    return frag;
  }
  function applyVShow(target, source) {
    if (isVaporComponent(target)) {
      return applyVShow(target.block, source);
    }
    if (isArray(target) && target.length === 1) {
      return applyVShow(target[0], source);
    }
    if (target instanceof DynamicFragment) {
      const update = target.update;
      target.update = (render, key) => {
        update.call(target, render, key);
        setDisplay(target, source());
      };
    }
    renderEffect(() => setDisplay(target, source()));
  }
  function setDisplay(target, value) {
    if (isVaporComponent(target)) {
      return setDisplay(target, value);
    }
    if (isArray(target) && target.length === 1) {
      return setDisplay(target[0], value);
    }
    if (target instanceof DynamicFragment) {
      return setDisplay(target.nodes, value);
    }
    if (target instanceof Element) {
      const el = target;
      if (!(vShowOriginalDisplay in el)) {
        el[vShowOriginalDisplay] = el.style.display === "none" ? "" : el.style.display;
      }
      el.style.display = value ? el[vShowOriginalDisplay] : "none";
      el[vShowHidden] = !value;
    }
  }
  function tryOnScopeDispose(fn) {
    if (getCurrentScope()) {
      onScopeDispose(fn);
      return true;
    }
    return false;
  }
  const localProvidedStateMap = /* @__PURE__ */ new WeakMap();
  const injectLocal = (...args) => {
    var _a;
    const key = args[0];
    const instance = (_a = getCurrentInstance()) == null ? void 0 : _a.proxy;
    if (instance == null && !hasInjectionContext())
      throw new Error("injectLocal must be called in setup");
    if (instance && localProvidedStateMap.has(instance) && key in localProvidedStateMap.get(instance))
      return localProvidedStateMap.get(instance)[key];
    return inject(...args);
  };
  const isClient = typeof window !== "undefined" && typeof document !== "undefined";
  typeof WorkerGlobalScope !== "undefined" && globalThis instanceof WorkerGlobalScope;
  const notNullish = (val) => val != null;
  const toString = Object.prototype.toString;
  const isObject = (val) => toString.call(val) === "[object Object]";
  function pxValue(px) {
    return px.endsWith("rem") ? Number.parseFloat(px) * 16 : Number.parseFloat(px);
  }
  function toArray(value) {
    return Array.isArray(value) ? value : [value];
  }
  function getLifeCycleTarget(target) {
    return getCurrentInstance();
  }
  function tryOnMounted(fn, sync = true, target) {
    const instance = getLifeCycleTarget();
    if (instance)
      onMounted(fn, target);
    else if (sync)
      fn();
    else
      nextTick(fn);
  }
  function watchImmediate(source, cb, options) {
    return watch(
      source,
      cb,
      {
        ...options,
        immediate: true
      }
    );
  }
  const defaultWindow = isClient ? window : void 0;
  function unrefElement(elRef) {
    var _a;
    const plain = toValue(elRef);
    return (_a = plain == null ? void 0 : plain.$el) != null ? _a : plain;
  }
  function useEventListener(...args) {
    const cleanups = [];
    const cleanup2 = () => {
      cleanups.forEach((fn) => fn());
      cleanups.length = 0;
    };
    const register = (el, event, listener, options) => {
      el.addEventListener(event, listener, options);
      return () => el.removeEventListener(event, listener, options);
    };
    const firstParamTargets = computed(() => {
      const test = toArray(toValue(args[0])).filter((e) => e != null);
      return test.every((e) => typeof e !== "string") ? test : void 0;
    });
    const stopWatch = watchImmediate(
      () => {
        var _a, _b;
        return [
          (_b = (_a = firstParamTargets.value) == null ? void 0 : _a.map((e) => unrefElement(e))) != null ? _b : [defaultWindow].filter((e) => e != null),
          toArray(toValue(firstParamTargets.value ? args[1] : args[0])),
          toArray(unref(firstParamTargets.value ? args[2] : args[1])),
          // @ts-expect-error - TypeScript gets the correct types, but somehow still complains
          toValue(firstParamTargets.value ? args[3] : args[2])
        ];
      },
      ([raw_targets, raw_events, raw_listeners, raw_options]) => {
        cleanup2();
        if (!(raw_targets == null ? void 0 : raw_targets.length) || !(raw_events == null ? void 0 : raw_events.length) || !(raw_listeners == null ? void 0 : raw_listeners.length))
          return;
        const optionsClone = isObject(raw_options) ? { ...raw_options } : raw_options;
        cleanups.push(
          ...raw_targets.flatMap(
            (el) => raw_events.flatMap(
              (event) => raw_listeners.map((listener) => register(el, event, listener, optionsClone))
            )
          )
        );
      },
      { flush: "post" }
    );
    const stop = () => {
      stopWatch();
      cleanup2();
    };
    tryOnScopeDispose(cleanup2);
    return stop;
  }
  function useMounted() {
    const isMounted = shallowRef(false);
    const instance = getCurrentInstance();
    if (instance) {
      onMounted(() => {
        isMounted.value = true;
      }, instance);
    }
    return isMounted;
  }
  function useSupported(callback) {
    const isMounted = useMounted();
    return computed(() => {
      isMounted.value;
      return Boolean(callback());
    });
  }
  function useMutationObserver(target, callback, options = {}) {
    const { window: window2 = defaultWindow, ...mutationOptions } = options;
    let observer;
    const isSupported = useSupported(() => window2 && "MutationObserver" in window2);
    const cleanup2 = () => {
      if (observer) {
        observer.disconnect();
        observer = void 0;
      }
    };
    const targets = computed(() => {
      const value = toValue(target);
      const items = toArray(value).map(unrefElement).filter(notNullish);
      return new Set(items);
    });
    const stopWatch = watch(
      () => targets.value,
      (targets2) => {
        cleanup2();
        if (isSupported.value && targets2.size) {
          observer = new MutationObserver(callback);
          targets2.forEach((el) => observer.observe(el, mutationOptions));
        }
      },
      { immediate: true, flush: "post" }
    );
    const takeRecords = () => {
      return observer == null ? void 0 : observer.takeRecords();
    };
    const stop = () => {
      stopWatch();
      cleanup2();
    };
    tryOnScopeDispose(stop);
    return {
      isSupported,
      stop,
      takeRecords
    };
  }
  const ssrWidthSymbol = Symbol("vueuse-ssr-width");
  function useSSRWidth() {
    const ssrWidth = hasInjectionContext() ? injectLocal(ssrWidthSymbol, null) : null;
    return typeof ssrWidth === "number" ? ssrWidth : void 0;
  }
  function useMediaQuery(query, options = {}) {
    const { window: window2 = defaultWindow, ssrWidth = useSSRWidth() } = options;
    const isSupported = useSupported(() => window2 && "matchMedia" in window2 && typeof window2.matchMedia === "function");
    const ssrSupport = shallowRef(typeof ssrWidth === "number");
    const mediaQuery = shallowRef();
    const matches = shallowRef(false);
    const handler = (event) => {
      matches.value = event.matches;
    };
    watchEffect(() => {
      if (ssrSupport.value) {
        ssrSupport.value = !isSupported.value;
        const queryStrings = toValue(query).split(",");
        matches.value = queryStrings.some((queryString) => {
          const not = queryString.includes("not all");
          const minWidth = queryString.match(/\(\s*min-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/);
          const maxWidth = queryString.match(/\(\s*max-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/);
          let res = Boolean(minWidth || maxWidth);
          if (minWidth && res) {
            res = ssrWidth >= pxValue(minWidth[1]);
          }
          if (maxWidth && res) {
            res = ssrWidth <= pxValue(maxWidth[1]);
          }
          return not ? !res : res;
        });
        return;
      }
      if (!isSupported.value)
        return;
      mediaQuery.value = window2.matchMedia(toValue(query));
      matches.value = mediaQuery.value.matches;
    });
    useEventListener(mediaQuery, "change", handler, { passive: true });
    return computed(() => matches.value);
  }
  function useResizeObserver(target, callback, options = {}) {
    const { window: window2 = defaultWindow, ...observerOptions } = options;
    let observer;
    const isSupported = useSupported(() => window2 && "ResizeObserver" in window2);
    const cleanup2 = () => {
      if (observer) {
        observer.disconnect();
        observer = void 0;
      }
    };
    const targets = computed(() => {
      const _targets = toValue(target);
      return Array.isArray(_targets) ? _targets.map((el) => unrefElement(el)) : [unrefElement(_targets)];
    });
    const stopWatch = watch(
      targets,
      (els) => {
        cleanup2();
        if (isSupported.value && window2) {
          observer = new ResizeObserver(callback);
          for (const _el of els) {
            if (_el)
              observer.observe(_el, observerOptions);
          }
        }
      },
      { immediate: true, flush: "post" }
    );
    const stop = () => {
      cleanup2();
      stopWatch();
    };
    tryOnScopeDispose(stop);
    return {
      isSupported,
      stop
    };
  }
  function useElementBounding(target, options = {}) {
    const {
      reset = true,
      windowResize = true,
      windowScroll = true,
      immediate = true,
      updateTiming = "sync"
    } = options;
    const height = shallowRef(0);
    const bottom = shallowRef(0);
    const left = shallowRef(0);
    const right = shallowRef(0);
    const top = shallowRef(0);
    const width = shallowRef(0);
    const x = shallowRef(0);
    const y = shallowRef(0);
    function recalculate() {
      const el = unrefElement(target);
      if (!el) {
        if (reset) {
          height.value = 0;
          bottom.value = 0;
          left.value = 0;
          right.value = 0;
          top.value = 0;
          width.value = 0;
          x.value = 0;
          y.value = 0;
        }
        return;
      }
      const rect = el.getBoundingClientRect();
      height.value = rect.height;
      bottom.value = rect.bottom;
      left.value = rect.left;
      right.value = rect.right;
      top.value = rect.top;
      width.value = rect.width;
      x.value = rect.x;
      y.value = rect.y;
    }
    function update() {
      if (updateTiming === "sync")
        recalculate();
      else if (updateTiming === "next-frame")
        requestAnimationFrame(() => recalculate());
    }
    useResizeObserver(target, update);
    watch(() => unrefElement(target), (ele) => !ele && update());
    useMutationObserver(target, update, {
      attributeFilter: ["style", "class"]
    });
    if (windowScroll)
      useEventListener("scroll", update, { capture: true, passive: true });
    if (windowResize)
      useEventListener("resize", update, { passive: true });
    tryOnMounted(() => {
      if (immediate)
        update();
    });
    return {
      height,
      bottom,
      left,
      right,
      top,
      width,
      x,
      y,
      update
    };
  }
  function useWindowSize(options = {}) {
    const {
      window: window2 = defaultWindow,
      initialWidth = Number.POSITIVE_INFINITY,
      initialHeight = Number.POSITIVE_INFINITY,
      listenOrientation = true,
      includeScrollbar = true,
      type = "inner"
    } = options;
    const width = shallowRef(initialWidth);
    const height = shallowRef(initialHeight);
    const update = () => {
      if (window2) {
        if (type === "outer") {
          width.value = window2.outerWidth;
          height.value = window2.outerHeight;
        } else if (type === "visual" && window2.visualViewport) {
          const { width: visualViewportWidth, height: visualViewportHeight, scale } = window2.visualViewport;
          width.value = Math.round(visualViewportWidth * scale);
          height.value = Math.round(visualViewportHeight * scale);
        } else if (includeScrollbar) {
          width.value = window2.innerWidth;
          height.value = window2.innerHeight;
        } else {
          width.value = window2.document.documentElement.clientWidth;
          height.value = window2.document.documentElement.clientHeight;
        }
      }
    };
    update();
    tryOnMounted(update);
    const listenerOptions = { passive: true };
    useEventListener("resize", update, listenerOptions);
    if (window2 && type === "visual" && window2.visualViewport) {
      useEventListener(window2.visualViewport, "resize", update, listenerOptions);
    }
    if (listenOrientation) {
      const matches = useMediaQuery("(orientation: portrait)");
      watch(matches, () => update());
    }
    return { width, height };
  }
  const t0 = /* @__PURE__ */ template('<div data-v-963bff90 class="x-track"><div data-v-963bff90></div></div>');
  const t1 = /* @__PURE__ */ template('<div data-v-963bff90 class="BodyScrollbar"><div data-v-963bff90 class="y-track"><div data-v-963bff90></div></div></div>', true);
  delegateEvents("click", "pointerdown");
  const errorDistance = 2;
  const _sfc_main = /* @__PURE__ */ defineVaporComponent({
    __name: "App",
    setup(__props) {
      const x = shallowRef(0);
      const y = shallowRef(0);
      const updateX = (v) => {
        window.scroll({ left: v });
      };
      const updateY = (v) => {
        window.scroll({ top: v });
      };
      useEventListener("scroll", () => {
        x.value = window.scrollX;
        y.value = window.scrollY;
      });
      const style = document.createElement("style");
      style.dataset.source = "pref-scrollbar";
      style.textContent = `html::-webkit-scrollbar{display:none !important;}`;
      onMounted(() => {
        document.head.appendChild(style);
      });
      onUnmounted(() => {
        document.head.removeChild(style);
      });
      const { height: winH, width: winW } = useWindowSize();
      const body = useElementBounding(document.body);
      const yShow = computed(() => body.height.value > winH.value + errorDistance);
      const yHeight = computed(() => {
        const clientHeight = body.height.value;
        const bodyHeight = clientHeight;
        return winH.value / bodyHeight * winH.value;
      });
      const translateY = computed(() => {
        const clientHeight = body.height.value;
        const height = yHeight.value;
        return y.value / (clientHeight - winH.value) * (winH.value - height);
      });
      const yStyle = computed(() => {
        if (!yShow.value) return {};
        return {
          transform: `translateY(${translateY.value}px)`,
          height: `${yHeight.value}px`
        };
      });
      const clickBoxY = async (e) => {
        const deltaY = yHeight.value * 0.9 * (e.clientY < yHeight.value + translateY.value ? -1 : 1);
        const clientHeight = body.height.value;
        const bodyHeight = clientHeight;
        const height = winH.value / bodyHeight * winH.value;
        updateY(
          y.value + deltaY / (winH.value - height) * (clientHeight - winH.value)
        );
      };
      const yDragging = shallowRef(false);
      let lastYEvent = void 0;
      const pointerdownY = (e) => {
        lastYEvent = e;
        yDragging.value = true;
      };
      useEventListener("pointermove", (e) => {
        if (!lastYEvent) return;
        const deltaY = e.clientY - lastYEvent.clientY;
        lastYEvent = e;
        const clientHeight = body.height.value;
        const bodyHeight = clientHeight;
        const height = winH.value / bodyHeight * winH.value;
        updateY(
          y.value + deltaY / (winH.value - height) * (clientHeight - winH.value)
        );
      });
      useEventListener("pointerup", () => {
        lastYEvent = void 0;
        yDragging.value = false;
      });
      const xShow = computed(() => body.width.value > winW.value + errorDistance);
      const xWidth = computed(() => {
        const clientWidth = body.width.value;
        const bodyWidth = clientWidth;
        return winW.value / bodyWidth * winW.value;
      });
      const translateX = computed(() => {
        const clientWidth = body.width.value;
        const width = xWidth.value;
        return x.value / (clientWidth - winW.value) * (winW.value - width);
      });
      const xStyle = computed(() => {
        if (!xShow.value) return {};
        return {
          transform: `translateX(${translateX.value}px)`,
          width: `${xWidth.value}px`
        };
      });
      const clickBoxX = (e) => {
        const deltaX = xWidth.value * 0.9 * (e.clientX < xWidth.value + translateX.value ? -1 : 1);
        const clientWidth = body.width.value;
        const bodyWidth = clientWidth;
        const width = winW.value / bodyWidth * winW.value;
        const newX = x.value + deltaX / (winW.value - width) * (clientWidth - winW.value);
        updateX(newX);
      };
      const xDragging = shallowRef(false);
      let lastXEvent = void 0;
      const pointerdownX = (e) => {
        lastXEvent = e;
        xDragging.value = true;
      };
      useEventListener("pointermove", (e) => {
        if (!lastXEvent) return;
        const deltaX = e.clientX - lastXEvent.clientX;
        lastXEvent = e;
        const clientWidth = body.width.value;
        const bodyWidth = clientWidth;
        const width = winW.value / bodyWidth * winW.value;
        const newX = x.value + deltaX / (winW.value - width) * (clientWidth - winW.value);
        updateX(newX);
      });
      useEventListener("pointerup", () => {
        lastXEvent = void 0;
        xDragging.value = false;
      });
      useEventListener("selectstart", (e) => {
        if (lastXEvent || lastYEvent) {
          e.preventDefault();
        }
      });
      const n6 = t1();
      const n1 = /* @__PURE__ */ child(n6);
      const n0 = /* @__PURE__ */ child(n1);
      setInsertionState(n6);
      createIf(() => xShow.value, () => {
        const n5 = t0();
        const n4 = /* @__PURE__ */ child(n5);
        n4.$evtclick = withModifiers(() => {
        }, ["stop"]);
        n5.$evtpointerdown = pointerdownX;
        n5.$evtclick = clickBoxX;
        renderEffect(() => {
          setClass(n4, ["slider", {
            dragging: xDragging.value
          }]);
          setStyle(n4, xStyle.value);
        });
        return n5;
      });
      n0.$evtclick = withModifiers(() => {
      }, ["stop"]);
      applyVShow(n1, () => yShow.value);
      n1.$evtpointerdown = pointerdownY;
      n1.$evtclick = clickBoxY;
      renderEffect(() => {
        setClass(n0, ["slider", {
          dragging: yDragging.value
        }]);
        setStyle(n0, yStyle.value);
      });
      return n6;
    }
  });
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-963bff90"]]);
  const useCheckedMenu = ({
    checkedTag = "✅ ",
    checkedName = "",
    uncheckedTag = "❎ ",
    uncheckedName = void 0,
    initValue = false
  }) => {
    let checked = initValue;
    const trueName = checkedTag + checkedName;
    const falseName = uncheckedTag + (uncheckedName ?? checkedName);
    const currentName = () => checked ? trueName : falseName;
    const register = () => {
      _GM_registerMenuCommand(currentName(), () => {
        onChange(!checked);
      });
    };
    const unregister = () => {
      _GM_unregisterMenuCommand(currentName());
    };
    let onChange = (checked2) => {
      controller.checked = checked2;
    };
    const controller = {
      get checked() {
        return checked;
      },
      set checked(newValue) {
        if (newValue == checked) return;
        unregister();
        checked = newValue;
        register();
      },
      get onChange() {
        return onChange;
      },
      set onChange(newFn) {
        onChange = newFn;
      }
    };
    register();
    return controller;
  };
  const [mount, unmount] = /* @__PURE__ */ (() => {
    let app;
    let div;
    return [
      // mount
      async () => {
        div = document.createElement("div");
        app = createVaporApp(App);
        app.mount(div);
        while (!document.body) {
          await new Promise((r) => setTimeout(r));
        }
        document.body.append(div);
      },
      // unmount
      () => {
        if (app) {
          app.unmount();
          app = void 0;
        }
        if (div) {
          div.parentElement?.removeChild(div);
          div = void 0;
        }
      }
    ];
  })();
  const storeKey = `k:` + location.origin;
  const menu = useCheckedMenu({
    checkedName: `滚动条优化`,
    initValue: _GM_getValue(storeKey, true)
  });
  if (menu.checked) {
    mount();
  }
  menu.onChange = (checked) => {
    menu.checked = checked;
    _GM_setValue(storeKey, checked);
    if (checked) {
      mount();
    } else {
      unmount();
    }
  };

})();