import { GM_getValue, GM_setValue } from '$';
import { createApp } from 'vue';
import App from './App.vue';
import { useCheckedMenu } from './utils';

const [mount, unmount] = (() => {
  let app: ReturnType<typeof createApp> | undefined;
  let div: HTMLElement | undefined;
  return [
    // mount
    async () => {
      div = document.createElement('div');
      div.classList.add('pref-scrollbar-container');
      while (!document.body) {
        await new Promise((r) => setTimeout(r));
      }
      document.body.append(div);
      app = createApp(App);
      app.mount(div);
    },
    // unmount
    () => {
      if (app) {
        app.unmount();
        app = undefined;
      }
      if (div) {
        div.remove();
        div = undefined;
      }
    },
  ];
})();

const storeKey = `k:` + location.origin;
const menu = useCheckedMenu({
  checkedName: `滚动条优化`,
  initValue: GM_getValue(storeKey, true),
});
if (menu.checked) {
  mount();
}
menu.onChange = (checked) => {
  menu.checked = checked;
  GM_setValue(storeKey, checked);
  if (checked) {
    mount();
  } else {
    unmount();
  }
};
