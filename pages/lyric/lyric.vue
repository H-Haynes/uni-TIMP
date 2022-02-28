<template>
	<view class="bg-gray-800 h-full w-full text-gray-300 p-4">
		<view class="flex justify-around mt-5">
			<image class="w-32 h-32" :src="store.state.audioInfo.picUrl" />
			<view class="w-56  flex flex-col justify-around">
				<text class="text-xl">{{store.state.audioInfo.name}}</text>
				<text class="text-sm">{{store.state.audioInfo.author.map(ele=>ele.name).join('&')}}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
	import {useStore} from 'vuex';
	import {ref,toRaw} from 'vue';
	const store = useStore();
	
	console.log(toRaw(store.state.audioInfo))
</script>

<style>

</style>
