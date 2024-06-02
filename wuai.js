QuantumultX 远程脚本配置:
************************

[task_local]
# 吾爱签到
5 9 * * * https://raw.githubusercontent.com/ClydeTime/Quantumult/main/Script/Task/52pojie.js

[rewrite_local]
# 获取Cookie
https:\/\/www\.52pojie\.cn\/home\.php\? url script-request-header https://raw.githubusercontent.com/ClydeTime/Quantumult/main/Script/Task/52pojie.js

[mitm] 
hostname= www.52pojie.cn