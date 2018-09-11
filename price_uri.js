module.exports = function(cookie, url){
    var l,
        isg = cookie.match('(^|;) ?l=([^;]*)(;|$)'),
        isg2 = cookie.match('(^|;) ?isg=([^;]*)(;|$)');                                                                                         
    var arr=["callback=setMdskip","timestamp="+(+new Date()),"isg="+(isg&&isg[2]),"isg2="+(isg2&&isg2[2])],reg=/[?&^](ip|campaignId|key|abt|cat_id|q|u_channel|areaId|sdShopId)=([^&]+)/g;
    return url+'&'+arr.join("&");
}
