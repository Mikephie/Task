/**
 * IPTV 自动签到 - 智能双平台适配版（Surge iOS + QingLong Node）
 * 运行时自动检测环境，选择对应 HTTP / 通知 / 结束方式
 */

// ===== 环境检测 =====
const isSurge = typeof $httpClient !== "undefined";
const isQingLong = typeof process !== "undefined" && process.env;

// ===== Cookie Key（Surge 端存储用）=====
const COOKIE_KEY = "iptv_cookie_storage";

// ===== HTTP 客户端适配 =====
let httpPost;
if (isQingLong) {
  const axios = require("axios");
  httpPost = (url, headers, body) => axios.post(url, body, { headers });
} else if (isSurge) {
  httpPost = (url, headers, body) =>
    new Promise((resolve, reject) => {
      $httpClient.post({ url, headers, body: JSON.stringify(body) }, (err, res, data) => {
        if (err) reject(err);
        else resolve({ res, data });
      });
    });
}

// ===== 通知适配（保持 Surge 结构）=====
function notify(title, subtitle, content) {
  if (isSurge) {
    $notification.post(title, subtitle, content);
  }
  console.log(`\n[NOTIFY]\n🔔 ${title}\n📌 ${subtitle}\n📝 ${content}\n`);
}

// ===== 结束适配 =====
function done(result = {}) {
  if (isSurge) {
    $done(result);
  }
  if (isQingLong) {
    // 不 exit 影响 promise callback，延迟结束
    setTimeout(() => process.exit(0), 50);
  }
}

// ===== 主执行函数 =====
async function run() {
  console.log(`\n[IPTV 签到助手] 脚本开始执行...\n`);

  // 读取 Cookie（Surge 端从 persistentStore，青龙从 env）
  let storedCookie = null;
  if (isSurge) {
    storedCookie = $persistentStore.read(COOKIE_KEY);
  } else if (isQingLong) {
    storedCookie = process.env.IPTV_COOKIE || null;
  }

  console.log("================= COOKIE =================");
  console.log(storedCookie);
  console.log("=========================================\n");

  // --- Surge Rewrite 捕获分支 ---
  if (isSurge && typeof $request !== "undefined") {
    const ck = $request.headers["Cookie"] || $request.headers["cookie"];
    console.log("[IPTV] 检测到请求头 Cookie:", ck);

    if (ck && ck.includes("session=")) {
      $persistentStore.write(ck, COOKIE_KEY);
      console.log("Cookie 已保存到 Surge persistentStore");

      notify("IPTV 签到助手", "✅ Cookie 捕获成功", ck);
    } else {
      console.log("⚠ 未检测到有效 session= Cookie");
    }
    return done({});
  }

  // --- 签到执行分支（Surge/Cron/青龙手动/Cron）---
  if (!storedCookie) {
    console.log("❌ 未找到 Cookie，终止签到流程");
    return done();
  }

  console.log("🚀 进入签到模式...\n");

  const requestBody = {}; // 保持 JSON 结构但不硬编码 "{}"
  const targetUrl = "https://www.go-iptv.ggff.net/user.php?action=checkin";
  const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Cookie": storedCookie,
    "Referer": "https://www.go-iptv.ggff.net/user.html",
    "X-Requested-With": "XMLHttpRequest"
  };

  try {
    const response = await httpPost(targetUrl, headers, requestBody);

    let bodyData = response.data;
    let bodyStr = "";

    // 适配返回类型（Surge 返回字符串，axios 返回对象）
    if (typeof bodyData === "string") {
      bodyStr = bodyData;
    } else if (typeof bodyData === "object") {
      bodyStr = JSON.stringify(bodyData);
    }

    console.log("📩 签到原始响应:", bodyStr, "\n");

    // 处理协程错误提示（图一曾出现过这种情况）
    if (bodyStr.includes("coroutine is not JSON serializable")) {
      console.log("⚠ 检测到协程提示，通常表示签到已成功但返回不可序列化信息");
      notify("IPTV", "⚠ 签到可能已成功", bodyStr);
    } else {
      // 解析 JSON 结果
      let resultObj = null;
      try {
        resultObj = JSON.parse(bodyStr);
      } catch (e) {
        resultObj = null;
      }

      if (resultObj && resultObj.ok) {
        notify("IPTV", "✅ 签到成功", `积分: ${resultObj.coins} (+${resultObj.bonus})`);
      } else if (resultObj) {
        console.log("❌ 签到失败:", resultObj.msg || "未知错误信息");
      } else {
        console.log("❌ 响应解析失败，非 JSON 结构:", bodyStr);
      }
    }
  } catch (err) {
    console.log("❌ HTTP 请求异常:", err.message);
  }

  done();
}

// ===== 立即执行脚本 =====
run();