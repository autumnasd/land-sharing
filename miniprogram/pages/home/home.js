const app = getApp()
Page({
    data: {
      swiperList: [],
      postList: [],
      userInfo: null,
      inputShowed: false,
      inputVal: '',
    },
  onLoad() {
    let userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo: userInfo
      })
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
      /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
    let userInfo = wx.getStorageSync('userInfo')
    const db = wx.cloud.database()
    let that = this
    db.collection('fields')
    .where({
      _openid: db.command.neq(userInfo._openid)//查询所有非当前用户的土地信息
    })
    .get({
      success: function(res) {
        let swpier = res.data.slice(0, 3);
        that.setData({
          postList: res.data,
          swiperList: swpier
        })
      }
    })
    if (userInfo) {
      this.setData({
        userInfo: userInfo
      })
    }

  },
  gotoDetail(e) {
    let index = e.currentTarget.dataset.index;
    let field = this.data.postList[index];
    let userInfo = this.data.userInfo
    let uid = userInfo._id
    let starList = userInfo.starList
    console.log(starList)
    let isStarred = starList.indexOf(field._id) == -1 ? false : true;
    field = JSON.stringify(field)
    wx.navigateTo({
      url: '../detail/detail?field=' + field + "&uid=" + uid +  "&isStarred=" + isStarred,
    })
  },
  gotoSearch() {
    wx.navigateTo({
      url: '../search/search',
    })
  }
})