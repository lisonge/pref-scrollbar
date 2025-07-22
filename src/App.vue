<script setup lang="ts">
import { useEventListener, useWindowSize, useElementSize } from '@vueuse/core';
import { computed, onMounted, onUnmounted, shallowRef } from 'vue';
import type { CSSProperties } from 'vue';

const x = shallowRef(0);
const y = shallowRef(0);
const updateX = (v: number) => {
  window.scroll({ left: v });
};
const updateY = (v: number) => {
  window.scroll({ top: v });
};
useEventListener('scroll', () => {
  x.value = window.scrollX;
  y.value = window.scrollY;
});

const style = document.createElement('style');
style.dataset.source = 'pref-scrollbar';
style.textContent = `html::-webkit-scrollbar{display:none !important;}`;
onMounted(() => {
  document.head.appendChild(style);
});
onUnmounted(() => {
  document.head.removeChild(style);
});
const { height: winH, width: winW } = useWindowSize();
const body = useElementSize(document.body);

// see https://github.com/user-attachments/assets/89796d25-b360-4486-9cf7-79a5e598022c
const errorDistance = 2;

const yShow = computed(() => body.height.value > winH.value + errorDistance);
const yHeight = computed(() => {
  const clientHeight = body.height.value;
  const bodyHeight = clientHeight;
  return (winH.value / bodyHeight) * winH.value;
});
const translateY = computed(() => {
  const clientHeight = body.height.value;
  const height = yHeight.value;
  return (y.value / (clientHeight - winH.value)) * (winH.value - height);
});
const yStyle = computed<CSSProperties>(() => {
  if (!yShow.value) return {};
  return {
    transform: `translateY(${translateY.value}px)`,
    height: `${yHeight.value}px`,
  };
});
const clickY = async (e: MouseEvent) => {
  const deltaY =
    yHeight.value *
    0.9 *
    (e.clientY < yHeight.value + translateY.value ? -1 : 1);
  const clientHeight = body.height.value;
  const bodyHeight = clientHeight;
  const height = (winH.value / bodyHeight) * winH.value;
  updateY(
    y.value + (deltaY / (winH.value - height)) * (clientHeight - winH.value)
  );
};
const yDragging = shallowRef(false);
let lastYEvent: MouseEvent | undefined = undefined;
const pointerdownY = (e: MouseEvent) => {
  lastYEvent = e;
  yDragging.value = true;
};
useEventListener('pointermove', (e) => {
  if (!lastYEvent) return;
  const deltaY = e.clientY - lastYEvent.clientY;
  lastYEvent = e;
  const clientHeight = body.height.value;
  const bodyHeight = clientHeight;
  const height = (winH.value / bodyHeight) * winH.value;
  updateY(
    y.value + (deltaY / (winH.value - height)) * (clientHeight - winH.value)
  );
});
useEventListener('pointerup', () => {
  lastYEvent = undefined;
  yDragging.value = false;
});

const xShow = computed(() => body.width.value > winW.value + errorDistance);
const xWidth = computed(() => {
  const clientWidth = body.width.value;
  const bodyWidth = clientWidth;
  return (winW.value / bodyWidth) * winW.value;
});
const translateX = computed(() => {
  const clientWidth = body.width.value;
  const width = xWidth.value;
  return (x.value / (clientWidth - winW.value)) * (winW.value - width);
});
const xStyle = computed<CSSProperties>(() => {
  if (!xShow.value) return {};
  return {
    transform: `translateX(${translateX.value}px)`,
    width: `${xWidth.value}px`,
  };
});

const clickX = (e: MouseEvent) => {
  const deltaX =
    xWidth.value * 0.9 * (e.clientX < xWidth.value + translateX.value ? -1 : 1);
  const clientWidth = body.width.value;
  const bodyWidth = clientWidth;
  const width = (winW.value / bodyWidth) * winW.value;
  const newX =
    x.value + (deltaX / (winW.value - width)) * (clientWidth - winW.value);
  updateX(newX);
};
const xDragging = shallowRef(false);
let lastXEvent: MouseEvent | undefined = undefined;
const pointerdownX = (e: MouseEvent) => {
  lastXEvent = e;
  xDragging.value = true;
};
useEventListener('pointermove', (e) => {
  if (!lastXEvent) return;
  const deltaX = e.clientX - lastXEvent.clientX;
  lastXEvent = e;
  const clientWidth = body.width.value;
  const bodyWidth = clientWidth;
  const width = (winW.value / bodyWidth) * winW.value;
  const newX =
    x.value + (deltaX / (winW.value - width)) * (clientWidth - winW.value);
  updateX(newX);
});
useEventListener('pointerup', () => {
  lastXEvent = undefined;
  xDragging.value = false;
});

useEventListener('selectstart', (e) => {
  if (lastXEvent || lastYEvent) {
    e.preventDefault();
  }
});
</script>
<template>
  <div
    class="y-track"
    v-show="yShow"
    @pointerdown="pointerdownY"
    @click="clickY"
  >
    <div
      class="slider"
      @click.stop
      :style="yStyle"
      :class="{
        dragging: yDragging,
      }"
    ></div>
  </div>
  <div v-if="xShow" class="x-track" @pointerdown="pointerdownX" @click="clickX">
    <div
      class="slider"
      @click.stop
      :style="xStyle"
      :class="{
        dragging: xDragging,
      }"
    ></div>
  </div>
</template>
<style scoped>
.y-track {
  position: fixed;
  z-index: 1000;
  right: 2px;
  top: 0;
  bottom: 0;
  width: 8px;
}
.x-track {
  position: fixed;
  z-index: 1000;
  left: 0;
  right: 0;
  bottom: 2px;
  height: 8px;
}
.slider {
  height: 100%;
  background: #8b8b8b;
  transition: opacity 200ms;
  border-radius: 4px;
}
.slider:not(.dragging) {
  opacity: 0.5;
}
.slider:hover {
  opacity: 0.75;
}
.slider.dragging {
  opacity: 0.75;
}
</style>
