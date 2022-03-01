<template>
	<view class="h-full flex flex-col overflow-hidden">
		<view class=" bg-gray-100 px-4 py-2">
			<input v-model="keywords" class="rounded-2xl bg-gradient-to-r from-blue-100 to-purple-100 px-2 text-sm h-8" placeholder="请输入关键字"/>
		</view>
		
		<view class="flex text-base bg-gray-100 mt-2">
			<text @click="platform=1" :class="{'bg-white':platform==1}" class="py-1 flex-1 border-r text-center">网易</text>
			<text @click="platform=2" :class="{'bg-white':platform==2}" class="py-1 flex-1 border-r text-center">QQ</text>
			<text @click="platform=3" :class="{'bg-white':platform==3}" class="py-1 flex-1 border-r text-center">酷我</text>
			<text @click="platform=4" :class="{'bg-white':platform==4}" class="py-1 flex-1 border-r text-center">酷狗</text>
		</view>
		<scroll-view scroll-y class="flex-1 overflow-y-scroll">
			<view  v-for="song in list" :key="song.id" class="border-b px-4 py-2 flex items-center justify-between">
				<view class="flex flex-col truncate flex-1" @click="playSong(song)">
					<text class="truncate text-base">{{song.name}}</text>
					<text class="text-xs text-gray-500 mt-1 truncate">{{song.author.map(ele=>ele.name).join('&')}} - {{song.album}}</text>
				</view>
				<view class="w-20 text-right flex-shrink-0 ml-4" >
					<text @click="unlike(song)" v-if="store.state.likeList.some(ele=>ele.id == song.id && ele.platform == platform)"  class="iconfont icon-chuangyikongjianICON_fuzhi- text-red-500"></text>
					<text v-else @click="addLike(song)" class="iconfont icon-xihuan"></text>
					<text @click="addCollect(song)" class="iconfont icon-plus ml-2"></text>
				</view>
			</view>
			
			<view v-show="list.length == 0" class="flex flex-col text-gray-300 h-48 items-center justify-center">
				<text class="iconfont icon-zanwushuju text-8xl "></text>
				<text>没有相关内容</text>
			</view>
			<album-dialog :show="showCollectDialog" @confirm="confirm" @update:show="e=>showCollectDialog=e"></album-dialog>
		</scroll-view>
	</view>
</template>

<script setup>
	import { onLoad } from '@dcloudio/uni-app';
	import {ref,watch,inject,toRaw} from 'vue'
	import {searchKG} from '@/apis/kugou';
	import {searchKW} from '@/apis/kuwo';
	import {searchQQ} from '@/apis/qq';
	import {searchWy} from '@/apis/netease';
	import {useStore} from 'vuex';
	import AlbumDialog from '@/components/AlbumDialog.vue'
	const keywords = ref('');
	const platform = ref(1);
	const list = ref([]);
	const store = useStore();
	const $eventBus = inject('$eventBus');
	const showCollectDialog = ref(false);
	const operateSong = ref({});
	onLoad((params)=>{
		keywords.value = params.keywords || '';
		platform.value = params.platform || 1;
	})
	
	
	    const getRelativeListWy = async (keywords) => {
	        const res = await searchWy(keywords);
	        let list = [];
	        if(res.data.code === 200){
	            list = res.data?.result?.songs?.map(ele=>({
	                id: ele.id,
	                type:1,
	                name: ele.name,
	                mvid:ele.mvid,
	                author:ele.artists.map(e=>({
	                    name:e.name,
	                    id:e.id, 
	                })),
					album:ele.album.name || ele.name
	            }));
	        }
	        return list;
	    };
	
	    const getRelativeListQQ = async(keywords) => {
	        const res = await searchQQ(keywords);
	        let list = [];
	        if(res.data.response.code === 0){
	            list = res.data.response.data.song.itemlist.map(ele=>({
	                id: ele.mid,
	                type:2,
	                name: ele.name,
	                mvid:ele.mv,
					album:ele.name,
	                author:[{
	                    name:ele.singer,
	                    id:ele.singerid,
	                }]
	            }));
	        }
	        return list;
	    };
	
	    const getRelativeListKG = async(keywords) => {
	        const res = await searchKG(keywords);
	        let list = [];
	        if(res.data.errcode === 0){
	            list = res.data.data.info.map(ele=>({
	                id:ele.hash,
	                type:3,
	                // name:ele.filename.split('-')[1].trim(),
					name:ele.songname,
	                mvid:ele.mvhash,
	                author:[{
	                    name:ele.singername,
	                    id:Math.random().toString(36).substr(2), //随机
	                }],
					album:ele.album_name || ele.filename.split('-')[1].trim()
	            }));
	        }
	        return list;
	    };
	
	    const getRelativeListKW = async (keywords) => {
	        const res = await searchKW(keywords);
	        let list = [];
	        if(res.data.code === 200){
	            list = res.data.data.list.map(ele=>({
	                id:ele.musicrid,
	                type:4,
	                name:ele.name,
	                mv:ele.mvpayinfo.vid,
					album:ele.album || ele.name,
	                author:[{
	                    name:ele.artist,
	                    id:ele.artistid
	                }],
	            }));
	        }
	        return list;
	    };
	
	watch([()=>keywords.value,()=>platform.value],async()=>{
		if(!keywords.value.trim()){
			return;
		}
		if(platform.value == 1){
			list.value = await getRelativeListWy(keywords.value)
		}else if(platform.value == 2){
			list.value = await getRelativeListQQ(keywords.value)
		}else if(platform.value == 3){
			list.value = await getRelativeListKW(keywords.value)
		}else if(platform.value == 4){
			list.value = await getRelativeListKG(keywords.value)
		}
	})
	watch(()=>platform.value,()=>{
		// 改变时先清空，避免平台改变了数据却没变，导致操作携带的平台信息错误
		list.value = []
	})
	
	const addLike = song =>{
		const {name,id,author,mvid:mv,time,album} = song;
		$eventBus.emit('addLike', {
			name,
			id,
			author,
			platform: platform.value,
			mv,
			time,
			album
		});
	}
	
	const unlike = song => {
		$eventBus.emit('unlike', {
			id: song.id,
			platform: platform.value
		});
	};
	const addCollect = song => {
		operateSong.value = toRaw(song);
		showCollectDialog.value = true;
	}
	const confirm = id => {
		// 添加到歌单;
		$eventBus.emit('addSongToAlbum',{
			song:{
				id:operateSong.value.id,
				platform:platform.value || operateSong.value.platform,
				name:operateSong.value.name,
				author:toRaw(operateSong.value.author),
				album:operateSong.value.album,
				mv:operateSong.value.mv,
				time:operateSong.value.time
			},
			albumId:id
		})
	}
	
	const playSong = song => {
		$eventBus.emit('playSong',{
			id: song.id,
			platform: platform.value || song.platform || 0
		})
	};
	
</script>

<style>

</style>
