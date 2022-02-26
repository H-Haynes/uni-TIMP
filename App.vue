<script >
	import {inject} from 'vue';
	import {useStore} from 'vuex';
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
			console.log('App Launch',store);
			// #ifndef H5
			const bgAudioManager = uni.getBackgroundAudioManager();
			store.commit('setAudioManager',bgAudioManager);
			// #endif
			// #ifdef H5
				const audio = document.createElement('audio');
				document.body.appendChild(audio);
				store.commit('setAudioManager',audio);
			// #endif
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
</style>
