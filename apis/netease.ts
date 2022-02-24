import promisify from '../promisify';
const prefix = 'http://preferyou.cn/wy';
const request = promisify(uni.request);

/**
 * 获取网易推荐歌单
 */
export const getRecommendWy = () => {
	return request({
		url:`${prefix}/personalized?page=2`,
		method:'GET',
	});
}

/**
 * 获取网易banner
 */

export const getBannerWy = () => {
    return request({
		url:`${prefix}/banner`,
		method:'GET'
	});
};

/**
 * 获取网易歌单分类
 */

export const getCategoryListWy = () => {
    return request({
		url:`${prefix}/playlist/catlist/hot`,
		methods:'GET'
	})
};