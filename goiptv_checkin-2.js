/**
 * IPTV 自动签到 - 豪华通知版
 * 变量名称: IPTV_COOKIE (需包含 session=eyJ...)
 */

const https = require('https');
// 尝试加载通知模块
let notify;
try { notify = require('./sendNotify'); } catch (e) { notify = null; }

const IPTV_COOKIE = process.env.IPTV_COOKIE;

async function doCheckin() {
    if (!IPTV_COOKIE) {
        console.log("❌ 错误：未在环境变量中找到 IPTV_COOKIE");
        return;
    }

    console.log("🚀 开始执行 IPTV 签到任务...");
    const title = "📺 IPTV 签到助手";
    let content = "";

    const options = {
        hostname: 'www.go-iptv.ggff.net',
        path: '/user.php?action=checkin',
        method: 'POST',
        headers: {
            // 严格对齐你 iMac 测试成功的指纹
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
            "Cookie": IPTV_COOKIE.trim(),
            "Origin": "https://www.go-iptv.ggff.net",
            "Referer": "https://www.go-iptv.ggff.net/user.html",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "application/json, text/javascript, */*; q=0.01"
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', async () => {
                try {
                    const resJson = JSON.parse(data);
                    if (resJson.ok === true) {
                        const isAlready = resJson.already === true;
                        const statusEmoji = isAlready ? "🔁" : "✅";
                        const statusText = isAlready ? "任务已达标 (今日已签)" : "今日签到成功";
                        
                        content = `
----------------------------
${statusEmoji} **结果**: ${statusText}
💰 **金币**: ${resJson.coins} (今日+${resJson.bonus || 0})
🔥 **连签**: ${resJson.streak} 天
📅 **日期**: ${resJson.today}
----------------------------
✨ 凭证状态：有效 (Active)
`;
                        console.log(content);
                        if (notify) await notify.sendNotify(title, content);
                    } else {
                        content = `⚠️ 签到异常: ${resJson.error || '未知错误'}`;
                        console.log(content);
                        if (notify) await notify.sendNotify(title, content);
                    }
                } catch (e) {
                    content = `❌ 解析崩溃: ${data}`;
                    console.log(content);
                    if (notify) await notify.sendNotify(title, content);
                }
                resolve();
            });
        });

        req.on('error', async (e) => {
            console.error(`❌ 网络错误: ${e.message}`);
            if (notify) await notify.sendNotify(title, `❌ 网络错误: ${e.message}`);
            resolve();
        });

        req.write(JSON.stringify({}));
        req.end();
    });
}

doCheckin();
