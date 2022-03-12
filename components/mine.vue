<template>
	<view class="h-full overflow-y-scroll">
		<view class="my-2 px-4 mt-5">
			<view class="flex justify-between mb-2">
				<text class="text-xl font-bold">我的音乐</text>
			</view>
			<view @click="toAlbum(0,0,0)" class="flex px-5 items-center py-2 border-b">
				<image class="w-12 h-12 rounded mr-3" src="http://preferyou.cn/freed/icon.png" />
				<text class="text-sm text-gray-500">我喜欢</text>
			</view>
		</view>
		<view class="my-2 px-4 mt-5" style="min-height:150rpx">
			<view class="flex justify-between mb-2">
				<text class="text-xl font-bold">我的歌单</text>
				<view class="flex items-center text-gray-400">
					<text @click="createAlbum" class="iconfont icon-plus text-xl"></text>
					<!-- <text class="iconfont icon-guanbi text-lg ml-3"></text> -->
				</view>
			</view>
			
			<view @click="toAlbum(item.id,0,0)" v-for="item in store.state.albumList" :key="item.id" class="flex px-5 items-center py-2 border-b">
				<image class="w-12 h-12 rounded mr-3" :src="item.pic || 'http://preferyou.cn/freed/icon.png'" />
				<text class="text-sm text-gray-500">{{item.name}}</text>
			</view>
		</view>
		<view class="my-2 px-4">
			<text class="text-xl font-bold">我的收藏</text>
			<view @click="toAlbum(item.id,item.platform,item.isRank)" v-for="item in store.state.collectList" :key="item.id" class="flex px-5 items-center py-2 border-b">
				<image class="w-12 h-12 rounded mr-3" :src="item.pic || 'http://preferyou.cn/freed/icon.png'" />
				<text class="text-sm text-gray-500">{{item.name}}</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import {ref} from 'vue'
	import {useStore} from 'vuex';
	import promisify from '@/promisify'
	import AlbumDialog from '@/components/AlbumDialog.vue'

	const store = useStore();

	const createAlbum = () => {
		promisify(uni.showModal)({
			title:'创建歌单',
			editable:true,
			placeholderText:'请输入歌单名称(20字内)',
		}).then(res=>{
			if(res.confirm){
				if(res.content.trim().length > 20 || !res.content.trim()){
					return uni.showToast({
						title:'名称20字内',
						icon:'none'
					})
				}
				// 序列化歌单信息
				const albumInfo = {
					id:Math.random().toString(36).substr(2),//随机ID，
					platform:0,
					pic:'http://preferyou.cn/freed/icon.png',
					name:res.content.trim(),
					list:[]
				}
				// 存入缓存
				const albumList = store.state.albumList.slice(0);
				albumList.push(albumInfo);
				uni.setStorageSync('albumList',albumList);
				store.commit('setAlbumList',albumList);
			}
		})
	}
	
	const toAlbum = (id,platform,isRank) =>{
		uni.navigateTo({
			url:`/pages/album/album?type=${platform}&id=${id}&rank=${isRank}`
		})
	}
</script>

<style>

</style>
