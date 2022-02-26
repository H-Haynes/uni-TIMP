import { createStore } from 'vuex'
import {getSongInfo,getSongUrl} from '@/hooks/usePlayInfo';
const store = createStore({
	state(){
		return {
			audioManager:null,
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
			}
		}
	},
	mutations:{
		setAudioManager(state,manager){
			state.audioManager = manager;
		},
		setAduioInfo(state,info){
			console.log(info);
			state.audioInfo = info;
			state.audioManager.src = info.src;
			state.audioManager.title = info.name;
			// 小canplay针对h5创建的audio元素
			state.audioManager.oncanplay = state.audioManager.onCanplay = () => {
				state.audioManager.play();
			}
		},
		setAudioBaseInfo(state,info){
			state.audioIdBaseInfo = info;
		}
	},
	actions:{
		async changeAudioBaseInfo({commit},info){
			commit('setAudioBaseInfo',info);
			// 获取音频信息
			const songInfo = await getSongInfo(info.id,info.platform);
			const songUrl = await getSongUrl(info.id,info.platform);
			if(!songUrl){
				return uni.showToast({
					title:'暂无播放地址',
					icon:'none'
				})
			}
			songInfo.src = songUrl;
			commit('setAduioInfo',songInfo);
		}
	}
})

export default store;