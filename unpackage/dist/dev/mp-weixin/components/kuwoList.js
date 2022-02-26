"use strict";
var common_vendor = require("../common/vendor.js");
var apis_kuwo = require("../apis/kuwo.js");
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
    apis_kuwo.getRecommendKW().then((res) => {
      if (res.data.code === 200) {
        albumList.value = res.data.data.list.map((ele) => ({
          name: ele.name,
          pic: ele.img,
          id: ele.id
        }));
      }
    });
    apis_kuwo.getBannerKW().then((res) => {
      if (res.data.code === 200) {
        bannerList.value = res.data.data.map((ele) => {
          let splitUrl = ele.url.split("/");
          return {
            pic: ele.pic,
            type: ele.url.includes("playlist") ? 2 : ele.url.includes("album") ? 3 : 0,
            id: splitUrl[splitUrl.length - 1]
          };
        });
      }
    });
    apis_kuwo.getCategoryListKW().then((res) => {
      if (res.data.code === 200) {
        let list = res.data.data.reduce((prev, cur) => {
          let list2 = cur.data.map((ele) => ({
            name: ele.name,
            id: ele.id,
            type: 3
          }));
          return prev.concat(list2);
        }, []);
        categoryList.value = list.reduce((pre, cur) => pre.concat(cur), []);
      }
    });
    const handleBannerClick = (e) => {
      console.log(common_vendor.toRaw(e));
    };
    const getRankList = () => {
      loading.value = true;
      apis_kuwo.getRankListKW().then((res) => {
        if (res.data.code === 200) {
          const list = res.data.data.reduce((prev, cur) => {
            let list2 = cur.list.map((ele) => ({
              id: ele.sourceid,
              name: ele.name,
              pic: ele.pic,
              rank: 1
            }));
            return prev.concat(list2);
          }, []);
          albumList.value = list;
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
      const albumListResult = await apis_kuwo.getAlbumListKW(category, pageNum);
      if (albumListResult.data.code === 200) {
        const list = albumListResult.data.data.data.map((ele) => ({
          name: ele.name,
          pic: ele.img,
          id: ele.id
        }));
        albumList.value = pageNum == 1 ? list : albumList.value.concat(list);
      }
      loading.value = false;
    };
    const detail = (e) => {
      common_vendor.index.navigateTo({
        url: `/pages/album/album?type=3&id=${e.id}&rank=${e.rank || 0}`
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
        a: common_vendor.sr(loadingRef, "cca0f048-0", {
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
        m: common_vendor.o(($event) => showAllCategory.value = false)
      }, {
        l: showAllCategory.value,
        n: common_vendor.f(albumList.value, (album, k0, i0) => {
          return {
            a: album.pic,
            b: common_vendor.t(album.name),
            c: common_vendor.o(($event) => detail(album), album.id),
            d: album.id
          };
        }),
        o: common_vendor.f(3 - albumList.value.length % 3, (item, k0, i0) => {
          return {
            a: item
          };
        }),
        p: common_vendor.o(scroll),
        q: common_vendor.o(($event) => 200)
      });
    };
  }
});
wx.createComponent(_sfc_main);
