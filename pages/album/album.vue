<template>
	<view class="h-full flex flex-col">
		<w-loading mask="true" click="true" ref="loadingRef"></w-loading>
		<view class="p-4 flex">
			<image class="w-32 h-32 rounded mr-3 flex-shrink-0" :src="albumInfo.pic || defaultImg" />
			<view class="h-32 overflow-hidden flex flex-col">
				<text class="text-base font-bold flex-shrink-0">{{albumInfo.name}}</text>
				<view class="flex flex-shrink-0 items-center mt-2 justify-between">
					<view class="flex items-center">
						<image class="w-6 h-6 mr-2 rounded-full" :src="albumInfo.avatar || defaultImg" />
						<text class="text-xs text-purple-500">{{albumInfo.nickname}}</text>
					</view>
					<text class="text-xs text-gray-400">{{$filters.dateFormat(albumInfo.updateTime)}}</text>
				</view>
				<scroll-view scroll-y class="text-xs flex-1 h-14 text-gray-500  mt-2">
					<text v-html="albumInfo.desc"></text>
				</scroll-view>
			</view>
		</view>
		<view class="flex-1 overflow-y-scroll">
			<uni-table stripe emptyText="暂无更多数据">
				<uni-tr>
						<uni-th align="left">歌曲</uni-th>
						<uni-th align="right" class="w-24">操作</uni-th>
				</uni-tr>
				<uni-tr v-for="song in songList" :key="song.id">
						<uni-td class="flex flex-col">
							<view class="text-sm font-bold truncate">{{song.name}}</view>
							<text class="text-xs truncate">{{song.author.map(ele=>ele.nickname).join('/')}} - {{song.album}}</text>
						</uni-td>
						<uni-td align="right">
							<text class="inline-block iconfont icon-gengduomore10  mr-2"></text>
						</uni-td>
				</uni-tr>
			</uni-table>
		</view>
	</view>
</template>

<script setup lang="ts">
	import {getAlbumDetailWy}  from '@/apis/netease';
	import {ref,watch,inject} from 'vue';
	import {onLoad,} from '@dcloudio/uni-app' 
	import wLoading from "@/components/w-loading/w-loading.vue"
	const defaultImg = 'http://preferyou.cn/freed/icon.png'
	const loadingRef = ref(null);
	const loading = ref(false);
	const platform = ref();
	const albumId = ref();
	const isRank = ref(false);
	const $filters = inject('$filters');
	const albumInfo = ref({
		name:'',
		updateTime:'',
		pic:'',
		desc:'',
		nickname:'',
		avatar:'',
	});
	const songList = ref([])
	onLoad(params=>{
		platform.value = +params.type;
		albumId.value = +params.id;
		isRank.value = Boolean(+params.rank);
	})
	const getAlbumInfo = () =>{
		loading.value = true;
		if(platform.value == 1){
			getAlbumDetailWy(albumId.value).then(res=>{
				if(res.data.code === 200){
					const {
						name,
						updateTime,
						description:desc,
						coverImgUrl:pic,
					} = res.data.playlist; 
					const {nickname,avatarUrl:avatar} = res.data.playlist.creator
					albumInfo.value = {
						name,
						updateTime,
						pic,
						desc,
						nickname,
						avatar
					}
					songList.value = res.data.playlist.tracks.map(ele=>({
						name:ele.name,
						time:ele.dt,
						id:ele.id,
						mv:ele.mv,
						album:ele.al.name || ele.name,
						author:ele.ar.map(e=>({
							nickname:e.name,
							id:e.id
						}))
					}))
				}
			}).finally(()=>{
				loading.value = false;
			})
		}
	}
	
	watch([() => albumId.value],()=>{
		getAlbumInfo();
	})
	
	watch(()=>loading.value,()=>{
		if(loading.value){
			loadingRef.value && loadingRef.value.open()
		}else{
			loadingRef.value && loadingRef.value.close()
		}
	})
</script>

<style>

</style>
