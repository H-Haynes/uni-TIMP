<template>
	<view class="fixed  bottom-0 shadow-sm shadow-inner w-full  left-0 h-12 flex items-center " >
		<view class="filter grayscale linear-bg  w-full h-full" style="filter:blur(1px)">
			
		</view>
		<view class='absolute left-0 top-0 w-full h-full flex px-2 text-white'>
			<view class="w-12 h-12 border rounded-full overflow-hidden mr-2 relative -top-2">
				<image class="w-full h-full" :src="audioInfo.pic"></image>
			</view>
			<view class="flex flex-col justify-center items-center flex-1">
				<text class="text-sm text-gray-200">我们仍未知道那天所见花的名字</text>
				<text class="text-xs text-gray-300">周深</text>
			</view>
			<text class="iconfont icon-bofang2  text-3xl"></text>
			<text class="iconfont icon-liebiao_o ml-2 text-3xl"></text>
		</view>

	</view>
</template>
<script setup>
	import {ref} from "vue"
	const audioInfo =  getApp().globalData.audioInfo;
	const audioContext = uni.createInnerAudioContext();
	
	audioContext.src = getApp().globalData.audioSrc;
	audioContext.autoplay = true;

</script>

<style>

</style>
