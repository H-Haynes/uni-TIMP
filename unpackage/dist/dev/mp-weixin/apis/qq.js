"use strict";
var common_vendor = require("../common/vendor.js");
var promisify = require("../promisify.js");
const prefix = "http://preferyou.cn/qq";
const request = promisify.promisify(common_vendor.index.request);
const getRecommendQQ = () => {
  return request({
    url: `${prefix}/getRecommend`,
    method: "GET"
  });
};
const getCategoryListQQ = () => {
  return request({
    url: `${prefix}/getSongListCategories`,
    methods: "GET"
  });
};
const getAlbumListQQ = (type, page = 1) => {
  return request({
    url: `${prefix}/getSongLists?categoryId=${type}&page=${page}`,
    method: "GET"
  });
};
const getRankListQQ = () => {
  return request({
    url: `${prefix}/getTopLists?limit=50`,
    method: "GET"
  });
};
const getAlbumDetailQQ = (id) => {
  return request({
    url: `${prefix}//getSongListDetail?disstid=${id}`,
    methods: "GET"
  });
};
const getRankDetailQQ = (id) => {
  return request({
    url: `${prefix}/getRanks?topId=${id}&limit=100`,
    method: "GET"
  });
};
const getSongUrlQQ = (id) => {
  return request({ url: `${prefix}/getMusicPlay?songmid=${id}` });
};
const getSongInfoQQ = (id) => {
  return request({ url: `${prefix}/getSongInfo?songmid=${id}` });
};
const getSongPicQQ = (id) => {
  return request({ url: `${prefix}/getImageUrl?id=${id}` });
};
const getLyricQQ = (id) => {
  return request({ url: `${prefix}/getLyric?songmid=${id}` });
};
exports.getAlbumDetailQQ = getAlbumDetailQQ;
exports.getAlbumListQQ = getAlbumListQQ;
exports.getCategoryListQQ = getCategoryListQQ;
exports.getLyricQQ = getLyricQQ;
exports.getRankDetailQQ = getRankDetailQQ;
exports.getRankListQQ = getRankListQQ;
exports.getRecommendQQ = getRecommendQQ;
exports.getSongInfoQQ = getSongInfoQQ;
exports.getSongPicQQ = getSongPicQQ;
exports.getSongUrlQQ = getSongUrlQQ;
