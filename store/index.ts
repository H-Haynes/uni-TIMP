import { createStore } from 'vuex'
import {getSongInfo,getSongUrl} from '@/hooks/usePlayInfo';
const store = createStore({
	state(){
		return {
			audioManager:null,
			currentTime:0,
			audioInfo:{
				name:'',
				art:[],
				time:0,
				picUrl:'',
				albumId:'',
				src:"",
			},
			audioIdBaseInfo:{
				id:"",
				platform:""
			},
			audioPlaying:false,
			playList:[], // 播放列表
			likeList:[], // 喜欢列表
			albumList:[], // 我的歌单列表
			collectList:[], // 收藏列表,
			playMode:0, // 0列表循环 1随机播放 2单曲循环
			lyric:[],
		}
	},
	mutations:{
		setAudioManager(state,manager){
			state.audioManager = manager;
		},
		setPlayMode(state,mode){
			state.playMode = mode;
		},
		changeCurrentTime(state,time){
			state.currentTime = time;
		},
		setLyric(state,lyric){
			state.lyric = lyric;
		},
		changeMode(state){
			state.playMode = (state.playMode+1) % 3;
		},
		setAduioInfo(state,info){
			state.audioInfo = info;
			state.audioManager.src = info.src;
			state.audioManager.title = info.name;
			// 监听事件
			// 小canplay针对h5创建的audio元素
			// state.audioManager.oncanplay = state.audioManager.onCanplay = () => {
			// 	state.audioManager.play();
			// 	state.audioPlaying = true;
			// }
			// state.audioManager.onplay = state.audioManager.onPlay = () => {
			// 	state.audioPlaying = true;
			// }
			// state.audioManager.onpause = state.audioManager.onPause = () => {
			// 	state.audioPlaying = false;
			// }
			// state.audioManager.onstop = state.audioManager.onStop = () => {
			// 	state.audioPlaying = false;
			// }
			// state.audioManager.onended = state.audioManager.onEnded = () =>{
			// 	state.audioPlaying = false;
			// }
			
		},
		setAudioBaseInfo(state,info){
			state.audioIdBaseInfo = info;
		},
		setPlayList(state,list){
			state.playList = list || [];
		},
		setLikeList(state,list){
			state.likeList = list || [];
		},
		setAlbumList(state,list){
			state.albumList = list || [];
		},
		setCollectList(state,list){
			state.collectList = list || [];
		},
		setAudioInfo(state,info){
			state.audioIdBaseInfo = {id:info.id,platform:info.platform};
			state.audioInfo = info.songInfo;
			
			state.audioManager.src = info.songInfo.src;
			state.audioManager.title = info.songInfo.name;
			
		},
		changeAudioPlaying(state,playing){
			state.audioPlaying = playing;
		}
	},
	actions:{
		// async changeAudioBaseInfo({commit,state},info){
		// 	commit('setAudioBaseInfo',info);
		// 	// 获取音频信息
		// 	const songInfo = await getSongInfo(info.id,info.platform);
		// 	const songUrl = await getSongUrl(info.id,info.platform);
		// 	if(!songUrl){
		// 		return uni.showToast({
		// 			title:'暂无播放地址',
		// 			icon:'none'
		// 		})
		// 	}
		// 	songInfo.src = songUrl;
		// 	commit('setAduioInfo',songInfo);
			
		// 	// 添加到播放列表
			
		// 	state.audioManager.singer = songInfo.art.map(ele=>ele).join('&');
		// 	state.audioManager.coverImgUrl = songInfo.picUrl;
		// 	state.audioManager.webUrl = 'http://preferyou.cn/netease';
		// }
	}
})

export default store;