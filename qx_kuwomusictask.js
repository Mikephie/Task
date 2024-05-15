⚙ 配置 (Quantumult X)
[MITM]
hostname = integralapi.kuwo.cn

[rewrite_local]
https\:\/\/integralapi\.kuwo\.cn\/api\/v1\/online\/sign\/v1\/earningSignIn\/.* url script-request-header https://raw.githubusercontent.com/MCdasheng/QuantumultX/main/Scripts/myScripts/kuwo.cookie.js

[rewrite_remote]
https://raw.githubusercontent.com/MCdasheng/QuantumultX/main/Scripts/myScripts/kuwo.cookie.js, tag=kuwo音乐, update-interval=172800, opt-parser=false, enabled=false

[task_local]
30 10,20 * * * https://raw.githubusercontent.com/MCdasheng/QuantumultX/main/Scripts/myScripts/kuwo.js, tag=🎵酷我音乐, img-url=https://raw.githubusercontent.com/deezertidal/private/main/icons/kuwosvip.png, enabled=true