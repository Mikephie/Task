/**
 * IPTV 自动签到 - 零依赖原生版
 * 变量名称: IPTV_COOKIE
 */

const https = require('https');

const IPTV_COOKIE = process.env.IPTV_COOKIE;

async function doCheckin() {
    if (!IPTV_COOKIE) {
        console.log("❌ 错误：环境变量中未找到 IPTV_COOKIE");
        return;
    }

    console.log("--- 正在启动 IPTV 签到任务 (原生 HTTPS 模式) ---");

    const options = {
        hostname: 'www.go-iptv.ggff.net',
        path: '/user.php?action=checkin',
        method: 'POST',
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
            "Cookie": IPTV_COOKIE.trim(),
            "Origin": "https://www.go-iptv.ggff.net",
            "Referer": "https://www.go-iptv.ggff.net/user.html",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Dest": "empty"
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`服务器状态码: ${res.statusCode}`);
            console.log(`原始响应内容: ${data}`);

            if (data.includes('"ok":true')) {
                console.log("✅ 签到成功！");
            } else if (data.includes("already")) {
                console.log("✅ 今天已经签到过了");
            } else {
                console.log("⚠️ 签到异常，请检查响应内容");
            }
        });
    });

    req.on('error', (e) => {
        console.error(`❌ 请求崩溃: ${e.message}`);
    });

    // 发送空 JSON 体 {}
    req.write(JSON.stringify({}));
    req.end();
}

doCheckin();
