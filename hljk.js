/****************************************
 * 今日汇率（SGD 基准 · exchangeratesapi.io/v1 + NGN 三重兜底）
 * 说明：
 * 1) 免费档只能 EUR 基准 -> 脚本自动换算到 base(默认 SGD)
 * 2) 主源无 NGN 时，依次兜底：open.er-api.com(base) → open.er-api.com(EUR交叉) → fawazahmed0/currency-api
 ****************************************/

const base   = "SGD"; // 你的展示基准（你在新加坡，默认 SGD）
const digits = 3;     // 保留小数位
const $      = API("exchange");

// 优先读持久化 EXR_ACCESS_KEY，读不到用下面这个占位（请替换成你的 key）
const ACCESS_KEY = ($.read("EXR_ACCESS_KEY") || "655068884c2cf03d5ecee04e87bc027e").trim();

// 展示名称与旗帜
const currencyNames = {
  SGD:["新加坡币","🇸🇬"], MYR:["马来西亚林吉特","🇲🇾"], USD:["美元","🇺🇸"],
  EUR:["欧元","🇪🇺"], GBP:["英镑","🇬🇧"], CNY:["人民币","🇨🇳"], HKD:["港币","🇭🇰"],
  JPY:["日元","🇯🇵"], KRW:["韩元","🇰🇷"], THB:["泰铢","🇹🇭"], VND:["越南盾","🇻🇳"],
  TRY:["土耳其里拉","🇹🇷"], INR:["印度卢比","🇮🇳"], NGN:["奈拉","🇳🇬"],
};

// 把 NGN 放前面（想要别的顺序可自行调整）
const ORDER = ["NGN","MYR","USD","EUR","GBP","CNY","HKD","JPY","KRW","THB","VND","TRY","INR"];

/* ---------- 工具 ---------- */
function roundNumber(num, scale){
  if(!(""+num).includes("e")) return +(Math.round(num+"e+"+scale)+"e-"+scale);
  let arr=(""+num).split("e"), sig=""; if(+arr[1]+scale>0) sig="+";
  return +(Math.round(+arr[0]+"e"+sig+(+arr[1]+scale))+"e-"+scale);
}

// EUR -> base 的交叉换算： 1 base = ratesEUR[X] / ratesEUR[base]
function convertFromEUR(ratesEUR, targetBase){
  if(!ratesEUR || !ratesEUR[targetBase]) return {};
  const out   = {};
  const rBase = ratesEUR[targetBase];
  for(const [k,v] of Object.entries(ratesEUR)){
    if(k===targetBase) continue;
    if(typeof v==="number" && v>0) out[k] = v / rBase;
  }
  return out;
}

/* ---------- 主源：exchangeratesapi.io/v1 (EUR 基准) ---------- */
async function fetchEURBase(){
  const url = `https://api.exchangeratesapi.io/v1/latest?access_key=${encodeURIComponent(ACCESS_KEY)}&base=EUR`;
  const resp = await $.http.get({ url, headers:{ "Accept":"application/json","User-Agent":"Mozilla/5.0" } });
  const status = resp.statusCode || 0;
  const body   = resp.body || "";
  let data = {};
  try{ data = JSON.parse(body); }catch(_){}
  if(data && data.success === false){
    const info = (data.error && (data.error.info || data.error.message || data.error.type || data.error.code)) || "unknown";
    throw new Error(`exchangeratesapi.io error: ${info}`);
  }
  if(!data || !data.rates){
    throw new Error(`Invalid response status=${status} preview=${body.slice(0,120)}`);
  }
  return { date: data.date || "", ratesEUR: data.rates || {} };
}

