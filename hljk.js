/****************************************
 * 监控汇率变化（CurrencyFreaks 主源 + exchangerate.host 兜底）
 * 原作者: Peng-YM | Alter: chxm1023 | update: YangZhaocool
 * 加强：支持 NGN；主源缺值或限流时自动兜底
 ****************************************/

const base   = "SGD"; // 基准货币：SGD / USD / CNY / NGN ...
const digits = 3;     // 小数位显示

const $ = API("exchange");

// ---- 你的 CurrencyFreaks API Key（如要改为持久化，见文末说明）----
const CF_KEY = "5c9ea957495c432b8afcb17f04b1e890";

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
  NGN: ["奈拉", "🇳🇬"], // 关键：奈拉
};

// 展示顺序（未列出的会接在后面）
const ORDER = ["MYR","USD","EUR","GBP","CNY","HKD","JPY","KRW","THB","VND","TRY","INR","NGN"];

/* ========== 工具 ========== */
function roundNumber(num, scale) {
  if (!("" + num).includes("e")) {
    return +(Math.round(num + "e+" + scale) + "e-" + scale);
  } else {
    const arr = ("" + num).split("e");
    const sig = (+arr[1] + scale > 0) ? "+" : "";
    return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
  }
}

// 把 "1 responseBase -> ? target" 归一化成 "1 desiredBase -> ? target"
function normalizeRates(ratesMap, responseBase, desiredBase) {
  const out = {};
  if (!ratesMap) return out;
  if (responseBase === desiredBase) return { ...ratesMap };
  const rDesired = ratesMap[desiredBase];
  if (!rDesired || rDesired <= 0) return out;
  for (const k of Object.keys(ratesMap)) {
    if (k === desiredBase) continue;
    const v = ratesMap[k];
    if (v > 0) out[k] = v / rDesired;
  }
  return out;
}

/* ========== 数据源 ========== */
// 主源：CurrencyFreaks（支持 NGN）
async function getFromCF(baseCode, symbols) {
  if (!CF_KEY) return { date: "", rates: {} };
  const url = `https://api.currencyfreaks.com/latest?apikey=${encodeURIComponent(CF_KEY)}&base=${encodeURIComponent(baseCode)}&symbols=${encodeURIComponent(symbols.join(","))}`;
  const resp = await $.http.get({ url });
  const data = JSON.parse(resp.body || "{}");
  const responseBase = data.base || baseCode; // 某些套餐可能强制 USD，这里统一归一化
  const norm = normalizeRates(data.rates || {}, responseBase, baseCode);
  return { date: data.date || "", rates: norm };
}

