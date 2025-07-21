import { GM_getValue, GM_setValue } from '$';
import { createVaporApp } from 'vue';
import App from './App.vue';
import { useCheckedMenu } from './utils';

const [mount, unmount] = (() => {
  let app: ReturnType<typeof createVaporApp> | undefined;
  let div: HTMLDivElement | undefined;
  return [
    // mount
    async () => {
      div = document.createElement('div');
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
        app = undefined;
      }
      if (div) {
        div.parentElement?.removeChild(div);
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
