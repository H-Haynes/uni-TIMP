<template>
	<view class="bg-gray-800 bg-opacity-50 h_full relative w-full overflow-hidden  flex flex-col text-gray-300 p-4 pt-24 border-red-500">
		<view class="flex justify-around items-center px-8 ">
			<image lazy-load="true" class="w-24 h-24 rounded" :src="store.state.audioInfo.picUrl" />
			<view class="flex-1 truncate ml-5 flex flex-col justify-around">
				<text class="text-xl">{{store.state.audioInfo.name}}</text>
				<text class="text-sm mt-3">{{store.state.audioInfo.author && store.state.audioInfo.author.map(ele=>ele.name).join('&')}}</text>
			</view>
		</view>
		
		<scroll-view :scroll-into-view="'lyric' + (highlightLine-6)" 
					scroll-with-animation scroll-y 
					class="gap-top  lyric-container  text-center text-base flex-1">
			<view 
				:class="{'linear-text highlight-line font-bold':highlightLine== index}"
				:id="'lyric'+index"
				class="text-center leading-8" 
				v-for="(item,index) in store.state.lyric" 
				:key="item.time + index">{{item.words}}
			</view>
		</scroll-view>
		
		<view class="mt-5 h-32 flex  flex-col justify-around">
			<view class=" h-1">
				<!-- <movable-area class="h-1 px-1 bg-gray-400 w-full relative overflow-x-hidden">
					<movable-view style="left:0" class="absolute top-0 h-full w-full bg-white rounded">
						<text class="absolute w-3 h-3 rounded-full -right-1 -top-1 bg-white"></text>
					</movable-view>
				</movable-area> -->
				<view id="progress" class="h-1  bg-gray-400 w-full relative" @click="setCurrentTime">
					<view :style="{width:currentTime * 1000 / store.state.audioInfo.time * 100 + '%'}" 
						class="absolute top-0 h-full w-0 bg-white rounded">
						<text class="absolute w-3 h-3 rounded-full -right-1 -top-1 bg-white"></text>
					</view>
				</view>
			</view>
			<view class="flex  items-center justify-around">
				<text @click="prev" class="iconfont icon-shangyishou"></text>
				<text v-if="store.state.audioPlaying" @click="togglePlay" class="iconfont icon-zantingtingzhi"></text>
				<text v-else  @click="togglePlay" class="iconfont icon-bofang"></text>
				<text @click="next" class="iconfont icon-xiayishou"></text>
				<text @click="toggleMode" v-if="store.state.playMode==0" class="iconfont icon-xunhuan"></text>
				<text @click="toggleMode" v-else-if="store.state.playMode == 1" class="iconfont icon-suijibofang"></text>
				<text @click="toggleMode" v-else-if="store.state.playMode == 2" class="iconfont icon-danquxunhuan"></text>
			</view>
		</view>
		
		<!-- <image mode="heightFix" :src="store.state.audioInfo.picUrl" :style="{
				'z-index':-1,
				filter:'blur(1px)',
				opacity:0.8
				}" 
			class="absolute left-0 top-0 w-full h-full">
		</image> -->
		
		<view  :style="{
				'z-index':-1,
				filter:'blur(15px)',
				opacity:0.8,
				'background-image':`url(${store.state.audioInfo.picUrl})`,
				'background-size':'auto 100%',
				transform:'scale(1.15)'
				}" 
			class="absolute left-0 top-0 w-full h-full">
		</view>
	</view>
</template>

<script setup>
	import {useStore} from 'vuex';
	import {ref,toRaw,inject,computed,readonly,watch,onMounted} from 'vue';
	const store = useStore();
	
	const $eventBus = inject('$eventBus');
	const next = () =>{
		$eventBus.emit('playNext');
	}
	const prev = () =>{
		$eventBus.emit('playPrev');
	}
	const currentTime = ref(store.state.currentTime)
	
		
		// 背景音频的需要用onPlay来调用?
		store.state.audioManager.onPlay && store.state.audioManager.onPlay(()=>{
			currentTime.value = store.state.audioManager.currentTime;
		})
		// store.state.audioManager.onplay = ()=>{
		// 	console.log(666)
		// }
		store.state.audioManager.ontimeupdate = () => {
			currentTime.value = store.state.audioManager.currentTime;
		}
		store.state.audioManager.onTimeUpdate && store.state.audioManager.onTimeUpdate(()=>{
			currentTime.value = store.state.audioManager.currentTime;
		})


	
	const lyric = store.state.lyric;
	const duration = ref(store.state.audioInfo.time);
	// 计算高亮行
	const highlightLine = computed(()=>{
		let index = lyric.findIndex((ele,index)=>{
		  return currentTime.value > ele.time && (lyric[index+1] ? currentTime.value < lyric[index+1].time : true);
		});
		return index;
	});

	const toggleMode = ()=>{
		store.commit('changeMode');
	}
	const togglePlay = () =>{

		$eventBus.emit(store.state.audioPlaying ? 'pause' : 'play')
	}
	
	const setCurrentTime = (e) => {
		const query = uni.createSelectorQuery().in(this);
		query.select('#progress').boundingClientRect(data => {
		  // 用当前点击位置/宽度获取百分比，然后根据百分比设置时间;
		  const percent = e.detail.x / data.width;
		  
		  // #ifdef H5
			store.state.audioManager.currentTime = store.state.audioInfo.time/1000 * percent;
		  // #endif
		  
		  // #ifndef H5
			store.state.audioManager.startTime = store.state.audioInfo.time/1000 * percent;
		  // #endif
		}).exec();
	}
		
	
</script>

<style>
	.h_full{
		height:100vh;
	}
	.lyric-head{
		height:280rpx;
	}
	.gap-top{
		margin-top:30rpx;
	}
	.gap-5{
		padding:30rpx;
	}
	.lyric-container{
		height:700rpx;
	}
</style>
