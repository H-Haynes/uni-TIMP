<template>
	<view class="content flex flex-col h-full">
		<view class="flex items-center  shadow-sm shadow-inner w-full pl-2 py-2">
			<text class="iconfont text-2xl icon-yuyin linear-text px-2"></text>
			<input confirm-type="搜索" @confirm="toSearch" class="flex-1 rounded-2xl bg-gradient-to-r from-blue-100 to-purple-100 px-2 text-sm h-8" placeholder="请输入歌曲名" />
			<text class="iconfont text-2xl linear-text icon-tinggeshiqu text-blue-500 px-2"></text>
		</view>
		<scroll-view scroll-x="true" :show-scrollbar="false" class="hide-scroll-bar whitespace-nowrap flex leading-10 text-gray-600">
			<view @click="platform=0" :class="{'linear-text font-bold border-b-2  border-purple-500':platform === 0}" class="inline-block text-base mx-3">我的</view>
			<view @click="platform=1" :class="{'linear-text font-bold border-b-2 border-purple-500':platform === 1}" class="inline-block text-base mx-3">网易云音乐</view>
			<view @click="platform=2"  :class="{'linear-text font-bold border-b-2 border-purple-500':platform === 2}" class="inline-block text-base mx-3">QQ音乐</view>
			<view @click="platform=3"  :class="{'linear-text font-bold border-b-2 border-purple-500':platform === 3}" class="inline-block text-base mx-3">酷我音乐</view>
			<view @click="platform=4"  :class="{'linear-text font-bold border-b-2 border-purple-500':platform === 4}" class="inline-block text-base mx-3">酷狗音乐</view>
		</scroll-view>

		<view class="flex-1 overflow-hidden pb-12">
			<!-- #ifdef H5 -->
				<keep-alive>
					<component :key="platform" :is="platformComp"></component>
				</keep-alive>
			<!-- #endif -->
			<!-- #ifdef APP-PLUS -->
				<component :key="platform" :is="platformComp"></component>
			<!-- #endif -->
			<!-- #ifdef MP -->
				<mine v-show="platform===0"/>
				<NeteaseList v-show="platform===1"/>
				<QQList v-show="platform===2"/>
				<KuwoList v-show="platform===3"/>
				<KugouList v-show="platform===4"/>
			<!-- #endif -->
		</view>
		<timp-audio></timp-audio>
		
	</view>
</template>

<script setup>
	import TimpAudio from "@/components/TimpAudio.vue"
	import mine from '@/components/mine.vue'
	import NeteaseList from '@/components/NeteaseList.vue'
	import QQList from '@/components/QQList.vue'
	import KuwoList from '@/components/kuwoList.vue'
	import KugouList from '@/components/kugouList.vue'
	import {ref,computed} from 'vue';
	const platform = ref(0);
	const platformComp = computed(()=>{
		switch(platform.value){
			case 0: return mine;
			case 1: return NeteaseList;
			case 2: return QQList;
			case 3: return KuwoList;
			case 4: return KugouList;
			default: return mine;
		}
	})
	
	const toSearch = (e) =>{
		uni.navigateTo({
			url:`/pages/search/search?keywords=${e.detail.value}`,
		});
	}
	
</script>
<style>
	
	/* .linear-text2{
		background-image:-webkit-linear-gradient(to right,#f40,orange,yellow,green,skyblue,cyan,purple); 
		-webkit-background-clip:text; 
		-webkit-text-fill-color:transparent;
	} */
</style>
