⚙ 配置 (Quantumult X)

[rewrite_local]
https://c6.y.qq.com/shop/fcgi-bin/fcg_get_order? url script-request-header https://raw.githubusercontent.com/WowYiJiu/Personal/main/Script/qqMusic.js
https://u6.y.qq.com/cgi-bin/musics.fcg? url script-request-header https://raw.githubusercontent.com/WowYiJiu/Personal/main/Script/qqMusic.js

[rewrite_remote]
https://raw.githubusercontent.com/WowYiJiu/Personal/main/rewrite/get_qqMusic_cookie.conf, tag=QQ音乐, update-interval=172800, opt-parser=false, enabled=false

[task_local]
25 7-12/1 * * * https://raw.githubusercontent.com/WowYiJiu/Personal/main/Script/qqMusic.js, tag=QQ音乐, img-url=https://raw.githubusercontent.com/WowYiJiu/Personal/main/icon/Color/qqMusic.png, enabled=true

[MITM]
hostname = *.y.qq.com