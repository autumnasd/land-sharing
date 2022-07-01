// pages/message/message.js
const app = getApp()
const tim = app.globalData.tim;
import TIM, { EVENT, TYPES } from 'tim-wx-sdk';
import TIMUploadPlugin from 'tim-upload-plugin';


Page({

  /**
   * 页面的初始数据
   */
  data: {
    itemData: [],
    userInfo: '',
    ConversationData: [],
    ReceivedMessage: [],
    openid: "",
    isLoading: false,
    noMore: false,
    //判断是否登录
    hasUserInfo: false,
    currentPage: 1
  },
 
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let that = this
    let userInfo = wx.getStorageSync('userInfo')
    this.setData({
      userInfo: userInfo,
      openid: userInfo._openid,
      hasUserInfo: userInfo?true:false
    })
    if (userInfo.nickName) {
      app.loginTIM(userInfo);
    }
    //app.messageWatcher.add(this);
    //let data = app.messageWatcher.getData();
    app.conversationWatcher.add(this);
    this.updateConversation();

    app.userInfoWatcher.add(this);
  },
  onUnload() {
    app.userInfoWatcher.remove(this);
  },
  updateUserInfo() {
    let userInfo = app.userInfoWatcher.getData();
    this.setData({
      userInfo
    })
  },
  updateConversation() {
    //let data = app.messageWatcher.getData();
    let data = app.conversationWatcher.getData();
    let msg = []//img name time info
    data.forEach((item, index) => {
      // 比如需要这样的格式 yyyy-MM-dd hh:mm:ss
      var date = new Date(item.lastMessage.lastTime * 1000);
      var Y = date.getFullYear() + '-';
      var M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
      var D = date.getDate() + ' ';
      var h = date.getHours() + ':';
      var m = date.getMinutes() + ':';
      var s = date.getSeconds(); 
      let tmp = {
        conversationID: item.conversationID,
        unreadCount: item.unreadCount,
        to: item.userProfile.userID,
        img: item.userProfile.avatar,
        name: item.userProfile.nick,
        time: Y+M+D+h+m+s,
        info: item.lastMessage.messageForShow
      };
      msg.push(tmp);
    });
    this.setData({
      itemData: msg
    })
  },

  touchS: function (e) {  // touchstart
    let startX = app.Touches.getClientX(e)
    startX && this.setData({ startX })
  },
  touchM: function (e) {  // touchmove
    let itemData = this.data.itemData;
    itemData = app.Touches.touchM(e, itemData, this.data.startX)
    itemData && this.setData({itemData});
  },
  touchE: function (e) {  // touchend
    const width = 150  // 定义操作列表宽度
    let itemData = this.data.itemData;
    itemData = app.Touches.touchE(e, itemData, this.data.startX, width)
    itemData && this.setData({itemData});
  },
  itemDelete: function(e){  // itemDelete
    let index = e.currentTarget.dataset.index;
    let itemData = this.data.itemData;
    let conversationID = itemData[index].conversationID;

    let promise = tim.deleteConversation(conversationID);
    promise.then(function(imResponse) {
      console.log('删除会话成功')
    }).catch(function(imError) {
      console.warn('deleteConversation error:', imError); // 删除会话失败的相关信息
    });
    itemData = app.Touches.deleteItem(e, itemData)
    itemData && this.setData(itemData);
  },
  onTapMessage(e) {
    let index = e.currentTarget.dataset.index;
    let itemData = this.data.itemData;
    let sendTo = itemData[index].to;

    
    wx.navigateTo({
      url: '../sendMessage/sendMessage?sendTo=' + sendTo,
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
      })
    }
    
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },
})