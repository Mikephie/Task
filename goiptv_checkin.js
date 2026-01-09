/**
 * IPTV 自动签到 - 智能双平台适配版（Surge + QingLong）
 * 运行时自动检测环境，选择对应 HTTP / 通知 / 结束方式
 */

// ===== 环境检测 =====
const isSurge = typeof $httpClient !== "undefined";
const isQingLong = typeof process !== "undefined" && process.env;

// ===== HTTP 客户端适配 =====
let httpPost;
if (isQingLong) {
  // 青龙用 axios
  const axios = require("axios");
  httpPost = (url, headers, body) => axios.post(url, body, { headers });
} else if (isSurge) {
  // Surge 用 $httpClient.post
  httpPost = (url, headers, body) =>
    new Promise((resolve, reject) => {
      $httpClient.post({ url, headers, body: JSON.stringify(body) }, (err, res, data) => {
        if (err) reject(err);
        else resolve({ res, data });
      });
    });
}

// ===== 本地存储 Key =====
const COOKIE_KEY = "iptv_cookie_storage";

// ===== 通知适配 =====
function notify(title, subtitle, content) {
  if (isSurge) {
    $notification.post(title, subtitle, content);
  }
  console.log(`\n🔔 ${title}\n📌 ${subtitle}\n📝 ${content}`);
}

// ===== 结束适配 =====
function done(result = {}) {
  if (isSurge) {
    $done(result);
  }
  if (isQingLong) {
    process.exit(0);
  }
}

// ===== 主逻辑 =====
async function run() {
  // 读取 persistentStore 里的 Cookie 并打印
  let storedCookie = null;
  if (isSurge) {
    storedCookie = $persistentStore.read(COOKIE_KEY);
  } else if (isQingLong) {
    storedCookie = process.env.IPTV_COOKIE;
  }

  console.log("\n================ COOKIE ================");
  console.log(storedCookie);
  console.log("=======================================\n");

  // --- Cookie 捕获分支（仅 Rewrite 触发时生效）---
  if (isSurge && typeof $request !== "undefined") {
    const ck = $request.headers["Cookie"] || $request.headers["cookie"];
    console.log("[IPTV] 检测到请求头 Cookie:", ck);

    if (ck && ck.includes("session=")) {
      $persistentStore.write(ck, COOKIE_KEY);
      console.log("Cookie 已保存到 Surge persistentStore");

      notify("IPTV 签到助手", "✅ Cookie 捕获成功", ck);
    }
    return done({});
  }

  // --- 签到分支（手动运行 or Cron 触发）---
  if (!storedCookie) {
    console.log("❌ 未找到可用 Cookie，终止签到");
    return done();
  }

  console.log("🚀 进入签到模式...");

  try {
    const { data } = await httpPost(
      "https://www.go-iptv.ggff.net/user.php?action=checkin",
      {
        "User-Agent": "Mozilla/5.0",
        "Cookie": storedCookie,
        "Referer": "https://www.go-iptv.ggff.net/user.html",
        "X-Requested-With": "XMLHttpRequest",
      },
      {}
    );

    console.log("📩 签到响应:", data);

    if (data.includes("coroutine is not JSON serializable")) {
      console.log("⚠ 可能已签到成功（协程错误提示）");
      notify("IPTV", "⚠ 签到可能已成功", data);
    } else {
      const res = JSON.parse(data);
      if (res.ok) {
        notify("IPTV", "✅ 签到成功", `积分: ${res.coins} (+${res.bonus})`);
      } else {
        console.log("❌ 签到失败:", res.msg);
      }
    }
  } catch (err) {
    console.log("❌ 签到请求失败:", err.message);
  }

  done();
}

run();