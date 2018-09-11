const rp = require('request-promise-native');
const phantom = require('phantom');
const cheerio = require('cheerio');
const fs = require('fs');
const Excel = require('exceljs');
const getPriceUri = require('./price_uri');

const ids = [
    'shop18745057617', 
    'shop18777575159', 
    'shop18803373329', 
    'shop18843690321', 
    'shop18888322149'
   ];
const uri = 'https://vansydical.tmall.com/p/rd531741.htm?spm=a1z10.1-b-s.w16608505-16183339087.8.dfb97e1fG2sdHH';

async function initPage(){
    let instance = await phantom.create();
    let page = await instance.createPage();
    await page.on('onResourceRequested', (requestData)=>{
        //console.log(requestData); 
    });
    return page;
}


async function main(){
    let body = await saveHtml(); 
    let $ = cheerio.load(body);
    for(let index = 0; index < ids.length; index++){
        let id = ids[index];
        let selector = `#${id} .zfh a`;
        let len = $(selector).length;
        for(let i = 0; i<len; i++){
            let item = $(selector).eq(i);
            let href = item.attr('href');
            if(href){
                await saveDetail(href);
            }
        }
    };

}

async function fetchDetailImgs(matches){
	if(matches.length == 0)return [];
	let uri = matches[0];
	let body = await rp.get('https:' + uri);
	let reg = new RegExp('https://img.alicdn.com[^"]+', 'ig');
	let _matches = body.match(reg);
	if(!_matches || _matches == null)return [];
	return _matches;
}

let g_index = 0;

let g_data = [];

let cookie = 'cna=jL63Er/uSEwCAXLxRThk/POO; cq=ccp%3D1; hng=CN%7Czh-CN%7CCNY%7C156; t=a732eeab9f4edbb1018ce8f41d7f0d36; tracknick=kyf1231; _tb_token_=ee8bee5e7db73; cookie2=13fbd8e666b69bd6d2    9d4e092bb29099; _m_h5_tk=a9311c8b9c8bcde033958d394896d3ef_1536668791887; _m_h5_tk_enc=f16587f999259d5eb3e18a446dcd0732; pnm_cku822=098%23E1hvEQvUvbpvUvCkvvvvvjiPPsdO0j3UPszpzjEUPmP9zjlRRszytjE8P2Fplj1HiQhvCv    vvpZpPvpvhvv2MMQhCvvOv9hCvvvvEvpCW9CfytC0DW3vOHkx%2F1RoK5d8rwZHl%2Bb8reEIaUWoQ%2Bu0OeB69zbmAdX9fjomUkC4AdX3gENLvHdoJVcaVzbvqrqpAOH2lYBpTHdaScOyCvvOCvhE20RoivpvUvvCCEmWHClAtvpvIvvCvpvvvvvvvvh8DvvmCtvvvBGwvvvU    wvvCj1Qvvv99vvhNjvvvmm2yCvvpvvhCv; isg=BL-_Soqs2GGDU928uNo2RPlQTpOJDBN17OYo5FGMB269YN_iWXVUl9FypnA7OOu-';


async function saveDetail(href){
	g_index++;
	if(g_index != 1)return;
    //let page = await initPage();
    //let status = await page.open(`https://${href}`);    
    //let body = await page.property('content');
    let body = await rp.get(`https:${href}`);
    await sleep(1);

	let reg = new RegExp('\/\/desc.alicdn.com[^"]+', 'ig');
	let matches = body.match(reg);
    let $ = cheerio.load(body);
    let bigImgs = $('#J_UlThumb img');
    let title = $('.tb-detail-hd h1').eq(0).text().trim();
    let detailImgs = await fetchDetailImgs(matches);
    let nameList = $('#J_AttrUL li');

    //let price = filterPrice(nameList);
    
    let reg1 = new RegExp('//mdskip.taobao.com/core/initItemDetail.htm[^"]+', 'ig');
    let priceuri = body.match(reg1);
    if(priceuri == null){
        console.log('priceuri is null');
        return;
    }
    let newPriceUri = getPriceUri(cookie, priceuri[1]);
    let priceBody = await rp({
        method: 'get',
        uri: 'https:' + newPriceUri,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.81 Safari/537.36",
            "Referer": `https:${href}`,
            "cookie": cookie,
        },
    });

    console.log(priceBody);return;

    let price1 = $('#J_StrPriceModBox .tm-price').text().trim();
    let price2 = $('#J_PromoPrice .tm-price').text().trim();
    
    let name = filterName(nameList);
    if(name == ''){
        console.log(`${href} not name ...`);
        return;
    }

    let item = {"number": name, "name": title, "price1": price1, "price2": price2};
    fs.writeFileSync(`./kk/${name}.json`, JSON.stringify(item));
    
	console.log(`[${g_index}] ${JSON.stringify(item)} ${href}...`);
    //return;

    fs.existsSync(`./data/${name}`) || fs.mkdirSync(`./data/${name}`);
    fs.existsSync(`./data/${name}/big`) || fs.mkdirSync(`./data/${name}/big`);
    fs.existsSync(`./data/${name}/detail`) || fs.mkdirSync(`./data/${name}/detail`);

    bigImgs = filterBigImgs(bigImgs);
	console.log(`[${g_index}]big images length is ${bigImgs.length}, detail images length is ${detailImgs.length} ...`);

    fs.writeFileSync(`./data/${name}/big/list.txt`, JSON.stringify(bigImgs));
    fs.writeFileSync(`./data/${name}/detail/list.txt`, JSON.stringify(detailImgs));

}

async function saveImg(imgUri, dir, index){
    let body = await rp.get(`https:${imgUri}`);
    fs.writeFileSync(`${dir}/${index}.jpg`, body);
}

function sleep(seconds){
    return new Promise((resolved, injected)=>{
        setTimeout(resolved, seconds * 1000); 
    });
}

function filterBigImgs(list){
    let size = list.length;
    let result = [];
    for(let i = 0; i < size; i++){
        let item = list.eq(i);
        let src = item.attr('src').replace('_60x60q90.jpg', '');
        result.push(src);
    }

    return result;
}

function filterDetailImgs(list){
    let size = list.length;
    let result = [];
    for(let i = 0; i < size; i++){
        let item = list.eq(i);
        let src = item.attr('src');
        result.push(src);
    }

    return result;
}

function filterPrice(list){
    let size = list.length;
    for(let i = 0; i < size; i++){
        let item = list.eq(i);
        let text = item.text();
        if(text.includes('吊牌价')){
            return text.replace('吊牌价:', '').trim();
        }
    }

    return "";
}


function filterName(list){
    let size = list.length;
    for(let i = 0; i < size; i++){
        let item = list.eq(i);
        let text = item.text();
        if(text.includes('款号')){
            return text.replace('款号:', '').trim();
        }
    }

    return "";
}

async function saveHtml(){
    let exists = await fs.existsSync('./content.html');
    if(exists){
        return await fs.readFileSync('./content.html');
    }

    let page = await initPage();
    let status = await page.open(uri);
    console.log(`status is ${status} ...`);
    let body = await page.property('content');
    //console.log(`body is ${body}...`);
    fs.writeFileSync('./content.html', body);
    return body;
} 

main().then(data => {
    if(data)console.log(data);
    process.exit(0);
}).catch(err => {
    console.log(err);
});
