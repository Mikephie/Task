#!name=合集CK
#!author=@Mike

🎯重写脚本:
[rewrite_local]

# 阿里云签到
^https:\/\/(auth|aliyundrive)\.alipan\.com\/v2\/account\/token url script-request-body https://gist.githubusercontent.com/Sliverkiss/33800a98dcd029ba09f8b6fc6f0f5162/raw/aliyun.js

# TestFlight自动加入
^https:\/\/testflight\.apple\.com\/(v3\/accounts\/.*[^\/accept]|join\/[A-Za-z0-9]+)$ url script-request-header https://raw.githubusercontent.com/Yuheng0101/X/main/Tasks/AutoJoinTF.js

# 酷我音乐签到 - MCdasheng
https\:\/\/integralapi\.kuwo\.cn\/api\/v1\/online\/sign\/v1\/earningSignIn\/.* url script-request-header https://raw.githubusercontent.com/MCdasheng/QuantumultX/main/Scripts/myScripts/kuwo.cookie.js

# 酷我音乐获取Cookies
https:\/\/appi\.kuwo\.cn\/api\/automobile\/kuwo\/v1\/configuration\/signature\?)/ url script-request-body https://raw.githubusercontent.com/General74110/Quantumult-X/master/Task/kuwo_Cookies.js

# 酷我音乐刷时长
https:\/\/integralapi\.kuwo\.cn\/api\/v1\/online\/sign\/v1\/music\/userBase\? url script-request-body https://raw.githubusercontent.com/General74110/Quantumult-X/master/Task/Kuwomusic.js


[MITM]
hostname = app.bilibili.com, m.bilibili.com, auth.alipan.com, auth.aliyundrive.com, integralapi.kuwo.cn, appi.kuwo.cn, testflight.apple.com