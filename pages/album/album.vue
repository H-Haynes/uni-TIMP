<template>
	<view class="h-full flex flex-col">
		<w-loading mask="true" click="true" ref="loadingRef"></w-loading>
		<view class="p-4 flex">
			<image class="w-32 h-32 rounded mr-3 flex-shrink-0" :src="albumInfo.pic || defaultImg" />
			<view class="h-32 overflow-hidden flex flex-col">
				<text class="text-base font-bold flex-shrink-0">{{ albumInfo.name }}</text>
				<view class="flex flex-shrink-0 items-center mt-2 justify-between">
					<view class="flex items-center">
						<image class="w-6 h-6 mr-2 rounded-full" :src="albumInfo.avatar || defaultImg" />
						<text class="text-xs text-purple-500 truncate">{{ albumInfo.nickname }}</text>
					</view>
					<text class="text-xs text-gray-400 truncate">{{ $filters.dateFormat(albumInfo.updateTime) }}</text>
				</view>
				<scroll-view scroll-y class="text-xs flex-1 h-14 text-gray-500  mt-2">
					<text>{{ albumInfo.desc }}</text>
				</scroll-view>
			</view>
		</view>

		<view class="px-4 text-sm flex mb-4">
			<text @click="playAll" class="rounded bg-red-500 hover:bg-red-600 text-white py-1 px-4 mr-5">播放全部</text>
			<text
				@click="unCollect"
				v-if="store.state.collectList.some(ele => ele.id == albumId && ele.platform == platform)"
				class="rounded bg-gray-600 hover:bg-gray-700 text-white py-1 px-4"
			>
				取消收藏
			</text>
			<text @click="collect" v-else class="rounded bg-gray-600 hover:bg-gray-700 text-white py-1 px-4">收藏歌单</text>
		</view>

		<view class="flex-1 overflow-y-scroll">
			<uni-table stripe emptyText="暂无更多数据">
				<uni-tr>
					<uni-th align="left">歌曲</uni-th>
					<uni-th align="right" class="w-24">操作</uni-th>
				</uni-tr>
				<uni-tr v-for="song in songList" :key="song.id">
					<uni-td>
						<view class="flex flex-col" @click="playSong(song)">
							<view class="text-sm font-bold ">{{ song.name }}</view>
							<text class="text-xs text-gray-400">{{ song.author.map(ele => ele.nickname).join('/') }} - {{ song.album }}</text>
						</view>
					</uni-td>
					<uni-td align="right">
						<text
							@click="unlike(song)"
							v-if="store.state.likeList.some(ele => ele.id == song.id && ele.platform == platform)"
							class="inline-block text-xl iconfont icon-chuangyikongjianICON_fuzhi-  text-red-500 mr-2"
						></text>
						<text v-else @click="addLike(song)" class="inline-block iconfont icon-xihuan text-xl mr-2"></text>
						<text @click="addCollect(song)" class="inline-block iconfont icon-plus text-xl mr-2"></text>
					</uni-td>
				</uni-tr>
			</uni-table>
		</view>
		<album-dialog :show="showCollectDialog" @confirm="confirm" @update:show="e=>showCollectDialog=e"></album-dialog>
	</view>
</template>

<script setup lang="ts">
import promisify from '@/promisify';
import { getAlbumDetailWy } from '@/apis/netease';
import { getAlbumDetailQQ, getRankDetailQQ } from '@/apis/qq';
import { getAlbumDetailKW, getRankMusicListKW, getRankListKW } from '@/apis/kuwo';
import { getAlbumDetailKG, getRankMusicListKG } from '@/apis/kugou';
import { ref, watch, inject ,toRaw} from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import wLoading from '@/components/w-loading/w-loading.vue';
import AlbumDialog from '@/components/AlbumDialog.vue'
import { useStore } from 'vuex';
const defaultImg = 'http://preferyou.cn/freed/icon.png';
const loadingRef = ref(null);
const loading = ref(false);
const platform = ref();
const albumId = ref();
const isRank = ref(false);
const $filters = inject('$filters');
const $eventBus = inject('$eventBus');
const showCollectDialog = ref(false);
const albumInfo = ref({
	name: '',
	updateTime: '',
	pic: '',
	desc: '',
	nickname: '',
	avatar: ''
});
const songList = ref([]);
const store = useStore();
const operateSong = ref({});
onLoad(params => {
	platform.value = +params.type;
	isRank.value = Boolean(+params.rank);
	albumId.value = +params.id;
});

