"use strict";
var common_vendor = require("../common/vendor.js");
var promisify = require("../promisify.js");
const prefix = "http://preferyou.cn/kuwo";
const request = promisify.promisify(common_vendor.index.request);
const getBannerKW = () => {
  return request({
    url: `${prefix}/kuwo/banner`,
    method: "GET"
  });
};
const getRecommendKW = () => {
  return request({
    url: `${prefix}/kuwo/rec_gedan?pn=30`,
    method: "GET"
  });
};
const getCategoryListKW = () => {
  return request({
    url: `${prefix}/kuwo/getTagList`,
    methods: "GET"
  });
};
const getRankListKW = () => {
  return request({
    url: `${prefix}/kuwo/rank`,
    method: "GET"
  });
};
const getAlbumListKW = (type, page = 1) => {
  return request({
    url: `${prefix}/kuwo/playList/getTagPlayList?id=${type}&pn=${page}`,
    method: "GET"
  });
};
const getAlbumDetailKW = (id) => {
  return request({
    url: `${prefix}/kuwo/musicList?pid=${id}`,
    methods: "GET"
  });
};
const getRankMusicListKW = (id) => {
  return request({
    url: `${prefix}/kuwo/rank/musicList?bangId=${id}&rn=100`,
    method: "GET"
  });
};
const getMusicUrlKW = (id, format = "mp3") => {
  return request({ url: `${prefix}/kuwo/musicUrl?mid=${id}&format=${format}` });
};
const getSongDetailKW = (id) => {
  return request({ url: `${prefix}/kuwo/musicInfo?mid=${id}` });
};
const getLyricKW = (id) => {
  return request({ url: `${prefix}/kuwo/lrc?musicId=${id}` });
};
const searchKW = (keyword) => {
  return request({ url: `${prefix}/kuwo/search/searchMusicBykeyWord?key=${keyword}` });
};
exports.getAlbumDetailKW = getAlbumDetailKW;
exports.getAlbumListKW = getAlbumListKW;
exports.getBannerKW = getBannerKW;
exports.getCategoryListKW = getCategoryListKW;
exports.getLyricKW = getLyricKW;
exports.getMusicUrlKW = getMusicUrlKW;
exports.getRankListKW = getRankListKW;
exports.getRankMusicListKW = getRankMusicListKW;
exports.getRecommendKW = getRecommendKW;
exports.getSongDetailKW = getSongDetailKW;
exports.searchKW = searchKW;
