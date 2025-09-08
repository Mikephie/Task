/****************************************
 * 监控汇率变化（APILayer·EUR基准自动换算版）
 * 原作者: Peng-YM | Alter: chxm1023 | 强化: 自动换算 + 容错 + NGN
 ****************************************/

const base   = "SGD"; // 你想展示的基准：SGD / CNY / USD / NGN ...
const digits = 3;     // 保留小数位
const $      = API("exchange");

/* === Access Key ===
 * 优先读持久化 EXR_ACCESS_KEY；没有就用下面这个你给的 Key
 * 可在调试台写入：$persistentStore.write("YOUR_KEY","EXR_ACCESS_KEY")
 */
const ACCESS_KEY = $.read("EXR_ACCESS_KEY") || "655068884c2cf03d5eee04e87bc027e";

// 展示名称与旗帜
const currencyNames = {
  SGD:["新加坡币","🇸🇬"], MYR:["马来西亚林吉特","🇲🇾"], USD:["美元","🇺🇸"],
  EUR:["欧元","🇪🇺"], GBP:["英镑","🇬🇧"], CNY:["人民币","🇨🇳"], HKD:["港币","🇭🇰"],
  JPY:["日元","🇯🇵"], KRW:["韩元","🇰🇷"], THB:["泰铢","🇹🇭"], VND:["越南盾","🇻🇳"],
  TRY:["土耳其里拉","🇹🇷"], INR:["印度卢比","🇮🇳"], NGN:["奈拉","🇳🇬"],
};

// 自定义展示顺序（未列出的会排在最后，按字母序）
const ORDER = ["MYR","USD","EUR","GBP","CNY","HKD","JPY","KRW","THB","VND","TRY","INR","NGN"];

/* ========== 小工具 ========== */
function roundNumber(num, scale){
  if(!(""+num).includes("e")) return +(Math.round(num+"e+"+scale)+"e-"+scale);
  let arr=(""+num).split("e"), sig=""; if(+arr[1]+scale>0) sig="+";
  return +(Math.round(+arr[0]+"e"+sig+(+arr[1]+scale))+"e-"+scale);
}

// 把"EUR 基准"的 rates 换算为 "base 基准"
function convertFromEUR(ratesEUR, targetBase){
  if(!ratesEUR || !ratesEUR[targetBase]) return {};
  const out = {};
  const rBase = ratesEUR[targetBase]; // 1 EUR = rBase targetBase
  // 我们要 1 targetBase = ? X
  // 已知：1 targetBase = (1 / rBase) EUR；则 1 targetBase = ratesEUR[X] / rBase (X 为任意币)
  for(const [k,v] of Object.entries(ratesEUR)){
    if(k===targetBase) continue;
    if(typeof v==="number" && v>0){
      out[k] = v / rBase;
    }
  }
  return out;
}

/* ========== 请求 EUR 基准的数据（APILayer 免费档） ========== */
async function fetchEURBase(){
  const url = `https://api.exchangerate.host/latest?access_key=${encodeURIComponent(ACCESS_KEY)}&base=EUR`;
  const resp = await $.http.get({ url, headers:{ "Accept":"application/json","User-Agent":"Mozilla/5.0" } });
  const status = resp.statusCode || 0;
  const body   = resp.body || "";
  let data = {};
  try{ data = JSON.parse(body); }catch(_){}
  if(data && data.success === false){
    const info = data.error && (data.error.info || data.error.type || data.error.code) || "unknown";
    throw new Error(`APILayer error: ${info}`);
  }
  if(!data || !data.rates){
    throw new Error(`Invalid response status=${status} preview=${body.slice(0,100)}`);
  }
  return { date: data.date || "", ratesEUR: data.rates || {} };
}

