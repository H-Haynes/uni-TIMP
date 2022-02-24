import promisify from '../promisify';
const prefix = 'http://preferyou.cn/kuwo';
const request = promisify(uni.request);

/**
 * 获取推荐歌单
 */
export const getRecommendKG = (page=1) => {
	return request({
		url:`${prefix}/kugou/getAlbumList?&page=${page}`,
		method:'GET',
	});
}


/**
 * 获取歌单分类
 */

export const getCategoryListKG = () => {
    return request({
		url:`${prefix}/kugou/getTagList`,
		methods:'GET'
	})
};

/**
 * 获取排行榜列表
 */
export const getRankListKG = () => {
    return request({
		url:`${prefix}/kugou/rank/list`,
		method:'GET'
	});
};


/**
 * 获取歌单列表
 * @param type 分类名称
 * @param page 分页
 */
export const getAlbumListKG = (type:string,page = 1) => {
    return request({
		url:`${prefix}/kugou/albumList?tagid=${type}&page=${page}`,
		method:'GET'
	})
};