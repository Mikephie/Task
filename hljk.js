/****************************************
 * 监控汇率变化（免 Key + NGN 兜底 + 涨跌箭头 + 数字位置开关）
 * 原作者: Peng-YM | Alter: chxm1023 | 强化: 开源兜底 + 排版 + 涨跌对比
 ****************************************/

const base        = "SGD";   // 想展示的基准：SGD / CNY / USD / NGN ...
const digits      = 3;       // 小数位
const NUM_WIDTH   = 10;      // 数字列宽（半角字符）8~12 之间调
const NUMBER_AT_END = true;  // ← 功能 3：true=数字在最后；false=数字在前面
const SHOW_TREND  = true;    // 功能 1：显示涨跌箭头和百分比
const SNAP_KEY    = "EX_RATES_SNAPSHOT"; // 持久化快照键名

const $ = API("exchange");

// === 两/三字命名，保证视觉宽度一致（两字补 1 空格凑三字） ===
const currencyNames = {
  SGD: ["新币",  "🇸🇬"],
  MYR: ["马币",  "🇲🇾"],
  USD: ["美元",  "🇺🇸"],
  EUR: ["欧元",  "🇪🇺"],
  GBP: ["英镑",  "🇬🇧"],
  CNY: ["人民币","🇨🇳"], // 3 字
  HKD: ["港币",  "🇭🇰"],
  JPY: ["日元",  "🇯🇵"],
  KRW: ["韩元",  "🇰🇷"],
  THB: ["泰铢",  "🇹🇭"],
  VND: ["越盾",  "🇻🇳"],
  NGN: ["奈拉",  "🇳🇬"],
};

// 展示顺序（未列出的按字母序补在末尾）
const ORDER = ["MYR","USD","EUR","GBP","CNY","HKD","JPY","KRW","THB","VND","TRY","INR","NGN"];

/* ---------- 工具 ---------- */
function roundNumber(num, scale) {
  if (!("" + num).includes("e")) return +(Math.round(num + "e+" + scale) + "e-" + scale);
  let arr = ("" + num).split("e"), sig = "";
  if (+arr[1] + scale > 0) sig = "+";
  return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
}

// 两字名补 1 个半角空格，凑成"三字宽"
function padName(name) { return name.length === 2 ? (name + " ") : name; }

// 右对齐数字（半角）
function alignNumber(n) { return String(n).padStart(NUM_WIDTH, " "); }

// 涨跌箭头与百分比（相对上次快照）
function trendMark(curr, prev) {
  if (!SHOW_TREND) return "";
  if (typeof prev !== "number" || prev <= 0) return " (--)";
  const diff = curr - prev;
  const pct  = (diff / prev) * 100;
  const sign = diff > 0 ? "↑" : (diff < 0 ? "↓" : "→");
  return ` (${sign}${roundNumber(Math.abs(pct), 2)}%)`;
}

// 主源：exchangerate-api.com（免 Key）
async function getPrimaryRates(baseCode) {
  const resp = await $.http.get({ url: `https://api.exchangerate-api.com/v4/latest/${baseCode}` });
  const data = JSON.parse(resp.body || "{}");
  return { date: data.date, rates: data.rates || {} };
}

// 兜底：open.er-api.com（免 Key，EUR 基准），用交叉汇率补齐缺失币种（如 NGN）
async function fillMissingWithERApi(baseCode, missingCodes) {
  if (!missingCodes.length) return {};
  const resp = await $.http.get({ url: "https://open.er-api.com/v6/latest/EUR" });
  const data = JSON.parse(resp.body || "{}");
  const ratesEUR = (data && data.result === "success" && data.rates) ? data.rates : {};
  if (!ratesEUR || !ratesEUR[baseCode]) return {};
  const out = {};
  const eurToBase = ratesEUR[baseCode];
  for (const k of missingCodes) {
    const eurToTarget = ratesEUR[k];
    if (typeof eurToTarget === "number" && eurToTarget > 0) {
      out[k] = eurToTarget / eurToBase; // 1 base = (EUR→target)/(EUR→base)
    }
  }
  return out;
}

