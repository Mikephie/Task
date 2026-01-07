/**
 * IPTV 自动签到 - 环境自适应增强版 (Surge & 青龙)
 * 兼容变量: IPTV_COOKIE
 */

const isSurge = typeof $httpClient !== "undefined";
const isNode = typeof process !== "undefined" && !isSurge;

// --- 环境适配器 ---
const $ = {
    name: "IPTV 签到助手",
    cookieKey: "iptv_cookie_storage",
    // 自动获取 Cookie：Surge 优先读持久化，青龙读环境变量
    cookie: isSurge ? ($persistentStore.read("iptv_cookie_storage") || "") : (process.env.IPTV_COOKIE || ""),
    
    // 通知适配：支持 (标题, 副标题, 内容)
    notify: async (title, subtitle, content) => {
        if (isSurge) {
            // Surge 支持三段式通知
            $notification.post(title, subtitle, content);
        } else if (isNode) {
            const fullMsg = `【${title}】${subtitle}\n${content}`;
            console.log(fullMsg);
            try {
                const notify = require('./sendNotify');
                await notify.sendNotify(title, fullMsg);
            } catch (e) {
                // 仅在 Node 环境打印日志
            }
        }
    },

    // HTTP 请求适配
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

    done: () => {
        if (isSurge) $done();
    }
};

async function run() {
    console.log(`🚀 开始执行 ${$.name} [${isSurge ? "Surge" : "Node.js"}]`);

    if (!$.cookie) {
        await $.notify($.name, "❌ 错误", "未找到 IPTV_COOKIE，请检查环境变量或持久化数据");
        $.done();
        return;
    }

    // 支持多账号分割 (换行或 &)
    const cookieList = $.cookie.split(/[&\n]+/).filter(x => !!x);
    
    for (let i = 0; i < cookieList.length; i++) {
        const currentCookie = cookieList[i].trim();
        console.log(`\n📦 正在处理第 ${i + 1}/${cookieList.length} 个账号...`);
        await doCheckin(currentCookie, i + 1);
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
        const resJson = JSON.parse(resp.body);

        if (resJson.ok === true) {
            const statusEmoji = resJson.already ? "🔁" : "✅";
            const statusText = resJson.already ? "今日已签过" : "签到成功";
            
            // 组装详细内容
            const subtitle = `账号(${index})：${statusText} ${statusEmoji}`;
            const detail = `💰 积分: ${resJson.coins} (+${resJson.bonus})\n🔥 连签: ${resJson.streak} 天\n📅 日期: ${resJson.today}`;
            
            console.log(`${subtitle}\n${detail}`);

            // Surge 环境下如果是新获取的 Cookie（比如手动更新过），自动同步到持久化
            if (isSurge && cookie !== $persistentStore.read($.cookieKey)) {
                $persistentStore.write(cookie, $.cookieKey);
            }

            await $.notify($.name, subtitle, detail);
        } else {
            await $.notify($.name, `账号(${index}) ❌ 签到异常`, `返回内容: ${resp.body}`);
        }
    } catch (e) {
        await $.notify($.name, `账号(${index}) ❌ 网络错误`, e.message || "请求失败");
    }
}

run();
