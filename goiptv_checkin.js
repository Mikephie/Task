/**
 * IPTV 自动签到 - 豪华通知版
 * 变量名称: IPTV_COOKIE
 */

const https = require('https');
const notify = require('./sendNotify'); // 必须确保同目录下有 sendNotify.js

const IPTV_COOKIE = process.env.IPTV_COOKIE;

async function doCheckin() {
    if (!IPTV_COOKIE) {
        console.log("❌ 错误：环境变量中未找到 IPTV_COOKIE");
        return;
    }

    console.log("🚀 开始执行 IPTV 签到任务...");
    let title = "📺 IPTV 签到助手";
    let content = "";

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
            "X-Requested-With": "XMLHttpRequest"
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', async () => {
                console.log(`[Log] 状态码: ${res.statusCode}`);
                
                try {
                    const resJson = JSON.parse(data);
                    const today = new Date().toLocaleDateString();

                    if (resJson.ok === true) {
                        const statusEmoji = resJson.already ? "🔁" : "✅";
                        const statusText = resJson.already ? "今日已签过" : "签到成功";
                        
                        // 组装美观的内容
                        content = `
----------------------------
${statusEmoji} **结果**: ${statusText}
💰 **金币**: ${resJson.coins} (+${resJson.bonus})
🔥 **连签**: ${resJson.streak} 天
📅 **日期**: ${resJson.today}
----------------------------
✨ 任务已完成，祝您今天愉快！`;
                        
                        console.log(content);
                        await notify.sendNotify(title, content);
                    } else {
                        content = `⚠️ 签到异常\n响应内容: ${data}`;
                        console.log(content);
                        await notify.sendNotify(title, content);
                    }
                } catch (e) {
                    content = `❌ 解析错误\n状态码: ${res.statusCode}\n返回: ${data}`;
                    console.log(content);
                    await notify.sendNotify(title, content);
                }
                resolve();
            });
        });

        req.on('error', async (e) => {
            console.error(`❌ 请求崩溃: ${e.message}`);
            await notify.sendNotify(title, `❌ 网络请求失败: ${e.message}`);
            resolve();
        });

        req.write(JSON.stringify({}));
        req.end();
    });
}

doCheckin();
