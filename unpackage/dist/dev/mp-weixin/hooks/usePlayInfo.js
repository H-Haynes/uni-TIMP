"use strict";
var apis_netease = require("../apis/netease.js");
var apis_qq = require("../apis/qq.js");
var apis_kuwo = require("../apis/kuwo.js");
var apis_kugou = require("../apis/kugou.js");
var platform;
(function(platform2) {
  platform2[platform2["wy"] = 1] = "wy";
  platform2[platform2["qq"] = 2] = "qq";
  platform2[platform2["kg"] = 4] = "kg";
  platform2[platform2["kw"] = 3] = "kw";
  platform2[platform2["mg"] = 5] = "mg";
})(platform || (platform = {}));
const getSongInfo = async (id, platformType) => {
  var _a, _b, _c, _d;
  let songInfo = {
    name: "",
    art: [],
    time: 0,
    picUrl: "",
    albumId: ""
  };
  if (platformType == 1) {
    const result = await apis_netease.getSongDetailWy(id);
    if (result.data.code === 200) {
      songInfo.name = result.data.songs[0].name;
      songInfo.art = result.data.songs[0].ar;
      songInfo.picUrl = result.data.songs[0].al.picUrl;
      songInfo.time = result.data.songs[0].dt;
    }
  } else if (platformType == 2) {
    const infoResult = await apis_qq.getSongInfoQQ(id);
    if (infoResult.data.response.code === 0) {
      songInfo.art = infoResult.data.response.songinfo.data.track_info.singer.map((ele) => {
        return {
          name: ele.name,
          id: ele.mid
        };
      });
      songInfo.name = infoResult.data.response.songinfo.data.track_info.title;
      songInfo.time = infoResult.data.response.songinfo.data.track_info.interval * 1e3;
      songInfo.albumId = infoResult.data.response.songinfo.data.track_info.album.mid;
    }
    const picResult = await apis_qq.getSongPicQQ(songInfo.albumId);
    if (picResult.data.response.code === 0) {
      songInfo.picUrl = picResult.data.response.data.imageUrl;
    }
  } else if (platformType === 3) {
    let mid = (_a = id.toString().match(/\d+/)) == null ? void 0 : _a[0];
    const result = await apis_kuwo.getSongDetailKW(mid);
    if (result.data.code === 200) {
      songInfo = {
        name: result.data.data.name,
        art: [{
          name: result.data.data.artist,
          id: result.data.data.artistid
        }],
        time: result.data.data.duration * 1e3,
        picUrl: result.data.data.pic
      };
    }
  } else if (platformType === 4) {
    const result = await apis_kugou.getSongDetailKG(id);
    songInfo = {
      name: result.data.songName,
      time: result.data.timeLength * 1e3,
      picUrl: (_c = (_b = result.data) == null ? void 0 : _b.imgUrl) == null ? void 0 : _c.replace("{size}", "400"),
      art: Array.isArray(result.data.authors) ? (_d = result.data.authors) == null ? void 0 : _d.map((ele) => ({
        name: ele.author_name,
        id: ele.author_id
      })) : [{
        name: result.data.singerName || result.data.author_name,
        id: result.data.singerId
      }]
    };
  }
  return songInfo;
};
const getSongUrl = async (id, platformType) => {
  if (platformType == 1) {
    const result = await apis_netease.getSongUrlWy(id);
    if (result.data.code == 200 && result.data.data[0].url) {
      return result.data.data[0].url;
    } else {
      ElMessage.error("\u6682\u65E0\u64AD\u653E\u5730\u5740");
      return false;
    }
  } else if (platformType == 2) {
    const result = await apis_qq.getSongUrlQQ(id);
    if (!result.data.data.playUrl[id].error) {
      return result.data.data.playUrl[id].url;
    } else {
      ElMessage.error(result.data.data.playUrl[id].error);
      return false;
    }
  } else if (platformType == 3) {
    const result = await apis_kuwo.getMusicUrlKW(id);
    if (result.data.code === 200) {
      return result.data.data;
    } else {
      ElMessage.error("\u6682\u65E0\u64AD\u653E\u5730\u5740");
      return false;
    }
  } else if (platformType == 4) {
    const result = await apis_kugou.getSongDetailKG(id);
    return result.data.url || result.data.backup_url[0];
  }
};
exports.getSongInfo = getSongInfo;
exports.getSongUrl = getSongUrl;
