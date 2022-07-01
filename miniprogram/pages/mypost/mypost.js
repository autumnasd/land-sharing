// pages/me/mypost/mypost.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    openid: null,
    postList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    let userInfo = wx.getStorageSync('userInfo')
    this.setData({
      openid: userInfo._openid
    })
    let openid = userInfo._openid
    let that = this
    if (openid != null) {
      wx.cloud.database().collection('fields').where({
        _openid: openid
      }).get({
        success: function(res) {
          let list = res.data
          
          wx.setStorageSync('myPostList', list);
          that.setData({
            postList: list
          })
        }
      })
    }
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
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
    let userInfo = wx.getStorageSync('userInfo')
    this.setData({
      openid: userInfo._openid
    })
    let list = wx.getStorageSync('myPostList');
    this.setData({
      postList: list
    })
  },
  handleMovableChange(e) {
    if (e.detail.source == 'friction') {
        if (e.detail.x < -30) {
            this.showOperateButtons(e)
        } else {
            this.hideOperateButtons(e)
        }
    } else if (e.detail.source == 'out-of-bounds' && e.detail.x == 0) {
        this.hideOperateButtons(e)
    }
  },
  handleTouchStart(e) {
    this.startX = e.touches[0].pageX
  },
  handleTouchEnd(e) {
    if (e.changedTouches[0].pageX < this.startX && e.changedTouches[0].pageX - this.startX <= -30) {
        this.showOperateButtons(e)
    } else if (e.changedTouches[0].pageX > this.startX && e.changedTouches[0].pageX - this.startX < 30) {
        this.showOperateButtons(e)
    } else {
        this.hideOperateButtons(e)
    }
  },
  showOperateButtons(e) {
    let index = e.currentTarget.dataset.index
    this.setXmove(index, -120)
  },
  hideOperateButtons(e) {
    let index = e.currentTarget.dataset.index
    this.setXmove(index, 0)
  },
  setXmove(index, xmove) {
    let list = this.data.postList
    list[index].xmove = xmove
    this.setData({
        postList: list
    })
  },
  onEdit(e) {
      //点击编辑时跳转到编辑页面
      //将对应的页面参数传递过去
      let index = e.currentTarget.dataset.index
      let post = JSON.stringify(this.data.postList[index]) 
      wx.navigateTo({
        url: './edit/edit?post=' + post,
      })
  },
  onDelete(e) {
    const that = this
    wx.showModal({
        title: "提示",
        content: '确定删除？',
        success(res) {
          if (res.confirm) {
            //先删除数据库中的再更新列表
            let index = e.currentTarget.dataset.index
            let list = that.data.postList
            let post = list[index]
            
            wx.cloud.database().collection('fields').doc(post._id).remove({
                success: res => {
                  //成功从数据库删除后，也将本地的删除
                  list.splice(index, 1)
                  that.setData({
                      postList: list
                  })
                  wx.showToast({
                    title: '删除成功',
                    icon: 'none'
                  })
                },
                fail: err => {
                    wx.showToast({
                      title: '删除失败',
                      icon: 'none'
                    })
                    console.log("删除失败", err)
                }
            })
          } else if (res.cancel) {
            console.log('取消')
          }
        }
      })
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