const getWyAlbum = async (id: string) => {
	loading.value = true;
	try {
		const res = await getAlbumDetailWy(id);
		if (res.data.code === 200) {
			const { name, updateTime, description: desc, coverImgUrl: pic } = res.data.playlist;
			const { nickname, avatarUrl: avatar } = res.data.playlist.creator;
			albumInfo.value = {
				name,
				updateTime,
				pic,
				desc,
				nickname,
				avatar
			};
			songList.value = res.data.playlist.tracks.map(ele => ({
				name: ele.name,
				time: ele.dt,
				id: ele.id,
				mv: ele.mv,
				album: ele.al.name || ele.name,
				author: ele.ar.map(e => ({
					nickname: e.name,
					id: e.id
				}))
			}));
		}
		loading.value = false;
	} catch {
		loading.value = false;
	}
};

const getQQAlbum = async (id: string) => {
	loading.value = true;
	const result = await getAlbumDetailQQ(id);
	if (result.data.response.code === 0) {
		let { dissname: name, desc, logo: pic, ctime: updateTime, headurl: avatar, nickname } = result.data.response.cdlist[0];
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
		songList.value = result.data.response.cdlist[0].songlist.map((ele: any) => ({
			name: ele.name,
			id: ele.mid,
			mv: ele.mv.vid || undefined,
			time: ele.interval * 1000,
			album: ele.album.name,
			pic: ele.album.picUrl,
			author: ele.singer.map((el: any) => ({
				nickname: el.name,
				id: el.id
			}))
		}));
	}
};

const getKWAlbum = async (id: string) => {
	const res = await getAlbumDetailKW(id);
	if (res.data.code === 200) {
		const { name, info: desc, img: pic, updateTime, uPic: avatar, userName: nickname } = res.data.data;
		albumInfo.value = {
			name,
			desc,
			pic,
			updateTime,
			avatar,
			nickname
		};
		songList.value = res.data.data.musicList.map((ele: any) => {
			return {
				name: ele.name,
				id: ele.rid,
				mv: ele.mvpayinfo.vid,
				time: ele.duration * 1000,
				album: ele.album,
				pic: ele.pic,
				author: [
					{
						nickname: ele.artist,
						id: ele.artistid
					}
				]
			};
		});
	}
};

const getKGAlbum = async (id: string) => {
	const result = await getAlbumDetailKG(id);
	if (result.data.info.list) {
		let { specialname: name, intro: desc, imgurl: pic, publishtime: updateTime, user_avatar: avatar, nickname } = result.data.info.list;
		pic = pic.replace('{size}', '400');
		albumInfo.value = { name, desc, pic, updateTime, avatar, nickname };
	}
	if (result.data.list.list.info) {
		songList.value = result.data.list.list.info.map(ele => ({
			name: ele.filename.split('-')[1].trim(),
			id: ele.hash,
			mv: ele.mvhash || undefined,
			time: ele.duration * 1000,
			album: '',
			pic: '',
			author: [
				{
					nickname: ele.filename.split('-')[0],
					id: 0
				}
			]
		}));
	}
};

const getKWRankDetail = async (id: number | string) => {
	try {
		loading.value = true;
		const result = await getRankMusicListKW(id);
		if (result.data.code === 200) {
			songList.value = result.data.data.musicList.map(ele => ({
			 name: ele.name,
				id: ele.musicrid,
				mv: ele.mvpayinfo.vid,
				time: ele.duration * 1000,
				album: ele.album,
				pic: ele.pic,
				author: [
					{
						nickname: ele.artist,
						id: ele.artistid
					}
				]
			}));
		}
		// 从排行榜列表获取到相关描述
		const rankListResult = await getRankListKW();
		if (rankListResult.data.code === 200) {
			let rankList = rankListResult.data.data.reduce((prev, cur) => {
				return prev.concat(cur.list);
			}, []);
			let rank = rankList.find(ele => ele.sourceid == id);

			let { name, intro: desc, pic, updateTime, pic: avatar, nickname } = rank;
			albumInfo.value = {
				name,
				desc,
				pic,
				updateTime,
				avatar,
				nickname
			};
		}
		loading.value = false;
	} catch {
		loading.value = false;
	}
};

