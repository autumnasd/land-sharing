// pages/me/me.js
const app = getApp();
const tim = app.globalData.tim;
import TIM, { EVENT, TYPES } from 'tim-wx-sdk';
Page({

    /**
     * 页面的初始数据
     */
    
    data: {
        userInfo: app.globalData.userInfo
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
      let user = wx.getStorageSync('userInfo')
      
      this.setData({
        userInfo: user
      })
      if (user.nickName) {
        app.loginTIM(user);
      }
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
  // 手动获取用户数据
  getUserInfo(e) {
    let that = this
    
    wx.getUserProfile({
      desc: '用于维护个人信息',
      success: async (res) => {
        console.log("getUserInfo:", res)
        
        let nickName = res.userInfo.nickName
        let avatarUrl = res.userInfo.avatarUrl
        let gender = res.userInfo.gender
        
        const result = await wx.cloud.callFunction({
          name: 'user-login-register',
          data: {
            user: {
              nickName: nickName,
              avatarUrl: avatarUrl,
              gender: gender
            }
          }
        })
        app.setUserInfo(result.result.user.data[0])
        that.setData({
          userInfo: result.result.user.data[0]
        })
        app.loginTIM(result.result.user.data[0]);
      }
    })  
  },

  // 退出登录
  async bindLogout() {
    const user = this.data.userInfo
    await wx.cloud.database().collection('users').doc(user._id).update({
      data: {
        expireTime: 0
      }
    })
    app.setUserInfo()
    this.setData({
      userInfo: null
    })
    let promise = tim.logout();
    promise.then(function(imResponse) {
      console.log(imResponse.data); // 登出成功
    }).catch(function(imError) {
      console.warn('logout error:', imError);
    });
  },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 4
        })
      }
      
    },
    onTapMyStar() {
      let userInfo = this.data.userInfo
      if (!userInfo.nickName) {
        return
      }
      let id = userInfo._id;
      wx.cloud.database().collection('users').doc(id)
      .get()
      .then(res => {
        let list = res.data.starList;
        list = JSON.stringify(list);
        wx.navigateTo({
          url: './myStar/myStar?starList=' + list,
        })
      })
    },
    onTapSubscribeMessage() {
      let that = this;
      let tmplId = 'P_ylqfbnvQf3fLDWvdJA_8TCIV3MnR_MjJD0bSrNhZo';
      wx.requestSubscribeMessage({
        tmplIds: [tmplId],
        success(res) {
          if (res[tmplId] == 'acceept') {
            console.log('已接受')
            that.cloudSendMsg();
          } else if (res[tmplId] == 'reject') {
            
          }
        },
        fail(err) {
          console.log(err)
        }
      })
    },
    cloudSendMsg() {
      let that = this;
      wx.cloud.callFunction({
        name: 'sendMsg',
        data: {
          user: 'xbq',
          content: '收到了新消息',
          date: new Date()
        }
      }).then(res => {
        console.log('cloud res:', res)
      }).catch(err => {
        console.log(err)
      })
    },
    gotoAbout(){
        wx.navigateTo({
          url: '../me/about/contact',
        })
      },
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },
})