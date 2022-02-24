<template>
	<view class="content">
		<view class="flex bg-gray-100 items-center h-10 border shadow-sm shadow-inner w-full pl-2">
			<text class="text-green-500 mr-2 font-bold">TIMP音乐</text>
			<input class="flex-1 bg-white px-2 text-sm h-9" placeholder="请输入歌曲名" />
		</view>
		<scroll-view scroll-x="true" class="whitespace-nowrap flex leading-10 text-gray-600 bg-gray-100">
			<view @click="platform=0" :class="{'text-purple-500 font-bold':platform === 0}" class="inline-block text-base ml-2">我的</view>
			<view @click="platform=1" :class="{'text-red-500 font-bold':platform === 1}" class="inline-block text-base ml-2">网易云音乐</view>
			<view @click="platform=2"  :class="{'text-green-500 font-bold ':platform === 2}" class="inline-block text-base ml-2">QQ音乐</view>
			<view @click="platform=3"  :class="{'text-blue-500 font-bold':platform === 3}" class="inline-block text-base ml-2">酷狗音乐</view>
			<view @click="platform=4"  :class="{'text-orange-500 font-bold':platform === 4}" class="inline-block text-base ml-2">酷我音乐</view>
		</scroll-view>

		<!-- <mine /> -->
		<component :is="platformComp"></component>
		<timp-audio></timp-audio>
	</view>
</template>

<script setup>
	import TimpAudio from "../../components/TimpAudio.vue"
	import mine from '../../components/mine.vue'
	import NeteaseList from '../../components/NeteaseList.vue'
	import {ref,computed} from 'vue';
	const platform = ref(1);
	const platformComp = computed(()=>{
		switch(platform.value){
			case 0: return mine;
			case 1: return NeteaseList;
			default: return mine;
		}
	})
</script>
