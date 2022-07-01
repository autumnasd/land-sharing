// pages/mypost/edit/edit.js
const app = getApp()
const key = 'KCMBZ-LLQ66-M3YSV-MQN6R-OSXJF-XEB5Z'; //使用在腾讯位置服务申请的key
const referer = '闲置土地信息共享工具'; //调用插件的app的名称
const chooseLocation = requirePlugin('chooseLocation');
//正则表达式，用于过滤符号，除了!！-(),?？，、。:：
const pattern=/[`~@#$^\&*=|{}':;'\\\[\]\.<>\/~@#￥……&*（）——|{}【】'；""'\s]/g;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: "",
    title: "",
    titleWarn: "",
    desc: "",
    imageList: [],
    location: null,//用来存包括经纬度的详细信息，留作以后导航用
    address: "", //用于展示给用户的地址
    area: "",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let post = JSON.parse(options['post'])
    let title = post.title
    let desc = post.desc
    let list = post.imgList
    let location = post.location
    let address = location.address
    let area = post.area
    this.setData({
        id: post._id,
        title: title,
        desc: desc,
        imageList: list,
        location: location,
        address: address,
        area: area
    })
  },
  onInputTitle(e) {
    let input = e.detail.value
    
    if (input.length < 5 || input.length > 18) {
      this.setData({
        titleWarn: "标题限制为5~18字\n"
      })
      return
    } else {
      input = input.replace(pattern, "")
      this.setData({
        titleWarn: "",
        title: input
      })
    }
  },
  onInputDesc(e) {
    let input = e.detail.value
    if (input != "") {
      input = input.replace(pattern, "")
    }
    this.setData({
      desc: e.detail.value
    })
  },
  chooseImage() {
    let that = this
    let imgList = that.data.imageList
    wx.chooseImage({
      /**
       * 每次只能选一张图片，便于处理；
       * 先选择多张图片，后期异步上传的时候很烧脑
       * 因此先暂时用这个实现了。
       */
      count: 1,
      success: function(res) {
        imgList.push(res.tempFilePaths[0])
        //先用本地路径展示
        that.setData({
          imageList: imgList
        })
        //上传
        let cloudPath = "img/" + that.data.openid + "/" + Date.now() + ".png"
        wx.cloud.uploadFile({
          cloudPath,
          filePath: res.tempFilePaths[0]
        }).then((res) => {
          let fileID = res.fileID
          if (fileID) {
            imgList[imgList.length - 1] = fileID
            that.setData({
              imageList: imgList
            })
          }
        })
      }
    })
  },
  chooseAddress() {
    wx.navigateTo({
      url: 'plugin://chooseLocation/index?key=' + key + '&referer=' + referer
    })
  },
  onInputArea(e) {
    this.setData({
      area: e.detail.value
    })
  },
  deleteImg(e) {
    let that = this;
    let index = e.currentTarget.dataset.index
    let imageList = that.data.imageList
    wx.showModal({
      title: "提示",
      content: '确定删除这张图片吗？',
      success(res) {
        if (res.confirm) {
          //先删除云储存中的
          wx.cloud.deleteFile({
            fileList: [imageList[index]],
            success: (res) => {
              console.log(res)
            }
          })
          //再更新数组
          imageList.splice(index, 1)//第一个参数：索引，第二个参数：从索引开始要删除的长度
          that.setData({
            imageList
          })
        } else if (res.cancel) {
          console.log('取消')
        }
      }
    })
  },
   //保存事件
   onSave() {
    let id = this.data.id
    let title = this.data.title
    let desc = this.data.desc
    let imgList = this.data.imageList
    let location = this.data.location
    let time = Date.now()
    if (location == null) {
      wx.showToast({
        title: '请选择位置',
        icon: 'none'
      })
      return
    }
    let area = this.data.area
    if (area.length == 0) {
      wx.showToast({
        title: '请输入面积',
        icon: 'none'
      })
      return
    }
    wx.cloud.database().collection('fields').doc(id).update({
      data: {
        title,
        desc,
        imgList,
        location,
        area,
        editTime: time
      },
      success: function(res) {
        wx.showToast({
          title: '修改成功',
          icon: 'none'
        })
        wx.navigateBack({
          delta: 1,
        })
      }
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
    const location = chooseLocation.getLocation();
    if (location != null) {
      this.setData({
        location: location,
        address: location.address
      })
    }
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
    chooseLocation.setLocation(null);
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