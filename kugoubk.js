const envInstance = new Env("酷狗概念版自动领取VIP-Eric");

if ($request.url) {
  let requestUrl = $request.url,
      requestHeaders = $request.headers,
      urlParams = new URLSearchParams(requestUrl.split("?")[1]),
      parsedParams = {
        "appid": urlParams.get("appid"),
        "clientver": urlParams.get("clientver"),
        "clienttime": urlParams.get("clienttime"),
        "mid": urlParams.get("mid"),
        "uuid": urlParams.get("uuid"),
        "dfid": urlParams.get("dfid"),
        "token": urlParams.get("token"),
        "userid": urlParams.get("userid"),
        "srcappid": urlParams.get("srcappid"),
        "signature": urlParams.get("signature")
      },
      parsedHeaders = {
        ":authority": requestHeaders[":authority"],
        "content-type": requestHeaders["content-type"],
        "kg-rf": requestHeaders["kg-rf"],
        "accept": requestHeaders.accept,
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

  function saveData(key, value) {
    if (typeof $prefs !== "undefined") {
      return $prefs.setValueForKey(JSON.stringify(value), key);
    } else if (typeof $persistentStore !== "undefined") {
      return $persistentStore.write(JSON.stringify(value), key);
    } else if (typeof $persistent !== "undefined") {
      return $persistent.setItem(key, JSON.stringify(value));
    }
  }

  saveData("urlParams", parsedParams);
  saveData("headerParams", parsedHeaders);
  saveData("originalUrl", requestUrl);

  envInstance.log("保存的 URL Params:", JSON.stringify(parsedParams));
  envInstance.log("保存的 Header Params:", JSON.stringify(parsedHeaders));
  envInstance.log("保存的 Original URL:", requestUrl);
  envInstance.log("数据已保存到持久化存储 - Eric 为您提供");
  envInstance.msg("获取数据成功", "数据已持久化保存", "");
  envInstance.done();
}

// 环境封装类
function Env(name, options) {
  class HTTPClient {
    constructor(env) {
      this.env = env;
    }
    send(request, method = "GET") {
      request = typeof request === "string" ? { url: request } : request;
      let handler = this.get;
      if (method === "POST") handler = this.post;
      return new Promise((resolve, reject) => {
        handler.call(this, request, (err, response, body) => {
          err ? reject(err) : resolve(response);
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

  return new (class {
    constructor(name, options) {
      this.name = name;
      this.http = new HTTPClient(this);
      this.data = null;
      this.dataFile = "box.dat";
      this.logs = [];
      this.isMute = false;
      this.isNeedRewrite = false;
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

    log(...messages) {
      if (messages.length > 0) {
        this.logs = [...this.logs, ...messages];
        console.log(messages.join(this.logSeparator));
      }
    }

    logErr(err) {
      this.log("", `❗️${this.name}, 错误!`, err.stack || err);
    }

    msg(title = "", subtitle = "", message = "", options = {}) {
      if (!this.isMute) {
        const formattedOptions = this.formatOptions(options);
        switch (this.getEnv()) {
          case "Surge":
          case "Loon":
          case "Shadowrocket":
          case "Stash":
            $notification.post(title, subtitle, message, formattedOptions);
            break;
          case "Quantumult X":
            $notify(title, subtitle, message, formattedOptions);
            break;
          default:
            console.log(`${title}\n${subtitle}\n${message}`);
        }
      }
    }

    formatOptions(options) {
      if (typeof options === "string") return { "open-url": options };
      if (typeof options === "object") return options;
      return {};
    }

    done() {
      const elapsedTime = (new Date().getTime() - this.startTime) / 1000;
      this.log("", `🔔${this.name}, 结束! 🕛 ${elapsedTime} 秒`);
      this.log();
      if (this.getEnv() === "Node.js") process.exit();
    }
  })(name, options);
}