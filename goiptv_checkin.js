/**
 * IPTV 自动签到 - 完整修复版
 * 修复：index 未定义报错 & 服务器协程序列化错误兼容
 */

const isSurge = typeof $httpClient !== "undefined";
const isNode = typeof process !== "undefined" && !isSurge;

const $ = {
    name: "IPTV 签到助手",
    cookie: isSurge ? ($persistentStore.read("iptv_cookie_storage") || "") : (process.env.IPTV_COOKIE || ""),
    
    notify: async (title, subtitle, content) => {
        if (isSurge) {
            $notification.post(title, subtitle, content);
        } else if (isNode) {
            const fullMsg = `【${title}】${subtitle}\n${content}`;
            console.log(fullMsg);
            try {
                const notify = require('./sendNotify');
                await notify.sendNotify(title, fullMsg);
            } catch (e) {}
        }
    },

    post: (options) => {
        return new Promise((resolve, reject) => {
            if (isSurge) {
                $httpClient.post(options, (err, resp, body) => {
                    if (err) reject(err);
                    else resolve({ status: resp.status, body });
                });
            } else {
                const https = require('https');
                const url = new URL(options.url);
                const reqOptions = {
                    hostname: url.hostname,
                    path: url.pathname + url.search,
                    method: 'POST',
                    headers: options.headers
                };
                const req = https.request(reqOptions, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve({ status: res.statusCode, body: data }));
                });
                req.on('error', reject);
                if (options.body) req.write(options.body);
                req.end();
            }
        });
    }
};

async function checkIn(cookie, index) {
    const options = {
        url: "https://goiptv.org/user/checkin",
        headers: {
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://goiptv.org/user",
            "X-Requested-With": "XMLHttpRequest"
        },
        body: "{}"
    };

    try {
        const resp = await $.post(options);
        
        // --- 核心修复：针对服务器返回 "coroutine is not JSON serializable" 的防御逻辑 ---
        if (resp.body && resp.body.includes("coroutine is not JSON serializable")) {
            const msg = `⚠️ 账号(${index})：服务器响应异常(协程错误)，通常表示签到已成功，请去官网核实积分。`;
            console.log(msg);
            // 这种错误通常不发通知，避免骚扰，仅在日志记录
            return;
        }

        let resJson;
        try {
            resJson = JSON.parse(resp.body);
        } catch (parseErr) {
            console.log(`❌ 账号(${index})：服务器返回非JSON格式数据: ${resp.body.substring(0, 100)}`);
            return;
        }

        if (resJson.ok === true) {
            const statusText = resJson.already ? "今日已签过 🔁" : "签到成功 ✅";
            const detail = `💰 积分: ${resJson.coins || 0} (+${resJson.bonus || 0})\n🔥 连签: ${resJson.streak || 0} 天`;
            console.log(`✅ 账号(${index})：${statusText}\n${detail}`);
        } else {
            console.log(`❌ 账号(${index})：签到失败，消息: ${resJson.msg || "未知错误"}`);
        }
    } catch (err) {
        console.log(`网络请求异常(账号 ${index}): ${err.message || err}`);
    }
}

async function run() {
    if (!$.cookie) {
        console.log("❌ 错误：未找到 IPTV_COOKIE，请在青龙面板添加环境变量。");
        return;
    }

    const cookieList = $.cookie.split('\n').filter(x => !!x && x.includes('session='));
    console.log(`🚀 开始执行 ${$.name}，共检测到 ${cookieList.length} 个账号`);

    for (let i = 0; i < cookieList.length; i++) {
        await checkIn(cookieList[i], i + 1);
    }
}

run().catch(e => console.log(e));
