"use strict";
var common_vendor = require("../common/vendor.js");
var apis_kugou = require("../apis/kugou.js");
require("../promisify.js");
if (!Math) {
  wLoading();
}
const wLoading = () => "./w-loading/w-loading.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  setup(__props) {
    const albumList = common_vendor.ref([]);
    const categoryList = common_vendor.ref([]);
    const showAllCategory = common_vendor.ref(false);
    const currentCategory = common_vendor.ref(null);
    const page = common_vendor.ref(1);
    const loading = common_vendor.ref(false);
    const loadingRef = common_vendor.ref(null);
    const getRecommend = (page2) => {
      loading.value = true;
      apis_kugou.getRecommendKG(page2).then((res) => {
        const list = res.data.plist.list.info.map((ele) => ({
          name: ele.specialname,
          pic: ele.imgurl.replace("{size}", "400"),
          id: ele.specialid
        }));
        albumList.value = page2.value == 1 ? list : albumList.value.concat(list);
        loading.value = false;
      }).finally(() => {
        loading.value = false;
      });
    };
    getRecommend(page.value);
    apis_kugou.getCategoryListKG().then((res) => {
      if (res.data.code === 200) {
        categoryList.value = res.data.result;
      }
    });
    const getRankList = () => {
      loading.value = true;
      apis_kugou.getRankListKG().then((res) => {
        albumList.value = res.data.rank.list.map((ele) => ({
          id: ele.rankid,
          name: ele.rankname,
          pic: ele.imgurl.replace("{size}", "400"),
          rank: 1
        }));
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
        const result = await apis_kugou.getAlbumListKG(category, page.value);
        if (result.data.errcode === 0 && result.data.data.info) {
          const list = result.data.data.info.map((ele) => ({
            name: ele.specialname,
            pic: ele.imgurl.replace("{size}", "400"),
            id: ele.specialid
          }));
          albumList.value = page.value === 1 ? list : albumList.value.concat(list);
        }
        loading.value = false;
      } catch {
        loading.value = false;
      }
    };
    const detail = (e) => {
      common_vendor.index.navigateTo({
        url: `/pages/album/album?type=4&id=${e.id}&rank=${e.rank || 0}`
      });
    };
    common_vendor.watch([() => currentCategory.value, () => page.value], () => {
      if (currentCategory.value == null) {
        getRecommend(page.value);
      } else if (+currentCategory.value === 0) {
        getRankList();
      } else if (currentCategory.value) {
        getAlbumList(currentCategory.value, page.value);
      }
    });
    const scroll = () => {
      if (loading.value || currentCategory.value == "0")
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
        a: common_vendor.sr(loadingRef, "6b894662-0", {
          "k": "loadingRef"
        }),
        b: common_vendor.p({
          mask: "true",
          click: "true"
        }),
        c: common_vendor.o(($event) => changeCategory(0)),
        d: currentCategory.value === 0 ? 1 : "",
        e: common_vendor.f(categoryList.value.slice(0, 10), (category, k0, i0) => {
          return {
            a: common_vendor.t(category.name),
            b: common_vendor.o(($event) => changeCategory(category.id), category.name),
            c: currentCategory.value === category.id ? 1 : "",
            d: category.name
          };
        }),
        f: common_vendor.f(categoryList.value.slice(10, categoryList.value.length - 1), (category, k0, i0) => {
          return {
            a: common_vendor.t(category.name),
            b: common_vendor.o(($event) => changeCategory(category.id), category.name),
            c: currentCategory.value === category.id ? 1 : "",
            d: category.name
          };
        }),
        g: !showAllCategory.value ? 1 : "",
        h: showAllCategory.value,
        i: !showAllCategory.value
      }, !showAllCategory.value ? {
        j: common_vendor.o(($event) => showAllCategory.value = true)
      } : {
        k: common_vendor.o(($event) => showAllCategory.value = false)
      }, {
        l: common_vendor.f(albumList.value, (album, k0, i0) => {
          return {
            a: album.pic,
            b: common_vendor.t(album.name),
            c: common_vendor.o(($event) => detail(album), album.id),
            d: album.id
          };
        }),
        m: common_vendor.f(3 - albumList.value.length % 3, (item, k0, i0) => {
          return {
            a: item
          };
        }),
        n: common_vendor.o(scroll),
        o: common_vendor.o(($event) => 200)
      });
    };
  }
});
wx.createComponent(_sfc_main);
