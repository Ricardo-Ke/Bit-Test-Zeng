var http = require('http');
var fs = require('fs');
var path = require('path');
var express = require('express');

var app = express();
var bmpFilePath = process.argv[2];
var encodingFmt = 'ascii';

const fileHeader = {}
const structHeader = {}
var fileBuf;
var step = 0;
var brightnessData = [];

readFile(path.resolve(__dirname, bmpFilePath || './pcr.bmp'));
digestHeader(fileBuf.slice(0, 54));   //  resolve header 

// 初始化灰度图统计数据
for(let i = 0;i < 255;i ++) {
  brightnessData[i] = 0;
}

// 判断是否由完整地rgb格式组成
if(structHeader.biSizeImage % step === 0) {
  getBrightnessData();
  generateTwoValueBMP();
}

// 转换格式，提供给接口
const resBrightnessData = brightnessData.map(function(val, ind) {
  return {
    x: ind,
    y: val
  }
})

// 启动服务
app.get('/', function(req, res) {
  var method = req.query.callback
    , textResBriData = JSON.stringify(resBrightnessData);
  res.send(200, method + `(${textResBriData})`);
}).listen(8001);


// -------------------------------------
// 同步读取文件
function readFile(fileName) {
  fileBuf = fs.readFileSync(fileName);
}

// 提取头部文件
function digestHeader(fhBytes) {
  fileHeader.bfType = fhBytes.toString(encodingFmt, 0, 2);
  fileHeader.bfSize = fhBytes.readInt32LE(2);
  fileHeader.bfReserved1 = fhBytes.readInt16LE(6);
  fileHeader.bfReserved2 = fhBytes.readInt16LE(8);
  fileHeader.bfOffBits = fhBytes.readInt32LE(10);

  structHeader.biSize = fhBytes.readInt32LE(14);
  structHeader.biWidth = fhBytes.readInt32LE(18);
  structHeader.biHeight = fhBytes.readInt32LE(22);
  structHeader.biPlanes = fhBytes.readInt16LE(26);
  structHeader.biBitCount = fhBytes.readInt16LE(28);
  structHeader.biCompresssion = fhBytes.readInt32LE(30);
  structHeader.biSizeImage = fhBytes.readInt32LE(34);
  structHeader.biXPelsPerMeter = fhBytes.readInt32LE(38);
  structHeader.biYPelsPerMeter = fhBytes.readInt32LE(42);
  structHeader.biClrUsed = fhBytes.readInt32LE(46);
  structHeader.biClrImportant = fhBytes.readInt32LE(50);

  step = structHeader.biBitCount / 8;
}

// 统计灰度值
function getBrightnessData() {
  for(let i = fileHeader.bfOffBits;i < structHeader.biSizeImage; i += 3) {
    let tmp = 0.3 * fileBuf[i] + 0.59 * fileBuf[i + 1] + 0.11 * fileBuf[i + 2]
      , bindex = Math.ceil(tmp) > 255 ? 255 : Math.ceil(tmp);

    brightnessData[bindex]++;
  }
}

// 生成二值变换图
function generateTwoValueBMP() {
  const targetUrl = path.resolve(__dirname, process.argv[3] || './twoValueImg.bmp');

  let targetFileBuf = fileBuf.slice();

  for(let i = fileHeader.bfOffBits;i < structHeader.biSizeImage;i += 3) {
    let result = 0.3*targetFileBuf[i] + 0.59*targetFileBuf[i + 1] + 0.11*targetFileBuf[i + 2]
      , k = Math.ceil(result) > 128 ? 255 : 0;
      
    targetFileBuf[i] = targetFileBuf[i + 1] = targetFileBuf[i + 2] = k;
  }

  fs.writeFile(targetUrl, targetFileBuf, 'utf-8', function(err) {
    if (err) throw err;
    console.log('File has been saved');
  })
}
