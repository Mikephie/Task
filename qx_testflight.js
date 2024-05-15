⚙ 配置 (Quantumult X)
[MITM]
hostname = testflight.apple.com

[rewrite_local]
https:\/\/testflight\.apple\.com\/v3\/accounts\/.*\/ru\/([^\/]+)(?!\/accept)$ url script-request-header https://raw.githubusercontent.com/MCdasheng/QuantumultX/main/Scripts/myScripts/TF_appIds.js

[rewrite_remote]
https://raw.githubusercontent.com/MCdasheng/QuantumultX/main/Scripts/myScripts/TF_appIds.js, tag=testflight, update-interval=172800, opt-parser=false, enabled=false

[task_local]
30 10,20 * * * https://raw.githubusercontent.com/MCdasheng/QuantumultX/main/Scripts/myScripts/TestFlight.js, tag=TestFlight自动加入, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/testflight.png, enabled=true