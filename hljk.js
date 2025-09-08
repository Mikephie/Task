/****************************************
 * 监控汇率变化（免Key·单源稳定版）
 ****************************************/
const base   = "SGD";         // 基准
const digits = 3;
const $      = API("exchange");

const currencyNames = {
  SGD:["新加坡币","🇸🇬"], MYR:["马来西亚林吉特","🇲🇾"], USD:["美元","🇺🇸"],
  EUR:["欧元","🇪🇺"], GBP:["英镑","🇬🇧"], CNY:["人民币","🇨🇳"], HKD:["港币","🇭🇰"],
  JPY:["日元","🇯🇵"], KRW:["韩元","🇰🇷"], THB:["泰铢","🇹🇭"], VND:["越南盾","🇻🇳"],
  TRY:["土耳其里拉","🇹🇷"], INR:["印度卢比","🇮🇳"], NGN:["奈拉","🇳🇬"],
};

const ORDER = ["MYR","USD","EUR","GBP","CNY","HKD","JPY","KRW","THB","VND","TRY","INR","NGN"];

function roundNumber(n,s){
  if(!(""+n).includes("e")) return +(Math.round(n+"e+"+s)+"e-"+s);
  let a=(""+n).split("e"),sig=""; if(+a[1]+s>0) sig="+";
  return +(Math.round(+a[0]+"e"+sig+(+a[1]+s))+"e-"+s);
}

(async()=>{
  try{
    // 关键：不带 symbols，返回全量
    const resp = await $.http.get({
      url:`https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}`,
      headers:{ "Accept":"application/json", "User-Agent":"Mozilla/5.0" }
    });
    const st  = resp.statusCode||0;
    const txt = resp.body||"";
    let data  = {};
    try { data = JSON.parse(txt); } catch(_){}
    const rates = (data && data.rates) ? data.rates : {};

    // 生成展示
    const wanted = Object.keys(currencyNames).filter(k=>k!==base);
    const src = currencyNames[base]||[base,""];
    const orderSet = new Set(ORDER);
    const sorted = [
      ...ORDER.filter(k=>k!==base && wanted.includes(k)),
      ...wanted.filter(k=>!orderSet.has(k)).sort()
    ];
    const info = sorted.map(k=>{
      const t = currencyNames[k]||[k,""];
      const v = rates[k];
      return (typeof v==="number" && v>0)
        ? `${t[1]} 1${src[0]}兑${roundNumber(v,digits)}${t[0]}`
        : `${t[1]} ${t[0]}：暂无数据（源未提供）`;
    }).join("\n");

    // 若整体空，直接把状态码+前80字节抛出来，方便排错
    const maybeDebug = Object.keys(rates).length? "" :
      `\n\n[调试] status=${st} preview=${(txt||"").slice(0,80)}`;

    $.notify(
      `[今日汇率] 基准：${src[1]} ${src[0]} (${base})`,
      `⏰ 更新时间：${data.date||"--"}`,
      `📈 汇率情况：\n${info}${maybeDebug}`
    );
  }catch(e){
    $.notify("[今日汇率] 错误","",String(e));
  }finally{$.done();}
})();

