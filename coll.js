const Excel = require('exceljs');
const fs = require('fs');

function main(){
    let workbook = new Excel.Workbook();
    let sheet = workbook.addWorksheet('kyf');
    sheet.columns = [{
        key: 'number',
        header: '货号',
        width: 10,
    },{
        key: 'name',
        header: '商品名称',
        width: 100,
    },{
        key: 'price1',
        header: '吊牌价',
        width: 10,
    },{
        key: 'price2',
        header: '天猫价',
        width: 10,
    }];

    let infos = fs.readdirSync('./kk/');
    for(let i = 0; i < infos.length; i++){
        let info = infos[i];
        let pp = `./kk/${info.toString()}`;
        if(fs.existsSync(pp)){
           let body = fs.readFileSync(pp); 
            sheet.addRow(JSON.parse(body));
        }
    }

    workbook.xlsx.writeFile('./kyf.xlsx').then(()=>{
        console.log('success ...');
    }).catch(err => {
        console.log(err);
    });

}

main();
