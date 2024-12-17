// 脚本名称：数据捕获与存储脚本
const Env = new class {
    constructor(name) {
        this.name = name;
        this.startTime = new Date().getTime();
    }
    msg(title, subtitle = "", message = "") {
        if (typeof $notification !== "undefined") {
            $notification.post(title, subtitle, message);
        } else {
            console.log(`${title}\n${subtitle}\n${message}`);
        }
    }
    log(message) {
        console.log(`[${this.name}] ${message}`);
    }
    setdata(key, value) {
        if (typeof $persistentStore !== "undefined") {
            return $persistentStore.write(value, key); // Surge, Loon 持久化存储
        } else if (typeof $prefs !== "undefined") {
            return $prefs.setValueForKey(value, key); // Quantumult X 持久化存储
        } else {
            this.log("不支持的环境，无法存储数据。");
            return false;
        }
    }
    getdata(key) {
        if (typeof $persistentStore !== "undefined") {
            return $persistentStore.read(key);
        } else if (typeof $prefs !== "undefined") {
            return $prefs.valueForKey(key);
        } else {
            this.log("不支持的环境，无法读取数据。");
            return null;
        }
    }
    done() {
        const endTime = new Date().getTime();
        this.log(`脚本执行完毕，用时 ${(endTime - this.startTime) / 1000} 秒`);
    }
}("数据捕获脚本");

// 获取请求内容
const requestBody = $request.body || "{}"; // 获取请求 Body
const requestHeaders = $request.headers || {}; // 获取请求头
Env.log(`捕获到的 Body: ${requestBody}`);
Env.log(`捕获到的 Headers: ${JSON.stringify(requestHeaders)}`);

// 数据存储逻辑
const keyName = "captured_request_data"; // 存储键名
const saveData = {
    body: requestBody,
    headers: requestHeaders,
    timestamp: new Date().toISOString(),
};

// 将数据保存到本地持久化存储
const result = Env.setdata(keyName, JSON.stringify(saveData, null, 2));

// 通知结果
if (result) {
    Env.msg("数据保存成功", "请求内容已保存到本地", `存储键: ${keyName}`);
} else {
    Env.msg("数据保存失败", "请检查存储权限或空间", "");
}

Env.done();