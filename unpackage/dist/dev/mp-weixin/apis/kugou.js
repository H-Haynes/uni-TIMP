"use strict";
var common_vendor = require("../common/vendor.js");
var promisify = require("../promisify.js");
const prefix = "http://preferyou.cn/kuwo";
const request = promisify.promisify(common_vendor.index.request);
const getRecommendKG = (page = 1) => {
  return request({
    url: `${prefix}/kugou/getAlbumList?&page=${page}`,
    method: "GET"
  });
};
const getCategoryListKG = () => {
  return request({
    url: `${prefix}/kugou/getTagList`,
    methods: "GET"
  });
};
const getRankListKG = () => {
  return request({
    url: `${prefix}/kugou/rank/list`,
    method: "GET"
  });
};
const getAlbumListKG = (type, page = 1) => {
  return request({
    url: `${prefix}/kugou/albumList?tagid=${type}&page=${page}`,
    method: "GET"
  });
};
const getAlbumDetailKG = (id) => {
  return request({
    url: `${prefix}/kugou/albumInfo?albumId=${id}`,
    methods: "GET"
  });
};
const getRankMusicListKG = (id) => {
  return request({
    url: `${prefix}/kugou/rank/info?rankid=${id}`,
    method: "GET"
  });
};
const getSongDetailKG = (id) => {
  return request({
    url: `${prefix}/kugou/playInfo?id=${id}`
  });
};
exports.getAlbumDetailKG = getAlbumDetailKG;
exports.getAlbumListKG = getAlbumListKG;
exports.getCategoryListKG = getCategoryListKG;
exports.getRankListKG = getRankListKG;
exports.getRankMusicListKG = getRankMusicListKG;
exports.getRecommendKG = getRecommendKG;
exports.getSongDetailKG = getSongDetailKG;
