/*************************************
 * iTunes应用列表加载器 (多平台版)
 * 更新日期：2025-03-25
 * 功能：定期加载应用列表并存储到本地
 * 支持：Quantumult X, Loon, Surge
 *************************************/

// 配置
const CONFIG = {
  // 应用列表URL（替换为你的实际URL）
  APP_LIST_URL: "https://raw.githubusercontent.com/Mikephie/AutomatedJS/main/itunes_apps_list.json",
  
  // 本地存储键名
  STORAGE_KEY: "itunes_apps_list",
  LAST_UPDATE_KEY: "itunes_apps_last_update",
  
  // 更新间隔（8小时）
  UPDATE_INTERVAL: 8 * 60 * 60 * 1000,
  
  // 调试设置
  DEBUG: true
};

// 多平台存储适配器
const Storage = {
  // 检查当前运行环境
  _detectEnvironment() {
    if (typeof $persistentStore !== 'undefined') {
      return 'surge';
    } else if (typeof $prefs !== 'undefined') {
      return 'quanx';
    } else if (typeof $loon !== 'undefined') {
      return 'loon';
    } else {
      return 'unknown';
    }
  },
  
  // 获取存储的值
  read(key) {
    try {
      const env = this._detectEnvironment();
      
      if (env === 'surge' || env === 'loon') {
        return $persistentStore.read(key);
      } else if (env === 'quanx') {
        return $prefs.valueForKey(key);
      } else {
        console.log('不支持的环境，无法读取存储');
        return null;
      }
    } catch (e) {
      console.error(`读取存储失败: ${e.message}`);
      return null;
    }
  },
  
  // 写入存储
  write(key, value) {
    try {
      const env = this._detectEnvironment();
      
      if (env === 'surge' || env === 'loon') {
        return $persistentStore.write(value, key);
      } else if (env === 'quanx') {
        return $prefs.setValueForKey(value, key);
      } else {
        console.log('不支持的环境，无法写入存储');
        return false;
      }
    } catch (e) {
      console.error(`写入存储失败: ${e.message}`);
      return false;
    }
  }
};

// 多平台网络请求适配器
const Http = {
  get(options, callback) {
    const env = Storage._detectEnvironment();
    
    if (env === 'surge' || env === 'loon' || env === 'quanx') {
      $httpClient.get(options, callback);
    } else {
      callback(new Error('不支持的环境'), null, null);
    }
  }
};

// 多平台通知适配器
const Notify = {
  post(title, subtitle, message) {
    try {
      const env = Storage._detectEnvironment();
      
      if (env === 'surge' || env === 'loon') {
        $notification.post(title, subtitle, message);
        return true;
      } else if (env === 'quanx') {
        $notify(title, subtitle, message);
        return true;
      } else {
        console.log(`通知: ${title}, ${subtitle}, ${message}`);
        return false;
      }
    } catch (e) {
      console.error(`发送通知失败: ${e.message}`);
      return false;
    }
  }
};

// 工具函数
const Utils = {
  log(msg) {
    if (CONFIG.DEBUG) console.log(`[iTunes加载器] ${msg}`);
  },
  
  error(msg, err) {
    console.error(`[iTunes加载器] 错误: ${msg}`, err);
  },
  
  notify(title, subtitle, body) {
    Notify.post(title, subtitle, body);
  }
};

// 加载应用列表
function loadAppsList() {
  Utils.log("开始加载应用列表...");
  
  // 检查上次更新时间
  const lastUpdate = Storage.read(CONFIG.LAST_UPDATE_KEY);
  const now = Date.now();
  
  if (lastUpdate && (now - parseInt(lastUpdate) < CONFIG.UPDATE_INTERVAL)) {
    const hoursSinceUpdate = Math.floor((now - parseInt(lastUpdate)) / (60 * 60 * 1000));
    Utils.log(`应用列表在${hoursSinceUpdate}小时前已更新，跳过本次更新`);
    $done({});
    return;
  }
  
  Http.get({
    url: CONFIG.APP_LIST_URL,
    timeout: 10000 // 10秒超时
  }, (error, response, data) => {
    if (error) {
      Utils.error("请求失败", error);
      Utils.notify("iTunes应用列表更新失败", "", "请检查网络连接和URL配置");
      $done({});
      return;
    }
    
    try {
      // 验证JSON格式
      const appsList = JSON.parse(data);
      const appsCount = Object.keys(appsList).length;
      
      if (appsCount > 0) {
        // 存储应用列表
        const saveResult = Storage.write(CONFIG.STORAGE_KEY, data);
        // 更新时间戳
        const timeResult = Storage.write(CONFIG.LAST_UPDATE_KEY, now.toString());
        
        if (saveResult && timeResult) {
          Utils.log(`应用列表更新成功，共${appsCount}个应用`);
          Utils.notify(
            "iTunes应用列表已更新", 
            `成功加载${appsCount}个应用配置`, 
            `下次更新将在8小时后进行`
          );
        } else {
          Utils.error("应用列表保存失败");
          Utils.notify("iTunes应用列表更新警告", "", "应用列表下载成功但保存失败");
        }
      } else {
        Utils.log("应用列表为空，跳过更新");
        Utils.notify("iTunes应用列表更新警告", "", "获取的应用列表为空");
      }
    } catch (e) {
      Utils.error("解析应用列表失败", e);
      Utils.notify(
        "iTunes应用列表更新失败", 
        "数据解析错误", 
        "请检查应用列表格式是否正确"
      );
    }
    
    $done({});
  });
}

// 执行加载
loadAppsList();