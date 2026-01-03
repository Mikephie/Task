/**
 * IPTV 自动签到 - 青龙适配版
 * 变量名: IPTV_COOKIE
 */

const fetch = require('node-fetch'); // 如果青龙环境 node 版本低于 18，需要安装此依赖

async function doCheckin() {
    // 1. 从环境变量读取 Cookie
    const cookie = process.env.IPTV_COOKIE;

    if (!cookie) {
        console.log("❌ 错误：未在青龙环境变量中找到 IPTV_COOKIE");
        return;
    }

    console.log("--- 正在启动 IPTV 签到任务 ---");

    const loginUrl = "https://www.go-iptv.ggff.net/user.php?action=checkin";
    
    // 2. 依然使用你 iMac 上成功的 Headers 指纹
    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Cookie": cookie.trim(),
        "Origin": "https://www.go-iptv.ggff.net",
        "Referer": "https://www.go-iptv.ggff.net/user.html",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Dest": "empty"
    };

    try {
        const response = await fetch(loginUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({})
        });

        const text = await response.text();
        console.log(`服务器返回状态码: ${response.status}`);
        console.log(`原始响应内容: ${text}`);

        if (text.includes('"ok":true')) {
            console.log("✅ 签到成功！");
        } else if (text.includes("NOT_LOGGED_IN")) {
            console.log("❌ 失败：Cookie 已失效，请更新环境变量");
        } else {
            console.log("⚠️ 响应异常，请检查日志");
        }
    } catch (error) {
        console.error(`❌ 运行崩溃: ${error.message}`);
    }
}

doCheckin();