// 读取/写入快照（持久化）
function readSnapshot() {
  try { return JSON.parse($.read(SNAP_KEY) || "{}"); } catch(_) { return {}; }
}
function writeSnapshot(obj) {
  try { $.write(JSON.stringify(obj), SNAP_KEY); } catch(_) {}
}

/* ---------- 主流程 ---------- */
(async () => {
  try {
    const source = currencyNames[base] || [base, ""];
    const prim   = await getPrimaryRates(base);
    const nowRates = { ...prim.rates }; // 1 base -> ? target

    const wanted  = Object.keys(currencyNames).filter(k => k !== base);
    const missing = wanted.filter(k => !(k in nowRates));

    // 兜底补齐（例如 NGN）
    if (missing.length) {
      const patched = await fillMissingWithERApi(base, missing);
      Object.assign(nowRates, patched);
    }

    // 读取上次快照（按 base 区分）
    const snapAll = readSnapshot();
    const prev = (snapAll && snapAll[base]) ? snapAll[base] : {};

    const orderSet = new Set(ORDER);
    const sorted = [
      ...ORDER.filter(k => k !== base && wanted.includes(k)),
      ...wanted.filter(k => !orderSet.has(k)).sort()
    ];

    const info = sorted.reduce((acc, key) => {
      const target = currencyNames[key] || [key, ""];
      const curr = nowRates[key];
      const prevVal = (prev && prev.rates) ? prev.rates[key] : undefined;

      if (curr > 0) {
        const num = alignNumber(roundNumber(curr, digits));
        const tmk = trendMark(curr, prevVal);
        // 数字位置开关
        const line = NUMBER_AT_END
          ? `${target[1]} ${padName(target[0])}：1${source[0]}兑 ${num}${tmk}\n`
          : `${target[1]} ${padName(target[0])}：${num} ⇐ 1${source[0]}${tmk}\n`;
        return acc + line;
      } else {
        return acc + `${target[1]} ${padName(target[0])}：暂无数据\n`;
      }
    }, "");

    // 通知
    $.notify(
      `[今日汇率] 基准：${source[1]} ${padName(source[0])} (${base})`,
      `⏰ 更新时间：${prim.date || "--"}`,
      `📈 汇率情况：\n${info}`
    );

    // 写入新快照（仅保存我们关心的币种，避免体积过大）
    const snapshot = { date: prim.date || "--", rates: {} };
    for (const k of wanted) {
      if (typeof nowRates[k] === "number") snapshot.rates[k] = nowRates[k];
    }
    snapAll[base] = snapshot;
    writeSnapshot(snapAll);

  } catch (e) {
    $.notify("[今日汇率] 错误", "", String(e));
  } finally {
    $.done();
  }
})();

