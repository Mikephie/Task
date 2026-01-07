/**
 * IPTV 自动签到 - 增强兼容版
 * 修复：针对服务器返回 "Object of type coroutine is not JSON serializable" 的兼容处理
 */

const isSurge = typeof $httpClient !== "undefined";
const isNode = typeof process !== "undefined" && !isSurge;

const $ = {
    name: "IPTV 签到助手",
    cookieKey: "iptv_cookie_storage",
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
    },

    done: () => { if (isSurge) $done(); }
};

async function run() {
    console.log(`🚀 开始执行 ${$.name} [${isSurge ? "Surge" : "Node.js"}]`);
    if (!$.cookie) {
        await $.notify($.name, "❌ 错误", "未找到 IPTV_COOKIE");
        $.done();
        return;
    }
    const cookieList = $.cookie.split(/[&\n]+/).filter(x => !!x);
    for (let i = 0; i < cookieList.length; i++) {
        await doCheckin(cookieList[i].trim(), i + 1);
    }
    $.done();
}

async function doCheckin(cookie, index) {
    const options = {
        url: 'https://www.go-iptv.ggff.net/user.php?action=checkin',
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Cookie": cookie,
            "Origin": "https://www.go-iptv.ggff.net",
            "Referer": "https://www.go-iptv.ggff.net/user.html",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        },
        body: "{}"
    };

    try {
        const resp = await $.post(options);
        
        // --- 新增：防御性逻辑 ---
        if (resp.body.includes("coroutine is not JSON serializable")) {
            console.log(`⚠️ 账号(${index})：服务器返回协程序列化错误，通常签到已成功，请稍后查看结果。`);
            await $.notify($.name, `账号(${index})：⚠️ 服务器响应异常`, "签到指令已发出，但服务器后端崩溃。建议稍后在网页端确认积分是否增加。");
            return;
        }

        let resJson;
        try {
            resJson = JSON.parse(resp.body);
        } catch (parseErr) {
            throw new Error(`非法 JSON 响应: ${resp.body.substring(0, 100)}`);
        }

        if (resJson.ok === true) {
            const statusEmoji = resJson.already ? "🔁" : "✅";
            const statusText = resJson.already ? "今日已签过" : "签到成功";
            const subtitle = `账号(${index})：${statusText} ${statusEmoji}`;
            const detail = `💰 积分: ${resJson.coins} (+${resJson.bonus})\n🔥 连签: ${resJson.streak} 天\n📅 日期: ${resJson.today}`;
            
            console.log(`${subtitle}\n${detail}`);
            if (isSurge && cookie !== $persistentStore.read($.cookieKey)) {
                $persistentStore.write(cookie, $.cookieKey);
            }
            await $.notify($.name, subtitle, detail);
        } else {
            await $.notify($.name, `账号(${index}) ❌ 签到失败`, `返回: ${resp.body}`);
        }
    } catch (e) {
        console.log(`❌ 运行异常: ${e.message}`);
        await $.notify($.name, `账号(${index}) ❌ 网络/系统解析错误`, e.message);
    }
}

run();
