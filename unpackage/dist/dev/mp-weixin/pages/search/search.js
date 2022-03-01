"use strict";
var common_vendor = require("../../common/vendor.js");
var apis_kugou = require("../../apis/kugou.js");
var apis_kuwo = require("../../apis/kuwo.js");
var apis_qq = require("../../apis/qq.js");
var apis_netease = require("../../apis/netease.js");
require("../../promisify.js");
if (!Math) {
  AlbumDialog();
}
const AlbumDialog = () => "../../components/AlbumDialog.js";
const _sfc_main = {
  setup(__props) {
    const keywords = common_vendor.ref("");
    const platform = common_vendor.ref(1);
    const list = common_vendor.ref([]);
    const store = common_vendor.useStore();
    const $eventBus = common_vendor.inject("$eventBus");
    const showCollectDialog = common_vendor.ref(false);
    const operateSong = common_vendor.ref({});
    common_vendor.onLoad((params) => {
      keywords.value = params.keywords || "";
      platform.value = params.platform || 1;
    });
    const getRelativeListWy = async (keywords2) => {
      var _a, _b, _c;
      const res = await apis_netease.searchWy(keywords2);
      let list2 = [];
      if (res.data.code === 200) {
        list2 = (_c = (_b = (_a = res.data) == null ? void 0 : _a.result) == null ? void 0 : _b.songs) == null ? void 0 : _c.map((ele) => ({
          id: ele.id,
          type: 1,
          name: ele.name,
          mvid: ele.mvid,
          author: ele.artists.map((e) => ({
            name: e.name,
            id: e.id
          })),
          album: ele.album.name || ele.name
        }));
      }
      return list2;
    };
    const getRelativeListQQ = async (keywords2) => {
      const res = await apis_qq.searchQQ(keywords2);
      let list2 = [];
      if (res.data.response.code === 0) {
        list2 = res.data.response.data.song.itemlist.map((ele) => ({
          id: ele.mid,
          type: 2,
          name: ele.name,
          mvid: ele.mv,
          album: ele.name,
          author: [{
            name: ele.singer,
            id: ele.singerid
          }]
        }));
      }
      return list2;
    };
    const getRelativeListKG = async (keywords2) => {
      const res = await apis_kugou.searchKG(keywords2);
      let list2 = [];
      if (res.data.errcode === 0) {
        list2 = res.data.data.info.map((ele) => ({
          id: ele.hash,
          type: 3,
          name: ele.songname,
          mvid: ele.mvhash,
          author: [{
            name: ele.singername,
            id: Math.random().toString(36).substr(2)
          }],
          album: ele.album_name || ele.filename.split("-")[1].trim()
        }));
      }
      return list2;
    };
    const getRelativeListKW = async (keywords2) => {
      const res = await apis_kuwo.searchKW(keywords2);
      let list2 = [];
      if (res.data.code === 200) {
        list2 = res.data.data.list.map((ele) => ({
          id: ele.musicrid,
          type: 4,
          name: ele.name,
          mv: ele.mvpayinfo.vid,
          album: ele.album || ele.name,
          author: [{
            name: ele.artist,
            id: ele.artistid
          }]
        }));
      }
      return list2;
    };
    common_vendor.watch([() => keywords.value, () => platform.value], async () => {
      if (!keywords.value.trim()) {
        return;
      }
      if (platform.value == 1) {
        list.value = await getRelativeListWy(keywords.value);
      } else if (platform.value == 2) {
        list.value = await getRelativeListQQ(keywords.value);
      } else if (platform.value == 3) {
        list.value = await getRelativeListKW(keywords.value);
      } else if (platform.value == 4) {
        list.value = await getRelativeListKG(keywords.value);
      }
    });
    common_vendor.watch(() => platform.value, () => {
      list.value = [];
    });
    const addLike = (song) => {
      const { name, id, author, mvid: mv, time, album } = song;
      $eventBus.emit("addLike", {
        name,
        id,
        author,
        platform: platform.value,
        mv,
        time,
        album
      });
    };
    const unlike = (song) => {
      $eventBus.emit("unlike", {
        id: song.id,
        platform: platform.value
      });
    };
    const addCollect = (song) => {
      operateSong.value = common_vendor.toRaw(song);
      showCollectDialog.value = true;
    };
    const confirm = (id) => {
      $eventBus.emit("addSongToAlbum", {
        song: {
          id: operateSong.value.id,
          platform: platform.value || operateSong.value.platform,
          name: operateSong.value.name,
          author: common_vendor.toRaw(operateSong.value.author),
          album: operateSong.value.album,
          mv: operateSong.value.mv,
          time: operateSong.value.time
        },
        albumId: id
      });
    };
    const playSong = (song) => {
      $eventBus.emit("playSong", {
        id: song.id,
        platform: platform.value || song.platform || 0
      });
    };
    return (_ctx, _cache) => {
      return {
        a: keywords.value,
        b: common_vendor.o(($event) => keywords.value = $event.detail.value),
        c: common_vendor.o(($event) => platform.value = 1),
        d: platform.value == 1 ? 1 : "",
        e: common_vendor.o(($event) => platform.value = 2),
        f: platform.value == 2 ? 1 : "",
        g: common_vendor.o(($event) => platform.value = 3),
        h: platform.value == 3 ? 1 : "",
        i: common_vendor.o(($event) => platform.value = 4),
        j: platform.value == 4 ? 1 : "",
        k: common_vendor.f(list.value, (song, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(song.name),
            b: common_vendor.t(song.author.map((ele) => ele.name).join("&")),
            c: common_vendor.t(song.album),
            d: common_vendor.o(($event) => playSong(song)),
            e: common_vendor.unref(store).state.likeList.some((ele) => ele.id == song.id && ele.platform == platform.value)
          }, common_vendor.unref(store).state.likeList.some((ele) => ele.id == song.id && ele.platform == platform.value) ? {
            f: common_vendor.o(($event) => unlike(song))
          } : {
            g: common_vendor.o(($event) => addLike(song))
          }, {
            h: common_vendor.o(($event) => addCollect(song)),
            i: song.id
          });
        }),
        l: list.value.length == 0,
        m: common_vendor.o(confirm),
        n: common_vendor.o((e) => showCollectDialog.value = e),
        o: common_vendor.p({
          show: showCollectDialog.value
        })
      };
    };
  }
};
wx.createPage(_sfc_main);