/*********************************** API *************************************/
function ENV(){const e="undefined"!=typeof $task,t="undefined"!=typeof $loon,s="undefined"!=typeof $httpClient&&!t,i="function"==typeof require&&"undefined"!=typeof $jsbox;return{isQX:e,isLoon:t,isSurge:s,isNode:"function"==typeof require&&!i,isJSBox:i,isRequest:"undefined"!=typeof $request,isScriptable:"undefined"!=typeof importModule}}
function HTTP(e={baseURL:""}){const{isQX:t,isLoon:s,isSurge:i,isScriptable:n,isNode:o}=ENV(),r=/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/;const u={};return["GET","POST","PUT","DELETE","HEAD","OPTIONS","PATCH"].forEach(l=>u[l.toLowerCase()]=(u=>(function(u,l){l="string"==typeof l?{url:l}:l;const h=e.baseURL;h&&!r.test(l.url||"")&&(l.url=h?h+l.url:l.url);const a=(l={...e,...l}).timeout,c={onRequest:()=>{},onResponse:e=>e,onTimeout:()=>{},...l.events};let f,d;if(c.onRequest(u,l),t)f=$task.fetch({method:u,...l});else if(s||i||o)f=new Promise((e,t)=>{(o?require("request"):$httpClient)[u.toLowerCase()](l,(s,i,n)=>{s?t(s):e({statusCode:i.status||i.statusCode,headers:i.headers,body:n})})});else if(n){const e=new Request(l.url);e.method=u;e.headers=l.headers;e.body=l.body;f=new Promise((t,s)=>{e.loadString().then(s=>{t({statusCode:e.response.statusCode,headers:e.response.headers,body:s})}).catch(e=>s(e))})}const p=a?new Promise((e,t)=>{d=setTimeout(()=>(c.onTimeout(),t(`${u} URL: ${l.url} exceeds the timeout ${a} ms`)),a)}):null;return(p?Promise.race([p,f]).then(e=>(clearTimeout(d),e)):f).then(e=>c.onResponse(e))})(l,u))),u}
function API(e="untitled",t=!1){
  const{isQX:s,isLoon:i,isSurge:n,isNode:o,isJSBox:r,isScriptable:u}=ENV();
  return new class{
    constructor(e,t){this.name=e;this.debug=t;this.http=HTTP();this.env=ENV();
      this.node=(()=>{if(o){return{fs:require("fs")}}return null})();this.initCache();
      Promise.prototype.delay=function(e){return this.then(function(t){return new Promise(function(s){setTimeout(s.bind(null,t),e)})})}}
    initCache(){if(s&&(this.cache=JSON.parse($prefs.valueForKey(this.name)||"{}")),(i||n)&&(this.cache=JSON.parse($persistentStore.read(this.name)||"{}")),o){
      let e="root.json";this.node.fs.existsSync(e)||this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e));
      this.root={};e=`${this.name}.json`;this.node.fs.existsSync(e)?this.cache=JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)):(this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e)),this.cache={})}}
    persistCache(){const e=JSON.stringify(this.cache,null,2);
      s&&$prefs.setValueForKey(e,this.name),(i||n)&&$persistentStore.write(e,this.name),
      o&&(this.node.fs.writeFileSync(`${this.name}.json`,e,{flag:"w"},e=>console.log(e)),this.node.fs.writeFileSync("root.json",JSON.stringify(this.root,null,2),{flag:"w"},e=>console.log(e)))} 
    write(e,t){this.log(`SET ${t}`);if(-1!==t.indexOf("#")){t=t.substr(1);if(n||i)$persistentStore.write(e,t);else if(s)$prefs.setValueForKey(e,t);else if(o)this.root[t]=e}else{this.cache[t]=e}this.persistCache()} 
    read(e){this.log(`READ ${e}`);if(-1===e.indexOf("#"))return this.cache[e];e=e.substr(1);if(n||i)return $persistentStore.read(e);if(s)return $prefs.valueForKey(e);if(o)return this.root[e]} 
    // 注意：避免使用关键字 delete 作为方法名
    del(e){this.log(`DELETE ${e}`);if(-1!==e.indexOf("#")){e=e.substr(1);if(n||i)$persistentStore.write(null,e);else if(s)$prefs.removeValueForKey(e);else if(o)delete this.root[e]}else{delete this.cache[e]}this.persistCache()} 
    notify(e,t="",l="",h={}){const a=h["open-url"],c=h["media-url"];if(s&&$notify(e,t,l,h),n&&$notification.post(e,t,l+`${c?"\n多媒体:${c}":""}`,{url:a}),i){let s={};if(a)s.openUrl=a;if(c)s.mediaUrl=c;if(JSON.stringify(s)!=="{}")$notification.post(e,t,l,s);else $notification.post(e,t,l)}if(o或u){const s=l+(a?`\n点击跳转: ${a}`:"")+(c?`\n多媒体: ${c}`:"");if(r){require("push").schedule({title:e,body:(t?t+"\n":"")+s})}else console.log(`${e}\n${t}\n${s}\n\n`)}} 
    log(e){this.debug&&console.log(`[${this.name}] LOG: ${this.stringify(e)}`)} info(e){console.log(`[${this.name}] INFO: ${this.stringify(e)}`)} error(e){console.log(`[${this.name}] ERROR: ${this.stringify(e)}`)} wait(e){return new Promise(t=>setTimeout(t,e))} done(e={}){if(s||i||n)$done(e);else if(o&&!r&&"undefined"!=typeof $context){$context.headers=e.headers;$context.statusCode=e.statusCode;$context.body=e.body}} stringify(e){if("string"==typeof e||e instanceof String)return e;try{return JSON.stringify(e,null,2)}catch(e){return"[object Object]"}}}(e,t)}
/*****************************************************************************/