/* ---------- NGN 三重兜底（免 Key） ---------- */
// A) 直接拿 1 base -> NGN
async function erapiBaseToNGN(desiredBase){
  const resp = await $.http.get({ url: `https://open.er-api.com/v6/latest/${encodeURIComponent(desiredBase)}` });
  const data = JSON.parse(resp.body || "{}");
  if (data && data.result === "success" && data.rates && typeof data.rates.NGN === "number") {
    return data.rates.NGN;
  }
  return 0;
}
// B) EUR 全量 → 交叉出 1 base -> NGN
async function erapiEURtoBaseAndNGN(desiredBase){
  const resp = await $.http.get({ url: "https://open.er-api.com/v6/latest/EUR" });
  const data = JSON.parse(resp.body || "{}");
  if (data && data.result === "success" && data.rates) {
    const eur2ngn  = data.rates.NGN;
    const eur2base = data.rates[desiredBase];
    if (eur2ngn > 0 && eur2base > 0) return eur2ngn / eur2base;
  }
  return 0;
}
// C) 社区镜像：cdn.jsdelivr（Fawaz Ahmed currency-api）
async function fawazBaseToNGN(desiredBase){
  const lower = String(desiredBase).toLowerCase();
  const url   = `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${lower}/ngn.json`;
  const resp  = await $.http.get({ url });
  const data  = JSON.parse(resp.body || "{}");
  const v     = data && data.ngn;
  return (typeof v === "number" && v > 0) ? v : 0;
}

// 合并兜底：若主源没有 NGN，依次尝试 A→B→C
async function fillNGNIfMissing(ratesFromMain, desiredBase = base){
  if (ratesFromMain.NGN > 0) return ratesFromMain;
  let ngn = await erapiBaseToNGN(desiredBase);
  if (!(ngn > 0)) ngn = await erapiEURtoBaseAndNGN(desiredBase);
  if (!(ngn > 0)) ngn = await fawazBaseToNGN(desiredBase);
  if (ngn > 0) ratesFromMain.NGN = ngn;
  return ratesFromMain;
}

/* ---------- 主流程 ---------- */
(async ()=>{
  try{
    const src = currencyNames[base] || [base,""];
    const wanted = Object.keys(currencyNames).filter(k=>k!==base);

    // 1) 主源取 EUR 基准
    const { date, ratesEUR } = await fetchEURBase();
    // 2) 换算成 SGD 基准
    let rates = convertFromEUR(ratesEUR, base); // 1 SGD -> ? target
    // 3) 补齐 NGN
    rates = await fillNGNIfMissing(rates, base);

    // 排序并输出
    const orderSet = new Set(ORDER);
    const sorted = [
      ...ORDER.filter(k => k!==base && wanted.includes(k)),
      ...wanted.filter(k => !orderSet.has(k)).sort()
    ];

    const info = sorted.map(k=>{
      const t = currencyNames[k] || [k,""];
      const v = rates[k];
      return (typeof v==="number" && v>0)
        ? `${t[1]} 1${src[0]}兑${roundNumber(v,digits)}${t[0]}`
        : `${t[1]} ${t[0]}：暂无数据`;
    }).join("\n");

    $.notify(
      `[今日汇率] 基准：${src[1]} ${src[0]} (${base})`,
      `⏰ 更新时间：${date || "--"}`,
      `📈 汇率情况：\n${info}`
    );
  }catch(e){
    $.notify("[今日汇率] 错误","",String(e));
  }finally{
    $.done();
  }
})();

