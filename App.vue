<script>
	import {inject,toRaw} from 'vue';
	import {useStore} from 'vuex';
	import {getSongInfo,getSongUrl,getLyric} from '@/hooks/usePlayInfo';

	
	
	export default {
		globalData:{
			audioSrc:"",
			audioInfo:{
				name:"ss",
				pic:"https://p2.music.126.net/qpvBqYIqkRhO9Ry2qOCdJQ==/2942293117852634.jpg",
			},
			audioName:"yyyy"
		},
		onLaunch: function() {
			const store = useStore();
			const $eventBus = inject('$eventBus');
			console.log('App Launch');
			// #ifndef H5
			const bgAudioManager = uni.getBackgroundAudioManager();
			store.commit('setAudioManager',bgAudioManager);
			
			bgAudioManager.onCanplay(()=>{
				bgAudioManager.play();
				store.commit('changeAudioPlaying',true);
			});
			// onplay会一直调用
			// bgAudioManager.onPlay(()=>{
			// 	bgAudioManager.play();
			// 	store.commit('changeAudioPlaying',true);
			// })
			bgAudioManager.onPause(()=>{
				store.commit('changeAudioPlaying',false);
			});
			bgAudioManager.onStop(()=>{
				store.commit('changeAudioPlaying',false);
			})
			bgAudioManager.onEnded(()=>{
				store.commit('changeAudioPlaying',false);
				//自动切歌
				$eventBus.emit('playNext');
			})
			bgAudioManager.onTimeUpdate(() => {
				store.commit('changeCurrentTime',bgAudioManager.currentTime);
			});
			 
			// #endif
			// #ifdef H5
				const audio = document.createElement('audio');
				document.body.appendChild(audio);
				store.commit('setAudioManager',audio);
				audio.oncanplay = () => {
					audio.play();
					store.commit('changeAudioPlaying',true);
				};
				
				audio.onplay = () =>{
					audio.play();
					store.commit('changeAudioPlaying',true);
				};
				
				audio.onpause = () => {
					store.commit('changeAudioPlaying',false);
				} 
				audio.onstop = () =>{
					store.commit('changeAudioPlaying',false);
				};
				audio.onended = () => {
					store.commit('changeAudioPlaying',false);
					//自动切歌
					$eventBus.emit('playNext');
				}  
				
				audio.ontimeupdate = () => {
					store.commit('changeCurrentTime',audio.currentTime);
				} 
			// #endif
			
			// uni.clearStorageSync();
			
			// 初始化用户私人数据
			// 获取用户播放列表
			store.commit('setPlayList',uni.getStorageSync('playList'))
			// 获取用户喜欢列表
			store.commit('setLikeList',uni.getStorageSync('likeList'))
			// 获取用户歌单列表
			store.commit('setAlbumList',uni.getStorageSync('albumList'))
			// 获取用户收藏列表
			store.commit('setCollectList',uni.getStorageSync('collectList'));
			
			// 监听用户喜欢歌曲事件
			$eventBus.on('addLike',song => {
				// 获取到当前喜欢列表，将其push，然后重设vuex
				// 安全起见先检查是否重复
				console.log(1)
				if(store.state.likeList.some(ele=>ele.id == song.id && ele.platform == song.platform)){
				   uni.showToast({
						title:'歌曲已存在',
						icon:'none'
				   })
				   return ;
				}
				const list = [...store.state.likeList,song]
				uni.setStorageSync('likeList',list);
				// TODO: ?在vuex设置mutation每次从storage获取还是从这里赋值好？
				store.commit('setLikeList',list);
			})
			
			// 监听用户取消喜欢事件
			$eventBus.on('unlike',song => {
				let list = store.state.likeList.slice(0);
				let index = list.findIndex(ele => ele.id == song.id && ele.platform == song.platform);
				if(index == -1){
					return uni.showToast({
						title:'列表中无此歌曲',
						icon:'none'
					})
				}else{
					list.splice(index,1);
					uni.setStorageSync('likeList',list);
					store.commit('setLikeList',list);
				}
			})
		
			// 监听收藏歌单事件
			$eventBus.on('addCollect',album => {
				//album 包含: pic,id,platform,name
				console.log(toRaw(store.state.collectList),album);
				if(store.state.collectList.some(ele=>ele.id == album.id && ele.platform == album.platform)){
					return uni.showToast({
						title:'重复收藏!',
						icon:'none'
					})
				}else{
					let list = [...store.state.collectList,album];
					uni.setStorageSync('collectList',list);
					store.commit('setCollectList',list);
					uni.showToast({
						title:'收藏成功',
						icon:'none'
					})
				}
			})
			
			// 监听取消收藏歌单事件
			$eventBus.on('unCollect',album => {
				// album 包含id,platform
				let list = store.state.collectList;
				let index = list.findIndex(ele => ele.id == album.id && ele.platform == album.platform);
				if(index == -1){
					return uni.showToast({
						title:'列表中无此歌单',
						icon:'none'
					})
				}else{
					list.splice(index,1);
					uni.setStorageSync('collectList',list);
					store.commit('setCollectList',list);
					uni.showToast({
						title:'已取消收藏',
						icon:'none'
					})
				}
			})
		
			// 监听播放歌曲
			// 1. 获取歌曲信息及播放地址
			// 2. 设置当前播放信息到vuex
			// 3. 在播放列表中添加该歌曲(区分自动切歌，非自动切歌需要将歌曲加入播放列表)
			// auto代表自动切歌，force代表强制切歌(用于单曲循环);
			$eventBus.on('playSong',async({id,platform,auto=false,force=false})=>{
				if(!id) return; // 无歌曲id不进行操作
				if(store.state.audioIdBaseInfo.id == id && !force){
					// 当前正在播放此歌曲
					return;
				}
				const songUrl = await getSongUrl(id,platform);
				if(!songUrl){
					uni.showToast({
						title:'暂无播放地址',
						icon:'none'
					});
					// 如果是自动切歌的，此处自动触发下一首
					if(auto){
						store.commit('setAudioBaseInfo',{
							id,
							platform,
						});
						$eventBus.emit('playNext');
					}
					
					return ;
				}
				// 更改过进度的重置开始时间;
				// #ifdef H5
					store.state.audioManager.currentTime = 0;
				// #endif
				
				// #ifndef H5
					store.state.audioManager.startTime = 0;
				// #endif
				 
				
				const songInfo = await getSongInfo(id,platform);
				songInfo.src = songUrl;
				store.commit('setAudioInfo',{
					id,
					platform,
					songInfo
				});
				
				const lyric = await getLyric(id,platform);
				store.commit('setLyric',lyric);
				if(!auto){ // 非自动切歌，加入播放列表
					let list = store.state.playList.slice(0);
					let index = list.findIndex(ele=>ele.id == id && ele.platform == platform)

					if(index!==-1){
						// 存在此歌曲，在原列表删除
						list.splice(index,1);
					}
					list.unshift({
						id,
						platform,
						name:songInfo.name,
						author:songInfo.author
					});
					//设置到缓存
					uni.setStorageSync('playList',list);
					store.commit('setPlayList',list);
				}
			})
			
			// 监听播放全部
			$eventBus.on('playAll',async(songList)=>{
				uni.setStorageSync('playList',songList);
				store.commit('setPlayList',songList);
				$eventBus.emit('playSong',{
					id:songList[0].id,
					platform:songList[0].platform,
				})
			})
			
			// 监听切换下一首
			
			$eventBus.on('playNext',()=>{
				let playList = store.state.playList;
				let current = store.state.audioIdBaseInfo;
				let playMode = store.state.playMode;
				let index = playList.findIndex(ele=>ele.id == current.id && ele.platform == current.platform);
				if(playMode == 0){
					index = index  == playList.length-1 ? 0 : index + 1;
				}else if(playMode == 1){
					index = Math.floor(Math.random() * (playList.length +1));
				}
				$eventBus.emit('playSong',{
					id:playList[index].id,
					platform:playList[index].platform,
					auto:true,
					force:playMode == 2
				})
			})
			
			// 监听切换上一首
			$eventBus.on('playPrev',()=>{
				let playList = store.state.playList;
				let current = store.state.audioIdBaseInfo;
				let playMode = store.state.playMode;
				let index = playList.findIndex(ele=>ele.id == current.id && ele.platform == current.platform);
				if(playMode == 0){
					index = index ==  0 ? playList.length-1 : index - 1;
				}else if(playMode == 1){
					index = Math.floor(Math.random() * (playList.length +1));
				}
				$eventBus.emit('playSong',{
					id:playList[index].id,
					platform:playList[index].platform,
					auto:true,
					force:playMode == 2
				})
			})
			
			// 监听暂停播放
			$eventBus.on('pause',() => {
				if(!store.state.audioIdBaseInfo.id) return; // 无id不操作
				store.state.audioManager.pause();
				store.commit('changeAudioPlaying',false)
			})
			
			// 监听继续播放
			$eventBus.on('play',() =>{
				if(!store.state.audioIdBaseInfo.id) return; // 无id不操作
				store.state.audioManager.play();
				store.commit('changeAudioPlaying',true)
			})
		
			// TODO 歌词界面
			// TODO 添加歌曲到我的歌单
			// TODO 手动切歌
			// TODO 播放进度
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		onLoad: function(){
			console.log(9999)
		}
	}
</script>

<style>
	@import url("~@/static/iconfont.css");
	@import 'tailwindcss/tailwind.css';
	/*每个页面公共css */
	uni-page-body{
		overflow: hidden;
		height:100vh;
	}
	.linear-text{
		background-image:linear-gradient(to right,rgb(106,177,214),rgb(93,125,220),rgb(140,105,230));
		-webkit-background-clip:text; 
		-webkit-text-fill-color:transparent;
	}
	.linear-bg{
		background-image:linear-gradient(to right,rgb(106,177,214),rgb(93,125,220),rgb(140,105,230));
	}
	.hide-scroll-bar::-webkit-scrollbar{
		display: none;
	}
	.flex-2{
		flex:2;
	}
	.text-red{
		color:#f40 !important;
	}
</style>
