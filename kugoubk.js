// COOKIE
const envInstance = new Env("酷狗概念版自动领取VIP-Eric");

if ($request.url) {
  let requestUrl = $request.url,
    requestHeaders = $request.headers,
    urlParams = new URLSearchParams(requestUrl.split("?")[1]),
    savedUrlParams = {
      appid: urlParams.get("appid"),
      clientver: urlParams.get("clientver"),
      clienttime: urlParams.get("clienttime"),
      mid: urlParams.get("mid"),
      uuid: urlParams.get("uuid"),
      dfid: urlParams.get("dfid"),
      token: urlParams.get("token"),
      userid: urlParams.get("userid"),
      srcappid: urlParams.get("srcappid"),
      signature: urlParams.get("signature")
    },
    savedHeaders = {
      ":authority": requestHeaders[":authority"],
      "content-type": requestHeaders["content-type"],
      "kg-rf": requestHeaders["kg-rf"],
      accept: requestHeaders.accept,
      "kg-thash": requestHeaders["kg-thash"],
      "accept-language": requestHeaders["accept-language"],
      "accept-encoding": requestHeaders["accept-encoding"],
      "kg-rec": requestHeaders["kg-rec"],
      "user-agent": requestHeaders["user-agent"],
      "kg-rc": requestHeaders["kg-rc"],
      "kg-fake": requestHeaders["kg-fake"],
      "content-length": requestHeaders["content-length"],
      "uni-useragent": requestHeaders["uni-useragent"]
    };

  function saveToStorage(key, value) {
    if (typeof $prefs !== "undefined") {
      return $prefs.setValueForKey(JSON.stringify(value), key);
    } else if (typeof $persistentStore !== "undefined") {
      return $persistentStore.write(JSON.stringify(value), key);
    } else if (typeof $persistent !== "undefined") {
      return $persistent.setItem(key, JSON.stringify(value));
    }
  }

  saveToStorage("urlParams", savedUrlParams);
  saveToStorage("headerParams", savedHeaders);
  saveToStorage("originalUrl", requestUrl);

  envInstance.log("保存的 URL Params:", JSON.stringify(savedUrlParams));
  envInstance.log("保存的 Header Params:", JSON.stringify(savedHeaders));
  envInstance.log("保存的 Original URL:", requestUrl);
  envInstance.log("数据已保存到持久化存储 - Eric为您提供");
  envInstance.msg("获取数据成功", "数据已持久化保存", "");
  envInstance.done();
}

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
      this.logs = [];
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

    log(...messages) {
      this.logs = [...this.logs, ...messages];
      console.log(messages.join("\n"));
    }

    msg(title = "", subtitle = "", body = "") {
      console.log(`${title}\n${subtitle}\n${body}`);
    }

    done() {
      const endTime = new Date().getTime();
      const duration = (endTime - this.startTime) / 1000;
      this.log("", `🔔${this.name}, 结束! 🕛 ${duration} 秒`);
    }

    get(request, callback = () => {}) {
      switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
          $httpClient.get(request, (error, response, body) => {
            callback(error, response, body);
          });
          break;
        case "Quantumult X":
          request.method = "GET";
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
          got(request).then(
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

    post(request, callback = () => {}) {
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
          got.post(request.url, {
            headers: request.headers,
            body: request.body,
          }).then(
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
  }(name, options);
}