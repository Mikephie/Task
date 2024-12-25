/* 
🎵酷我音乐 v1.6.1
🥳脚本功能:  
  ✅每日小说
  ✅每日签到
  ✅每日听歌
  ✅每日收藏
  ✅创意视频
  ✅免费抽奖
  ✅视频抽奖
  ✅惊喜任务
  ✅定时宝箱
  ✅补领宝箱
  ✅资产查询
🎯重写脚本:
  [Script]
http-request https://appi.kuwo.cn/api/automobile/kuwo/v1/configuration/signature script-path=https://raw.githubusercontent.com/MCdasheng/QuantumultX/main/Scripts/myScripts/kuwo.cookie.js, requires-body=true, timeout=60, enabled=false, tag=酷我音乐获取Cookies, img-url=https://raw.githubusercontent.com/deezertidal/private/main/icons/kuwosvip.png
[MITM]
hostname = appi.kuwo.cn
⏰定时任务:
  cron "0 9,11,13,15,17,19,21 * * *" script-path=https://raw.githubusercontent.com/Mikephie/Task/main/kuwocoin.js, timeout=3000, tag=酷我音乐刷积分, img-url=https://raw.githubusercontent.com/deezertidal/private/main/icons/kuwosvip.png
🔍手动抓包: 
  开启抓包,进入网页登陆后的界面
  搜索url记录关键词"configuration\/signature"请求头中的Cookies里的 userid和 websid 分别填入BoxJs（userid=loginUid，websid=loginSid）

 
📦BoxJs地址:
  https://raw.githubusercontent.com/General74110/Quantumult-X/master/Boxjs/General74110.json(General℡版)改变了获取Cookies的途径，添加了多账号，增加多次运行防遗漏

  https://raw.githubusercontent.com/MCdasheng/QuantumultX/main/mcdasheng.boxjs.json（原作者版）




*/


const $ = new Env("酷我音乐");

// 移除个人数据
const loginUid = $.getdata("kw_loginUid").split("@");
const loginSid = $.getdata("kw_loginSid").split("@");

if (loginUid.length === 0 || loginSid.length === 0) {
  $.log("未填写 cookie");
  $.msg($.name, "未填写 cookie");
  $.done();
} else {
  $.log("脚本执行时间: " + new Date().toLocaleString());
}

const kw_headers = {
  "Host": "integralapi.kuwo.cn",
  "Origin": "https://h5app.kuwo.cn",
  "Connection": "keep-alive", 
  "Accept": "application/json, text/plain, */*",
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 iting/6.11.0 kw_app",
  "Accept-Language": "zh-CN,zh-Hans;q=0.9",
  "Referer": "https://h5app.kuwo.cn/",
  "Accept-Encoding": "gzip, deflate, br"
};

async function getNickname(uid) {
  // 获取用户昵称的实现
}

async function novel(uid, sid) {
  // 每日小说任务的实现
}

async function mobile(uid, sid) {
  // 每日听歌任务的实现
}

async function collect(uid, sid) {
  // 每日收藏任务的实现
}

async function video(uid, sid) {
  // 创意视频任务的实现
}

async function sign(uid, sid) {
  // 每日签到任务的实现
}

async function new_sign(uid, sid) {
  // 新用户签到列表的实现
}

async function loterry_free(uid, sid) {
  // 免费抽奖的实现
}

async function loterry_video(uid, sid) {
  // 视频抽奖的实现
}

async function surprise(uid, sid) {
  // 惊喜任务的实现
}

async function box(uid, sid) {
  // 定时宝箱任务的实现
}

async function box_new(boxType, uid, sid) {
  // 新版定时宝箱的实现
}

async function box_old(boxType, uid, sid) {
  // 旧版定时宝箱的实现
}

async function getAsset(uid, sid) {
  // 获取账户资产信息的实现
}

// 主执行函数
(async () => {
  for (let i = 0; i < loginUid.length; i++) {
    if (loginUid[i] && loginSid[i]) {
      $.notifyMsg = [];
      const nickname = await getNickname(loginUid[i]);
      $.log(`账号 ${loginUid[i]} 开始执行 - ${nickname}`);
      
      // 执行各种任务
      await novel(loginUid[i], loginSid[i]);
      await mobile(loginUid[i], loginSid[i]);
      await collect(loginUid[i], loginSid[i]);
      await box(loginUid[i], loginSid[i]);
      await loterry_free(loginUid[i], loginSid[i]);
      await new_sign(loginUid[i], loginSid[i]);
      await sign(loginUid[i], loginSid[i]);
      
      // 多次执行视频任务
      for (let j = 0; j < 20; j++) {
        await video(loginUid[i], loginSid[i]);
      }
      
      // 多次执行惊喜任务和视频抽奖
      for (let k = 0; k < 10; k++) {
        await surprise(loginUid[i], loginSid[i]);
        await loterry_video(loginUid[i], loginSid[i]);
      }
      
      // 获取资产信息
      const asset = await getAsset(loginUid[i], loginSid[i]);
      $.notifyMsg.push(asset);
      
      // 发送通知
      $.msg($.name, `【এ${nickname}এ】`, $.notifyMsg.join('\n'));
    }
  }
})().catch(e => $.logErr(e)).finally(() => $.done());

