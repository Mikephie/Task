/****************************************
 * 监控汇率变化（含 NGN 兜底）
****************************************/

const base   = "SGD"; // 基准货币
const digits = 3;     // 小数位

const $ = API("exchange");

// 展示名称与旗帜
const currencyNames = {
  SGD: ["新加坡币", "🇸🇬"],
  MYR: ["马来西亚林吉特", "🇲🇾"],
  USD: ["美元", "🇺🇸"],
  EUR: ["欧元", "🇪🇺"],
  GBP: ["英镑", "🇬🇧"],
  CNY: ["人民币", "🇨🇳"],
  HKD: ["港币", "🇭🇰"],
  JPY: ["日元", "🇯🇵"],
  KRW: ["韩元", "🇰🇷"],
  THB: ["泰铢", "🇹🇭"],
  VND: ["越南盾", "🇻🇳"],
  TRY: ["土耳其里拉", "🇹🇷"],
  INR: ["印度卢比", "🇮🇳"],
  NGN: ["奈拉", "🇳🇬"],  // ← 关键：奈拉
};

// 想固定展示/排序请改这里（未列出的也会补在后面）
const ORDER = ["MYR","USD","EUR","GBP","CNY","HKD","JPY","KRW","THB","VND","TRY","INR","NGN"];

// ===== 工具 =====
function roundNumber(num, scale) {
  if (!("" + num).includes("e")) {
    return +(Math.round(num + "e+" + scale) + "e-" + scale);
  } else {
    let arr = ("" + num).split("e");
    let sig = "";
    if (+arr[1] + scale > 0) sig = "+";
    return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
  }
}

async function getPrimaryRates(base) {
  const resp = await $.http.get({ url: `https://api.exchangerate-api.com/v4/latest/${base}` });
  const data = JSON.parse(resp.body || "{}");
  return { date: data.date, rates: data.rates || {} };
}

// 兜底：只取缺失的目标币（如 NGN）
async function fillMissingWithHost(base, missingCodes) {
  if (!missingCodes.length) return {};
  const symbols = missingCodes.join(",");
  // exchangerate.host 支持任意 base 和筛选 symbols
  const resp = await $.http.get({ url: `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symbols)}` });
  const data = JSON.parse(resp.body || "{}");
  return data.rates || {};
}

(async () => {
  try {
    const source = currencyNames[base] || [base, ""];
    const prim   = await getPrimaryRates(base);
    const rates  = { ...prim.rates }; // 1 base -> ? target

    // 找出需要展示但在主源里缺失的币（重点：NGN）
    const wanted = Object.keys(currencyNames).filter(k => k !== base);
    const missing = wanted.filter(k => !(k in rates));

    // 用备用源补齐缺失
    if (missing.length) {
      const patched = await fillMissingWithHost(base, missing);
      Object.assign(rates, patched);
    }

    // 生成展示：优先按 ORDER，其余按字母序
    const orderSet = new Set(ORDER);
    const sorted = [
      ...ORDER.filter(k => k !== base && wanted.includes(k)),
      ...wanted.filter(k => !orderSet.has(k)).sort()
    ];

    const info = sorted.reduce((acc, key) => {
      const target = currencyNames[key] || [key, ""];
      if (rates[key] > 0) {
        // 统一口径：1 基准币 = ? 目标币
        return acc + `${target[1]} 1${source[0]}兑${roundNumber(rates[key], digits)}${target[0]}\n`;
      } else {
        return acc + `${target[1]} ${target[0]}：暂无数据（源未提供）\n`;
      }
    }, "");

    $.notify(
      `[今日汇率] 基准：${source[1]} ${source[0]} (${base})`,
      `⏰ 更新时间：${prim.date || "--"}`,
      `📈 汇率情况：\n${info}`
    );
  } catch (e) {
    $.notify("[今日汇率] 错误", "", String(e));
  } finally {
    $.done();
  }
})();

