// components/TabBar/TabBar.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    selected: -1,
    color: "#515151",
    selectedColor: "#DAA520",
    backgroundColor: "#ffffff",
    list: [
      {
        pagePath: "/pages/home/home",
        text: "首页",
        iconPath: "/images/home.png",
        selectedIconPath: "/images/home_selected.png"
      },
      {
        pagePath: "/pages/mypost/mypost",
        text: "发布",
        iconPath: "/images/post.png",
        selectedIconPath: "/images/post_selected.png"
      },
      {
        index: 2,
        pagePath: "",
        bulge:true,
        iconPath: "/images/add.png",
      },
      {
        pagePath: "/pages/message/message",
        text: "消息",
        iconPath: "/images/message.png",
        selectedIconPath: "/images/message_selected.png"
      },
      {
        pagePath: "/pages/me/me",
        text: " 我",
        iconPath: "/images/me.png",
        selectedIconPath: "/images/me_selected.png"
      }
    ]
  },
  attached() {
  },
  /**
   * 组件的方法列表
   */
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const index = data.index
      const url = data.path
      if (index == 2) {
        wx.switchTab({
          url: '/pages/mypost/add/add',
        })
      } else {
        wx.switchTab({
          url
        })
      }
    }
  }
})
