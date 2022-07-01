// pages/me/myStar/myStar.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    postList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let starList = options.starList;
    let userInfo = wx.getStorageSync('userInfo');
    this.setData({
      userInfo
    })
    starList = JSON.parse(starList)
    let that = this;
    const db = wx.cloud.database()
    let postList = []
    db.collection('fields')
    .where({
      _id: db.command.in(starList)
    })
    .get({
      success(res) {
        postList = res.data;
        that.setData({
          postList
        })
      }
    })
  },
  gotoDetail(e) {
    let index = e.currentTarget.dataset.index;
    let field = this.data.postList[index];
    let userInfo = this.data.userInfo
    let uid = userInfo._id
    let starList = userInfo.starList
    let isStarred = starList.indexOf(field._id) == -1 ? false : true;
    field = JSON.stringify(field)
    wx.navigateTo({
      url: '../../detail/detail?field=' + field + "&uid=" + uid +  "&isStarred=" + isStarred,
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