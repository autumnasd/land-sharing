// pages/sendMessage/sendMessage.js
const app = getApp()
const tim = app.globalData.tim;
import TIM, { EVENT, TYPES } from 'tim-wx-sdk';
import TIMUploadPlugin from 'tim-upload-plugin';

var windowWidth = wx.getSystemInfoSync().windowWidth;
var windowHeight = wx.getSystemInfoSync().windowHeight;
var keyHeight = 0;

// 获取全局唯一的录音管理器 RecorderManager
const recorderManager = wx.getRecorderManager();
// 录音部分参数
const recordOptions = {
  duration: 60000, // 录音的时长，单位 ms，最大值 600000（10 分钟）
  sampleRate: 44100, // 采样率
  numberOfChannels: 1, // 录音通道数
  encodeBitRate: 192000, // 编码码率
  format: 'aac' // 音频格式
};
// 监听录音错误事件
recorderManager.onError(function(errMsg) {
  console.warn('recorder error:', errMsg);
});




Page({

  /**
   * 页面的初始数据
   */
  data: {
    msgList: [],
    inputVal: '',
    scrollHeight: '90vh',
    inputBottom: 0,
    isInputtingText: false,
    isMoreTapped: false,
    inputRoomPaddingBottom: 0,
    isSpeakTapped: false,
    sendTo: '',
    nextReqMessageID: '',
    isCompleted: true,
    isRecordingAudio: false,
    RecordAudioButtonText: '点击开始录音',
    isPlayingAudio: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    app.messageWatcher.add(this);

    let sendTo = options.sendTo;
    let that = this;
    //加载历史消息
    // 打开某个会话时，第一次拉取消息列表
    let promise = tim.getMessageList({conversationID: 'C2C' + sendTo, count: 15});
    promise.then(function(imResponse) {
      const messageList = imResponse.data.messageList; // 消息列表。
      let list = that.convertMessageList(messageList);
      const nextReqMessageID = imResponse.data.nextReqMessageID; // 用于续拉，分页续拉时需传入该字段。
      const isCompleted = imResponse.data.isCompleted; // 表示是否已经拉完所有消息。
      that.setData({
        msgList: list,
        nextReqMessageID,
        isCompleted
      })
    });

    this.setData({
      cusHeadIcon: app.globalData.userInfo.avatarUrl,
      sendTo: sendTo
    });
    this.setAllMessagesRead();
  },
  convertMessageList(messageList) {
    let list = [];
    let sendTo = this.data.sendTo;
    messageList.forEach(item => {
      if (item.conversationID == 'C2C' + sendTo) {
        //文本消息
        let tmp;
        if (item.type === TIM.TYPES.MSG_TEXT) {
          tmp = {
            isSend: item.to == sendTo ? true : false,
            avatar: item.avatar,
            content: item.payload['text'],
            contentType: "text"
          }
        } else if (item.type === TIM.TYPES.MSG_IMAGE) {
          //图片消息
          tmp = {
            isSend: item.to == sendTo ? true : false,
            avatar: item.avatar,
            content: item.payload.imageInfoArray[0].imageUrl,//第一个图片大小是225*225
            contentType: "image"
          }
        } else if (item.type === TIM.TYPES.MSG_SOUND) {
          //音频
          tmp = {
            isSend: item.to == sendTo ? true : false,
            avatar: item.avatar,
            content: item.payload.remoteAudioUrl,
            second: item.payload.second,
            contentType: "audio"
          }

        } else if (item.type === TIM.TYPES.MSG_VIDEO) {
          //视频
          tmp = {
            isSend: item.to == sendTo ? true : false,
            avatar: item.avatar,
            content: item.payload.snapshotUrl,
            videoUrl: item.payload.videoUrl,
            contentType: "video"
          }
        }
        list.push(tmp);
      }
    });
    return list;
  },
  updateMessage() {
    let messageList = app.messageWatcher.getData();
    let list = this.convertMessageList(messageList);
    let msgList = this.data.msgList;
    msgList = msgList.concat(list);
    console.log('更新后的消息列表', msgList)
    this.setData({
      msgList
    })
    this.setAllMessagesRead();
  },
  setAllMessagesRead() {
    let sendTo = this.data.sendTo;
    let conversationID = 'C2C' + sendTo;
    // 将会话设置已读并上报
    let promise = tim.setMessageRead({conversationID: conversationID});
    promise.then(function(imResponse) {
    // 已读上报成功，指定 ID 的会话的 unreadCount 属性值被置为0
    }).catch(function(imError) {
     // 已读上报失败
      console.warn('setMessageRead error:', imError);
    });
  },
  sendImageMessage() {
    let sendTo = this.data.sendTo;
    let msgList = this.data.msgList;
    let that = this;
    // 1. 选择图片
    wx.chooseImage({
      sourceType: ['album'], // 从相册选择
        count: 1, // 只选一张，目前 SDK 不支持一次发送多张图片
        success: function (res) {
        // 2. 创建消息实例，接口返回的实例可以上屏
        let message = tim.createImageMessage({
          to: sendTo,
          conversationType: TIM.TYPES.CONV_C2C,
          payload: { file: res },
          onProgress: function(event) { console.log('file uploading:', event) }
        });
        msgList.push({
          isSend: true,
          avatar: message.avatar,
          content: message.payload.imageInfoArray[0].imageUrl,//第一个图片大小是225*225
          contentType: "image"
        })
        that.setData({
          msgList
        })
        // 3. 发送图片
        let promise = tim.sendMessage(message);
        promise.then(function(imResponse) {
        // 发送成功
          console.log(imResponse);
        }).catch(function(imError) {
          // 发送失败
          console.warn('sendMessage error:', imError);
        });
      }
    })
    this.setAllMessagesRead();
  },
  previewImage(e) {
    let index = e.currentTarget.dataset.index;
    let url = this.data.msgList[index].content;
    wx.previewImage({
      urls: [url],
    })
  },
  sendAudioMessage() {
    let isRecording = this.data.isRecordingAudio;
    let RecordAudioButtonText = this.data.RecordAudioButtonText;
    let sendTo = this.data.sendTo;
    let msgList = this.data.msgList;
    let that = this;
    if (!isRecording) {
      // 3. 开始录音
      recorderManager.start(recordOptions);
      RecordAudioButtonText = '点击停止录音';
      isRecording = true;
    } else {
      recorderManager.stop();
      // 监听录音结束事件，录音结束后，调用 createAudioMessage 创建音频消息实例
      recorderManager.onStop(function(res) {
        console.log('recorder stop', res);
        // 创建消息实例，接口返回的实例可以上屏
        const message = tim.createAudioMessage({
          to: sendTo,
          conversationType: TIM.TYPES.CONV_C2C,
          payload: {
            file: res
          },
          onProgress: function(event) {
            console.log('file uploading:', event)
         }
        });
        msgList.push({
          isSend: true,
          avatar: message.avatar,
          content: message.payload.remoteAudioUrl,
          second: message.payload.second,
          contentType: "audio"
        })
        // 发送消息
        let promise = tim.sendMessage(message);
        promise.then(function(imResponse) {
          // 发送成功
          console.log(imResponse);
        }).catch(function(imError) {
          // 发送失败
          console.warn('sendMessage error:', imError);
        });
      });
      isRecording = true;
      RecordAudioButtonText = '点击开始录音';
    }
    this.setData({
      msgList,
      RecordAudioButtonText,
      isRecordingAudio: isRecording
    })
    this.setAllMessagesRead();
  },
  playAudio(e) {
    let isPlaying = this.data.isPlayingAudio;
    let that = this;
    if (isPlaying) {
      wx.showToast({
        title: '正在播放',
        icon: 'none'
      })
      return
    }
    this.setData({
      isPlayingAudio: true
    })
    let index = e.currentTarget.dataset.index;
    let src = this.data.msgList[index].content;
    let audioRef = wx.createInnerAudioContext();
    audioRef.obeyMuteSwitch = false;
    audioRef.src = src;
    audioRef.play();
    audioRef.onEnded(() => {
      that.setData({
        isPlayingAudio: false
      })
    })
  },

  sendVideoMessage() {
    let sendTo = this.data.sendTo;
    let msgList = this.data.msgList;
    let that = this;
    // 小程序端发送视频消息示例：
    // 1. 调用小程序接口选择视频，接口详情请查阅 https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.chooseVideo.html
    wx.chooseVideo({
      sourceType: ['album', 'camera'], // 来源相册或者拍摄
      maxDuration: 60, // 设置最长时间60s
      camera: 'back', // 后置摄像头
      success (res) {
        // 2. 创建消息实例，接口返回的实例可以上屏
        let message = tim.createVideoMessage({
          to: sendTo,
          conversationType: TIM.TYPES.CONV_C2C,
          payload: {
            file: res
          },
          // v2.12.2起，支持小程序端视频上传进度回调
          onProgress: function(event) {
             console.log('file uploading:', event)
             wx.showToast({
               title: '视频正在上传:' + event * 100 + '%',
               icon: 'none'
             })
          }
        })
        msgList.push({
          isSend: true,
          avatar: message.avatar,
          content: message.payload.snapshotUrl,
          videoUrl: message.payload.videoUrl,
          contentType: "video"
        })
        that.setData({
          msgList
        })
        // 3. 发送消息
        let promise = tim.sendMessage(message);
        promise.then(function(imResponse) {
          // 发送成功
          console.log(imResponse);
        }).catch(function(imError) {
          // 发送失败
          console.warn('sendMessage error:', imError);
        });
      }
    })
    this.setAllMessagesRead();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    let isCompleted = this.data.isCompleted
    if (isCompleted) {
      wx.showToast({
        title: '没有更多了',
        icon: 'none'
      })
      return
    }
    let sendTo = this.data.sendTo;
    let nextReqMessageID = this.data.sendTo;
    let that = this;
    // 下拉查看更多消息
    let promise = tim.getMessageList({conversationID: 'C2C' + sendTo, nextReqMessageID, count: 15});
    promise.then(function(imResponse) {
      const messageList = imResponse.data.messageList; // 消息列表。
      const nextID = imResponse.data.nextReqMessageID; // 用于续拉，分页续拉时需传入该字段。
      const isCompleted = imResponse.data.isCompleted; // 表示是否已经拉完所有消息。
      let list = that.convertMessageList(messageList);
      let msgList = this.data.msgList;
      msgList = list.concat(msgList)
      that.setData({
        msgList: msgList,
        nextReqMessageID: nextID,
        isCompleted
      })
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 获取聚焦
   */
  focus: function(e) {
    keyHeight = e.detail.height;
    let msgList = this.data.msgList;
    this.setData({
      scrollHeight: (windowHeight - keyHeight) + 'px'
    });
    this.setData({
      toView: 'msg-' + (msgList.length - 1),
      inputBottom: keyHeight + 'px'
    })
    //计算msg高度
    // calScrollHeight(this, keyHeight);

  },

  //失去聚焦(软键盘消失)
  blur: function(e) {
    let msgList = this.data.msgList;
    this.setData({
      scrollHeight: '90vh',
      inputBottom: 0
    })
    this.setData({
      toView: 'msg-' + (msgList.length - 1)
    })

  },
  onTyping(e) {
    if (e.detail.value == "") {
      let inputVal = ""
      this.setData({
        isInputtingText: false,
        inputVal
      })
    } else {
      let inputVal = e.detail.value
      this.setData({
        isInputtingText: true,
        inputVal
      })
    }
  },
  onTapMore() {
    let isTapped = this.data.isMoreTapped
    isTapped = !isTapped
    this.setData({
      isMoreTapped: isTapped,
      scrollViewHeight: isTapped ? '80vh' : '90vh'
    })
  },
  onTapSpeak() {
    let isTapped = this.data.isSpeakTapped
    isTapped = !isTapped
    this.setData({
      isSpeakTapped: isTapped
    })
  },
  onLongPress(e) {
    console.log(e)
  },
  /**
   * 发送点击监听
   */
  sendClick: function(e) {
    let msgList = this.data.msgList;
    let inputVal = this.data.inputVal;
    msgList.push({
      isSend: true,
      avatar: app.globalData.userInfo.avatarUrl,
      content: inputVal,
      contentType: 'text'
    })
    let sendTo = this.data.sendTo;
    this.sendTextMessage(sendTo, inputVal);
    inputVal = '';
    this.setData({
      msgList,
      inputVal,
      isInputtingText: false
    });
  },
  sendTextMessage(sendTo, text) {
    // 1. 创建消息实例，接口返回的实例可以上屏
    let message = tim.createTextMessage({
    to: sendTo,
    conversationType: TIM.TYPES.CONV_C2C,
    payload: {
      text: text
    }
    });
    // 2. 发送消息
    let promise = tim.sendMessage(message);
    promise.then(function(imResponse) {
    // 发送成功
    console.log(imResponse);
    }).catch(function(imError) {
    // 发送失败
    console.warn('sendMessage error:', imError);
    });
  },
  /**
   * 退回上一页
   */
  toBackClick: function() {
    wx.navigateBack({})
  },
  onUnload() {
    app.messageWatcher.remove(this);
  }

})