const getQQRankDetail = async (id: number) => {
	try {
		loading.value = true;
		const result = await getRankDetailQQ(id);
		if (result.data.response.code === 0) {
			let { title: name, titleShare: desc, frontPicUrl: pic, updateTime: updateTime, topAlbumURL: avatar, AdShareContent: nickname } = result.data.response.req_1.data.data;
			albumInfo.value = { name, desc, pic, updateTime, avatar, nickname };
			let list = [];
			if (result.data.response.req_1.data.songInfoList.length > 0) {
				list = result.data.response.req_1.data.songInfoList.map(ele => ({
					name: ele.name,
					id: ele.mid,
					mv: ele.mv.vid || undefined,
					time: ele.interval * 1000,
					album: ele.album.name,
					pic: ele.album.picUrl,
					author: ele.singer.map((el: any) => ({
						nickname: el.name,
						id: el.id
					}))
				}));
			} else {
				list = result.data.response.req_1.data.data.song.map(ele => ({
					name: ele.title,
					id: ele.songId,
					albumMid: ele.albumMid,
					mv: ele.vid || undefined,
					time: null,
					album: ele.title,
					pic: ele.cover,
					author: [
						{
							nickname: ele.singerName,
							id: ele.singerMid
						}
					]
				}));
			}
			songList.value = list;
		}
		loading.value = false;
	} catch {
		loading.value = false;
	}
};

const getKGRankDetail = async (id: number | string) => {
	const result = await getRankMusicListKG(id);
	if (result.data.info) {
		let { rankname: name, intro: desc, imgurl: pic, updateTime, img_cover: avatar, nickname } = result.data.info;
		pic = pic.replace('{size}', '400');
		avatar = avatar.replace('{size}', '400');
		albumInfo.value = { name, desc, pic, updateTime, avatar, nickname };
		let list = [];
		if (result.data.songs.list) {
			list = result.data.songs.list.map(ele => ({
				name: ele.filename.split('-')[1].trim(),
				id: ele.hash,
				mv: ele.mvhash || undefined,
				time: ele.duration * 1000,
				album: ele.filename.split('-')[1].trim(),
				pic: '',
				author: [
					{
						nickname: ele.filename.split('-')[0],
						id: Math.random()
							.toString(36)
							.substr(2)
					}
				]
			}));
		}
		songList.value = list;
	}
};

const getAlbumInfo = async () => {
	if (platform.value == 1) {
		await getWyAlbum(albumId.value);
	} else if (platform.value == 2) {
		if (isRank.value) {
			await getQQRankDetail(albumId.value);
		} else {
			await getQQAlbum(albumId.value);
		}
	} else if (platform.value == 3) {
		if (isRank.value) {
			await getKWRankDetail(albumId.value);
		} else {
			await getKWAlbum(albumId.value);
		}
	} else if (platform.value == 4) {
		if (isRank.value) {
			await getKGRankDetail(albumId.value);
		} else {
			await getKGAlbum(albumId.value);
		}
	}
};

const playSong = song => {
	$eventBus.emit('playSong',{
		id: song.id,
		platform: platform.value
	})
};

const addLike = song => {
	// 需要的信息：歌曲名、歌手、id、平台
	const { name, id, author } = song;
	$eventBus.emit('addLike', {
		name,
		id,
		author,
		platform: platform.value
	});
};
const unlike = song => {
	$eventBus.emit('unlike', {
		id: song.id,
		platform: platform.value
	});
};

const collect = () => {
	$eventBus.emit('addCollect', {
		id: albumId.value,
		pic: albumInfo.value.pic,
		name: albumInfo.value.name,
		platform: platform.value,
		isRank:+isRank.value
	});
};

const unCollect = () => {
	$eventBus.emit('unCollect', {
		id: albumId.value,
		platform: platform.value
	});
};

const playAll = () => {
	promisify(uni.showModal)({
		title:'全部播放',
		content:'播放全部会替换当前播放列表，是否继续?',
		showCancel:true,
		confirmText:'继续',
	}).then(res=>{
		if(res.confirm){
			$eventBus.emit('playAll',songList.value.map(ele=>({
				id:ele.id,
				platform:platform.value,
				author:toRaw(ele.author).map(ele=>({name:ele.nickname,id:ele.id})),
				name:ele.name
			})));
		}
	})
}


const addCollect = song => {
	operateSong.value = toRaw(song);
	showCollectDialog.value = true;
}

const confirm = id => {
	console.log(id);
	// 添加到歌单;
	$eventBus.emit('addSongToAlbum',{
		song:{
			id:operateSong.value.id,
			platform:platform.value || operateSong.value.platform,
			name:operateSong.value.name,
			author:toRaw(operateSong.value.author),
		},
		albumId:id
	})
}

watch([() => albumId.value], () => {
	getAlbumInfo();
});

watch(
	() => loading.value,
	() => {
		if (loading.value) {
			loadingRef.value && loadingRef.value.open();
		} else {
			loadingRef.value && loadingRef.value.close();
		}
	}
);
</script>

<style></style>
