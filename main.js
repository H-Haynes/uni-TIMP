import App from './App'
import 'virtual:windi.css'
import mitt from 'mitt'
// #ifndef VUE3
import Vue from 'vue'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
	...App
})
app.$mount()
// #endif

// #ifdef VUE3
// import { createPinia } from 'pinia'
import store from '@/store/index';
import {createSSRApp} from 'vue'
const filters = {
	timeFormat: (value) => {
		if (!value) return '-';
		const date = new Date(value);
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const hour = date.getHours();
		const minute = date.getMinutes();
		const seconds = date.getSeconds();
		const addZero = (num) => num < 10 ? '0' + num : num;
		return `${year}-${addZero(month)}-${addZero(day)} ${addZero(hour)}:${addZero(minute)}:${addZero(seconds)}`;
	},
	dateFormat: (value) => {
		if (!value) return '-';
		const date = new Date(value);
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const addZero = (num) => num < 10 ? '0' + num : num;
		return `${year}-${addZero(month)}-${addZero(day)}`;
	},
	durationFormat: (value) => {
		if (!value) return '--:--';
		const minute = Math.floor(value / 60000);
		const second = Math.floor(value % 60000 / 1000);
		const addZero = (num) => num < 10 ? '0' + num : num;
		return `${addZero(minute)}:${addZero(second)}`;
	},
	secToMin: (value) => {
		const minute = Math.floor(value / 60);
		const second = Math.floor(value % 60);
		const addZero = (num) => num < 10 ? '0' + num : num;
		return `${addZero(minute)}:${addZero(second)}`;
	},
	countFormat: (value) => {
		if (isNaN(+value)) return 0;
		if (value < 10000) return value;
		if (value < 100000000) return Math.floor(value / 10000) + '万';
		return Math.floor(value / 100000000) + '亿';
	},
	durationTransSec: (value) => {
		if (!value) return 0;
		const temp = value.split(':');
		const minute = temp[0];
		const second = temp[1];
		return (+minute) * 60 + (+second);
	},
}
export function createApp() {
	const app = createSSRApp(App);
	// app.use(createPinia());
	app.use(store);
	app.provide('$filters', filters);
	app.provide('$eventBus',mitt());
	return {
		app
	}
}
// #endif
