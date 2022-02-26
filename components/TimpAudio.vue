<template>
	<view class="fixed  bottom-0 shadow-sm shadow-inner w-full  left-0 h-12 flex items-center " >
		<view class="filter grayscale linear-bg  w-full h-full" style="filter:blur(1px)">
			
		</view>
		<view class='absolute left-0 top-0 w-full h-full flex px-2 text-white'>
			<view class="w-12 h-12 border rounded-full overflow-hidden mr-2 relative -top-2">
				<image :class="{'album-rotate':store.state.audioPlaying}" class=" w-full h-full" :src="store.state.audioInfo.picUrl"></image>
			</view>
			<view class="flex flex-col justify-center items-center flex-1 truncate">
				<text class="text-sm text-gray-200 truncate">{{store.state.audioInfo.name || 'TIMP,你想听的都在这里!'}}</text>
				<text class="text-xs text-gray-300">{{store.state.audioInfo.name ? store.state.audioInfo.art.map(ele=>ele.name).join('&') : '暂无歌曲'}}</text>
			</view>
			<text v-if="!store.state.audioPlaying" class="iconfont icon-bofang2  text-3xl" @click="play"></text>
			<text v-else class="iconfont icon-zantingtingzhi ml-2 text-3xl" @click="pause"></text>
			<text class="iconfont icon-liebiao_o ml-2 text-3xl"></text>
		</view>
		
	</view>
</template>
<script setup>
	import {ref} from "vue"
	import {onLoad,} from '@dcloudio/uni-app' 
	import {useStore} from 'vuex'
	
	const store = useStore();
	const pause = () => {
		store.state.audioManager.pause();
	}
	const play = () => {
		store.state.audioManager.play();
	}

</script>

<style>
	.album-rotate{
		animation: albumRotate 5s linear infinite;
	}
	@keyframes albumRotate{
		from{
			transform:rotateZ(0deg)
		}
		to{
			transform: rotateZ(360deg);
		}
	}
</style>
