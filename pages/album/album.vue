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
						<text class="text-xs text-purple-500 truncate">{{albumInfo.nickname}}</text>
					</view>
					<text class="text-xs text-gray-400 truncate">{{$filters.dateFormat(albumInfo.updateTime)}}</text>
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
							<view class="text-sm font-bold ">{{song.name}}</view>
							<text class="text-xs ">{{song.author.map(ele=>ele.nickname).join('/')}} - {{song.album}}</text>
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
	import {getAlbumDetailQQ}  from '@/apis/qq';
	import {getAlbumDetailKW} from '@/apis/kuwo';
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
	
	const getWyAlbum = async (id:string) => {
		loading.value = true;
		try{
			const res = await getAlbumDetailWy(id);
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
			loading.value = false;
		}catch{
			loading.value = false;
		}
	}
	
	const getQQAlbum = async (id:string) => {
		loading.value = true;
		const result = await getAlbumDetailQQ(id);
		if(result.data.response.code === 0){
		    let {
				dissname:name,
				desc,
				logo: pic,
				ctime:updateTime,
				headurl:avatar,
				nickname
			} = result.data.response.cdlist[0];
		    updateTime *= 1000;
		    albumInfo.value = {
				name,
				id,
				desc,
				pic,
				updateTime,
				avatar,
				nickname
			};
		    songList.value = result.data.response.cdlist[0].songlist.map((ele:any)=>({
				name:ele.name,
				id:ele.mid,
				mv:ele.mv.vid || undefined,
				time:ele.interval * 1000,
				album:ele.album.name,
				pic:ele.album.picUrl,
				author:ele.singer.map((el:any)=>({
					nickname:el.name,
					id:el.id,
				})),
		    }));
		}
	}
	
	const getKWAlbum = async(id:string) =>{
	  const res = await getAlbumDetailKW(id);
	  if(res.data.code === 200){
	    const {
			name,
			info:desc,
			img: pic,
			updateTime,
			uPic: avatar,
			userName:nickname
		} = res.data.data;
	    albumInfo.value = {
			name,
			desc,
			pic,
			updateTime,
			avatar,nickname
		};
	    songList.value = res.data.data.musicList.map((ele:any)=>{
	          return {
				  name:ele.name,
				  id:ele.rid,
				  mv:ele.mvpayinfo.vid,
				  time:ele.duration*1000,
				  album:ele.album,
				  pic:ele.pic,
	              author:[{
	                      nickname:ele.artist,
	                      id:ele.artistid,
	              }],
	              
	          };
	    });
	  }
	};
	
	const getAlbumInfo = async() =>{
		if(platform.value == 1){
			await getWyAlbum(albumId.value);
		}else if(platform.value == 2){
			await getQQAlbum(albumId.value);
		}else if(platform.value == 3){
			await getKWAlbum(albumId.value);
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
