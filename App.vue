<script>	
	export default {
		globalData:{
			audioSrc:"http://m7.music.126.net/20220223165847/2515f43e9b9f6afc43cf0e7ad9e2f795/ymusic/obj/w5zDlMODwrDDiGjCn8Ky/3355921739/46f4/f5d9/4418/50d29712324d57b466ed78cc8f7b1892.mp3",
			audioInfo:{
				pic:"https://p2.music.126.net/qpvBqYIqkRhO9Ry2qOCdJQ==/2942293117852634.jpg",
			}
		},
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
	}
</script>

<style>
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
</style>
