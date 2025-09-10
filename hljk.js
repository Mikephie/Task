/****************************************
 * 今日汇率（逐小时对比 · 免密钥 · 面板/直接运行双模式）
 * - 源：https://api.exchangerate-api.com/v4/latest/<BASE>
 * - 不需要 API Key
 * - 每次运行：上次(currHour) → lastHour，再写入新的 currHour
 * - 对比 lastHour ⇆ currHour：🟢↑ / 🔴↓ / ⚪→ + 百分比
 * - 两字币名用全角空格；数字 toFixed；箭头在数字前
 ****************************************/

const base          = "SGD";   // 基准币
const digits        = 3;       // 数字小数位
const trendDigits   = 2;       // 百分比小数位
const SNAP_KEY      = "EX_RATES_SNAPSHOT_HOURLY_" + base;

const SYM_UP   = "🟢↑";
const SYM_DOWN = "🔴↓";
const SYM_FLAT = "⚪→";

const $ = API("exchange");

// 显示名称与旗帜（奈拉在泰铢上面）
const NAMES = {
  SGD: ["新币", "🇸🇬"], MYR: ["马币", "🇲🇾"], USD: ["美元", "🇺🇸"], EUR: ["欧元", "🇪🇺"],
  GBP: ["英镑", "🇬🇧"], CNY: ["人民币", "🇨🇳"], HKD: ["港币", "🇭🇰"], JPY: ["日元", "🇯🇵"],
  KRW: ["韩元", "🇰🇷"], NGN: ["奈拉", "🇳🇬"], THB: ["泰铢", "🇹🇭"],
};
const ORDER = ["MYR","USD","EUR","GBP","CNY","HKD","JPY","KRW","NGN","THB"];

/* ---------- 环境与模式 ---------- */
// 尝试解析 argument（可选：mode=panel / mode=text）
const ARG = (() => {
  try {
    if (typeof $argument === "string" && $argument) {
      const obj = {};
      for (const kv of $argument.split("&")) {
        const [k, v=""] = kv.split("=");
        obj[decodeURIComponent(k)] = decodeURIComponent(v);
      }
      return obj;
    }
  } catch {}
  return {};
})();

// “是否面板模式”的判定：
// 1) 明确传参 mode=panel/text 直接决定
// 2) 否则：Surge/Loon 且存在 $done（面板/脚本环境皆有）；
//    再辅助判断 $environment / $loon（若可用）是否来自面板；
// 3) 无法确定时默认“面板模式”，但在编辑器里会额外 console.log 纯文本。
function isPanelEnv() {
  if (ARG.mode === "panel") return true;
  if (ARG.mode === "text")  return false;
  // Surge/Loon 均可到这里：编辑器运行/面板运行都具备 $done
  // 大多数情况下我们仍返回 true 以渲染面板，
  // 同时在 showResult 里“直接运行”会额外 console.log 文本供你调试查看。
  return (typeof $httpClient !== "undefined" || typeof $loon !== "undefined");
}

/* ---------- 工具 ---------- */
function padName(n){ return n.length===2 ? n[0]+"　"+n[1] : n; } // 全角空格
function fix(x, d=digits){ return Number(x).toFixed(d); }

// 逐小时快照：{ lastHour:{time,rates}, currHour:{time,rates} }
function readSnap(){ try{ return JSON.parse($.read(SNAP_KEY)||"{}"); }catch{ return {}; } }
function writeSnapHourly(newRates){
  const snap = readSnap();
  if (snap.currHour) snap.lastHour = snap.currHour;           // 先挪到上一小时
  snap.currHour = { time: new Date().toISOString(), rates: pickShown(newRates) };
  $.write(JSON.stringify(snap), SNAP_KEY);
  return snap;
}
function getPrevRates(snap){ return snap && snap.lastHour ? snap.lastHour.rates : undefined; }
function pickShown(all){ const o={}; for(const c of ORDER){ if(typeof all[c]==="number") o[c]=all[c]; } return o; }

// 箭头 + 百分比
function trendTag(curr, prev){
  if (typeof prev!=="number" || !isFinite(prev) || prev===0) return [SYM_FLAT, "(—)"];
  const diff = curr - prev;
  if (Math.abs(diff) < 1e-12) return [SYM_FLAT, "(0%)"];
  const pct = Math.abs(diff/prev*100).toFixed(trendDigits);
  return diff>0 ? [SYM_UP, `(${pct}%)`] : [SYM_DOWN, `(${pct}%)`];
}

// 免密钥数据源
async function getRates(baseCode){
  const resp = await $.http.get({ url: `https://api.exchangerate-api.com/v4/latest/${baseCode}` });
  const data = JSON.parse(resp.body || "{}");
  return { date: data.date || "--", rates: data.rates || {} };
}

/* ---------- 输出：面板 or 纯文本 ---------- */
function showResult({title, sub, linesText}){
  const panelMode = isPanelEnv();

  // 直接运行/调试：打印纯文本
  const plain =
    `${title}\n${sub}\n` +
    linesText.replace(/\n$/,"");
  // 无论是否是面板，只要是在“编辑器里 Run”，你都能在控制台看到纯文本
  try { console.log(plain); } catch {}

  if (panelMode) {
    // 面板渲染
    const isSurge = typeof $httpClient !== "undefined";
    const isLoon  = typeof $loon !== "undefined";
    if (isSurge || isLoon) {
      $done({
        title,
        content: `${sub}\n${linesText}`.trim(),
        icon: "arrow.up.arrow.down.circle",
        "icon-color": "#16A34A"
      });
      return;
    }
  }

  // 非面板（或不支持面板）走通知兜底
  if (typeof $task !== "undefined") { // QX
    $notify(title, sub, linesText);
  }
  try { $done(); } catch {}
}

