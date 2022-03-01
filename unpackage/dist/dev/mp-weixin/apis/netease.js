"use strict";
var common_vendor = require("../common/vendor.js");
var promisify = require("../promisify.js");
const prefix = "http://preferyou.cn/wy";
const request = promisify.promisify(common_vendor.index.request);
const getRecommendWy = () => {
  return request({
    url: `${prefix}/personalized?limit=120`,
    method: "GET"
  });
};
const getBannerWy = () => {
  return request({
    url: `${prefix}/banner`,
    method: "GET"
  });
};
const getCategoryListWy = () => {
  return request({
    url: `${prefix}/playlist/catlist/hot`,
    methods: "GET"
  });
};
const getAlbumListWy = (type, page = 1) => {
  return request({
    url: `${prefix}/top/playlist?cat=${type}&offset=${(page - 1) * 50}`,
    method: "GET"
  });
};
const getRankListWy = () => {
  return request({
    url: `${prefix}/toplist`,
    method: "GET"
  });
};
const getAlbumDetailWy = (id) => {
  return request({
    url: `${prefix}/playlist/detail?id=${id}`,
    methods: "GET"
  });
};
const getSongUrlWy = (id) => {
  return request({ url: `${prefix}/song/url?id=${id}` });
};
const getSongDetailWy = (id) => {
  return request({ url: `${prefix}/song/detail?ids=${id}` });
};
const getLyricWy = (id) => {
  return request({ url: `${prefix}/lyric?id=${id}` });
};
const searchWy = (keyword) => {
  return request({ url: `${prefix}/search/search/multimatch?keywords=${keyword}` });
};
exports.getAlbumDetailWy = getAlbumDetailWy;
exports.getAlbumListWy = getAlbumListWy;
exports.getBannerWy = getBannerWy;
exports.getCategoryListWy = getCategoryListWy;
exports.getLyricWy = getLyricWy;
exports.getRankListWy = getRankListWy;
exports.getRecommendWy = getRecommendWy;
exports.getSongDetailWy = getSongDetailWy;
exports.getSongUrlWy = getSongUrlWy;
exports.searchWy = searchWy;
