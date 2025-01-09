const environment = new Env("酷狗概念版自动领取VIP-Eric");

if ($request.url) {
  let requestUrl = $request.url, // 请求的完整 URL
    requestHeaders = $request.headers, // 请求头信息
    urlParams = new URLSearchParams(requestUrl.split("?")[1]), // 解析 URL 参数
    parsedUrlParams = {
      appId: urlParams.get("appid"),
      clientVersion: urlParams.get("clientver"),
      clientTime: urlParams.get("clienttime"),
      machineId: urlParams.get("mid"),
      uniqueId: urlParams.get("uuid"),
      deviceFingerprint: urlParams.get("dfid"),
      token: urlParams.get("token"),
      userId: urlParams.get("userid"),
      sourceAppId: urlParams.get("srcappid"),
      signature: urlParams.get("signature"),
    },
    parsedHeaders = {
      authority: requestHeaders[":authority"],
      contentType: requestHeaders["content-type"],
      kgReferer: requestHeaders["kg-rf"],
      accept: requestHeaders["accept"],
      kgThash: requestHeaders["kg-thash"],
      acceptLanguage: requestHeaders["accept-language"],
      acceptEncoding: requestHeaders["accept-encoding"],
      kgRec: requestHeaders["kg-rec"],
      userAgent: requestHeaders["user-agent"],
      kgRc: requestHeaders["kg-rc"],
      kgFake: requestHeaders["kg-fake"],
      contentLength: requestHeaders["content-length"],
      uniUserAgent: requestHeaders["uni-useragent"],
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

  saveData("urlParams", parsedUrlParams);
  saveData("headerParams", parsedHeaders);
  saveData("originalUrl", requestUrl);

  environment.log("保存的 URL 参数:", JSON.stringify(parsedUrlParams));
  environment.log("保存的 Header 参数:", JSON.stringify(parsedHeaders));
  environment.log("保存的原始 URL:", requestUrl);
  environment.log("数据已保存到持久化存储 - Eric为您提供");
  environment.msg("数据获取成功", "数据已持久化保存", "");
  environment.done();
}

// 环境配置类
function Env(name, options) {
  class HTTP {
    constructor(env) {
      this.env = env;
    }
    send(request, method = "GET") {
      request = typeof request === "string" ? { url: request } : request;
      let func = this.get;
      if (method === "POST") func = this.post;
      return new Promise((resolve, reject) => {
        func.call(this, request, (error, response, body) => {
          if (error) reject(error);
          else resolve(response);
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
      this.http = new HTTP(this);
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

    // 获取当前运行环境
    getEnv() {
      if (typeof $environment !== "undefined" && $environment["surge-version"]) return "Surge";
      if (typeof $environment !== "undefined" && $environment["stash-version"]) return "Stash";
      if (typeof module !== "undefined" && module.exports) return "Node.js";
      if (typeof $task !== "undefined") return "Quantumult X";
      if (typeof $loon !== "undefined") return "Loon";
      if (typeof $rocket !== "undefined") return "Shadowrocket";
      return undefined;
    }

    // 判断运行环境
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

    // 省略其余方法，保持脚本完整
  })(name, options);
}