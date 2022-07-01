// 云函数入口文件
const cloud = require('wx-server-sdk')
var TLSSigAPIv2 = require('./TLSSigAPIv2')
cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  var api = new TLSSigAPIv2.Api(1400669715, '8be0d142b71afcbd91f294686e02863729d4cb6dfbd24540c9c0257c29d99342');
  var sig = api.genSig(wxContext.OPENID, 86400*180);
  return {sig}
}