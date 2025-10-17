// ====== 与面板相同的配置 ======
const BASE = "SGD";
const DIGITS = 3;
const SNAP_KEY = `exch.snap.${BASE}`;
const ORDER = ["MYR","USD","EUR","GBP","CNY","HKD","JPY","KRW","NGN","THB"];
const SHOW  = ORDER.slice();

const FULL = "\u3000", FIG = "\u2007";
const NAME_W = 3, VAL_W = 8;

const CN = { MYR:"马币", USD:"美元", EUR:"欧元", GBP:"英镑", CNY:"人民币", HKD:"港币", JPY:"日元", KRW:"韩元", THB:"泰铢", NGN:"奈拉" };
const FLAG = { MYR:"🇲🇾", USD:"🇺🇸", EUR:"🇪🇺", GBP:"🇬🇧", CNY:"🇨🇳", HKD:"🇭🇰", JPY:"🇯🇵", KRW:"🇰🇷", THB:"🇹🇭", NGN:"🇳🇬" };

function dispName(code){ const n = CN[code] || code; const a=[...n]; return a.length===2 ? a[0]+FULL+a[1] : n; }
function padRightFull(s,w){ const len=[...s].length; return len>=w?s:s+FULL.repeat(w-len); }
function padLeftFig(s,w){ s=String(s); return s.length>=w?s:FIG.repeat(w-s.length)+s; }

function getJSON(url){ return new Promise((res,rej)=>$httpClient.get(url,(e,r,b)=>e?rej(e):res(JSON.parse(b)))); }
async function fetchRates(base){
  const r1 = await getJSON(`https://api.exchangerate-api.com/v4/latest/${encodeURIComponent(base)}`).catch(_=>({}));
  let rates = (r1 && r1.rates) ? r1.rates : {};
  const missing = SHOW.filter(c=>c!==base && !rates[c]);
  if (missing.length){
    const r2 = await getJSON(`https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(missing.join(","))}`).catch(_=>({}));
    if (r2 && r2.rates) rates = Object.assign(rates, r2.rates);
  }
  return { date: r1 && r1.date || "", rates };
}

function buildLines(nowDict, prevDict, digits){
  const out = [];
  for (const code of SHOW){
    const cur = nowDict[code];
    if (!cur) continue;
    const prev = prevDict ? prevDict[code] : null;
    const pct  = (prev && prev>0) ? ((cur - prev)/prev*100) : 0;
    const name = padRightFull(dispName(code), NAME_W);
    const num  = padLeftFig(cur.toFixed(digits), VAL_W);
    const pctStr = (prev==null) ? "--" : (pct===0 ? "0.0%" : (pct>0?`+${pct.toFixed(1)}%`:`${pct.toFixed(1)}%`));
    out.push(`${FLAG[code]||""} ${name} 1新币 ${"→"} ${num}  ${pctStr}`);
  }
  return out;
}

async function notifySplit(title, subtitle, lines, chunk=7){
  if (!lines.length){ $notification.post(title, subtitle, "暂无数据"); return; }
  for (let i=0;i<lines.length;i+=chunk){
    const body = lines.slice(i, i+chunk).join("\n");
    $notification.post(title, subtitle, body);
    await new Promise(r=>setTimeout(r,150));
  }
}

(async () => {
  try{
    const {date, rates} = await fetchRates(BASE);
    const prev = JSON.parse($persistentStore.read(SNAP_KEY)||"{}");

    // 首次：只建快照，不打扰
    if (!prev || Object.keys(prev).length===0){
      $persistentStore.write(JSON.stringify(pickShow(rates)), SNAP_KEY);
      $notification.post("[今日汇率] 首次准备完成", "已建立对比快照", `基准：新币 (SGD)`);
      return $done();
    }

    const lines = buildLines(rates, prev, DIGITS);
    await notifySplit(`[今日汇率] 基准：新币 (SGD)`, `更新时间：${date||"--"}`, lines);

    // 【重要修改】仅在成功获取到新汇率数据时，才覆盖快照
    if (Object.keys(rates).length > 0) {
      $persistentStore.write(JSON.stringify(pickShow(rates)), SNAP_KEY);
    }
    
    $done();
  }catch(e){
    $notification.post("[今日汇率] 错误", "", String(e));
    $done();
  }
})();

function pickShow(rates){ const o={}; for (const k of SHOW){ if (rates[k]) o[k]=rates[k]; } return o; }
