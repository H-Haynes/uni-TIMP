<template>
	<view class="fixed fixed left-0 top-0 w-full h-full  z-10" v-show="show">
		<view class="w-full h-full bg-gray-800 bg-opacity-40 mask" @click="close"></view>
		<view v-if="show" class="container absolute bottom-0 left-0 w-full  rounded-t-md overflow-y-scroll" :style="{height:height}">
			<view class="w-full h-full  bg-gray-50 flex flex-col">
				<view class="text-center text-sm linear-bg text-white py-3 px-3">添加到歌单</view>
				<scroll-view class="flex-1 overflow-hidden" scroll-y="true" >
					<view @click="confirm(album.id)" v-for="(album,index) in store.state.albumList"
						class="py-2 hover:bg-gray-100 text-gray-500 px-3 flex justify-between items-center text-xs border-b" 
						:key="album.id"
						>
						<image :src="album.pic" class="w-12 h-12 mr-4 rounded"></image>
						<text class="truncate mr-2 flex-2 flex-shrink-0">{{album.name}}</text>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script setup>
	import {ref,onMounted} from 'vue';
	import {useStore} from 'vuex';
	const showDrawer = ref(true);
	const drawRef = ref(null);
	const store = useStore();
	
	const props = defineProps({
		height:{
			type:String,
			default:'50%'
		},
		show:{
			type:Boolean,
			default:false
		}
	})
	const emit = defineEmits(['confirm','update:show'])
	
	const close = ()=>{
		emit('update:show',false)
	}
	const confirm = (id) => {
		emit('confirm',id);
		emit('update:show',false);
	}
	
	
</script>

<style lang="less" scoped>
	.container{
		animation:bounceInDown 0.3s linear;
	}
	@keyframes bounceInDown{
		0%{
			bottom:-100%;
		}
		100%{
			bottom:0%
		}
	}
</style>
