var ImageModule = require('open-docxtemplater-image-module');
var PizZip = require('pizzip');
var Docxtemplater = require('docxtemplater');

// Import image-size - có thể cần destructure hoặc .default
var sizeOf;
try {
  sizeOf = require('image-size');
  // Nếu là ES module, có thể cần .default
  if (sizeOf.default) {
    sizeOf = sizeOf.default;
  }
} catch (e) {
  console.log('image-size import error:', e.message);
}


// Lấy items từ input
var items = $input.all();
var results = [];

for (var i = 0; i < items.length; i++) {
  var item = items[i];
  var context = item.json;
  var imageData = item.binary.elastic_dashboard;
  
  if (!imageData) {
    throw new Error('No image data found in binary.elastic_dashboard');
  }
  
  // Lấy template
  var templateNode = $('Retrieve DOCX template');
  var templateBuffer = Buffer.from(templateNode.first().binary.data.data, 'base64');
  
  // Options cho ImageModule
  var opts = {};
  opts.centered = true;
  opts.fileType = "docx";
  
  // Image loader function
  opts.getImage = function(tagValue, tagName) {
    // tagValue = 'elastic_dashboard' 
    // tagName = 'elastic_dashboard'
    return Buffer.from(imageData.data, 'base64');
  };
  
  // Image size function
  opts.getSize = function(img, tagValue, tagName) {
    // img = Buffer trả về từ getImage
    
    // Fallback: Nếu sizeOf không work, dùng fixed size tạm
    if (!sizeOf) {
      console.log('Using fixed size: 600x400');
      return [600, 400];
    }
    
    try {
      var dimensions = sizeOf(img);
      
      var maxWidth = 600;
      var width = dimensions.width;
      var height = dimensions.height;
      
      if (width > maxWidth) {
        var ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);
      }
      
      return [width, height];
    } catch (e) {
      console.log('sizeOf error:', e.message, '- using fixed size');
      return [600, 400];
    }
  };
  
  // Tạo ImageModule instance
  var imageModule = new ImageModule(opts);
  
  // Load template ZIP - PizZip (JSZip 2.x fork cho Docxtemplater)
  var zip = new PizZip(templateBuffer);
  
  // Tạo Docxtemplater và render - CHỈ XỬ LÝ IMAGE, GIỮ NGUYÊN TEXT TAGS
  var doc = new Docxtemplater()
    .attachModule(imageModule)
    .loadZip(zip);
  
  // Set options để GIỮ NGUYÊN các tag không có trong data
  doc.setOptions({
    nullGetter: function(part) {
      // Giữ nguyên tag nếu không có trong data
      // VD: {ip} sẽ vẫn là {ip} thay vì bị xóa
      if (!part.module) {
        return "{" + part.value + "}";
      }
      return "";
    }
  });
  
  doc.setData({
    elastic_dashboard: 'elastic_dashboard'  // Chỉ tag image
  })
  .render();
  
  // Generate buffer
  var buffer = doc
    .getZip()
    .generate({type: "nodebuffer"});
  
  // Tên file cố định
  var filename = 'ip-report_template_with_image.docx';
  
  // Push vào results
  results.push({
    json: {
      success: true,
      filename: filename,
      imageProcessed: true
    },
    binary: {
      data: {
        data: buffer.toString('base64'),
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileName: filename,
        fileExtension: 'docx'
      }
    }
  });
}

return results;
