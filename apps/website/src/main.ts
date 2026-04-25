import "./style.css";
import { createDomograph } from "domograph";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<div class="max-w-3xl mx-auto px-6 min-h-screen flex flex-col">

  <header class="text-center pt-22 pb-14 border-b border-zinc-200 dark:border-zinc-800">
    <span class="inline-block font-mono text-xs uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-brand-soft border border-brand-edge text-brand mb-6">
      @domograph
    </span>
    <h1 class="text-5xl md:text-6xl font-semibold tracking-tight m-0 mb-4 bg-gradient-to-br from-zinc-900 to-brand bg-clip-text text-transparent dark:from-zinc-50">
      Domograph
    </h1>
    <p class="text-lg md:text-xl max-w-xl mx-auto text-zinc-500 dark:text-zinc-400">
      A live debug overlay charting DOM-node count over time — framework-free.
    </p>
    <div class="mt-8 flex gap-3 justify-center flex-wrap">
      <a href="#demo" class="inline-flex items-center px-4.5 py-2.5 rounded-lg text-sm font-medium border border-brand-edge text-brand bg-brand-soft hover:shadow-md transition">
        Try the demo
      </a>
      <a href="https://github.com/thyngster/domograph" target="_blank" rel="noreferrer" class="inline-flex items-center px-4.5 py-2.5 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 hover:shadow-md transition">
        GitHub
      </a>
    </div>
  </header>

  <section id="demo" class="py-14 border-b border-zinc-200 dark:border-zinc-800">
    <h2 class="text-2xl md:text-3xl font-semibold tracking-tight mb-3">Live demo</h2>
    <p class="text-zinc-600 dark:text-zinc-400 mb-6 max-w-xl">
      Spawn or clear DOM and watch the floating overlay in the bottom-right react.
      Each dot is a single empty <code class="font-mono text-sm px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">&lt;div&gt;</code>,
      so the count moves one-for-one.
    </p>
    <div class="flex gap-2 flex-wrap mb-4">
      <button id="dg-add-100" type="button" class="px-3.5 py-2 text-sm font-medium rounded-md border border-brand-edge text-brand bg-brand-soft hover:shadow-md transition cursor-pointer">
        +100 nodes
      </button>
      <button id="dg-add-1000" type="button" class="px-3.5 py-2 text-sm font-medium rounded-md border border-brand-edge text-brand bg-brand-soft hover:shadow-md transition cursor-pointer">
        +1,000 nodes
      </button>
      <button id="dg-clear" type="button" class="px-3.5 py-2 text-sm font-medium rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 hover:shadow-md transition cursor-pointer">
        Clear
      </button>
    </div>
    <div id="dg-sandbox" aria-label="Spawned DOM" class="flex flex-wrap gap-[3px] content-start p-3 h-[220px] overflow-auto border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900"></div>
  </section>

  <section class="py-14 border-b border-zinc-200 dark:border-zinc-800">
    <h2 class="text-2xl md:text-3xl font-semibold tracking-tight mb-3">Install</h2>
    <pre class="font-mono text-sm leading-relaxed p-4 m-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-x-auto text-zinc-900 dark:text-zinc-100"><code># Core (framework-free)
bun add domograph

# Vue 3 plugin (peer-depends on vue)
bun add @domograph/vue</code></pre>
  </section>

  <section class="py-14 border-b border-zinc-200 dark:border-zinc-800">
    <h2 class="text-2xl md:text-3xl font-semibold tracking-tight mb-3">Quick start</h2>

    <h3 class="text-xs uppercase tracking-[0.14em] font-semibold text-zinc-500 dark:text-zinc-400 mt-6 mb-2">Vanilla</h3>
    <pre class="font-mono text-sm leading-relaxed p-4 m-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-x-auto text-zinc-900 dark:text-zinc-100"><code>import { createDomograph } from 'domograph';

createDomograph().show();</code></pre>

    <h3 class="text-xs uppercase tracking-[0.14em] font-semibold text-zinc-500 dark:text-zinc-400 mt-6 mb-2">Vue 3</h3>
    <pre class="font-mono text-sm leading-relaxed p-4 m-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-x-auto text-zinc-900 dark:text-zinc-100"><code>import { createApp } from 'vue';
import DomographPlugin from '@domograph/vue';
import App from './App.vue';

createApp(App)
  .use(DomographPlugin)  // auto-shows in dev
  .mount('#app');</code></pre>
  </section>

  <footer class="mt-auto py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
    MIT · built by
    <a href="https://analytics-debugger.com" target="_blank" rel="noreferrer" class="text-brand hover:underline">
      analytics-debugger.com
    </a>
  </footer>

</div>
`;

createDomograph().show();

const sandbox = document.querySelector<HTMLDivElement>("#dg-sandbox")!;
function spawn(n: number) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const dot = document.createElement("div");
    dot.className = "w-1.5 h-1.5 rounded-full bg-brand opacity-85 flex-none";
    frag.appendChild(dot);
  }
  sandbox.appendChild(frag);
}
document
  .querySelector<HTMLButtonElement>("#dg-add-100")!
  .addEventListener("click", () => spawn(100));
document
  .querySelector<HTMLButtonElement>("#dg-add-1000")!
  .addEventListener("click", () => spawn(1000));
document.querySelector<HTMLButtonElement>("#dg-clear")!.addEventListener("click", () => {
  sandbox.innerHTML = "";
});
