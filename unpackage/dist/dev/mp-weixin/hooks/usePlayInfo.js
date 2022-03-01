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
function durationTransSec(value) {
  if (!value)
    return 0;
  const temp = value.split(":");
  const minute = temp[0];
  const second = temp[1];
  return +minute * 60 + +second;
}
const getSongInfo = async (id, platformType) => {
  var _a, _b, _c, _d;
  let songInfo = {
    name: "",
    author: [],
    time: 0,
    picUrl: "",
    albumId: ""
  };
  if (platformType == 1) {
    const result = await apis_netease.getSongDetailWy(id);
    if (result.data.code === 200) {
      songInfo.name = result.data.songs[0].name;
      songInfo.author = result.data.songs[0].ar;
      songInfo.picUrl = result.data.songs[0].al.picUrl;
      songInfo.time = result.data.songs[0].dt;
    }
  } else if (platformType == 2) {
    const infoResult = await apis_qq.getSongInfoQQ(id);
    if (infoResult.data.response.code === 0) {
      songInfo.author = infoResult.data.response.songinfo.data.track_info.singer.map((ele) => {
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
        author: [{
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
      author: Array.isArray(result.data.authors) ? (_d = result.data.authors) == null ? void 0 : _d.map((ele) => ({
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
      return false;
    }
  } else if (platformType == 2) {
    const result = await apis_qq.getSongUrlQQ(id);
    if (!result.data.data.playUrl[id].error) {
      return result.data.data.playUrl[id].url;
    } else {
      return false;
    }
  } else if (platformType == 3) {
    const result = await apis_kuwo.getMusicUrlKW(id);
    if (result.data.code === 200) {
      return result.data.data;
    } else {
      return false;
    }
  } else if (platformType == 4) {
    const result = await apis_kugou.getSongDetailKG(id);
    return result.data.url || result.data.backup_url[0];
  }
};
const getLyric = async (id, platformType) => {
  let list = [{
    time: 0,
    words: "\u6B4C\u8BCD\u83B7\u53D6\u5931\u8D25!"
  }];
  if (platformType === 1) {
    const result = await apis_netease.getLyricWy(id);
    if (result.data.code == 200) {
      let lyricArr = result.data.lrc.lyric.split("\n").filter((ele) => ele.trim());
      list = lyricArr.map((ele) => {
        let temp = ele.split("]");
        let words = temp[1].trim();
        let time = temp[0].replace("[", "").trim();
        return {
          time: durationTransSec(time),
          words
        };
      });
    }
  } else if (platformType === 2) {
    const result = await apis_qq.getLyricQQ(id);
    if (result.data.response.code === 0) {
      let lyricArr = result.data.response.lyric.split("\n").filter((ele) => ele.trim());
      list = lyricArr.map((ele) => {
        let temp = ele.split("]");
        let words = temp[1].trim();
        let time = temp[0].replace("[", "").trim();
        return {
          time: durationTransSec(time),
          words
        };
      });
    }
  } else if (platformType === 3) {
    const result = await apis_kuwo.getLyricKW(id);
    if (result.data.status === 200) {
      list = result.data.data.lrclist.map((ele) => {
        return {
          time: +ele.time,
          words: ele.lineLyric
        };
      });
    }
  } else if (platformType === 4) {
    const result = await getKGLyric(id);
    if (result.data.code === 200) {
      let lyricArr = result.data.result.split("\r\n").filter((ele) => ele[ele.length - 1] !== "]" && ele.trim());
      list = lyricArr.map((ele) => {
        let temp = ele.split("]");
        let words = temp[1].trim();
        let time = temp[0].replace("[", "").trim();
        return {
          time: durationTransSec(time),
          words
        };
      });
    }
  }
  return list;
};
exports.getLyric = getLyric;
exports.getSongInfo = getSongInfo;
exports.getSongUrl = getSongUrl;