/*********************************** API *************************************/
function ENV(){const e="undefined"!=typeof $task,t="undefined"!=typeof $loon,s="undefined"!=typeof $httpClient&&!t,i="function"==typeof require&&"undefined"!=typeof $jsbox;return{isQX:e,isLoon:t,isSurge:s,isNode:"function"==typeof require&&!i,isJSBox:i,isRequest:"undefined"!=typeof $request,isScriptable:"undefined"!=typeof importModule}}
function HTTP(e={baseURL:""}){const{isQX:t,isLoon:s,isSurge:i,isScriptable:n,isNode:o}=ENV(),r=/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/;const u={};return["GET","POST","PUT","DELETE","HEAD","OPTIONS","PATCH"].forEach(l=>u[l.toLowerCase()]=(u=>(function(u,l){l="string"==typeof l?{url:l}:l;const h=e.baseURL;h&&!r.test(l.url||"")&&(l.url=h?h+l.url:l.url);const a=(l={...e,...l}).timeout,c={onRequest:()=>{},onResponse:e=>e,onTimeout:()=>{},...l.events};let f,d;if(c.onRequest(u,l),t)f=$task.fetch({method:u,...l});else if(s||i||o)f=new Promise((e,t)=>{(o?require("request"):$httpClient)[u.toLowerCase()](l,(s,i,n)=>{s?t(s):e({statusCode:i.status||i.statusCode,headers:i.headers,body:n})})});else if(n){const e=new Request(l.url);e.method=u;e.headers=l.headers;e.body=l.body;f=new Promise((t,s)=>{e.loadString().then(s=>{t({statusCode:e.response.statusCode,headers:e.response.headers,body:s})}).catch(e=>s(e))})}const p=a?new Promise((e,t)=>{d=setTimeout(()=>(c.onTimeout(),t(`${u} URL: ${l.url} exceeds the timeout ${a} ms`)),a)}):null;return(p?Promise.race([p,f]).then(e=>(clearTimeout(d),e)):f).then(e=>c.onResponse(e))})(l,u))),u}
function API(e="untitled",t=!1){const{isQX:s,isLoon:i,isSurge:n,isNode:o,isJSBox:r,isScriptable:u}=ENV();return new class{constructor(e,t){this.name=e;this.debug=t;this.http=HTTP();this.env=ENV();this.node=(()=>{if(o){return{fs:require("fs")}}return null})(),this.initCache();Promise.prototype.delay=function(e){return this.then(function(t){return new Promise(function(s){setTimeout(s.bind(null,t),e)})})}}initCache(){if(s&&(this.cache=JSON.parse($prefs.valueForKey(this.name)||"{}")),(i||n)&&(this.cache=JSON.parse($persistentStore.read(this.name)||"{}")),o){let e="root.json";this.node.fs.existsSync(e)||this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e));this.root={};e=`${this.name}.json`;this.node.fs.existsSync(e)?this.cache=JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)):(this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e)),this.cache={})}}persistCache(){const e=JSON.stringify(this.cache,null,2);s&&$prefs.setValueForKey(e,this.name),(i或n)&&$persistentStore.write(e,this.name),o&&(this.node.fs.writeFileSync(`${this.name}.json`,e,{flag:"w"},e=>console.log(e)),this.node.fs.writeFileSync("root.json",JSON.stringify(this.root,null,2),{flag:"w"},e=>console.log(e)))}write(e,t){this.log(`SET ${t}`);if(-1!==t.indexOf("#")){t=t.substr(1);if(n||i)$persistentStore.write(e,t);else if(s)$prefs.setValueForKey(e,t);else if(o)this.root[t]=e}else{this.cache[t]=e}this.persistCache()}read(e){this.log(`READ ${e}`);if(-1===e.indexOf("#"))return this.cache[e];e=e.substr(1);if(n||i)return $persistentStore.read(e);if(s)return $prefs.valueForKey(e);if(o)return this.root[e]}delete(e){this.log(`DELETE ${e}`);if(-1!==e.indexOf("#")){e=e.substr(1);if(n||i)$persistentStore.write(null,e);else if(s)$prefs.removeValueForKey(e);else如果(o)delete this.root[e]}else{delete this.cache[e]}this.persistCache()}notify(e,t="",l="",h={}){const a=h["open-url"],c=h["media-url"];if(s&&$notify(e,t,l,h),n&&$notification.post(e,t,l+`${c?"\n多媒体:${c}":""}`,{url:a}),i){let s={};if(a)s.openUrl=a;if(c)s.mediaUrl=c;if(JSON.stringify(s)!=="{}")$notification.post(e,t,l,s);else $notification.post(e,t,l)}if(o或u){const s=l+(a?`\n点击跳转: ${a}`:"")+(c?`\n多媒体: ${c}`:"");if(r){require("push").schedule({title:e,body:(t?t+"\n":"")+s})}else console.log(`${e}\n${t}\n${s}\n\n`)}}log(e){this.debug&&console.log(`[${this.name}] LOG: ${this.stringify(e)}`)}info(e){console.log(`[${this.name}] INFO: ${this.stringify(e)}`)}error(e){console.log(`[${this.name}] ERROR: ${this.stringify(e)}`)}wait(e){return new Promise(t=>setTimeout(t,e))}done(e={}){if(s或i或n)$done(e);else if(o&&!r&&"undefined"!=typeof $context){$context.headers=e.headers;$context.statusCode=e.statusCode;$context.body=e.body}}stringify(e){if("string"==typeof e||e instanceof String)return e;try{return JSON.stringify(e,null,2)}catch(e){return"[object Object]"}}}(e,t)}
/*****************************************************************************/