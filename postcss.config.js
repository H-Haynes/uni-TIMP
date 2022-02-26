const path = require('path')
const PLATFORM_MAP = {
  h5: "h5",
  "mp-weixin": "mp",
  "mp-alipay": "mp",
  "mp-baidu": "mp",
  "mp-toutiao": "mp",
  "mp-qq": "mp",
  "app-plus": "native"
};
module.exports = {
  parser: require('postcss-comment'),
  plugins: [
    require('postcss-import')({
      resolve(id) {
        if (id.startsWith('~@/')) {
          return path.resolve(process.env.UNI_INPUT_DIR, id.substr(3))
        } else if (id.startsWith('@/')) {
          return path.resolve(process.env.UNI_INPUT_DIR, id.substr(2))
        } else if (id.startsWith('/') && !id.startsWith('//')) {
          return path.resolve(process.env.UNI_INPUT_DIR, id.substr(1))
        }
        return id
      }
    }),
    require('tailwindcss'),
    require('postcss-class-rename')({
      '\\\\.': '_' // 兼容小程序，将类名带 .和/ 替换成 _
    }),
    require('autoprefixer')({
      remove: process.env.UNI_PLATFORM !== 'h5'
    }),
    // require('@dcloudio/vue-cli-plugin-uni/packages/postcss')
	PLATFORM_MAP[process.env.UNI_PLATFORM] == 'mp' && require("postcss-uni-tailwind")({
		  platform: PLATFORM_MAP[process.env.UNI_PLATFORM],
		  name: process.env.UNI_PLATFORM
	})
	
  ]
}