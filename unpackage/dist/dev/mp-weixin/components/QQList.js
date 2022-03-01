"use strict";
var common_vendor = require("../common/vendor.js");
var apis_qq = require("../apis/qq.js");
require("../promisify.js");
if (!Math) {
  (wLoading + myBanner)();
}
const wLoading = () => "./w-loading/w-loading.js";
const myBanner = () => "./EtherealWheat-banner/specialBanner.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const albumList = common_vendor.ref([]);
    const bannerList = common_vendor.ref([]);
    const categoryList = common_vendor.ref([]);
    const showAllCategory = common_vendor.ref(false);
    const currentCategory = common_vendor.ref(null);
    const page = common_vendor.ref(1);
    const loading = common_vendor.ref(false);
    const loadingRef = common_vendor.ref(null);
    apis_qq.getRecommendQQ().then((res) => {
      if (res.data.response.code === 0) {
        albumList.value = res.data.response.playlist.data.v_playlist.map((ele) => ({
          name: ele.title,
          pic: ele.cover_url_small,
          id: ele.tid
        }));
        bannerList.value = res.data.response.focus.data.content.map((ele) => ({
          pic: ele.pic_info.url,
          id: ele.jump_info.url,
          type: ele.type === 10002 ? 1 : 2
        }));
      }
    });
    apis_qq.getCategoryListQQ().then((res) => {
      if (res.data.response.code === 0) {
        let list = res.data.response.data.categories.map((ele) => {
          return ele.items.map((e) => ({
            name: e.categoryName,
            id: e.categoryId,
            type: 2
          }));
        });
        categoryList.value = list.reduce((pre, cur) => pre.concat(cur), []);
      }
    });
    const handleBannerClick = (e) => {
      console.log(common_vendor.toRaw(e));
    };
    const getRankList = () => {
      loading.value = true;
      apis_qq.getRankListQQ().then((res) => {
        if (res.data.response.code === 0) {
          albumList.value = res.data.response.data.topList.map((ele) => ({
            name: ele.topTitle,
            id: ele.id,
            pic: ele.picUrl,
            rank: 1
          }));
        }
      }).finally(() => {
        loading.value = false;
      });
    };
    const changeCategory = (category) => {
      if (category === currentCategory)
        return;
      currentCategory.value = category;
      page.value = 1;
    };
    const getAlbumList = async (category, pageNum = 1) => {
      page.value = pageNum;
      currentCategory.value = category;
      loading.value = true;
      try {
        const albumListResult = await apis_qq.getAlbumListQQ(category, pageNum);
        if (albumListResult.data.response.code === 0) {
          const list = albumListResult.data.response.data.list.map((ele) => ({
            id: ele.dissid,
            name: ele.dissname,
            pic: ele.imgurl
          }));
          albumList.value = pageNum == 1 ? list : albumList.value.concat(list);
        }
        loading.value = false;
      } catch {
        loading.value = false;
      }
    };
    const detail = (e) => {
      common_vendor.index.navigateTo({
        url: `/pages/album/album?type=2&id=${e.id}&rank=${e.rank || 0}`
      });
    };
    common_vendor.watch([() => currentCategory.value, () => page.value], () => {
      if (+currentCategory.value === 0) {
        getRankList();
      } else if (currentCategory.value) {
        getAlbumList(currentCategory.value, page.value);
      }
    });
    const scroll = (e) => {
      if (loading.value || !currentCategory.value || currentCategory.value == "0")
        return;
      page.value += 1;
    };
    common_vendor.watch(() => loading.value, () => {
      if (loading.value) {
        loadingRef.value && loadingRef.value.open();
      } else {
        loadingRef.value && loadingRef.value.close();
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.sr(loadingRef, "2ef855a0-0", {
          "k": "loadingRef"
        }),
        b: common_vendor.p({
          mask: "true",
          click: "true"
        }),
        c: common_vendor.o(handleBannerClick),
        d: common_vendor.p({
          scaleY: "1.1",
          scaleX: "1.1",
          bannerList: bannerList.value
        }),
        e: common_vendor.o(($event) => changeCategory(0)),
        f: currentCategory.value === 0 ? 1 : "",
        g: common_vendor.f(categoryList.value.slice(0, 10), (category, k0, i0) => {
          return {
            a: common_vendor.t(category.name),
            b: common_vendor.o(($event) => changeCategory(category.id), category.name),
            c: currentCategory.value === category.id ? 1 : "",
            d: category.name
          };
        }),
        h: common_vendor.f(categoryList.value.slice(10, categoryList.value.length - 1), (category, k0, i0) => {
          return {
            a: common_vendor.t(category.name),
            b: common_vendor.o(($event) => changeCategory(category.id), category.name),
            c: currentCategory.value === category.id ? 1 : "",
            d: category.name
          };
        }),
        i: !showAllCategory.value ? 1 : "",
        j: !showAllCategory.value
      }, !showAllCategory.value ? {
        k: common_vendor.o(($event) => showAllCategory.value = true)
      } : {
        l: common_vendor.o(($event) => showAllCategory.value = false)
      }, {
        m: common_vendor.f(albumList.value, (album, k0, i0) => {
          return {
            a: album.pic,
            b: common_vendor.t(album.name),
            c: common_vendor.o(($event) => detail(album), album.id),
            d: album.id
          };
        }),
        n: common_vendor.f(3 - albumList.value.length % 3, (item, k0, i0) => {
          return {
            a: item
          };
        }),
        o: common_vendor.o(scroll),
        p: common_vendor.o(($event) => 200)
      });
    };
  }
});
wx.createComponent(_sfc_main);
