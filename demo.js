const rp = require('request-promise-native');
const fs = require('fs');


function sleep(seconds){
    return new Promise((resolved, injected)=>{
        setTimeout(resolved, seconds * 1000); 
    });
}

async function main(){
	let uri = 'https://detail.tmall.com/item.htm?id=574311954397&sku_properties=1627207:3232483';
    let body = await rp.get(uri).on('response', (response)=>{
        console.log(response.headers);
    });
}

main().then(()=>{
	process.exit(0);
}).catch(err => {
	console.log(err);
	process.exit(0);
});
