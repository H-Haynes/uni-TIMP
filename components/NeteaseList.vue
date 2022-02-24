<template>
	<view >
		<view class="flex flex-wrap">
			<view class="w-32" v-for="album in albumList" :key="album.id">
				<image class="w-28 h-28" :src="album.pic" />
			</view>
		</view>

	</view>
</template>

<script setup>
	import {getRecommendWy} from '../apis/netease';
	import {ref} from 'vue'
	const albumList = ref([]);
	
	getRecommendWy().then(res=>{
		if(res.data.result){
			albumList.value = res.data.result.map(ele=>({
				name:ele.name,
				pic:ele.picUrl,
				id:ele.id,
			}))
		}
	})
</script>

<style>

</style>
