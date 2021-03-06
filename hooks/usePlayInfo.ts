import {getSongUrlWy,getSongDetailWy,getLyricWy} from '@/apis/netease';
import { getSongUrlQQ, getSongPicQQ, getSongInfoQQ,getLyricQQ} from '@/apis/qq';
import {  getMusicUrlKW,getSongDetailKW,getLyricKW } from '@/apis/kuwo';
import { getSongDetailKG ,getLyricKG} from '@/apis/kugou';

enum platform {
    wy = 1,
    qq = 2,
    kg = 4,
    kw = 3,
    mg = 5
}

function durationTransSec(value) {
		if (!value) return 0;
		const temp = value.split(':');
		const minute = temp[0];
		const second = temp[1];
		return (+minute) * 60 + (+second);
}

export const getSongInfo = async (id:string|number,platformType:platform) =>{
    let songInfo = {
      name:'',
      author:[],
      time:0,
      picUrl:'',
      albumId:'',
    };
    if(platformType == platform.wy){
      const result = await getSongDetailWy(id);
      if(result.data.code === 200){
        songInfo.name = result.data.songs[0].name;
        songInfo.author = result.data.songs[0].ar;
        songInfo.picUrl = result.data.songs[0].al.picUrl;
        songInfo.time = result.data.songs[0].dt;
      }
    }else if(platformType == platform.qq){
      // 获取歌曲信息
      const infoResult = await getSongInfoQQ(id);
      if(infoResult.data.response.code === 0){
        songInfo.author = infoResult.data.response.songinfo.data.track_info.singer.map(ele=>{
          return {
            name:ele.name,
            id:ele.mid,
          };
        });
        songInfo.name = infoResult.data.response.songinfo.data.track_info.title;
        songInfo.time = infoResult.data.response.songinfo.data.track_info.interval * 1000;
        songInfo.albumId = infoResult.data.response.songinfo.data.track_info.album.mid;
      }
      const picResult = await getSongPicQQ(songInfo.albumId);
      if(picResult.data.response.code === 0){
        songInfo.picUrl = picResult.data.response.data.imageUrl;
      }
    }else if(platformType === platform.kw){
      let mid = id.toString().match(/\d+/)?.[0];
      const result = await getSongDetailKW(mid as string);
      if(result.data.code === 200){
        songInfo = {
          name:result.data.data.name,
          author:[{
            name: result.data.data.artist,
            id: result.data.data.artistid,
          }],
          time:result.data.data.duration * 1000,
          picUrl:result.data.data.pic,
        };
      }
    }else if(platformType === platform.kg){
      const result = await getSongDetailKG(id);
      songInfo = {
        name:result.data.songName,
        time:result.data.timeLength * 1000,
        picUrl:result.data?.imgUrl?.replace('{size}','400'),
        author:Array.isArray(result.data.authors)?result.data.authors?.map(ele=>({
          name:ele.author_name,
          id:ele.author_id,
        })) : [{
          name:result.data.singerName || result.data.author_name,
          id: result.data.singerId,
        }],
      };
    }
    return songInfo;
};

  // 获取播放地址
export const getSongUrl = async (id:string|number,platformType:platform)=>{
    if(platformType == platform.wy){
      const result = await getSongUrlWy(id);
      if(result.data.code == 200 && result.data.data[0].url){
        return result.data.data[0].url;
      }else{
        return false;
      }
    }else if(platformType == platform.qq){
      const result = await getSongUrlQQ(id);
      if(!result.data.data.playUrl[id].error){
        return result.data.data.playUrl[id].url;
      }else{
        // ElMessage.error(result.data.data.playUrl[id].error);
        return false;
      }
    }else if(platformType == platform.kw){

      const result = await getMusicUrlKW(id);
      if(result.data.code === 200){
        return result.data.data;
      }else{
        // ElMessage.error('暂无播放地址');
        return false;
      }
    }else if(platformType == platform.kg){
      const result = await getSongDetailKG(id);
      return result.data.url || result.data.backup_url[0];
    }
};

  // 获取歌词
export const getLyric = async (id:string,platformType:platform) => {
    let list = [{
      time:0,
      words:'歌词获取失败!',
    }];
    if(platformType === platform.wy ){
      const result = await getLyricWy(id);
      if(result.data.code == 200){
        let lyricArr = result.data.lrc.lyric.split('\n').filter(ele=>ele.trim()); // 去除空的
        list = lyricArr.map(ele=>{
          let temp = ele.split(']');
          let words = temp[1].trim();
          let time = temp[0].replace('[','').trim();
          return {
            time:durationTransSec(time),
            words,
          };
        });
      }
    }else if(platformType === platform.qq){
      const result = await getLyricQQ(id);
      if(result.data.response.code === 0){
        let lyricArr = result.data.response.lyric.split('\n').filter(ele=>ele.trim());
        list = lyricArr.map(ele=>{
          let temp = ele.split(']');
          let words = temp[1].trim();
          let time = temp[0].replace('[','').trim();
          return {
            time:durationTransSec(time),
            words,
          };
        });
      }
    }else if(platformType === platform.kw){
      const result = await getLyricKW(id);
      if(result.data.status === 200){
        list = result.data.data.lrclist.map(ele=>{
          return {
            time:+ele.time,
            words:ele.lineLyric,
          };
        });
      }
    }else if(platformType === platform.kg){
      const result = await getKGLyric(id);
      if(result.data.code === 200){
        let lyricArr = result.data.result.split('\r\n').filter(ele=>ele[ele.length-1]!==']' && ele.trim());
        list = lyricArr.map(ele=>{
          let temp = ele.split(']');
          let words = temp[1].trim();
          let time = temp[0].replace('[','').trim();
          return {
            time:durationTransSec(time),
            words,
          };
        });

      }
    }
    return list;
  };