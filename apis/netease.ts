import promisify from '../promisify';
const prefix = 'http://preferyou.cn/wy';
const request = promisify(uni.request);

/**
 * 获取网易推荐歌单
 */
export const getRecommendWy = () => {
	return request({
		url:`${prefix}/personalized?limit=120`,
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


/**
 * 获取网易歌单列表
 * @param type 分类名称
 * @param page 分页
 */
export const getAlbumListWy = (type:string,page = 1) => {
    return request({
		url:`${prefix}/top/playlist?cat=${type}&offset=${(page-1) * 50}`,
		method:'GET'
	})
};

/**
 * 获取网易排行榜列表
 */
export const getRankListWy = () => {
    return request({
		url:`${prefix}/toplist`,
		method:'GET'
	});
};

/**
 * 获取歌单详情
 */
export const getAlbumDetailWy = (id: string) => {
    return request({
		url:`${prefix}/playlist/detail?id=${id}`,
		methods:'GET'
	})
};

// 获取播放地址
export const getSongUrlWy = (id: string|number) => {
    return request({url:`${prefix}/song/url?id=${id}`});
};

// 获取歌曲详情

export const getSongDetailWy = (id: string|number) => {
    return request({url:`${prefix}/song/detail?ids=${id}`});
};

// 获取歌词

export const getLyricWy = (id) => {
    return request({url:`${prefix}/lyric?id=${id}`});
};

// 搜索(多重匹配)

export const searchWy = (keyword:string) => {
    return request({url:`${prefix}/search/search/multimatch?keywords=${keyword}`});

};