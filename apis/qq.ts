import promisify from '../promisify';
const prefix = 'http://preferyou.cn/qq';
const request = promisify(uni.request);

/**
 * 获取QQ音乐推荐歌单
 */
export const  getRecommendQQ = () =>{
    return request({
		url:`${prefix}/getRecommend`,
		method:'GET'
	})
};


/**
 * 获取QQ音乐歌单分类
 */

export const getCategoryListQQ = () => {
    return request({
		url:`${prefix}/getSongListCategories`,
		methods:'GET'
	})
};

/**
 * 获取QQ音乐歌单列表
 * @param type 分类名称
 * @param page 分页
 */
export const getAlbumListQQ = (type:string,page = 1) => {
    return request({
		url:`${prefix}/getSongLists?categoryId=${type}&page=${page}`,
		method:'GET'
	})
};

/**
 * 获取QQ音乐排行榜列表
 */
export const getRankListQQ = () => {
    return request({
		url:`${prefix}/getTopLists?limit=50`,
		method:'GET'
	});
};

/**
 * 获取QQ音乐歌单详情
 */
export const getAlbumDetailQQ = (id: string) => {
    return request({
		url:`${prefix}//getSongListDetail?disstid=${id}`,
		methods:'GET'
	})
};

/**
 * 获取QQ音乐排行榜详情
 */

export const getRankDetailQQ = (id:number) => {
    return request({
		url:`${prefix}/getRanks?topId=${id}&limit=100`,
		method:'GET'
	})
};

// 获取播放地址

export const getSongUrlQQ = (id:string|number) => {
    return request({url:`${prefix}/getMusicPlay?songmid=${id}`});
};

// 获取歌曲信息

export const getSongInfoQQ = (id:string|number) => {
    return request({url:`${prefix}/getSongInfo?songmid=${id}`});
};

// 获取歌曲+专辑+图片

export const getSongPicQQ = (id:string|number) => {
    return request({url:`${prefix}/getImageUrl?id=${id}`});
};

