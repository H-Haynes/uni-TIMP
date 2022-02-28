<template>
	<view class="bg-gray-800 h-full w-full flex flex-col text-gray-300 gap-5 border-red-500">
		<view class="flex justify-around items-center px-8 ">
			<image class="w-24 h-24 rounded" :src="store.state.audioInfo.picUrl" />
			<view class="flex-1 truncate ml-5 flex flex-col justify-around">
				<text class="text-xl">{{store.state.audioInfo.name}}</text>
				<text class="text-sm mt-3">{{store.state.audioInfo.author && store.state.audioInfo.author.map(ele=>ele.name).join('&')}}</text>
			</view>
		</view>
		
		<scroll-view :scroll-into-view="'lyric' + (highlightLine-5)" scroll-with-animation scroll-y class="gap-top  lyric-container  text-center text-base">
			<view 
				:class="{'linear-text highlight-line font-bold':highlightLine== index}"
				:id="'lyric'+index"
				class="text-center leading-8" 
				v-for="(item,index) in store.state.lyric" 
				:key="item.time + index">{{item.words}}
			</view>
		</scroll-view>
		
		<view class="mt-5 flex flex-1 items-center justify-around ">
			<text @click="prev" class="iconfont icon-xiayishou"></text>
			<text class="iconfont icon-bofang"></text>
			<text @click="next" class="iconfont icon-xiayishou"></text>
			<text class="iconfont icon-xunhuan"></text>
		</view>
		
	</view>
</template>

<script setup>
	import {useStore} from 'vuex';
	import {ref,toRaw,inject,computed,readonly,watch,onMounted} from 'vue';
	const store = useStore();
	
	const $eventBus = inject('$eventBus');
	const lyricRef = ref()
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
	const scrollDis = ref(0);
	// 计算高亮行距离居中需要的滚动距离
	  // watch(()=>highlightLine.value,()=>{
		 //  const query = uni.createSelectorQuery().in(this);
		 // //  query.select('.highlight-line').boundingClientRect(data => {
		 // //    if(data){
			// // 	if(data.top < 700 / 2){
			// // 		scrollDis.value = 0
			// // 	}else{
			// // 		scrollDis.value = data.top - 700/2;
			// // 	}
			// // }
		 // //  }).exec()
		 //  query.select('.highlight-line').fields({
			//   computedStyle:true,
		 //  },(res)=>{
			//   // 歌词容器高度：700rpx;
			//   // 当前行距离顶部距离小于容器一半时，不做调整
			//   // 当前行距离顶部距离大于容器一半时，设置滚动为：当前行距离顶部距离 - 容器一半
			//   console.log(res)
		 //  }).exec();
	  // })
		
	
</script>

<style>
	.h-full{
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