/* ========== 主流程 ========== */
(async ()=>{
  try{
    const wanted = Object.keys(currencyNames).filter(k=>k!==base);
    const src    = currencyNames[base] || [base,""];

    const { date, ratesEUR } = await fetchEURBase();
    const rates = convertFromEUR(ratesEUR, base); // 1 base -> ? target

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
        : `${t[1]} ${t[0]}：暂无数据（源未提供）`;
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
function API(e="untitled",t=!1){const{isQX:s,isLoon:i,isSurge:n,isNode:o,isJSBox:r,isScriptable:u}=ENV();return new class{constructor(e,t){this.name=e;this.debug=t;this.http=HTTP();this.env=ENV();this.node=(()=>{if(o){return{fs:require("fs")}}return null})(),this.initCache();Promise.prototype.delay=function(e){return this.then(function(t){return new Promise(function(s){setTimeout(s.bind(null,t),e)})})}}initCache(){if(s&&(this.cache=JSON.parse($prefs.valueForKey(this.name)||"{}")),(i||n)&&(this.cache=JSON.parse($persistentStore.read(this.name)||"{}")),o){let e="root.json";this.node.fs.existsSync(e)||this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e));this.root={};e=`${this.name}.json`;this.node.fs.existsSync(e)?this.cache=JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)):(this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e)),this.cache={})}}persistCache(){const e=JSON.stringify(this.cache,null,2);s&&$prefs.setValueForKey(e,this.name),(i||n)&&$persistentStore.write(e,this.name),o&&(this.node.fs.writeFileSync(`${this.name}.json`,e,{flag:"w"},e=>console.log(e)),this.node.fs.writeFileSync("root.json",JSON.stringify(this.root,null,2),{flag:"w"},e=>console.log(e)))}write(e,t){this.log(`SET ${t}`);if(-1!==t.indexOf("#")){t=t.substr(1);if(n||i)$persistentStore.write(e,t);else if(s)$prefs.setValueForKey(e,t);else if(o)this.root[t]=e}else{this.cache[t]=e}this.persistCache()}read(e){this.log(`READ ${e}`);if(-1===e.indexOf("#"))return this.cache[e];e=e.substr(1);if(n||i)return $persistentStore.read(e);if(s)return $prefs.valueForKey(e);if(o)return this.root[e]}delete(e){this.log(`DELETE ${e}`);if(-1!==e.indexOf("#")){e=e.substr(1);if(n||i)$persistentStore.write(null,e);else if(s)$prefs.removeValueForKey(e);else if(o)delete this.root[e]}else{delete this.cache[e]}this.persistCache()}notify(e,t="",l="",h={}){const a=h["open-url"],c=h["media-url"];if(s&&$notify(e,t,l,h),n&&$notification.post(e,t,l+`${c?"\n多媒体:${c}":""}`,{url:a}),i){let s={};if(a)s.openUrl=a;if(c)s.mediaUrl=c;if(JSON.stringify(s)!=="{}")$notification.post(e,t,l,s);else $notification.post(e,t,l)}if(o||u){const s=l+(a?`\n点击跳转: ${a}`:"")+(c?`\n多媒体: ${c}`:"");if(r){require("push").schedule({title:e,body:(t?t+"\n":"")+s})}else console.log(`${e}\n${t}\n${s}\n\n`)}}log(e){this.debug&&console.log(`[${this.name}] LOG: ${this.stringify(e)}`)}info(e){console.log(`[${this.name}] INFO: ${this.stringify(e)}`)}error(e){console.log(`[${this.name}] ERROR: ${this.stringify(e)}`)}wait(e){return new Promise(t=>setTimeout(t,e))}done(e={}){if(s||i||n)$done(e);else if(o&&!r&&"undefined"!=typeof $context){$context.headers=e.headers;$context.statusCode=e.statusCode;$context.body=e.body}}stringify(e){if("string"==typeof e||e instanceof String)return e;try{return JSON.stringify(e,null,2)}catch(e){return"[object Object]"}}}(e,t)}
/*****************************************************************************/