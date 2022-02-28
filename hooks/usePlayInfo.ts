import {getSongUrlWy,getSongDetailWy} from '@/apis/netease';
import { getSongUrlQQ, getSongPicQQ, getSongInfoQQ} from '@/apis/qq';
import {  getMusicUrlKW,getSongDetailKW } from '@/apis/kuwo';
import { getSongDetailKG } from '@/apis/kugou';

enum platform {
    wy = 1,
    qq = 2,
    kg = 4,
    kw = 3,
    mg = 5
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
        ElMessage.error('暂无播放地址');
        return false;
      }
    }else if(platformType == platform.qq){
      const result = await getSongUrlQQ(id);
      if(!result.data.data.playUrl[id].error){
        return result.data.data.playUrl[id].url;
      }else{
        ElMessage.error(result.data.data.playUrl[id].error);
        return false;
      }
    }else if(platformType == platform.kw){

      const result = await getMusicUrlKW(id);
      if(result.data.code === 200){
        return result.data.data;
      }else{
        ElMessage.error('暂无播放地址');
        return false;
      }
    }else if(platformType == platform.kg){
      const result = await getSongDetailKG(id);
      return result.data.url || result.data.backup_url[0];
    }
};

