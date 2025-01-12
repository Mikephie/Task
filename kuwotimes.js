//Sun Jan 12 2025 12:42:32 GMT+0000 (Coordinated Universal Time)
//Base:https://github.com/echo094/decode-js
//Modify:https://github.com/smallfawn/decode_action
/*
APP：酷我音乐
版本：10.6.6
作者：General℡

脚本功能：看广告，获取更多的免费听歌时间！不管你有没有刷广告入口都能用

更新：优化通知，更新多账号支持,更新Boxjs定阅(https://raw.githubusercontent.com/General74110/Quantumult-X/master/Boxjs/General74110.json)

操作：点击 我的-用户昵称 获取Cookies！获取完后关掉重写，避免不必要的MITM


注意⚠️：当前脚本只测试Loon，其他自测！
可配合其他酷我音乐会员脚本去掉部分广告（没时间搞广告）




使用声明：⚠️⚠️⚠️此脚本仅供学习与交流，
        请勿转载与贩卖！⚠️⚠️⚠️

[Script]
http-request ^https\:\/\/integralapi\.kuwo\.cn\/api\/v1\/online\/sign\/v1\/earningSignIn\/.* script-path=https://raw.githubusercontent.com/Mikephie/Task/main/kuwotimes.js, requires-body=true, timeout=10, enabled=true, tag=酷我音乐刷时长获取Cookie, img-url=https://raw.githubusercontent.com/LovedGM/Quantumult-X-TuBiao/main/zishi-cs/zs23.png


[Task]
cron "30 6 * * *" script-path=https://raw.githubusercontent.com/Mikephie/Task/main/kuwotimes.js, timeout=3600, tag=酷我音乐刷时长, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/KKTV.png


[MITM]
hostname = integralapi.kuwo.cn

*/

const $ = new Env("酷我音乐");

// 主要参数设置
const Clear = $.getval("Clear") || 0;
let message = "";

// 主函数入口
!(async () => {
  if (Clear == 1) {
    clearEnvVars();
    $.log("清除环境变量完成");
    return;
  }

  if (typeof $request !== "undefined") {
    await kuwock();
  } else {
    await mainTask();
  }
})().catch((err) => $.logErr(err)).finally(() => $.done());

// 清除环境变量
function clearEnvVars() {
  $.setdata("", "loginUid");
  $.log("环境变量已清除");
}

// 获取Cookies
async function kuwock() {
  const url = $request.url;
  const params = new URLSearchParams(url.split("?")[1]);
  const loginUid = params.get("loginUid");

  if (loginUid) {
    $.setdata(loginUid, "loginUid");
    $.log(`获取Cookie成功: ${loginUid}`);
  } else {
    $.log("获取Cookie失败");
  }
}

// 执行广告任务
async function mainTask() {
  const loginUid = $.getval("loginUid");
  if (!loginUid) {
    $.log("未获取到有效Cookie");
    return;
  }

  const result = await Task(loginUid);
  if (result.success) {
    message = `任务成功：获取${result.singleTime}分钟，听歌时长延长至 ${result.expiryTime}`;
  } else {
    message = `任务失败：${result.message}`;
  }

  $.msg("酷我音乐任务结果", "", message);
}

// 广告观看任务
function Task(loginUid) {
  return new Promise((resolve) => {
    const options = {
      url: "https://integralapi.kuwo.cn/api/v1/online/sign/v1/earningSignIn",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ loginUid, status: 1 }),
    };

    $.post(options, (err, resp, data) => {
      try {
        const result = JSON.parse(data);
        if (result.code === 200) {
          const expiryTime = new Date(result.data.endTime).toLocaleString();
          resolve({
            success: true,
            singleTime: result.data.singleTime,
            expiryTime: expiryTime,
            message: result.msg,
          });
        } else {
          resolve({ success: false, message: result.msg || "未知错误" });
        }
      } catch (e) {
        resolve({ success: false, message: "解析响应失败" });
      }
    });
  });
}

// 工具类
function Env(name) {
  this.name = name;
  this.http = {
    get: this.get.bind(this),
    post: this.post.bind(this),
  };
  this.data = null;
  this.logs = [];
  this.logSeparator = "\n";
  this.startTime = new Date().getTime();
  this.isBoxJs = false;

  this.getval = (key) => {
    if (this.isBoxJs) return this.getBoxJsVal(key);
    switch (true) {
      case typeof $persistentStore !== "undefined": // Surge/Loon
        return $persistentStore.read(key);
      case typeof $prefs !== "undefined": // Quantumult X
        return $prefs.valueForKey(key);
      case typeof process !== "undefined": // Node.js
        return process.env[key];
      default:
        return this.data ? this.data[key] : null;
    }
  };

  this.setdata = (val, key) => {
    if (this.isBoxJs) return this.setBoxJsVal(val, key);
    switch (true) {
      case typeof $persistentStore !== "undefined": // Surge/Loon
        return $persistentStore.write(val, key);
      case typeof $prefs !== "undefined": // Quantumult X
        return $prefs.setValueForKey(val, key);
      case typeof process !== "undefined": // Node.js
        return (process.env[key] = val);
      default:
        return (this.data[key] = val);
    }
  };

  this.getBoxJsVal = (key) => {
    const boxData = this.getdata("@boxjs.userprefs") || "{}";
    try {
      return JSON.parse(boxData)[key] || null;
    } catch {
      return null;
    }
  };

  this.setBoxJsVal = (val, key) => {
    const boxData = this.getdata("@boxjs.userprefs") || "{}";
    try {
      const parsed = JSON.parse(boxData);
      parsed[key] = val;
      this.setdata(JSON.stringify(parsed), "@boxjs.userprefs");
      return true;
    } catch {
      return false;
    }
  };

  this.msg = (title, subtitle, body) => {
    switch (true) {
      case typeof $notification !== "undefined": // Surge/Loon
        return $notification.post(title, subtitle, body);
      case typeof $notify !== "undefined": // Quantumult X
        return $notify(title, subtitle, body);
      default:
        console.log(`${title}\n${subtitle}\n${body}`);
    }
  };

  this.log = (...args) => console.log(...args);
  this.logErr = (err) => console.error(err);
  this.done = () => {
    const endTime = new Date().getTime();
    console.log(`🔔${this.name}, 结束! 🕛 ${(endTime - this.startTime) / 1000} 秒`);
    if (typeof $done !== "undefined") $done();
  };

  this.get = (opts, callback) => {
    const method = "GET";
    this.send({ ...opts, method }, callback);
  };

  this.post = (opts, callback) => {
    const method = "POST";
    this.send({ ...opts, method }, callback);
  };

  this.send = (opts, callback) => {
    switch (true) {
      case typeof $httpClient !== "undefined": // Surge/Loon
        const clientMethod = opts.method.toLowerCase();
        $httpClient[clientMethod](opts, callback);
        break;
      case typeof $task !== "undefined": // Quantumult X
        opts.method = opts.method || "GET";
        $task.fetch(opts).then((resp) => callback(null, resp, resp.body), callback);
        break;
      default:
        this.log("环境不支持");
    }
  };
}