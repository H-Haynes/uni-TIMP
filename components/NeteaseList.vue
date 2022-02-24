<template>
	<view >
		
		<my-banner scaleY="1.1" scaleX="1.1" @bannerClick="handleBannerClick" :bannerList="bannerList"></my-banner>
		<view class="mb-3 px-2">
			<text :class="{'current-category border-gray-100':currentCategory === 0}" @click="currentCategory = 0" class="inline-block text-sm text-red-500 border border-red-500 mr-1 px-2 mb-2">排行榜</text>
			<text :class="{'current-category':currentCategory === category.name}" @click="currentCategory = category.name" class="inline-block text-gray-500 text-sm mr-1 border px-2 mb-2" v-for="category in categoryList.slice(0,10)" :key="category.name">{{category.name}}</text>

			<text :class="{'current-category':currentCategory === category.name}" @click="currentCategory = category.name" v-show="showAllCategory" class="inline-block text-gray-500 text-sm mr-1 border px-2 mb-2" v-for="category in categoryList.slice(10,categoryList.length-1)" :key="category.name">{{category.name}}</text>

			<text v-show="!showAllCategory" @click="showAllCategory=true" class="inline-block text-gray-500 text-sm mr-1 border px-2 mb-2">···</text>
			<text v-show="showAllCategory" @click="showAllCategory=false" class="inline-block text-gray-500 text-sm mr-1 border px-2 mb-2">收起</text>
		</view>
		<view class="flex flex-wrap justify-around ">
			<view class="w-28" v-for="album in albumList" :key="album.id">
				<image class="w-28 h-28 rounded"  :lazy-load="true" :src="album.pic" />
				<text class="text-xs inline-block leading-5 h-10 overflow-hidden">{{album.name}}</text>
			</view>
		</view>

	</view>
</template>

<script setup>
	import {getRecommendWy,getBannerWy,getCategoryListWy} from '../apis/netease';
	import myBanner from '../components/EtherealWheat-banner/specialBanner.vue';
	import {ref,toRaw} from 'vue'
	const albumList = ref([]);
	const bannerList = ref([]);
	const categoryList = ref([]);
	const showAllCategory = ref(false);
	const currentCategory = ref(null);
	//获取推荐歌单
	getRecommendWy().then(res=>{
		if(res.data.result){
			albumList.value = res.data.result.map(ele=>({
				name:ele.name,
				pic:ele.picUrl,
				id:ele.id,
			}))
		}
	})
	//获取banner列表
	getBannerWy().then(res=>{
		if(res.data.code === 200){
			bannerList.value = res.data.banners.map(ele=>({
				pic:ele.imageUrl,
				type:ele.targetType === 1 ? 1 : 2 ,// 1为歌曲2 为其他类型，暂时忽略
				id:ele.targetId
			}))
		}
	})
	
	// 获取歌单分类
	getCategoryListWy().then(res=>{
		if(res.data.code === 200){
			categoryList.value = res.data.sub.map(ele=>({
				id:ele.category,
				name:ele.name,
				type:1
			}))
		}
	})
	
	const handleBannerClick = (e) =>{
		console.log(toRaw(e))
	}
</script>

<style>
	.current-category{
		background-image:linear-gradient(to right,rgb(106,177,214),rgb(93,125,220),rgb(140,105,230));
		color:#fff;
	}
</style>
