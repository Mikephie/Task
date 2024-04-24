#!name=合集CK
#!desc=looncookie
#!author=@Mike
#!icon=https://raw.githubusercontent.com/Mikephie/icons/main/loon/qiandao.png

[Script]

# 酷我音乐签到
http-request ^https\:\/\/integralapi\.kuwo\.cn\/api\/v1\/online\/sign\/v1\/earningSignIn\/.* script-path=https://raw.githubusercontent.com/MCdasheng/QuantumultX/main/Scripts/myScripts/kuwo.cookie.js, timeout=60, tag=kuwo.cookie

# BiliBili cookie
http-request ^https?:\/\/app\.bilibili\.com\/x\/resource\/fingerprint\? script-path=https://raw.githubusercontent.com/ClydeTime/Quantumult/main/Script/Task/BiliBili.js, binary-body-mode=true, timeout=60, tag=BiliBili

http-request ^https?:\/\/m.bilibili.com/$ script-path=https://raw.githubusercontent.com/ClydeTime/Quantumult/main/Script/Task/BiliBili.js, binary-body-mode=true, timeout=60, tag=BiliBili

# TestFlight自动加入
http-request ^https:\/\/testflight\.apple\.com\/v3\/accounts\/.*\/ru\/([^\/]+)(?!\/accept)$ script-path=https://raw.githubusercontent.com/MCdasheng/QuantumultX/main/Scripts/myScripts/TF_appIds.js, timeout=60, tag=TF_appIds

# 阿里云签到
^https:\/\/(auth|aliyundrive)\.alipan\.com\/v2\/account\/token url script-request-body https://gist.githubusercontent.com/Sliverkiss/33800a98dcd029ba09f8b6fc6f0f5162/raw/aliyun.js

[MITM]
hostname = app.bilibili.com, m.bilibili.com, auth.alipan.com, auth.aliyundrive.com, integralapi.kuwo.cn, testflight.apple.com