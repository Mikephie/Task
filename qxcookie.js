#!name=合集CK
#!desc=looncookie
#!author=@Mike
#!icon=https://raw.githubusercontent.com/Mikephie/icons/main/loon/qiandao.png

[rewrite_local]

# 酷我音乐签到
https\:\/\/integralapi\.kuwo\.cn\/api\/v1\/online\/sign\/v1\/earningSignIn\/.* url script-request-header https://raw.githubusercontent.com/MCdasheng/QuantumultX/main/Scripts/myScripts/kuwo.cookie.js

# BiliBili cookie
^https?:\/\/app\.bilibili\.com\/x\/resource\/fingerprint\? url script-request-header https://raw.githubusercontent.com/ClydeTime/Quantumult/main/Script/Task/BiliBili.js
^https?:\/\/m.bilibili.com/$ url script-request-header https://raw.githubusercontent.com/ClydeTime/Quantumult/main/Script/Task/BiliBili.js

# TestFlight自动加入
^https:\/\/testflight\.apple\.com\/v3\/accounts\/.*\/ru\/([^\/]+)(?!\/accept)$ url script-request-header https://raw.githubusercontent.com/MCdasheng/QuantumultX/main/Scripts/myScripts/TF_appIds.js

# 阿里云签到
^https:\/\/(auth|aliyundrive)\.alipan\.com\/v2\/account\/token url script-request-body https://gist.githubusercontent.com/Sliverkiss/33800a98dcd029ba09f8b6fc6f0f5162/raw/aliyun.js

# 吾爱破解 cookie
^https?:\/\/www\.52pojie\.cn\/home\.php\? url script-request-header https://raw.githubusercontent.com/ClydeTime/Quantumult/main/Script/Task/52pojie.js

[MITM]
hostname = app.bilibili.com, m.bilibili.com, auth.alipan.com, auth.aliyundrive.com, integralapi.kuwo.cn, testflight.apple.com, www.52pojie.cn