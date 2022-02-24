import promisify from '../promisify';
const prefix = 'http://preferyou.cn/wy';
const request = promisify(uni.request);

export const getRecommendWy = () => {
	return request({
		url:`${prefix}/personalized`,
		method:'GET',
	});
}