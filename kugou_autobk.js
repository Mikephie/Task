const scriptManager = new Env("KuGou VIP Auto-Claim");

function loadStoredParams(key) {
  if (typeof $prefs !== "undefined") {
    return JSON.parse($prefs.valueForKey(key)) || {};
  } else if (typeof $persistentStore !== "undefined") {
    return JSON.parse($persistentStore.read(key)) || {};
  } else if (typeof $persistent !== "undefined") {
    return JSON.parse($persistent.getItem(key)) || {};
  }
  return {};
}

let urlParams = loadStoredParams("urlParams");
let headerParams = loadStoredParams("headerParams");
let originalUrl = loadStoredParams("originalUrl");

const requestUrl = "https://gateway.kugou.com/youth/v1/recharge/receive_vip_listen_song?" + 
  `appid=${urlParams.appid}&` +
  `clientver=${urlParams.clientver}&` +
  `clienttime=${urlParams.clienttime}&` +
  `mid=${urlParams.mid}&` +
  `uuid=${urlParams.uuid}&` +
  `dfid=${urlParams.dfid}&` +
  `token=${urlParams.token}&` +
  `userid=${urlParams.userid}&` +
  `srcappid=${urlParams.srcappid}&` +
  `signature=${urlParams.signature}`;

const headers = {
  ":authority": headerParams[":authority"],
  "content-type": headerParams["content-type"],
  "kg-rf": headerParams["kg-rf"],
  "accept": headerParams.accept,
  "kg-thash": headerParams["kg-thash"],
  "accept-language": headerParams["accept-language"],
  "accept-encoding": headerParams["accept-encoding"],
  "kg-rec": headerParams["kg-rec"],
  "user-agent": headerParams["user-agent"],
  "kg-rc": headerParams["kg-rc"],
  "kg-fake": headerParams["kg-fake"],
  "content-length": headerParams["content-length"],
  "uni-useragent": headerParams["uni-useragent"]
};

const requestConfig = {
  "url": requestUrl,
  "headers": headers
};

scriptManager.post(requestConfig, function (error, response, data) {
  if (error) {
    scriptManager.log("Request error:", error);
    scriptManager.done();
    return;
  }
  
  try {
    scriptManager.log(data);
    const responseData = JSON.parse(data);
    
    if (responseData.status === 1) {
      scriptManager.msg("Claim Successful", "Successfully claimed VIP privileges", "");
    } else {
      scriptManager.msg("Claim Failed", "Already claimed today - no need to claim again", "");
    }
  } catch (parseError) {
    scriptManager.log("Response parsing error:", parseError);
    scriptManager.msg("Parse Failed", "Unable to parse server response", "");
  } finally {
    scriptManager.done();
  }
});

// Env class definition remains the same...
// (The rest of the Env class implementation is kept as is since it's a utility class)