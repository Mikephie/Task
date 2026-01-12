/**
 * IPTV 自动签到 - 最终稳定版
 * 智能适配 Surge iOS + 青龙 QingLong
 * 关键修复：Cookie 规范化，解决青龙首次 400 问题
 */

// ================= 环境检测 =================
const isSurge = typeof $httpClient !== "undefined";
const isQingLong = typeof process !== "undefined" && process.env;

// ================= 常量 =================
const COOKIE_KEY = "iptv_cookie_storage";
const CHECKIN_URL = "https://www.go-iptv.ggff.net/user.php?action=checkin";

// ================= Cookie 规范化（核心修复） =================
function normalizeCookie(raw) {
  if (!raw) return null;
  // 只保留 session=xxxx，去掉 path / Max-Age / httponly / samesite
  return raw.split(";")[0].trim();
}

// ================= HTTP POST 适配 =================
let httpPost;
if (isQingLong) {
  const axios = require("axios");
  httpPost = (url, headers, body) =>
    axios.post(url, body, { headers, timeout: 15000 });
} else if (isSurge) {
  httpPost = (url, headers, body) =>
    new Promise((resolve, reject) => {
      $httpClient.post(
        { url, headers, body: JSON.stringify(body) },
        (err, resp, data) => {
          if (err) reject(err);
          else resolve({ data });
        }
      );
    });
}

// ================= 通知适配 =================
function notify(title, subtitle, content) {
  if (isSurge) {
    $notification.post(title, subtitle, content);
  }
  console.log(`\n[NOTIFY]\n🔔 ${title}\n📌 ${subtitle}\n📝 ${content}\n`);
}

// ================= 结束适配 =================
function done(result = {}) {
  if (isSurge) {
    $done(result);
  } else if (isQingLong) {
    setTimeout(() => process.exit(0), 50);
  }
}

// ================= 主逻辑 =================
async function run() {
  console.log(`[IPTV 签到助手] 脚本开始执行...\n`);

  // -------- 读取 Cookie --------
  let rawCookie = null;
  if (isSurge) {
    rawCookie = $persistentStore.read(COOKIE_KEY);
  } else if (isQingLong) {
    rawCookie = process.env.IPTV_COOKIE || null;
  }

  let cookie = normalizeCookie(rawCookie);

  console.log("================= COOKIE =================");
  console.log(cookie);
  console.log("=========================================\n");

  // -------- Surge Rewrite 捕获 Cookie --------
  if (isSurge && typeof $request !== "undefined") {
    const ck = $request.headers["Cookie"] || $request.headers["cookie"];
    if (ck && ck.includes("session=")) {
      $persistentStore.write(ck, COOKIE_KEY);
      notify("IPTV 签到助手", "✅ Cookie 捕获成功", normalizeCookie(ck));
    } else {
      console.log("⚠ 未检测到有效 session Cookie");
    }
    return done({});
  }

  // -------- 签到执行 --------
  if (!cookie) {
    console.log("❌ 未找到 Cookie，终止签到");
    return done();
  }

  console.log("🚀 进入签到模式...\n");

  const headers = {
    "User-Agent": "Mozilla/5.0",
    "Cookie": cookie,
    "Referer": "https://www.go-iptv.ggff.net/user.html",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json"
  };

  try {
    const resp = await httpPost(CHECKIN_URL, headers, {});
    let body = resp.data;
    let bodyStr = typeof body === "string" ? body : JSON.stringify(body);

    console.log("📩 签到原始响应:", bodyStr);

    // 协程异常提示（站点特性）
    if (bodyStr.includes("coroutine is not JSON serializable")) {
      notify("IPTV", "⚠ 签到可能已成功", bodyStr);
      return done();
    }

    let result;
    try {
      result = typeof body === "object" ? body : JSON.parse(bodyStr);
    } catch (e) {
      console.log("❌ JSON 解析失败");
      return done();
    }

    if (result.ok) {
      notify(
        "IPTV",
        "✅ 签到成功",
        `积分: ${result.coins} (+${result.bonus})`
      );
    } else {
      console.log("❌ 签到失败:", result.msg || "未知错误");
    }
  } catch (err) {
    console.log("❌ HTTP 请求异常:", err.message);
  }

  done();
}

// ================= 启动 =================
run();