/* ---------- 主流程 ---------- */
(async () => {
  try {
    const src = NAMES[base] || [base,""];
    const { date, rates } = await getRates(base);

    const snap = writeSnapHourly(rates);              // 写入本次（同时得到上一次）
    const prev = getPrevRates(snap);

    const lines = ORDER.reduce((acc, code) => {
      const meta = NAMES[code]; if (!meta) return acc;
      const r = rates[code];   if (!(r > 0)) return acc;
      const [sym, pct] = trendTag(r, prev ? prev[code] : undefined);
      return acc + `${meta[1]} ${padName(meta[0])}：1${src[0]}兑 ${sym}${fix(r)} ${pct}\n`;
    }, "");

    showResult({
      title: `今日汇率 · 基准：${src[0]} (${base})`,
      sub:   `⏰ 更新时间：${date}`,
      linesText: lines
    });
  } catch (e) {
    try {
      // 直接运行时也输出错误
      console.log("[今日汇率] 错误：", e);
    } catch {}
    $.notify?.("[今日汇率] 错误", "", String(e));
    try { $done(); } catch {}
  }
})();

/********* API 帮助（原版即可） *********/
function ENV(){const e="undefined"!=typeof $task,t="undefined"!=typeof $loon,s="undefined"!=typeof $httpClient&&!t,i="function"==typeof require&&"undefined"!=typeof $jsbox;return{isQX:e,isLoon:t,isSurge:s,isNode:"function"==typeof require&&!i,isJSBox:i,isRequest:"undefined"!=typeof $request,isScriptable:"undefined"!=typeof importModule}}
function HTTP(e={baseURL:""}){const{isQX:t,isLoon:s,isSurge:i,isScriptable:n,isNode:o}=ENV(),r=/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/;const u={};return["GET","POST","PUT","DELETE","HEAD","OPTIONS","PATCH"].forEach(l=>u[l.toLowerCase()]=(u=>(function(u,l){l="string"==typeof l?{url:l}:l;const h=e.baseURL;h&&!r.test(l.url||"")&&(l.url=h?h+l.url:l.url);const a=(l={...e,...l}).timeout,c={onRequest:()=>{},onResponse:e=>e,onTimeout:()=>{},...l.events};let f,d;if(c.onRequest(u,l),t)f=$task.fetch({method:u,...l});else if(s||i||o)f=new Promise((e,t)=>{(o?require("request"):$httpClient)[u.toLowerCase()](l,(s,i,n)=>{s?t(s):e({statusCode:i.status||i.statusCode,headers:i.headers,body:n})})});else if(n){const e=new Request(l.url);e.method=u;e.headers=l.headers;e.body=l.body;f=new Promise((t,s)=>{e.loadString().then(s=>{t({statusCode:e.response.statusCode,headers:e.response.headers,body:s})}).catch(e=>s(e))})}const p=a?new Promise((e,t)=>{d=setTimeout(()=>(c.onTimeout(),t(`${u} URL: ${l.url} exceeds the timeout ${a} ms`)),a)}):null;return(p?Promise.race([p,f]).then(e=>(clearTimeout(d),e)):f).then(e=>c.onResponse(e))})(l,u))),u}
function API(e="untitled",t=!1){const{isQX:s,isLoon:i,isSurge:n,isNode:o,isJSBox:r,isScriptable:u}=ENV();return new class{constructor(e,t){this.name=e;this.debug=t;this.http=HTTP();this.env=ENV();this.node=(()=>{if(o){return{fs:require("fs")}}return null})(),this.initCache();Promise.prototype.delay=function(e){return this.then(function(t){return new Promise(function(s){setTimeout(s.bind(null,t),e)})})}}initCache(){if(s&&(this.cache=JSON.parse($prefs.valueForKey(this.name)||"{}")),(i||n)&&(this.cache=JSON.parse($persistentStore.read(this.name)||"{}")),o){let e="root.json";this.node.fs.existsSync(e)||this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e)),this.root={},e=`${this.name}.json`,this.node.fs.existsSync(e)?this.cache=JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)):(this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e)),this.cache={})}}persistCache(){const e=JSON.stringify(this.cache,null,2);s&&$prefs.setValueForKey(e,this.name),(i||n)&&$persistentStore.write(e,this.name),o&&(this.node.fs.writeFileSync(`${this.name}.json`,e,{flag:"w"},e=>console.log(e)),this.node.fs.writeFileSync("root.json",JSON.stringify(this.root,null,2),{flag:"w"},e=>console.log(e)))}write(e,t){-1!==t.indexOf("#")?(t=t.substr(1),i||n?$persistentStore.write(e,t):s?$prefs.setValueForKey(e,t):o&&(this.root[t]=e)):(this.cache[t]=e,this.persistCache())}read(e){return-1===e.indexOf("#")?this.cache[e]:(e=e.substr(1),i||n?$persistentStore.read(e):s?$prefs.valueForKey(e):o?this.root[e]:void 0)}notify(e,t="",l="",h={}){const a=h["open-url"],c=h["media-url"];s&&$notify(e,t,l,h),i||n?$notification.post(e,t,l+`${c?"\n多媒体:"+c:""}`,{url:a}):o||u?console.log(`${e}\n${t}\n${l}\n\n`):0}done(e={}){(i||n||s)?$done(e):o||r||"undefined"!=typeof $context&&($context.headers=e.headers,$context.statusCode=e.statusCode,$context.body=e.body)}}(e,t)}