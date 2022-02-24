import WindiCSS from 'vite-plugin-windicss'
import uni from '@dcloudio/vite-plugin-uni'

export default {
	plugins: [
		WindiCSS({
			scan: {
				dirs: ['.'], // 当前目录下所有文件
				fileExtensions: ['vue', 'js', 'ts'], // 同时启用扫描vue/js/ts
			},
		}),
		uni(),
	],
}
