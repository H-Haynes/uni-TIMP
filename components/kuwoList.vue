<template>
	<scroll-view @scrolltolower="scroll"  @lower-threshold="200" scroll-y class="h-full">
		<w-loading mask="true" click="true" ref="loadingRef"></w-loading>
		<my-banner scaleY="1.1" scaleX="1.1" @bannerClick="handleBannerClick" :bannerList="bannerList"></my-banner>
		<view class="mb-3 px-2">
			<text @click="changeCategory(0)" :class="{'current-category border-gray-100':currentCategory === 0}"  class="inline-block text-sm text-red-500 border border-red-500 mr-1 px-2 mb-2">排行榜</text>
			<text @click="changeCategory(category.id)" :class="{'current-category':currentCategory === category.id}" class="inline-block text-gray-500 text-sm mr-1 border px-2 mb-2" v-for="category in categoryList.slice(0,10)" :key="category.name">{{category.name}}</text>

			<text  @click="changeCategory(category.id)" :class="{'current-category':currentCategory === category.id,'hidden':!showAllCategory}"  class="inline-block text-gray-500 text-sm mr-1 border px-2 mb-2" v-for="category in categoryList.slice(10,categoryList.length-1)" :key="category.name">{{category.name}}</text>

			<text v-if="!showAllCategory" @click="showAllCategory=true" class="inline-block text-gray-500 text-sm mr-1 border px-2 mb-2">···</text>
			<text v-else="showAllCategory" @click="showAllCategory=false" class="inline-block text-gray-500 text-sm mr-1 border px-2 mb-2">收起</text>
		</view>
		<view class="flex flex-wrap justify-around ">
			<view @click="detail(album)" class="w-28" v-for="album in albumList" :key="album.id">
				<image class="w-28 h-28 rounded"  :lazy-load="true" :src="album.pic" />
				<text class="text-xs inline-block leading-5 h-10 overflow-hidden">{{album.name}}</text>
			</view>
			<view class="w-28 empty" v-for="item in (3 - albumList.length % 3)" :key="item"></view>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import wLoading from "../components/w-loading/w-loading.vue"

	import {getAlbumListKW,getBannerKW,getRecommendKW,getCategoryListKW,getRankListKW} from '@/apis/kuwo';
	import myBanner from '../components/EtherealWheat-banner/specialBanner.vue';
	import {ref,toRaw,watch} from 'vue'
	const albumList = ref([]);
	const bannerList = ref([]);
	const categoryList = ref([]);
	const showAllCategory = ref(false);
	const currentCategory = ref(null);
	const page = ref(1);
	const loading = ref(false);
	const loadingRef = ref(null);
	//获取推荐歌单
	getRecommendKW().then(res=>{
		if(res.data.code === 200){
		  albumList.value = res.data.data.list.map(ele=>({
			name:ele.name,
			pic:ele.img,
			id:ele.id,
		  }));
		}
	})
	
	//获取banner列表
	getBannerKW().then(res=>{
		if(res.data.code === 200){
			bannerList.value = res.data.data.map(ele=>{
			  let splitUrl = ele.url.split('/');
			  return {
				pic:ele.pic,
				type:ele.url.includes('playlist') ? 2 : ele.url.includes('album') ? 3 : 0,
				id:splitUrl[splitUrl.length-1],
			  };
			});
		}
	})
	
	// 获取歌单分类
	getCategoryListKW().then(res=>{
		if(res.data.code === 200){
			let list = res.data.data.reduce((prev,cur) => {
			  let list = cur.data.map(ele=>({
				name:ele.name,
				id:ele.id,
				type:3
			  }));
			  return prev.concat(list);
			},[]);
			categoryList.value = list.reduce((pre,cur)=>pre.concat(cur),[]);
		}
	})
	
	const handleBannerClick = (e) =>{
		console.log(toRaw(e))
	}
	// 获取排行榜
	const getRankList = () => {
		loading.value = true;
		getRankListKW().then(res=>{
			if(res.data.code === 200){
				const list = res.data.data.reduce((prev,cur)=>{
				  let list = cur.list.map(ele=>({
					id:ele.sourceid,
					name:ele.name,
					pic:ele.pic,
					rank:1,
				  }));
				  return prev.concat(list);
				},[]);
				albumList.value = list;
			}
		}).finally(()=>{
			loading.value = false;
		})
	}
	// 切换分类
	const changeCategory = (category) => {
		if(category === currentCategory) return; // 相同分类不改变
		currentCategory.value = category; // 设置分类
		page.value = 1; // 重设页数
	}
	// 获取歌单列表
	const getAlbumList = async (category:string,pageNum = 1) => {
		page.value = pageNum;
		currentCategory.value = category;
		loading.value = true;
		// try{
			const albumListResult = await getAlbumListKW(category,pageNum);
			if(albumListResult.data.code === 200){
			  const list = albumListResult.data.data.data.map(ele=>({
				  name:ele.name,
				  pic:ele.img,
				  id:ele.id,
				}));
			  albumList.value = pageNum == 1 ? list : albumList.value.concat(list); // 不是第一页则进行拼接
			}
			loading.value = false;
		// }catch{
		// 	loading.value = false;
		// }
	};
	// 前往歌单详情

	const detail = (e:{id:string,rank:string}) => {

		uni.navigateTo({
			url:`/pages/album/album?type=3&id=${e.id}&rank=${e.rank||0}`
		})
	}
	watch([()=>currentCategory.value,()=>page.value],()=>{
		
		if(+currentCategory.value === 0){
			getRankList()
		}else if(currentCategory.value){
			getAlbumList(currentCategory.value,page.value)
		}
	});
	const scroll = () => {
		if(loading.value || !currentCategory.value || currentCategory.value == '0') return;
		page.value += 1;
	}
	
	watch(()=>loading.value, ()=>{
		if(loading.value){
			loadingRef.value && loadingRef.value.open()
		}else{
			loadingRef.value && loadingRef.value.close();
		}
	})
</script>

<style>
	.current-category{
		background-image:linear-gradient(to right,rgb(106,177,214),rgb(93,125,220),rgb(140,105,230));
		color:#fff;
	}
</style>