/*********************************** API *************************************/
function ENV(){const e="undefined"!=typeof $task,t="undefined"!=typeof $loon,s="undefined"!=typeof $httpClient&&!t,i="function"==typeof require&&"undefined"!=typeof $jsbox;return{isQX:e,isLoon:t,isSurge:s,isNode:"function"==typeof require&&!i,isJSBox:i,isRequest:"undefined"!=typeof $request,isScriptable:"undefined"!=typeof importModule}}
function HTTP(e={baseURL:""}){const{isQX:t,isLoon:s,isSurge:i,isScriptable:n,isNode:o}=ENV(),r=/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/;const u={};return["GET","POST","PUT","DELETE","HEAD","OPTIONS","PATCH"].forEach(l=>u[l.toLowerCase()]=(u=>(function(u,l){l="string"==typeof l?{url:l}:l;const h=e.baseURL;h&&!r.test(l.url||"")&&(l.url=h?h+l.url:l.url);const a=(l={...e,...l}).timeout,c={onRequest:()=>{},onResponse:e=>e,onTimeout:()=>{},...l.events};let f,d;if(c.onRequest(u,l),t)f=$task.fetch({method:u,...l});else if(s||i||o)f=new Promise((e,t)=>{(o?require("request"):$httpClient)[u.toLowerCase()](l,(s,i,n)=>{s?t(s):e({statusCode:i.status||i.statusCode,headers:i.headers,body:n})})});else if(n){const e=new Request(l.url);e.method=u;e.headers=l.headers;e.body=l.body;f=new Promise((t,s)=>{e.loadString().then(s=>{t({statusCode:e.response.statusCode,headers:e.response.headers,body:s})}).catch(e=>s(e))})}const p=a?new Promise((e,t)=>{d=setTimeout(()=>(c.onTimeout(),t(`${u} URL: ${l.url} exceeds the timeout ${a} ms`)),a)}):null;return(p?Promise.race([p,f]).then(e=>(clearTimeout(d),e)):f).then(e=>c.onResponse(e))})(l,u))),u}
function API(e="untitled",t=!1){const{isQX:s,isLoon:i,isSurge:n,isNode:o,isJSBox:r,isScriptable:u}=ENV();return new class{constructor(e,t){this.name=e;this.debug=t;this.http=HTTP();this.env=ENV();this.node=(()=>{if(o){return{fs:require("fs")}}return null})(),this.initCache();Promise.prototype.delay=function(e){return this.then(function(t){return new Promise(function(s){setTimeout(s.bind(null,t),e)})})}}initCache(){if(s&&(this.cache=JSON.parse($prefs.valueForKey(this.name)||"{}")),(i||n)&&(this.cache=JSON.parse($persistentStore.read(this.name)||"{}")),o){let e="root.json";this.node.fs.existsSync(e)||this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e));this.root={};e=`${this.name}.json`;this.node.fs.existsSync(e)?this.cache=JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)):(this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e)),this.cache={})}}persistCache(){const e=JSON.stringify(this.cache,null,2);s&&$prefs.setValueForKey(e,this.name),(i||n)&&$persistentStore.write(e,this.name),o&&(this.node.fs.writeFileSync(`${this.name}.json`,e,{flag:"w"},e=>console.log(e)),this.node.fs.writeFileSync("root.json",JSON.stringify(this.root,null,2),{flag:"w"},e=>console.log(e)))}write(e,t){if(this.log(`SET ${t}`),-1!==t.indexOf("#")){t=t.substr(1);if(n||i)$persistentStore.write(e,t);else if(s)$prefs.setValueForKey(e,t);else if(o)this.root[t]=e}else this.cache[t]=e;this.persistCache()}read(e){this.log(`READ ${e}`);if(-1===e.indexOf("#"))return this.cache[e];e=e.substr(1);if(n||i)return $persistentStore.read(e);if(s)return $prefs.valueForKey(e);if(o)return this.root[e]}delete(e){this.log(`DELETE ${e}`);if(-1!==e.indexOf("#")){e=e.substr(1);if(n||i)$persistentStore.write(null,e);else if(s)$prefs.removeValueForKey(e);else if(o)delete this.root[e]}else{delete this.cache[t]}this.persistCache()}notify(e,t="",l="",h={}){const a=h["open-url"],c=h["media-url"];if(s&&$notify(e,t,l,h),n&&$notification.post(e,t,l+`${c?"\n多媒体:${c}":""}`,{url:a}),i){let s={};a&&(s.openUrl=a);c&&(s.mediaUrl=c);if(JSON.stringify(s)!=="{}")$notification.post(e,t,l,s);else $notification.post(e,t,l)}if(o||u){const s=l+(a?`\n点击跳转: ${a}`:"")+(c?`\n多媒体: ${c}`:"");if(r){require("push").schedule({title:e,body:(t?t+"\n":"")+s})}else console.log(`${e}\n${t}\n${s}\n\n`)}}log(e){this.debug&&console.log(`[${this.name}] LOG: ${this.stringify(e)}`)}info(e){console.log(`[${this.name}] INFO: ${this.stringify(e)}`)}error(e){console.log(`[${this.name}] ERROR: ${this.stringify(e)}`)}wait(e){return new Promise(t=>setTimeout(t,e))}done(e={}){if(s||i||n)$done(e);else if(o&&!r&&"undefined"!=typeof $context){$context.headers=e.headers;$context.statusCode=e.statusCode;$context.body=e.body}}stringify(e){if("string"==typeof e||e instanceof String)return e;try{return JSON.stringify(e,null,2)}catch(e){return"[object Object]"}}}(e,t)}