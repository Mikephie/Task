/**
 * IPTV 自动签到脚本 (Node.js 终端版)
 * 适配站点: www.go-iptv.ggff.net
 * 运行命令: node checkin.js
 */

// ================= 配置区域 =================
// 请填入你刚才在 iMac 浏览器捕获到的完整 Cookie (eyJ... 字符串)
const COOKIE_STR = `session=eyJ1c2VybmFtZSI6ICJtaWtlcGhpZSJ9.aVkP3A.ok6u4eGQsx8t_UXghF4BnnBq8NY; path=/; Max-Age=1209600; httponly; samesite=lax`;

// 接口地址 (基于抓包确定的 PHP 后端接口)
const LOGIN_URL = "https://www.go-iptv.ggff.net/user.php?action=checkin";
// ===========================================

async function doCheckin() {
    console.log("--- 正在启动 IPTV 签到任务 ---");

    // 严格对齐图 18 中 iMac Chrome 的请求头参数
    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Cookie": COOKIE_STR.trim(),
        "Origin": "https://www.go-iptv.ggff.net",
        "Referer": "https://www.go-iptv.ggff.net/user.html",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Dest": "empty",
        "Accept-Language": "en-GB,en;q=0.9,zh-TW;q=0.8,zh-CN;q=0.7,zh;q=0.6,en-US;q=0.5"
    };

    try {
        const response = await fetch(LOGIN_URL, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({}) // 发送空负载，对应 Content-Length: 2
        });

        const status = response.status;
        const text = await response.text();

        console.log(`服务器状态码: ${status}`);
        console.log(`原始响应内容: ${text}`);

        if (status === 200) {
            if (text.includes("NOT_LOGGED_IN")) {
                console.log("❌ 错误：Cookie 格式正确但已失效，请重新登录网页抓取");
            } else {
                try {
                    const resJson = JSON.parse(text);
                    console.log(`✅ 签到成功！结果内容: ${JSON.stringify(resJson)}`);
                } catch (e) {
                    console.log("✅ 签到请求已成功发送");
                }
            }
        } else {
            console.log(`❌ 签到异常，错误代码: ${status}`);
        }
    } catch (error) {
        console.error(`❌ 脚本运行崩溃: ${error.message}`);
    }
}

doCheckin();