// prettier-ignore
/*********************************** API *************************************/
function ENV(){const e="undefined"!=typeof $task,t="undefined"!=typeof $loon,s="undefined"!=typeof $httpClient&&!t,i="function"==typeof require&&"undefined"!=typeof $jsbox;return{isQX:e,isLoon:t,isSurge:s,isNode:"function"==typeof require&&!i,isJSBox:i,isRequest:"undefined"!=typeof $request,isScriptable:"undefined"!=typeof importModule}}function HTTP(e={baseURL:""}){const{isQX:t,isLoon:s,isSurge:i,isScriptable:n,isNode:o}=ENV(),r=/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/;const u={};return["GET","POST","PUT","DELETE","HEAD","OPTIONS","PATCH"].forEach(l=>u[l.toLowerCase()]=(u=>(function(u,l){l="string"==typeof l?{url:l}:l;const h=e.baseURL;h&&!r.test(l.url||"")&&(l.url=h?h+l.url:l.url);const a=(l={...e,...l}).timeout,c={onRequest:()=>{},onResponse:e=>e,onTimeout:()=>{},...l.events};let f,d;if(c.onRequest(u,l),t)f=$task.fetch({method:u,...l});else if(s||i||o)f=new Promise((e,t)=>{(o?require("request"):$httpClient)[u.toLowerCase()](l,(s,i,n)=>{s?t(s):e({statusCode:i.status||i.statusCode,headers=i.headers,body:n})})});else if(n){const e=new Request(l.url);e.method=u,e.headers=l.headers,e.body=l.body,f=new Promise((t,s)=>{e.loadString().then(s=>{t({statusCode:e.response.statusCode,headers:e.response.headers,body:s})}).catch(e=>s(e))})}const p=a?new Promise((e,t)=>{d=setTimeout(()=>(c.onTimeout(),t(`${u} URL: ${l.url} exceeds the timeout ${a} ms`)),a)}):null;return(p?Promise.race([p,f]).then(e=>(clearTimeout(d),e)):f).then(e=>c.onResponse(e))})(l,u))),u}function API(e="untitled",t=!1){const{isQX:s,isLoon:i,isSurge:n,isNode:o,isJSBox:r,isScriptable:u}=ENV();return new class{constructor(e,t){this.name=e,this.debug=t,this.http=HTTP(),this.env=ENV(),this.node=(()=>{if(o){return{fs:require("fs")}}return null})(),this.initCache();Promise.prototype.delay=function(e){return this.then(function(t){return((e,t)=>new Promise(function(s){setTimeout(s.bind(null,t),e)}))(e,t)})}}initCache(){if(s&&(this.cache=JSON.parse($prefs.valueForKey(this.name)||"{}")),(i||n)&&(this.cache=JSON.parse($persistentStore.read(this.name)||"{}")),o){let e="root.json";this.node.fs.existsSync(e)||this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e)),this.root={},e=`${this.name}.json`,this.node.fs.existsSync(e)?this.cache=JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)):(this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e)),this.cache={})}}persistCache(){const e=JSON.stringify(this.cache,null,2);s&&$prefs.setValueForKey(e,this.name),(i||n)&&$persistentStore.write(e,this.name),o&&(this.node.fs.writeFileSync(`${this.name}.json`,e,{flag:"w"},e=>console.log(e)),this.node.fs.writeFileSync("root.json",JSON.stringify(this.root,null,2),{flag:"w"},e=>console.log(e)))}write(e,t){if(this.log(`SET ${t}`),-1!==t.indexOf("#")){if(t=t.substr(1),n||i)return $persistentStore.write(e,t);if(s)return $prefs.setValueForKey(e,t);o&&(this.root[t]=e)}else this.cache[t]=e;this.persistCache()}read(e){return this.log(`READ ${e}`),-1===e.indexOf("#")?this.cache[e]:(e=e.substr(1),n||i?$persistentStore.read(e):s?$prefs.valueForKey(e):o?this.root[e]:void 0)}delete(e){if(this.log(`DELETE ${e}`),-1!==e.indexOf("#")){if(e=e.substr(1),n||i)return $persistentStore.write(null,e);if(s)return $prefs.removeValueForKey(e);o&&delete this.root[e]}else delete this.cache[e];this.persistCache()}notify(e,t="",l="",h={}){const a=h["open-url"],c=h["media-url"];if(s&&$notify(e,t,l,h),n&&$notification.post(e,t,l+`${c?"\n多媒体:"+c:""}`,{url:a}),i){let s={};a&&(s.openUrl=a),c&&(s.mediaUrl=c),"{}"===JSON.stringify(s)?$notification.post(e,t,l):$notification.post(e,t,l,s)}if(o||u){const s=l+(a?`\n点击跳转: ${a}`:"")+(c?`\n多媒体: ${c}`:"");if(r){require("push").schedule({title:e,body:(t?t+"\n":"")+s})}else console.log(`${e}\n${t}\n${s}\n\n`)}}log(e){this.debug&&console.log(`[${this.name}] LOG: ${this.stringify(e)}`)}info(e){console.log(`[${this.name}] INFO: ${this.stringify(e)}`)}error(e){this.debug?console.log(`[${this.name}] ERROR: ${this.stringify(e)}`):console.log(`[${this.name}] ERROR`) }wait(e){return new Promise(t=>setTimeout(t,e))}done(e={}){s||i||n?$done(e):o&&!r&&"undefined"!=typeof $context&&($context.headers=e.headers,$context.statusCode=e.statusCode,$context.body=e.body)}stringify(e){if("string"==typeof e||e instanceof String)return e;try{return JSON.stringify(e,null,2)}catch(e){return"[object Object]"}}}(e,t)}
/*****************************************************************************/