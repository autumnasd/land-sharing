// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: 'cloud1-9g5e8u1983b81b8b'
})

// 云函数入口函数
exports.main = async (event, context) => {
  console.log(event)
  return sendTemplateMessage(event);
}

async function sendTemplateMessage(event) {
  const {OPENID} = cloud.getWXContext();
  const templateId = 'P_ylqfbnvQf3fLDWvdJA_8TCIV3MnR_MjJD0bSrNhZo';
  const data = {
    'name1': {
      value: event.name
    },
    'thing2': {
      value: event.content
    },
    'time3': {
      value: event.date
    }
  };
  const sendResult = await cloud.openapi.subscribeMessage.send({
    touser: OPENID,
    templateId: templateId,
    page: "pages/home/home",
    data: data
  })
  return sendResult;
}