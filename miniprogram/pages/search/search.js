const app = getApp();
Page({
  data: {
    inputtingIext: "",
    postList: [],
    userInfo: app.globalData.userInfo,
    noResult: false,
    historyArray: []
  },
  onLoad() {
    let userInfo = wx.getStorageSync('userInfo')
    let historyArray = wx.getStorageSync('searchHistory');
    if (typeof historyArray == 'string') {
      historyArray = []
    }
    this.setData({
      userInfo,
      historyArray
    })
  },
  searchInput(e) {
    let input = e.detail.value;
    this.setData({
      inputtingIext: input
    })
  },
  search() {
    let historyArray = this.data.historyArray;
    
    let key = this.data.inputtingIext;
    let that = this;
    const db = wx.cloud.database();
    let openid = this.data.userInfo._openid;
    let list = [];
    db.collection('fields')
    .where(
      db.command.and(
        {
          title:db.RegExp({ regexp: key, options: 'i' })
        },
        {
          _openid: db.command.neq(openid) // 查询不是用户自己的
        }
      )
    ).get()
    .then(res => {
      console.log('查询成功')
      list = res.data;
      if (historyArray.indexOf(key) == -1) {
        historyArray.push(key);
        wx.setStorageSync('searchHistory', historyArray);
        that.setData({
          historyArray
        })
      }
      let noResult = list.length == 0 ? true : false;
      this.setData({
        noResult,
        postList: list
      })
    })
    .catch(res => {
      console.log('查询失败', res)
    })
  },
  onTapHistory(e) {
    let index = e.currentTarget.dataset.index;
    let key = this.data.historyArray[index];
    this.setData({
      inputtingIext: key
    })
    this.search();
  },
  cleanHistory() {
    let historyArray = []
    this.setData({
      historyArray
    })
   wx.setStorageSync('searchHistory', historyArray)
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
      url: '../detail/detail?field=' + field + "&uid=" + uid +  "&isStarred=" + isStarred,
    })
  },
})