// 兜底：exchangerate.host（免 Key，拉全量更稳）
async function getFromHost(baseCode) {
  const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(baseCode)}`;
  const resp = await $.http.get({ url });
  const data = JSON.parse(resp.body || "{}");
  return { date: data.date || "", rates: data.rates || {} };
}

/* ========== 主流程 ========== */
(async () => {
  try {
    const source = currencyNames[base] || [base, ""];
    const wanted = Object.keys(currencyNames).filter(k => k !== base);

    // 为便于 cross conversion，把 base 本身也加入 symbols
    const symbols = Array.from(new Set([...wanted, base]));

    // 先试 CF
    let cf = { date: "", rates: {} };
    try { cf = await getFromCF(base, symbols); } catch (_) {}

    // 如 CF 没数据或缺项，再用 host 补齐
    let finalDate = cf.date || "";
    let finalRates = { ...(cf.rates || {}) };

    let host = { date: "", rates: {} };
    try { host = await getFromHost(base); } catch (_) {}

    if (!finalDate && host.date) finalDate = host.date;

    // 用 host 补缺
    for (const k of wanted) {
      if (!(k in finalRates) && host.rates && host.rates[k] > 0) {
        finalRates[k] = host.rates[k];
      }
    }

    // 排序并生成文本
    const orderSet = new Set(ORDER);
    const sorted = [
      ...ORDER.filter(k => k !== base && wanted.includes(k)),
      ...wanted.filter(k => !orderSet.has(k)).sort()
    ];

    const info = sorted.reduce((acc, key) => {
      const target = currencyNames[key] || [key, ""];
      const val = finalRates[key];
      if (val > 0) {
        return acc + `${target[1]} 1${source[0]}兑${roundNumber(val, digits)}${target[0]}\n`;
      } else {
        return acc + `${target[1]} ${target[0]}：暂无数据（源未提供）\n`;
      }
    }, "");

    $.notify(
      `[今日汇率] 基准：${source[1]} ${source[0]} (${base})`,
      `⏰ 更新时间：${finalDate || "--"}`,
      `📈 汇率情况：\n${info}`
    );
  } catch (e) {
    $.notify("[今日汇率] 错误", "", String(e));
  } finally {
    $.done();
  }
})();

/*********************************** API *************************************/
function ENV(){
  const isQX  = typeof $task !== "undefined";
  const isLoon= typeof $loon !== "undefined";
  const isSurge = typeof $httpClient !== "undefined" && !isLoon;
  const isNode  = typeof require === "function" && typeof $jsbox === "undefined";
  const isJSBox = typeof $jsbox !== "undefined";
  const isRequest = typeof $request !== "undefined";
  const isScriptable = typeof importModule !== "undefined";
  return { isQX, isLoon, isSurge, isNode, isJSBox, isRequest, isScriptable };
}
function HTTP(opts = { baseURL: "" }){
  const { isQX, isLoon, isSurge, isScriptable, isNode } = ENV();
  const u = {};
  ["GET","POST","PUT","DELETE","HEAD","OPTIONS","PATCH"].forEach((m)=>{
    u[m.toLowerCase()] = (cfg) => {
      cfg = (typeof cfg === "string") ? { url: cfg } : cfg;
      const url = opts.baseURL && cfg.url && !/^https?:\/\//i.test(cfg.url) ? opts.baseURL + cfg.url : (cfg.url || "");
      const timeout = cfg.timeout;
      const headers = cfg.headers || {};
      const body = cfg.body;

      const onResponse = (resp) => resp;
      let reqPromise;
      if (isQX) {
        reqPromise = $task.fetch({ method: m, url, headers, body });
      } else if (isLoon || isSurge || isNode) {
        reqPromise = new Promise((resolve, reject)=>{
          const client = isNode ? require("request") : $httpClient;
          client[m.toLowerCase()]({ url, headers, body }, (err, resp, data)=>{
            if (err) reject(err);
            else resolve({ statusCode: resp.status || resp.statusCode, headers: resp.headers, body: data });
          });
        });
      } else if (isScriptable) {
        const req = new Request(url);
        req.method = m;
        req.headers = headers;
        if (body) req.body = body;
        reqPromise = req.loadString().then((data)=>({
          statusCode: req.response.statusCode,
          headers: req.response.headers,
          body: data
        }));
      } else {
        reqPromise = Promise.reject(new Error("Unsupported runtime"));
      }

      if (timeout) {
        return Promise.race([
          reqPromise.then(onResponse),
          new Promise((_, rej)=>setTimeout(()=>rej(new Error(`Timeout ${timeout}ms`)), timeout))
        ]);
      }
      return reqPromise.then(onResponse);
    };
  });
  return u;
}
function API(name = "untitled", debug = false){
  const { isQX, isLoon, isSurge, isNode, isJSBox } = ENV();
  return new (class {
    constructor(name, debug){
      this.name = name;
      this.debug = debug;
      this.http = HTTP();
      this.env = ENV();
      this.cache = {};
      this.root = {};
      if (isQX) {
        try { this.cache = JSON.parse($prefs.valueForKey(this.name) || "{}"); } catch(_) {}
      } else if (isLoon || isSurge) {
        try { this.cache = JSON.parse($persistentStore.read(this.name) || "{}"); } catch(_) {}
      }
    }
    read(key){
      if (key.startsWith("#")) {
        const k = key.slice(1);
        if (isLoon || isSurge) return $persistentStore.read(k);
        if (isQX) return $prefs.valueForKey(k);
        return undefined;
      }
      return this.cache[key];
    }
    write(value, key){
      if (key.startsWith("#")) {
        const k = key.slice(1);
        if (isLoon || isSurge) return $persistentStore.write(value, k);
        if (isQX) return $prefs.setValueForKey(value, k);
        return false;
      }
      this.cache[key] = value;
      const str = JSON.stringify(this.cache, null, 2);
      if (isQX) $prefs.setValueForKey(str, this.name);
      if (isLoon || isSurge) $persistentStore.write(str, this.name);
      return true;
    }
    notify(title, sub = "", body = "", opts = {}){
      const openUrl = opts["open-url"];
      const mediaUrl = opts["media-url"];
      if (isQX) $notify(title, sub, body, opts);
      else if (isLoon) $notification.post(title, sub, body, openUrl ? { openUrl } : {});
      else if (isSurge) $notification.post(title, sub, body);
      else console.log(`${title}\n${sub}\n${body}`);
    }
    log(...args){ if (this.debug) console.log(`[${this.name}]`, ...args); }
    done(obj = {}){
      if (isQX || isLoon || isSurge) $done(obj);
    }
  })(name, debug);
}
/*****************************************************************************/

/* ========== 可选：更安全的 Key 存法 ==========
1) 先运行一次（单独的小脚本）保存 Key：
   $persistentStore.write("5c9ea957495c432b8afcb17f04b1e890","EX_API_CF_KEY"); $done();

2) 然后把上面的
   const CF_KEY = "5c9ea957495c432b8afcb17f04b1e890";
   改成
   const CF_KEY = $.read("EX_API_CF_KEY") || "";
================================================ */