// pages/detail/detail.js
let plugin = requirePlugin('routePlan');
let key = 'KCMBZ-LLQ66-M3YSV-MQN6R-OSXJF-XEB5Z';  //使用在腾讯位置服务申请的key
let referer = '闲置土地信息共享工具';   //调用插件的app的名称
Page({

  /**
   * 页面的初始数据
   */
  data: {
    field: {},
    imgList: [
        '../../images/home.png',
        '../../images/home.png',
        '../../images/home.png'
    ],
    title: "地方就送安抚啊发的发掘阿迪斯发士大夫阿道夫阿迪斯发到付阿道夫的官方认定事故",
    desc: "fsf sfsghaofha dashfaof haosdhfaoshf aod\nfaufgaifgaifdhasiodfa\nsfgsdhj",
    isStarred: false,
    uid: ""
  },

  routeTo() {
    let field = this.data.field;
    let endPoint = JSON.stringify({
      'name': field.location.name,
      'latitude': field.location.latitude,
      'longitude': field.location.longitude
    })
    wx.navigateTo({
        url: 'plugin://routePlan/index?key=' + key + '&referer=' + referer + '&endPoint=' + endPoint
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //TODO:需要传入一个土地id用于查询土地信息
    let field = options.field
    field = JSON.parse(field)
    this.setData({
      field,
      uid: options.uid,
      isStarred: options.isStarred == "true" ? true : false
    })
  },
  onTabStar() {
    let isStarred = this.data.isStarred
    let uid = this.data.uid
    let fid = this.data.field._id
    let that = this
    wx.cloud.database().collection('users').doc(uid)
    .get({
      success: function(res) {
        let list = res.data.starList
        if (isStarred) {
          list.splice(list.indexOf(fid), 1)
          isStarred = false
        } else {
          list.push(fid)
          isStarred = true
        }
        let userInfo = wx.getStorageSync('userInfo');
        userInfo.starList = list;
        wx.setStorageSync('userInfo', userInfo);
        wx.cloud.database().collection('users').doc(uid).update({
          data: {
            starList: list
          }
        })
        that.setData({
          isStarred
        })
      }
    })
  },
  onTabChat() {
    let sendTo = this.data.field._openid;
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
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})