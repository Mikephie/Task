/****************************************
 * 今日汇率监控（对齐加强版）
 * 基准：SGD；顺序：MYR, USD, EUR, GBP, CNY, HKD, JPY, KRW, NGN, THB
 ****************************************/
const base   = "SGD";
const digits = 3;
const NUM_WIDTH = 8;      // 数字列宽（8~10 之间可调）
const SHOW_FLAGS = false; // 旗帜放行尾；关=最整齐

const $ = API("exchange");

const ORDER = ["MYR","USD","EUR","GBP","CNY","HKD","JPY","KRW","NGN","THB"];

const currencyNames = {
  SGD: ["新币", "🇸🇬"],
  MYR: ["马币", "🇲🇾"],
  USD: ["美元", "🇺🇸"],
  EUR: ["欧元", "🇪🇺"],
  GBP: ["英镑", "🇬🇧"],
  CNY: ["人民币","🇨🇳"],
  HKD: ["港币", "🇭🇰"],
  JPY: ["日元", "🇯🇵"],
  KRW: ["韩元", "🇰🇷"],
  NGN: ["奈拉", "🇳🇬"],
  THB: ["泰铢", "🇹🇭"],
};

// ---- 对齐工具 ----
// 两字补"全角空格"到三字宽
function padName(name){const FW="　";return name.length===2?name+FW:name;}
// 数字用 Figure Space 等宽右对齐
function padNum(num,width){const FIG="\u2007";return String(num).padStart(width," ").replace(/ /g,FIG);}
// 四舍五入
function roundNumber(num,scale){if(!(""+num).includes("e"))return +(Math.round(num+"e+"+scale)+"e-"+scale);let a=(""+num).split("e"),sig="";if(+a[1]+scale>0)sig="+";return +(Math.round(+a[0]+"e"+sig+(+a[1]+scale))+"e-"+scale);}

// 拉取主源（免 Key）
async function getRates(baseCode){
  const resp=await $.http.get({url:`https://api.exchangerate-api.com/v4/latest/${baseCode}`});
  const data=JSON.parse(resp.body||"{}");
  return {date:data.date,rates:data.rates||{}};
}

(async()=>{
  try{
    const {date,rates}=await getRates(base);
    const src = currencyNames[base] || [base,""];

    const body = ORDER.reduce((out, code)=>{
      const meta = currencyNames[code]; if(!meta) return out;
      const r = rates[code]; if(!(r>0)) return out;
      const name3 = padName(meta[0]);
      const num   = padNum(roundNumber(r, digits), NUM_WIDTH);
      const tail  = SHOW_FLAGS ? `  ${meta[1]}` : "";
      return out + `${name3}：1${src[0]}兑 ${num}${tail}\n`;
    }, "");

    $.notify(
      `[今日汇率] 基准：${SHOW_FLAGS?src[1]+" ":""}${src[0]} (${base})`,
      `⏰ 更新时间：${date||"--"}`,
      `📈 汇率情况：\n${body}`
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
function API(e="untitled",t=!1){const{isQX:s,isLoon:i,isSurge:n,isNode:o,isJSBox:r,isScriptable:u}=ENV();return new class{constructor(e,t){this.name=e,this.debug=t,this.http=HTTP(),this.env=ENV(),this.node=(()=>{if(o){return{fs:require("fs")}}return null})(),this.initCache();Promise.prototype.delay=function(e){return this.then(function(t){return new Promise(function(s){setTimeout(s.bind(null,t),e)})})}}initCache(){if(s&&(this.cache=JSON.parse($prefs.valueForKey(this.name)||"{}")),(i||n)&&(this.cache=JSON.parse($persistentStore.read(this.name)||"{}")),o){let e="root.json";this.node.fs.existsSync(e)||this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e)),this.root={},e=`${this.name}.json`,this.node.fs.existsSync(e)?this.cache=JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)):(this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e)),this.cache={})}}persistCache(){const e=JSON.stringify(this.cache,null,2);s&&$prefs.setValueForKey(e,this.name),(i||n)&&$persistentStore.write(e,this.name),o&&(this.node.fs.writeFileSync(`${this.name}.json`,e,{flag:"w"},e=>console.log(e)),this.node.fs.writeFileSync("root.json",JSON.stringify(this.root,null,2),{flag:"w"},e=>console.log(e)))}write(e,t){this.log(`SET ${t}`);if(-1!==t.indexOf("#")){t=t.substr(1);if(n||i)$persistentStore.write(e,t);else if(s)$prefs.setValueForKey(e,t);else if(o)this.root[t]=e}else{this.cache[t]=e}this.persistCache()}read(e){this.log(`READ ${e}`);if(-1===e.indexOf("#"))return this.cache[e];e=e.substr(1);if(n||i)return $persistentStore.read(e);if(s)return $prefs.valueForKey(e);if(o)return this.root[e]}del(e){this.log(`DELETE ${e}`);if(-1!==e.indexOf("#")){e=e.substr(1);if(n||i)$persistentStore.write(null,e);else if(s)$prefs.removeValueForKey(e);else if(o)delete this.root[e]}else{delete this.cache[e]}this.persistCache()}notify(e,t="",l="",h={}){const a=h["open-url"],c=h["media-url"];if(s&&$notify(e,t,l,h),n&&$notification.post(e,t,l+`${c?"\n多媒体:${c}":""}`,{url:a}),i){let s={};if(a)s.openUrl=a;if(c)s.mediaUrl=c;if(JSON.stringify(s)!=="{}")$notification.post(e,t,l,s);else $notification.post(e,t,l)}if(o||u){const s=l+(a?`\n点击跳转: ${a}`:"")+(c?`\n多媒体: ${c}`:"");if(r){require("push").schedule({title:e,body:(t?t+"\n":"")+s})}else console.log(`${e}\n${t}\n${s}\n\n`)}}log(e){this.debug&&console.log(`[${this.name}] LOG: ${this.stringify(e)}`)}info(e){console.log(`[${this.name}] INFO: ${this.stringify(e)}`)}error(e){console.log(`[${this.name}] ERROR: ${this.stringify(e)}`)}wait(e){return new Promise(t=>setTimeout(t,e))}done(e={}){if(s||i||n)$done(e);else if(o&&!r&&"undefined"!=typeof $context){$context.headers=e.headers;$context.statusCode=e.statusCode;$context.body=e.body}}stringify(e){if("string"==typeof e||e instanceof String)return e;try{return JSON.stringify(e,null,2)}catch(e){return"[object Object]"}}}(e,t)}