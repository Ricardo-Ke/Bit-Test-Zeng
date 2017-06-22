var http = require('http');
var fs = require('fs');
var path = require('path');

var encodingFmt = 'ascii';

const fileHeader = {}
const structHeader = {}
var fileBuf;
var brightnessData = [];

readFile(path.resolve(__dirname, './pcrbmp.bmp'));
digestHeader(fileBuf.slice(0, 54));   //  resolve header 

// 初始化灰度图统计数据
for(let i = 0;i < 255;i ++) {
  brightnessData[i] = 0;
}

// 判断是否由完整地rgb格式组成
if(structHeader.biSizeImage % 3 === 0) {
  getBrightnessData();
}


for(let i = 0;i < 255;i ++) {
  console.log(brightnessData[i]);
}

// console.log(fileHeader);
// console.log(structHeader);

function getBrightnessData() {
  for(let i = fileHeader.bfOffBits;i < structHeader.biSizeImage; i += 3) {
    let tmp = 0.3 * fileBuf[i] + 0.59 * fileBuf[i + 1] + 0.11 * fileBuf[i + 2]
      , bindex = Math.ceil(tmp) > 255 ? 255 : Math.ceil(tmp);

    brightnessData[bindex]++;
  }
  console.log(brightnessData);
}

function readFile(fileName) {
  fileBuf = fs.readFileSync(fileName);
}

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
}

// readFile(path.resolve(__dirname, './SimpleBmpResolver/zyp/res/test.bmp'));

// rs.on('data', function(chunk) {
//   chunks.push(chunk);
//   size += chunk.length;
// })

// rs.on('end', function() {
//   var buf = new Buffer(size);
//   buf = Buffer.concat(chunks);
//   console.log(buf.slice(0, 15).toString('ascii'));
// })



