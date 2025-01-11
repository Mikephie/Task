//CRON
const envInstance = new Env("酷狗概念版自动领取VIP");

function getStoredParams(key) {
  if (typeof $prefs !== "undefined") {
    return JSON.parse($prefs.valueForKey(key)) || {};
  } else if (typeof $persistentStore !== "undefined") {
    return JSON.parse($persistentStore.read(key)) || {};
  } else if (typeof $persistent !== "undefined") {
    return JSON.parse($persistent.getItem(key)) || {};
  }
  return {};
}

let urlParams = getStoredParams("urlParams"),
  headerParams = getStoredParams("headerParams"),
  originalUrl = getStoredParams("originalUrl"),
  requestUrl = `https://gateway.kugou.com/youth/v1/recharge/receive_vip_listen_song?appid=${urlParams.appid}&clientver=${urlParams.clientver}&clienttime=${urlParams.clienttime}&mid=${urlParams.mid}&uuid=${urlParams.uuid}&dfid=${urlParams.dfid}&token=${urlParams.token}&userid=${urlParams.userid}&srcappid=${urlParams.srcappid}&signature=${urlParams.signature}`,
  requestHeaders = {
    ":authority": headerParams[":authority"],
    "content-type": headerParams["content-type"],
    "kg-rf": headerParams["kg-rf"],
    accept: headerParams.accept,
    "kg-thash": headerParams["kg-thash"],
    "accept-language": headerParams["accept-language"],
    "accept-encoding": headerParams["accept-encoding"],
    "kg-rec": headerParams["kg-rec"],
    "user-agent": headerParams["user-agent"],
    "kg-rc": headerParams["kg-rc"],
    "kg-fake": headerParams["kg-fake"],
    "content-length": headerParams["content-length"],
    "uni-useragent": headerParams["uni-useragent"]
  };

const requestConfig = {
  url: requestUrl,
  headers: requestHeaders
};

envInstance.post(requestConfig, function (error, response, body) {
  if (error) {
    envInstance.log("请求出错:", error);
    envInstance.done();
    return;
  }
  try {
    envInstance.log(body);
    const responseJson = JSON.parse(body);
    if (responseJson.status === 1) {
      envInstance.msg("获取成功", "成功领取VIP", "");
    } else {
      envInstance.msg("获取失败", "当天已领取无需再领", "");
    }
  } catch (parseError) {
    envInstance.log("解析响应数据出错:", parseError);
    envInstance.msg("解析失败", "无法解析服务器返回的数据", "");
  } finally {
    envInstance.done();
  }
});

function Env(name, options) {
  class HTTP {
    constructor(env) {
      this.env = env;
    }
    send(request, method = "GET") {
      request = typeof request === "string" ? { url: request } : request;
      let action = this.get;
      if (method === "POST") action = this.post;
      return new Promise((resolve, reject) => {
        action.call(this, request, (error, response, body) => {
          error ? reject(error) : resolve(response);
        });
      });
    }
    get(request) {
      return this.send.call(this.env, request);
    }
    post(request) {
      return this.send.call(this.env, request, "POST");
    }
  }

  return new class {
    constructor(name, options) {
      this.name = name;
      this.http = new HTTP(this);
      this.data = null;
      this.logs = [];
      this.isMute = false;
      this.logSeparator = "\n";
      this.encoding = "utf-8";
      this.startTime = new Date().getTime();
      Object.assign(this, options);
      this.log("", `🔔${this.name}, 开始!`);
    }

    getEnv() {
      if (typeof $environment !== "undefined") {
        if ($environment["surge-version"]) return "Surge";
        if ($environment["stash-version"]) return "Stash";
      }
      if (typeof module !== "undefined" && module.exports) return "Node.js";
      if (typeof $task !== "undefined") return "Quantumult X";
      if (typeof $loon !== "undefined") return "Loon";
      if (typeof $rocket !== "undefined") return "Shadowrocket";
      return undefined;
    }

    isNode() {
      return this.getEnv() === "Node.js";
    }

    isQuanX() {
      return this.getEnv() === "Quantumult X";
    }

    isSurge() {
      return this.getEnv() === "Surge";
    }

    isLoon() {
      return this.getEnv() === "Loon";
    }

    isShadowrocket() {
      return this.getEnv() === "Shadowrocket";
    }

    isStash() {
      return this.getEnv() === "Stash";
    }

    post(request, callback) {
      switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
          $httpClient.post(request, (error, response, body) => {
            callback(error, response, body);
          });
          break;
        case "Quantumult X":
          request.method = "POST";
          $task.fetch(request).then(
            (response) => {
              callback(null, response, response.body);
            },
            (error) => {
              callback(error);
            }
          );
          break;
        case "Node.js":
          const got = require("got");
          got.post(request.url, { headers: request.headers, body: request.body }).then(
            (response) => {
              callback(null, response, response.body);
            },
            (error) => {
              callback(error);
            }
          );
          break;
      }
    }

    log(...messages) {
      this.logs = [...this.logs, ...messages];
      console.log(messages.join(this.logSeparator));
    }

    msg(title = "", subtitle = "", body = "") {
      console.log(`${title}\n${subtitle}\n${body}`);
    }

    done() {
      const endTime = new Date().getTime();
      const duration = (endTime - this.startTime) / 1000;
      this.log("", `🔔${this.name}, 结束! 🕛 ${duration} 秒`);
    }
  }(name, options);
}