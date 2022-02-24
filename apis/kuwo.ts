import promisify from '../promisify';
const prefix = 'http://preferyou.cn/kuwo';
const request = promisify(uni.request);

/**
 * 获取酷我banner
 */

export const getBannerKW = () => {
    return request({
		url:`${prefix}/kuwo/banner`,
		method:'GET'
	});
};

/**
 * 获取酷我推荐歌单
 */
export const getRecommendKW = () => {
	return request({
		url:`${prefix}/kuwo/rec_gedan?pn=30`,
		method:'GET',
	});
}

/**
 * 获取酷我歌单分类
 */

export const getCategoryListKW = () => {
    return request({
		url:`${prefix}/kuwo/getTagList`,
		methods:'GET'
	})
};

/**
 * 获取酷我排行榜列表
 */
export const getRankListKW = () => {
    return request({
		url:`${prefix}/kuwo/rank`,
		method:'GET'
	});
};

/**
 * 获取酷我歌单列表
 * @param type 分类名称
 * @param page 分页
 */
export const getAlbumListKW = (type:string,page = 1) => {
    return request({
		url:`${prefix}/kuwo/playList/getTagPlayList?id=${type}&pn=${page}`,
		method:'GET'
	})
};

/**
 * 获取歌单详情
 */
export const getAlbumDetailKW = (id: string) => {
    return request({
		url:`${prefix}/kuwo/musicList?pid=${id}`,
		methods:'GET'
	})
};

// 获取排行榜音乐列表
export const getRankMusicListKW = (id:string|number) => {
    return request({
		url:`${prefix}/kuwo/rank/musicList?bangId=${id}&rn=100`,
		method:'GET'
	})
};

