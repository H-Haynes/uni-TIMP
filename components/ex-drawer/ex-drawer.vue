<template>
	<view class="ex-drawer" @touchstart="containerStart" @touchend="containerEnd" @touchmove="containerMove">
		<!-- 抽屉 -->
		<view class="ex-drawer-warp" :class="{ move: move }" :style="{ width: `${width}rpx`, left: `-${width}rpx`, transform: `translate3d(${differential}px,0,0)`,backfaceVisibility:`hidden`, }">
			<!-- 抽屉内容插槽 -->
			<slot name="drawerContent"></slot>
		</view>
		<!-- 主容器 -->
		<view class="ex-container-warp" :class="maskShow == true ? 'container prevent' : 'container'">
			<!-- 遮罩 -->
			<view v-show="maskShow" class="mask" @tap="close"></view>
			<!-- 主容器内容插槽 -->
			<slot name="containerContent"></slot>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			maskShow: false,
			startX: 0,
			startY: 0,
			moveX: 0,
			moveY: 0,
			startExcursion: 0,
			differential: 0,
			isDirection: null,
			iswidth: null,
			move: false
		};
	},
	props: {
		width: {
			type: String,
			default: ''
		}
	},
	methods: {
		containerStart(e) {
			this.isDirection = null;
			this.move = false;
			this.startX = e.changedTouches[0].clientX;
			this.startY = e.changedTouches[0].clientY;
			this.startExcursion = this.differential;
		},
		containerMove(e) {
			this.moveX = e.changedTouches[0].clientX;
			this.moveY = e.changedTouches[0].clientY;
			let X = Math.abs(this.moveX - this.startX);
			let Y = Math.abs(this.moveY - this.startY);
			let differential = this.startExcursion + this.moveX - this.startX;
			differential = Math.min(uni.upx2px(this.width), differential);
			differential = Math.max(0, differential);
			this.isDirection == null ? (this.isDirection = Y / X > Math.sqrt(3) / 3) : ``;
			if (!this.isDirection) {
				this.differential = differential;
				if(this.differential == 0 ){
					this.containerEnd()
				}else{
					this.maskShow = true
				}
			}
		},
		containerEnd() {
			if (this.isDirection != null) {
				if (!this.isDirection) {
					this.iswidth = this.differential > (uni.upx2px(this.width) * 2) / 6;
					this.differential > 0 && this.differential < uni.upx2px(this.width) ? (this.move = true) : ``;
				}
				this.differential = this.iswidth ? uni.upx2px(this.width) : 0;
				this.differential == 0 ? this.maskShow = false : ``;
			}
		},
		close(){
			if(this.maskShow){
				this.move = true
				this.differential = 0;	
				if(this.differential == 0 ){
					this.maskShow = false
					this.iswidth=false
				}
			}
		},
		open(){
			if(!this.maskShow){
				this.move = true
				this.differential = uni.upx2px(this.width);	
				if(this.differential == uni.upx2px(this.width) ){
					this.maskShow = true
					this.iswidth=true
				}
				
			}
		}
	}
};
</script>

<style>
.ex-drawer {
	display: flex;
	align-items: flex-start;
	justify-content: flex-start;
}
.ex-drawer-warp {
	position: fixed;
	z-index: 1000;
	touch-action: none;
}
.mask {
	position: fixed;
	left: 0rpx;
	width: 100vw;
	height: 100vh;
	z-index: 999;
	background-color:#000000;filter:Alpha(Opacity=60);opacity:0.3;
}
.prevent {
	touch-action: none;
}
.move {
	transition: transform 0.3s ease;
}
</style>
