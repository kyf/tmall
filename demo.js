const phantom = require('phantom');
const fs = require('fs');

async function initPage(){
    let instance = await phantom.create();
    let page = await instance.createPage();
    await page.on('onResourceRequested', (requestData)=>{
        //console.log(requestData); 
    });
    return page;
}

function sleep(seconds){
    return new Promise((resolved, injected)=>{
        setTimeout(resolved, seconds * 1000); 
    });
}

async function main(){
	let uri = 'https://detail.tmall.com/item.htm?id=574311954397&sku_properties=1627207:3232483';
	let page = await initPage();
	await page.open(uri);
	let body = await page.property('content');
	let reg = new RegExp('\/\/desc.alicdn.com[^"]+', 'ig');
	let matches = body.match(reg);
	console.log(matches);
}

main().then(()=>{
	process.exit(0);
}).catch(err => {
	console.log(err);
	process.exit(0);
});
