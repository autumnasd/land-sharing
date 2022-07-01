// app.js
import TIM, { EVENT, TYPES } from 'tim-wx-sdk';
import TIMUploadPlugin from 'tim-upload-plugin';
import Touches from './utils/Touches.js'
var { 
  ConversationWatcher, 
  MessageWatcher, 
  UserInfoWatcher 
} = require('./utils/Watcher');
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // env: 'cloud1-9g5e8u1983b81b8b',
        traceUser: true,
      });
    }
    //会话观察者
    this.conversationWatcher = new ConversationWatcher(this.globalData.conversationList);
    this.conversationWatcher.add(this);

    //消息观察者
    this.messageWatcher = new MessageWatcher(this.globalData.myMessages);
    this.messageWatcher.add(this);

    //UserInfo Wathcer
    this.userInfoWatcher = new UserInfoWatcher(this.globalData.userInfo);
    this.userInfoWatcher.add(this);

    this.initTIM();
    this.db = wx.cloud.database()
    this.checkAuthSetting()
    this.checkUser()
  },
  initTIM() {
    let options = { SDKAppID: 1400669715 };
    var that = this;
    let tim = TIM.create(options);
    tim.setLogLevel(0);
    //tim.setLogLevel(1);
    // 注册腾讯云即时通信 IM 上传插件
    tim.registerPlugin({'tim-upload-plugin': TIMUploadPlugin});
    tim.on(TIM.EVENT.SDK_READY, function(event) {
      console.log('TIM_SDK_READY');
      that.globalData.isImLogin = true;
      wx.setStorageSync('isImLogin', true)
    });
    let onMessageReceived = function(event) {
      // event.data - 存储 Message 对象的数组 - [Message]
      const messageList = event.data;
      console.log(messageList)
      console.log('收到了消息')
      that.messageWatcher.setData(messageList)
    };
    tim.on(TIM.EVENT.MESSAGE_RECEIVED, onMessageReceived);

    tim.on(TIM.EVENT.MESSAGE_REVOKED, function(event) {

    })

    tim.on(TIM.EVENT.MESSAGE_READ_BY_PEER, function(event) {
      console.log('消息被对方读了')
      console.log(event.data)
    });

    tim.on(TIM.EVENT.CONVERSATION_LIST_UPDATED, function(event) {
      console.log('更新当前所有会话列表')
      var conversationList = event.data
      that.conversationWatcher.setData(conversationList);
    })

    tim.on(TIM.EVENT.PROFILE_UPDATED, function(event) {

    })

    tim.on(TIM.EVENT.BLACKLIST_UPDATED, function(event) {

    })

    tim.on(TIM.EVENT.ERROR, function(event) {

    })

    tim.on(TIM.EVENT.SDK_NOT_READY, function(event) {
      console.log('SDK_NOT_READY')
      that.globalData.isImLogin = false
      wx.setStorageSync('isImLogin', false)
    })
    tim.on(TIM.EVENT.SDK_READY, function(event) {
      that.updateProfile(that.globalData.userInfo);
    });

    tim.on(TIM.EVENT.KICKED_OUT, function(event) {
      console.log('KIKED_OUT')
      wx.setStorageSync('isImLogin', false)
      that.globalData.isImLogin = false
    })

    that.globalData.tim = tim
  },
  loginTIM(userInfo) {
    let sig = ''
    let openid = userInfo._openid;
    let that = this;
    wx.cloud.callFunction({
      name: 'getUserSig',
      success: function(sigRet) {
        sig = sigRet.result.sig
        let promise = that.globalData.tim.login({userID: openid, userSig: sig});
        promise.then(function(imResponse) {
          console.log(imResponse.data); // 登录成功
          if (imResponse.data.repeatLogin === true) {
            // 标识帐号已登录，本次登录操作为重复登录。v2.5.1 起支持
            console.log(imResponse.data.errorInfo);
          }
        }).catch(function(imError) {
          console.warn('login error:', imError); // 登录失败的相关信息
        });
      }
    })
  },

  updateConversation() {
    this.globalData.conversationList = this.conversationWatcher.getData();
  },
  updateMessage() {
    this.globalData.myMessages = this.messageWatcher.getData();
  },
  updateUserInfo() {
    this.globalData.userInfo = this.userInfoWatcher.getData();
  },

  // 检测权限，在旧版小程序若未授权会自己弹起授权
  checkAuthSetting() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: async (res) => {
              if (res.userInfo) {
                const userInfo = res.userInfo
                
                // 将用户数据放在临时对象中，用于后续写入数据库
                this.setUserTemp(userInfo)
              }

              const userInfo = this.userInfoWatcher.getData() || {}
              userInfo.isLoaded = true
              this.userInfoWatcher.setData(userInfo);
              this.globalData.isAuthorized = true
            }
          })
        } else {
          const userInfo = this.userInfoWatcher.getData() || {}
          userInfo.isLoaded = true
          this.userInfoWatcher.setData(userInfo);
        }
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success: (res) => {
             console.log(res)
            },
            fail: (err) => {
             console.log(err)
            }
          })
        }
      }
    })
  },
  // 检测小程序的 session 是否有效
  async checkUser() {
    let that = this
    const Users = this.db.collection('users')
    const users = await Users.get()
    wx.checkSession({
      success: () => {
        // session_key 未过期，并且在本生命周期一直有效
        // 数据里有用户，则直接获取
        if (users.data.length && this.checkSession(users.data[0].expireTime || 0)) {
          this.setUserInfo(users.data[0])
          that.loginTIM(users.data[0])//登录腾讯IM
        } else {
          this.setUserInfo()
          // 强制更新并新增了用户
          this.updateSession()
        }
      },
      fail: () => {
        // session_key 已经失效，需要重新执行登录流程
        this.updateSession()
      }
    })
  },
  updateProfile(userInfo) {
    let promise = this.globalData.tim.updateMyProfile({
      nick: userInfo.nickName,
      avatar: userInfo.avatarUrl,
      gender: TIM.TYPES.GENDER_UNKNOWN,
    });
    promise.then(function(imResponse){
      console.log('成功更新个人信息')
      
    }).catch(function(imError) {
      console.warn('updateMyProfile error:', imError);
    });
  },
  // 更新 session_key
  updateSession() {
    let that = this
    wx.login({
      success: async (res) => {
        try {
          let result = await wx.cloud.callFunction({
            name: 'user-session',
            data: {
              code: res.code
            }
          })
          that.setUserInfo(result.result.user.data[0])
        } catch (e) {

        }
      }
    })
  },
  
  // 检查用户是否登录态还没过期
  checkSession(expireTime = 0) {
    if (Date.now() > expireTime) {
      return false
    }
    return true
  },
  
  // 设置用户数据
  setUserInfo(userInfo = {}) {
    userInfo.isLoaded = true
    
    // 去掉敏感信息 session_key
    if (Object.prototype.hasOwnProperty.call(userInfo, 'session_key')) {
      delete userInfo.session_key
    }
    //将登录信息存入本地
    if (userInfo.length == 0 || userInfo.expireTime == 0) {
      wx.clearStorageSync()
    } else {
      wx.setStorageSync('userInfo', userInfo)
    }
    this.userInfoWatcher.setData(userInfo);
  },
  
  // 设置临时数据，待 “真正登录” 时将用户数据写入 collection "users" 中
  setUserTemp(userInfo = null, isAuthorized = true) {
    this.globalData.userTemp = userInfo;
    this.globalData.isAuthorized = true;
  },
  //全局变量
  globalData: {
    tim: '',
    isImLogin: false,
    msgList: [],
    userTemp: '',
    myMessages: new Map(),
    conversationList: [],
    isAuthorized: false, // 已取得授权
    userInfo: null,
    openid: null
  },
  Touches: new Touches()
});
