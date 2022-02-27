<template>
	<view>
		<view class="my-2 px-4 mt-5">
			<view class="flex justify-between mb-2">
				<text class="text-xl font-bold">我的歌单</text>
				<view class="flex items-center text-gray-400">
					<text class="iconfont icon-plus text-xl"></text>
					<text class="iconfont icon-guanbi text-lg ml-3"></text>
				</view>
			</view>
			<uni-list :border="false">
				<uni-list-item 
					v-for="item in myAlbumList"
					:title="item.name"
					:thumb="item.pic || 'http://preferyou.cn/freed/icon.png'"
					:key="item.id"
					thumbSize="lg"
					>
				</uni-list-item>
			</uni-list>
		</view>
		<view class="my-2 px-4">
			<text class="text-xl font-bold">我的收藏</text>
			<uni-list :border="false">
				<uni-list-item 
					v-for="item in myCollectList"
					:title="item.name"
					:thumb="item.pic || 'http://preferyou.cn/freed/icon.png'"
					:key="item.id"
					thumbSize="lg"
					>
				</uni-list-item>
			</uni-list>
		</view>
	</view>
</template>

<script setup lang="ts">
	import {ref} from 'vue'

	const myAlbumList = ref([
		{
			name:'我喜欢',
			id:0,
			pic:'',
		},
		{
			name:"轻音乐",
			id:1,
			pic:''
		}
	])
	
	const myCollectList = ref([
		{
			name:"【一期一会】纯音乐合集",
			id:177,
			pic:"",
			type:1
		},
		{
			name:"白噪音睡眠专用合集",
			id:88299,
			pic:"",
			type:2
		}
	])
</script>

<style>

</style>
