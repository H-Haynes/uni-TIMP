"use strict";
var common_vendor = require("../../common/vendor.js");
var promisify = require("../../promisify.js");
var apis_netease = require("../../apis/netease.js");
var apis_qq = require("../../apis/qq.js");
var apis_kuwo = require("../../apis/kuwo.js");
var apis_kugou = require("../../apis/kugou.js");
if (!Array) {
  const _easycom_uni_th2 = common_vendor.resolveComponent("uni-th");
  const _easycom_uni_tr2 = common_vendor.resolveComponent("uni-tr");
  const _easycom_uni_td2 = common_vendor.resolveComponent("uni-td");
  const _easycom_uni_table2 = common_vendor.resolveComponent("uni-table");
  (_easycom_uni_th2 + _easycom_uni_tr2 + _easycom_uni_td2 + _easycom_uni_table2)();
}
const _easycom_uni_th = () => "../../uni_modules/uni-table/components/uni-th/uni-th.js";
const _easycom_uni_tr = () => "../../uni_modules/uni-table/components/uni-tr/uni-tr.js";
const _easycom_uni_td = () => "../../uni_modules/uni-table/components/uni-td/uni-td.js";
const _easycom_uni_table = () => "../../uni_modules/uni-table/components/uni-table/uni-table.js";
if (!Math) {
  (wLoading + _easycom_uni_th + _easycom_uni_tr + _easycom_uni_td + _easycom_uni_table)();
}
const wLoading = () => "../../components/w-loading/w-loading.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const defaultImg = "http://preferyou.cn/freed/icon.png";
    const loadingRef = common_vendor.ref(null);
    const loading = common_vendor.ref(false);
    const platform = common_vendor.ref();
    const albumId = common_vendor.ref();
    const isRank = common_vendor.ref(false);
    const $filters = common_vendor.inject("$filters");
    const $eventBus = common_vendor.inject("$eventBus");
    const albumInfo = common_vendor.ref({
      name: "",
      updateTime: "",
      pic: "",
      desc: "",
      nickname: "",
      avatar: ""
    });
    const songList = common_vendor.ref([]);
    const store = common_vendor.useStore();
    common_vendor.onLoad((params) => {
      platform.value = +params.type;
      isRank.value = Boolean(+params.rank);
      albumId.value = +params.id;
    });
    const getWyAlbum = async (id) => {
      loading.value = true;
      try {
        const res = await apis_netease.getAlbumDetailWy(id);
        if (res.data.code === 200) {
          const { name, updateTime, description: desc, coverImgUrl: pic } = res.data.playlist;
          const { nickname, avatarUrl: avatar } = res.data.playlist.creator;
          albumInfo.value = {
            name,
            updateTime,
            pic,
            desc,
            nickname,
            avatar
          };
          songList.value = res.data.playlist.tracks.map((ele) => ({
            name: ele.name,
            time: ele.dt,
            id: ele.id,
            mv: ele.mv,
            album: ele.al.name || ele.name,
            author: ele.ar.map((e) => ({
              nickname: e.name,
              id: e.id
            }))
          }));
        }
        loading.value = false;
      } catch {
        loading.value = false;
      }
    };
    const getQQAlbum = async (id) => {
      loading.value = true;
      const result = await apis_qq.getAlbumDetailQQ(id);
      if (result.data.response.code === 0) {
        let { dissname: name, desc, logo: pic, ctime: updateTime, headurl: avatar, nickname } = result.data.response.cdlist[0];
        updateTime *= 1e3;
        albumInfo.value = {
          name,
          id,
          desc,
          pic,
          updateTime,
          avatar,
          nickname
        };
        songList.value = result.data.response.cdlist[0].songlist.map((ele) => ({
          name: ele.name,
          id: ele.mid,
          mv: ele.mv.vid || void 0,
          time: ele.interval * 1e3,
          album: ele.album.name,
          pic: ele.album.picUrl,
          author: ele.singer.map((el) => ({
            nickname: el.name,
            id: el.id
          }))
        }));
      }
    };
    const getKWAlbum = async (id) => {
      const res = await apis_kuwo.getAlbumDetailKW(id);
      if (res.data.code === 200) {
        const { name, info: desc, img: pic, updateTime, uPic: avatar, userName: nickname } = res.data.data;
        albumInfo.value = {
          name,
          desc,
          pic,
          updateTime,
          avatar,
          nickname
        };
        songList.value = res.data.data.musicList.map((ele) => {
          return {
            name: ele.name,
            id: ele.rid,
            mv: ele.mvpayinfo.vid,
            time: ele.duration * 1e3,
            album: ele.album,
            pic: ele.pic,
            author: [
              {
                nickname: ele.artist,
                id: ele.artistid
              }
            ]
          };
        });
      }
    };
    const getKGAlbum = async (id) => {
      const result = await apis_kugou.getAlbumDetailKG(id);
      if (result.data.info.list) {
        let { specialname: name, intro: desc, imgurl: pic, publishtime: updateTime, user_avatar: avatar, nickname } = result.data.info.list;
        pic = pic.replace("{size}", "400");
        albumInfo.value = { name, desc, pic, updateTime, avatar, nickname };
      }
      if (result.data.list.list.info) {
        songList.value = result.data.list.list.info.map((ele) => ({
          name: ele.filename.split("-")[1].trim(),
          id: ele.hash,
          mv: ele.mvhash || void 0,
          time: ele.duration * 1e3,
          album: "",
          pic: "",
          author: [
            {
              nickname: ele.filename.split("-")[0],
              id: 0
            }
          ]
        }));
      }
    };
    const getKWRankDetail = async (id) => {
      try {
        loading.value = true;
        const result = await apis_kuwo.getRankMusicListKW(id);
        if (result.data.code === 200) {
          songList.value = result.data.data.musicList.map((ele) => ({
            name: ele.name,
            id: ele.musicrid,
            mv: ele.mvpayinfo.vid,
            time: ele.duration * 1e3,
            album: ele.album,
            pic: ele.pic,
            author: [
              {
                nickname: ele.artist,
                id: ele.artistid
              }
            ]
          }));
        }
        const rankListResult = await apis_kuwo.getRankListKW();
        if (rankListResult.data.code === 200) {
          let rankList = rankListResult.data.data.reduce((prev, cur) => {
            return prev.concat(cur.list);
          }, []);
          let rank = rankList.find((ele) => ele.sourceid == id);
          let { name, intro: desc, pic, updateTime, pic: avatar, nickname } = rank;
          albumInfo.value = {
            name,
            desc,
            pic,
            updateTime,
            avatar,
            nickname
          };
        }
        loading.value = false;
      } catch {
        loading.value = false;
      }
    };
    const getQQRankDetail = async (id) => {
      try {
        loading.value = true;
        const result = await apis_qq.getRankDetailQQ(id);
        if (result.data.response.code === 0) {
          let { title: name, titleShare: desc, frontPicUrl: pic, updateTime, topAlbumURL: avatar, AdShareContent: nickname } = result.data.response.req_1.data.data;
          albumInfo.value = { name, desc, pic, updateTime, avatar, nickname };
          let list = [];
          if (result.data.response.req_1.data.songInfoList.length > 0) {
            list = result.data.response.req_1.data.songInfoList.map((ele) => ({
              name: ele.name,
              id: ele.mid,
              mv: ele.mv.vid || void 0,
              time: ele.interval * 1e3,
              album: ele.album.name,
              pic: ele.album.picUrl,
              author: ele.singer.map((el) => ({
                nickname: el.name,
                id: el.id
              }))
            }));
          } else {
            list = result.data.response.req_1.data.data.song.map((ele) => ({
              name: ele.title,
              id: ele.songId,
              albumMid: ele.albumMid,
              mv: ele.vid || void 0,
              time: null,
              album: ele.title,
              pic: ele.cover,
              author: [
                {
                  nickname: ele.singerName,
                  id: ele.singerMid
                }
              ]
            }));
          }
          songList.value = list;
        }
        loading.value = false;
      } catch {
        loading.value = false;
      }
    };
    const getKGRankDetail = async (id) => {
      const result = await apis_kugou.getRankMusicListKG(id);
      if (result.data.info) {
        let { rankname: name, intro: desc, imgurl: pic, updateTime, img_cover: avatar, nickname } = result.data.info;
        pic = pic.replace("{size}", "400");
        avatar = avatar.replace("{size}", "400");
        albumInfo.value = { name, desc, pic, updateTime, avatar, nickname };
        let list = [];
        if (result.data.songs.list) {
          list = result.data.songs.list.map((ele) => ({
            name: ele.filename.split("-")[1].trim(),
            id: ele.hash,
            mv: ele.mvhash || void 0,
            time: ele.duration * 1e3,
            album: ele.filename.split("-")[1].trim(),
            pic: "",
            author: [
              {
                nickname: ele.filename.split("-")[0],
                id: Math.random().toString(36).substr(2)
              }
            ]
          }));
        }
        songList.value = list;
      }
    };
    const getAlbumInfo = async () => {
      if (platform.value == 1) {
        await getWyAlbum(albumId.value);
      } else if (platform.value == 2) {
        if (isRank.value) {
          await getQQRankDetail(albumId.value);
        } else {
          await getQQAlbum(albumId.value);
        }
      } else if (platform.value == 3) {
        if (isRank.value) {
          await getKWRankDetail(albumId.value);
        } else {
          await getKWAlbum(albumId.value);
        }
      } else if (platform.value == 4) {
        if (isRank.value) {
          await getKGRankDetail(albumId.value);
        } else {
          await getKGAlbum(albumId.value);
        }
      }
    };
    const playSong = (song) => {
      $eventBus.emit("playSong", {
        id: song.id,
        platform: platform.value
      });
    };
    const addLike = (song) => {
      const { name, id, author } = song;
      $eventBus.emit("addLike", {
        name,
        id,
        author,
        platform: platform.value
      });
    };
    const unlike = (song) => {
      $eventBus.emit("unlike", {
        id: song.id,
        platform: platform.value
      });
    };
    const collect = () => {
      $eventBus.emit("addCollect", {
        id: albumId.value,
        pic: albumInfo.value.pic,
        name: albumInfo.value.name,
        platform: platform.value
      });
    };
    const unCollect = () => {
      $eventBus.emit("unCollect", {
        id: albumId.value,
        platform: platform.value
      });
    };
    const playAll = () => {
      promisify.promisify(common_vendor.index.showModal)({
        title: "\u5168\u90E8\u64AD\u653E",
        content: "\u64AD\u653E\u5168\u90E8\u4F1A\u66FF\u6362\u5F53\u524D\u64AD\u653E\u5217\u8868\uFF0C\u662F\u5426\u7EE7\u7EED?",
        showCancel: true,
        confirmText: "\u7EE7\u7EED"
      }).then((res) => {
        if (res.confirm) {
          $eventBus.emit("playAll", songList.value.map((ele) => ({
            id: ele.id,
            platform: platform.value,
            author: common_vendor.toRaw(ele.author).map((ele2) => ({ name: ele2.nickname, id: ele2.id })),
            name: ele.name
          })));
        }
      });
    };
    common_vendor.watch([() => albumId.value], () => {
      getAlbumInfo();
    });
    common_vendor.watch(() => loading.value, () => {
      if (loading.value) {
        loadingRef.value && loadingRef.value.open();
      } else {
        loadingRef.value && loadingRef.value.close();
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.sr(loadingRef, "312fc82d-0", {
          "k": "loadingRef"
        }),
        b: common_vendor.p({
          mask: "true",
          click: "true"
        }),
        c: albumInfo.value.pic || defaultImg,
        d: common_vendor.t(albumInfo.value.name),
        e: albumInfo.value.avatar || defaultImg,
        f: common_vendor.t(albumInfo.value.nickname),
        g: common_vendor.t(common_vendor.unref($filters).dateFormat(albumInfo.value.updateTime)),
        h: common_vendor.t(albumInfo.value.desc),
        i: common_vendor.o(playAll),
        j: common_vendor.unref(store).state.collectList.some((ele) => ele.id == albumId.value && ele.platform == platform.value)
      }, common_vendor.unref(store).state.collectList.some((ele) => ele.id == albumId.value && ele.platform == platform.value) ? {
        k: common_vendor.o(unCollect)
      } : {
        l: common_vendor.o(collect)
      }, {
        m: common_vendor.p({
          align: "left"
        }),
        n: common_vendor.p({
          align: "right"
        }),
        o: common_vendor.f(songList.value, (song, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(song.name),
            b: common_vendor.t(song.author.map((ele) => ele.nickname).join("/")),
            c: common_vendor.t(song.album),
            d: common_vendor.o(($event) => playSong(song)),
            e: "312fc82d-6-" + i0 + "," + ("312fc82d-5-" + i0),
            f: common_vendor.unref(store).state.likeList.some((ele) => ele.id == song.id && ele.platform == platform.value)
          }, common_vendor.unref(store).state.likeList.some((ele) => ele.id == song.id && ele.platform == platform.value) ? {
            g: common_vendor.o(($event) => unlike(song))
          } : {
            h: common_vendor.o(($event) => addLike(song))
          }, {
            i: "312fc82d-7-" + i0 + "," + ("312fc82d-5-" + i0),
            j: song.id,
            k: "312fc82d-5-" + i0 + ",312fc82d-1"
          });
        }),
        p: common_vendor.p({
          align: "right"
        }),
        q: common_vendor.p({
          stripe: true,
          emptyText: "\u6682\u65E0\u66F4\u591A\u6570\u636E"
        })
      });
    };
  }
});
wx.createPage(_sfc_main);
