// Script này để copy-paste vào Puppeteer node với operation "runCustomScript"
// QUAN TRỌNG: Không có wrapper function async ({ page }) => 
// Chỉ cần code trực tiếp, sử dụng $page thay vì page

// Truy cập trang đăng nhập Elastic
await $page.goto("https://elastic.local/login", {
  waitUntil: "networkidle2"
});

// Đợi form đăng nhập xuất hiện
await $page.waitForSelector('[data-test-subj="loginUsername"]', { timeout: 10000 });

// Nhập username và password (sử dụng data-test-subj selector)
await $page.type('[data-test-subj="loginUsername"]', "");
await $page.type('[data-test-subj="loginPassword"]', "");

// Click nút submit và đợi navigation
await Promise.all([
  $page.waitForNavigation({ waitUntil: "networkidle2" }),
  $page.click('[data-test-subj="loginSubmit"]')
]);

// Truy cập dashboard
await $page.goto("https://elastic.local/s/app/dashboards#/view/c5qf7346-b33f-4asa-9d17-7b12ea85210d?_g=(filters:!(),refreshInterval:(pause:!t,value:60000),time:(from:now-7d%2Fd,to:now))", {
  waitUntil: "networkidle2"
});

// Đợi thêm 5 giây để dashboard render xong (sử dụng setTimeout thay vì waitForTimeout)
await new Promise(resolve => setTimeout(resolve, 15000));

// Chụp screenshot - KHÔNG dùng encoding: 'base64', để trả về Buffer
const screenshotBuffer = await $page.screenshot({
  fullPage: true,
  type: 'png'
});

// Tạo timestamp cho tên file
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const filename = `elastic-dashboard-${timestamp}.png`;

// Trả về kết quả theo format của n8n
return [{
  json: {
    status: "success",
    filename: filename,
    timestamp: new Date().toISOString()
  },
  binary: {
    elastic_dashboard: {
      data: screenshotBuffer.toString('base64'),
      mimeType: 'image/png',
      fileName: filename
    }
  }
}];
