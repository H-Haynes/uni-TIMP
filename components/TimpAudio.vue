<template>
	<view class="fixed  bottom-0 shadow-sm shadow-inner w-full  left-0 h-12 flex items-center " >
		<view class="filter grayscale linear-bg  w-full h-full" style="filter:blur(1px)">
			
		</view>
		<view class='absolute left-0 top-0 w-full h-full items-center flex px-2 text-white'>
			<view class="w-12 h-12 border rounded-full overflow-hidden mr-2 relative -top-2">
				<image @click="toLyric" lazy-load="true" :class="{'album-rotate':store.state.audioPlaying}" class=" w-full h-full" :src="store.state.audioInfo.picUrl || defaultPic"></image>
			</view>
			<view class="flex flex-col justify-center items-center flex-1 truncate">
				<text class="text-sm text-gray-200 truncate">{{store.state.audioInfo.name || 'TIMP,你想听的都在这里!'}}</text>
				<text class="text-xs text-gray-300 truncate">{{store.state.audioInfo.name ? store.state.audioInfo.author.map(ele=>ele.name).join('&') : '暂无歌曲'}}</text>
			</view>
			<text v-if="!store.state.audioPlaying" class="iconfont icon-bofang2  text-3xl" @click="play"></text>
			<text v-else class="iconfont icon-zantingtingzhi ml-2 text-2xl" @click="pause"></text>
			<text @click="showPlayList" class="iconfont icon-liebiao_o ml-2 text-3xl"></text>
			<view class="progress absolute bottom-0 left-0 h-1 bg-blue-700"
				:style="{width:(currentTime * 1000 / store.state.audioInfo.time) * 100 + '%'}"
				>
				
			</view>
		</view>

		<Drawer ref='drawRef' :show="showDrawer" @close="showDrawer = false">
			<view class="w-64 h-full  bg-gray-50 flex flex-col">
				<view class="flex justify-between text-sm linear-bg text-white py-3 px-3">
					<text>歌曲名</text>
					<text>歌手</text>
				</view>
				<scroll-view class="flex-1 overflow-hidden" scroll-y="true">
					<view v-for="(song,index) in store.state.playList"
						class="py-3 text-gray-500 px-3 flex justify-between text-xs"
						:class="{
							'bg-gray-200':index%2==0,
							'text-red':store.state.audioIdBaseInfo.id == song.id && store.state.audioIdBaseInfo.platform == song.platform
						}" 
						:key="song.id"
						 @click="playSong(song)"
						>
						<text class="truncate mr-2 flex-2 flex-shrink-0">{{song.name}}</text>
						<text class="truncate flex-1 text-right">{{song.author.map(ele=>ele.name).join('&')}}</text>
					</view>
				</scroll-view>
			</view>
		</Drawer>
	</view>
</template>
<script setup>
	import {ref,readonly,inject} from "vue"
	import {onLoad,onShow} from '@dcloudio/uni-app' 
	import {useStore} from 'vuex'
	import Drawer from '@/components/fui-drawer/fui-drawer.vue';
	
	const defaultPic = readonly("http://preferyou.cn/freed/icon.png");
	const store = useStore();
	const $eventBus = inject('$eventBus');
	const drawRef = ref(null);
	const showDrawer = ref(false);
	const currentTime = ref(store.state.currentTime);
	
	onShow(()=>{
		// 背景音频的需要用onPlay来调用?
		store.state.audioManager.onPlay && store.state.audioManager.onPlay(()=>{
			currentTime.value = store.state.audioManager.currentTime;
		})
		
		store.state.audioManager.ontimeupdate = () => {
			currentTime.value = store.state.audioManager.currentTime;
		}
		store.state.audioManager.onTimeUpdate && store.state.audioManager.onTimeUpdate(()=>{
			currentTime.value = store.state.audioManager.currentTime;
		})
	})
	
	
	const playSong = song => {
		$eventBus.emit('playSong',{
			id:song.id,
			platform:song.platform,
			auto:true, // 列表切歌视为自动
		})
	}
	
	const pause = () => {
		// store.state.audioManager.pause();
		$eventBus.emit('pause');
	}
	const play = () => {
		// store.state.audioManager.play();
		$eventBus.emit('play')
	}
	const showPlayList = () => {
		console.log(drawRef.value.open)
		showDrawer.value = true;
		drawRef.vlaue && drawRef.value.open();
	}

	const toLyric = () => {
		if(!store.state.audioIdBaseInfo.id){
			return uni.showToast({
				title:'暂无播放曲目',
				icon:'none'
			})
		}
		uni.navigateTo({
			url:'/pages/lyric/lyric'
		});
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