// Env函数的完整实现
function Env(t,s){
  // Env函数的完整代码（之前提供的那个长函数）
}

function Env(t, s) {
    class e {
        constructor(t) {
            this.env = t;
        }
        send(t, s = "GET") {
            t = "string" == typeof t ? { url: t } : t;
            let e = this.get;
            return (
                "POST" === s && (e = this.post),
                new Promise((s, i) => {
                    e.call(this, t, (t, e, r) => {
                        t ? i(t) : s(e);
                    });
                })
            );
        }
        get(t) {
            return this.send.call(this.env, t);
        }
        post(t) {
            return this.send.call(this.env, t, "POST");
        }
    }
    return new (class {
        constructor(t, s) {
            (this.name = t),
                (this.http = new e(this)),
                (this.data = null),
                (this.dataFile = "box.dat"),
                (this.logs = []),
                (this.isMute = !1),
                (this.isNeedRewrite = !1),
                (this.logSeparator = "\n"),
                (this.encoding = "utf-8"),
                (this.startTime = new Date().getTime()),
                Object.assign(this, s),
                this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`);
        }
        isNode() {
            return "undefined" != typeof module && !!module.exports;
        }
        isQuanX() {
            return "undefined" != typeof $task;
        }
        isSurge() {
            return "undefined" != typeof $environment && $environment["surge-version"];
        }
        isLoon() {
            return "undefined" != typeof $loon;
        }
        isShadowrocket() {
            return "undefined" != typeof $rocket;
        }
        isStash() {
            return "undefined" != typeof $environment && $environment["stash-version"];
        }
        toObj(t, s = null) {
            try {
                return JSON.parse(t);
            } catch {
                return s;
            }
        }
        toStr(t, s = null) {
            try {
                return JSON.stringify(t);
            } catch {
                return s;
            }
        }
        getjson(t, s) {
            let e = s;
            const i = this.getdata(t);
            if (i)
                try {
                    e = JSON.parse(this.getdata(t));
                } catch { }
            return e;
        }
        setjson(t, s) {
            try {
                return this.setdata(JSON.stringify(t), s);
            } catch {
                return !1;
            }
        }
        getScript(t) {
            return new Promise((s) => {
                this.get({ url: t }, (t, e, i) => s(i));
            });
        }
        runScript(t, s) {
            return new Promise((e) => {
                let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
                i = i ? i.replace(/\n/g, "").trim() : i;
                let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
                (r = r ? 1 * r : 20), (r = s && s.timeout ? s.timeout : r);
                const [o, h] = i.split("@"),
                    a = {
                        url: `http://${h}/v1/scripting/evaluate`,
                        body: { script_text: t, mock_type: "cron", timeout: r },
                        headers: { "X-Key": o, Accept: "*/*" },
                        timeout: r,
                    };
                this.post(a, (t, s, i) => e(i));
            }).catch((t) => this.logErr(t));
        }
        loaddata() {
            if (!this.isNode()) return {};
            {
                (this.fs = this.fs ? this.fs : require("fs")),
                    (this.path = this.path ? this.path : require("path"));
                const t = this.path.resolve(this.dataFile),
                    s = this.path.resolve(process.cwd(), this.dataFile),
                    e = this.fs.existsSync(t),
                    i = !e && this.fs.existsSync(s);
                if (!e && !i) return {};
                {
                    const i = e ? t : s;
                    try {
                        return JSON.parse(this.fs.readFileSync(i));
                    } catch (t) {
                        return {};
                    }
                }
            }
        }
        writedata() {
            if (this.isNode()) {
                (this.fs = this.fs ? this.fs : require("fs")),
                    (this.path = this.path ? this.path : require("path"));
                const t = this.path.resolve(this.dataFile),
                    s = this.path.resolve(process.cwd(), this.dataFile),
                    e = this.fs.existsSync(t),
                    i = !e && this.fs.existsSync(s),
                    r = JSON.stringify(this.data);
                e
                    ? this.fs.writeFileSync(t, r)
                    : i
                        ? this.fs.writeFileSync(s, r)
                        : this.fs.writeFileSync(t, r);
            }
        }
        lodash_get(t, s, e) {
            const i = s.replace(/\[(\d+)\]/g, ".$1").split(".");
            let r = t;
            for (const t of i) if (((r = Object(r)[t]), void 0 === r)) return e;
            return r;
        }
        lodash_set(t, s, e) {
            return Object(t) !== t
                ? t
                : (Array.isArray(s) || (s = s.toString().match(/[^.[\]]+/g) || []),
                    (s
                        .slice(0, -1)
                        .reduce(
                            (t, e, i) =>
                                Object(t[e]) === t[e]
                                    ? t[e]
                                    : (t[e] = Math.abs(s[i + 1]) >> 0 == +s[i + 1] ? [] : {}),
                            t
                        )[s[s.length - 1]] = e),
                    t);
        }
        getdata(t) {
            let s = this.getval(t);
            if (/^@/.test(t)) {
                const [, e, i] = /^@(.*?)\.(.*?)$/.exec(t),
                    r = e ? this.getval(e) : "";
                if (r)
                    try {
                        const t = JSON.parse(r);
                        s = t ? this.lodash_get(t, i, "") : s;
                    } catch (t) {
                        s = "";
                    }
            }
            return s;
        }
        setdata(t, s) {
            let e = !1;
            if (/^@/.test(s)) {
                const [, i, r] = /^@(.*?)\.(.*?)$/.exec(s),
                    o = this.getval(i),
                    h = i ? ("null" === o ? null : o || "{}") : "{}";
                try {
                    const s = JSON.parse(h);
                    this.lodash_set(s, r, t), (e = this.setval(JSON.stringify(s), i));
                } catch (s) {
                    const o = {};
                    this.lodash_set(o, r, t), (e = this.setval(JSON.stringify(o), i));
                }
            } else e = this.setval(t, s);
            return e;
        }
        getval(t) {
            return this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()
                ? $persistentStore.read(t)
                : this.isQuanX()
                    ? $prefs.valueForKey(t)
                    : this.isNode()
                        ? ((this.data = this.loaddata()), this.data[t])
                        : (this.data && this.data[t]) || null;
        }
        setval(t, s) {
            return this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()
                ? $persistentStore.write(t, s)
                : this.isQuanX()
                    ? $prefs.setValueForKey(t, s)
                    : this.isNode()
                        ? ((this.data = this.loaddata()), (this.data[s] = t), this.writedata(), !0)
                        : (this.data && this.data[s]) || null;
        }
        initGotEnv(t) {
            (this.got = this.got ? this.got : require("got")),
                (this.cktough = this.cktough ? this.cktough : require("tough-cookie")),
                (this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar()),
                t &&
                ((t.headers = t.headers ? t.headers : {}),
                    void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar));
        }
        get(t, s = () => { }) {
            if (
                (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]),
                    this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash())
            )
                this.isSurge() &&
                    this.isNeedRewrite &&
                    ((t.headers = t.headers || {}),
                        Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })),
                    $httpClient.get(t, (t, e, i) => {
                        !t &&
                            e &&
                            ((e.body = i),
                                (e.statusCode = e.status ? e.status : e.statusCode),
                                (e.status = e.statusCode)),
                            s(t, e, i);
                    });
            else if (this.isQuanX())
                this.isNeedRewrite && ((t.opts = t.opts || {}), Object.assign(t.opts, { hints: !1 })),
                    $task.fetch(t).then(
                        (t) => {
                            const { statusCode: e, statusCode: i, headers: r, body: o } = t;
                            s(null, { status: e, statusCode: i, headers: r, body: o }, o);
                        },
                        (t) => s((t && t.error) || "UndefinedError")
                    );
            else if (this.isNode()) {
                let e = require("iconv-lite");
                this.initGotEnv(t),
                    this.got(t)
                        .on("redirect", (t, s) => {
                            try {
                                if (t.headers["set-cookie"]) {
                                    const e = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                                    e && this.ckjar.setCookieSync(e, null), (s.cookieJar = this.ckjar);
                                }
                            } catch (t) {
                                this.logErr(t);
                            }
                        })
                        .then(
                            (t) => {
                                const { statusCode: i, statusCode: r, headers: o, rawBody: h } = t,
                                    a = e.decode(h, this.encoding);
                                s(null, { status: i, statusCode: r, headers: o, rawBody: h, body: a }, a);
                            },
                            (t) => {
                                const { message: i, response: r } = t;
                                s(i, r, r && e.decode(r.rawBody, this.encoding));
                            }
                        );
            }
        }
        post(t, s = () => { }) {
            const e = t.method ? t.method.toLocaleLowerCase() : "post";
            if (
                (t.body &&
                    t.headers &&
                    !t.headers["Content-Type"] &&
                    (t.headers["Content-Type"] = "application/x-www-form-urlencoded"),
                    t.headers && delete t.headers["Content-Length"],
                    this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash())
            )
                this.isSurge() &&
                    this.isNeedRewrite &&
                    ((t.headers = t.headers || {}),
                        Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })),
                    $httpClient[e](t, (t, e, i) => {
                        !t &&
                            e &&
                            ((e.body = i),
                                (e.statusCode = e.status ? e.status : e.statusCode),
                                (e.status = e.statusCode)),
                            s(t, e, i);
                    });
            else if (this.isQuanX())
                (t.method = e),
                    this.isNeedRewrite && ((t.opts = t.opts || {}), Object.assign(t.opts, { hints: !1 })),
                    $task.fetch(t).then(
                        (t) => {
                            const { statusCode: e, statusCode: i, headers: r, body: o } = t;
                            s(null, { status: e, statusCode: i, headers: r, body: o }, o);
                        },
                        (t) => s((t && t.error) || "UndefinedError")
                    );
            else if (this.isNode()) {
                let i = require("iconv-lite");
                this.initGotEnv(t);
                const { url: r, ...o } = t;
                this.got[e](r, o).then(
                    (t) => {
                        const { statusCode: e, statusCode: r, headers: o, rawBody: h } = t,
                            a = i.decode(h, this.encoding);
                        s(null, { status: e, statusCode: r, headers: o, rawBody: h, body: a }, a);
                    },
                    (t) => {
                        const { message: e, response: r } = t;
                        s(e, r, r && i.decode(r.rawBody, this.encoding));
                    }
                );
            }
        }
        time(t, s = null) {
            const e = s ? new Date(s) : new Date();
            let i = {
                "M+": e.getMonth() + 1,
                "d+": e.getDate(),
                "H+": e.getHours(),
                "m+": e.getMinutes(),
                "s+": e.getSeconds(),
                "q+": Math.floor((e.getMonth() + 3) / 3),
                S: e.getMilliseconds(),
            };
            /(y+)/.test(t) &&
                (t = t.replace(RegExp.$1, (e.getFullYear() + "").substr(4 - RegExp.$1.length)));
            for (let s in i)
                new RegExp("(" + s + ")").test(t) &&
                    (t = t.replace(
                        RegExp.$1,
                        1 == RegExp.$1.length ? i[s] : ("00" + i[s]).substr(("" + i[s]).length)
                    ));
            return t;
        }
        queryStr(t) {
            let s = "";
            for (const e in t) {
                let i = t[e];
                null != i &&
                    "" !== i &&
                    ("object" == typeof i && (i = JSON.stringify(i)), (s += `${e}=${i}&`));
            }
            return (s = s.substring(0, s.length - 1)), s;
        }
        msg(s = t, e = "", i = "", r) {
            const o = (t) => {
                if (!t) return t;
                if ("string" == typeof t)
                    return this.isLoon() || this.isShadowrocket()
                        ? t
                        : this.isQuanX()
                            ? { "open-url": t }
                            : this.isSurge() || this.isStash()
                                ? { url: t }
                                : void 0;
                if ("object" == typeof t) {
                    if (this.isLoon()) {
                        let s = t.openUrl || t.url || t["open-url"],
                            e = t.mediaUrl || t["media-url"];
                        return { openUrl: s, mediaUrl: e };
                    }
                    if (this.isQuanX()) {
                        let s = t["open-url"] || t.url || t.openUrl,
                            e = t["media-url"] || t.mediaUrl,
                            i = t["update-pasteboard"] || t.updatePasteboard;
                        return { "open-url": s, "media-url": e, "update-pasteboard": i };
                    }
                    if (this.isSurge() || this.isShadowrocket() || this.isStash()) {
                        let s = t.url || t.openUrl || t["open-url"];
                        return { url: s };
                    }
                }
            };
            if (
                (this.isMute ||
                    (this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()
                        ? $notification.post(s, e, i, o(r))
                        : this.isQuanX() && $notify(s, e, i, o(r))),
                    !this.isMuteLog)
            ) {
                let t = [
                    "",
                    "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3==============",
                ];
                t.push(s),
                    e && t.push(e),
                    i && t.push(i),
                    console.log(t.join("\n")),
                    (this.logs = this.logs.concat(t));
            }
        }
        log(...t) {
            t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator));
        }
        logErr(t, s) {
            const e = !(
                this.isSurge() ||
                this.isShadowrocket() ||
                this.isQuanX() ||
                this.isLoon() ||
                this.isStash()
            );
            e
                ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack)
                : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t);
        }
        wait(t) {
            return new Promise((s) => setTimeout(s, t));
        }
        done(t = {}) {
            const s = new Date().getTime(),
                e = (s - this.startTime) / 1e3;
            this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${e} \u79d2`),
                this.log(),
                this.isSurge() || this.isShadowrocket() || this.isQuanX() || this.isLoon() || this.isStash()
                    ? $done(t)
                    : this.isNode() && process.exit(1);
        }
    })(t, s);
}