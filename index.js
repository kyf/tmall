const rp = require('request-promise-native');
const phantom = require('phantom');
const cheerio = require('cheerio');
const fs = require('fs');

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


async function saveDetail(href){
    let page = await initPage();
    let status = await page.open(`https://${href}`);    
    let body = await page.property('content');
    await sleep(20);

    body = await page.property('content');
    let $ = cheerio.load(body);
    let bigImgs = $('#J_UlThumb img');
    let detailImgs = $('.img-ks-lazyload');
    let nameList = $('#J_AttrUL li');

    let name = filterName(nameList);
    if(name == ''){
        console.log(`${href} not name ...`);
        return;
    }

    fs.existsSync(`./data/${name}`) || fs.mkdirSync(`./data/${name}`);
    fs.existsSync(`./data/${name}/big`) || fs.mkdirSync(`./data/${name}/big`);
    fs.existsSync(`./data/${name}/detail`) || fs.mkdirSync(`./data/${name}/detail`);

    bigImgs = filterBigImgs(bigImgs);
    detailImgs = filterDetailImgs(detailImgs);

    fs.writeFileSync(`./data/${name}/big/list.txt`, JSON.stringify(bigImgs));
    fs.writeFileSync(`./data/${name}/detail/list.txt`, JSON.stringify(detailImgs));

    /*
    bigImgs.forEach((img, index) => {
        console.log(`[big]${img}`);
        saveImg(img, `./data/${name}/big`, index);
    });

    detailImgs.forEach((img, index) => {
        console.log(`[detail]${img}`);
        saveImg(img, `./data/${name}/detail`, index);
    });
    */
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
