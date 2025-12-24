// Truy cập trang đăng nhập Elastic
await $page.goto("https://elastic.local/login", {
  waitUntil: "networkidle2"
});

// Đợi form đăng nhập xuất hiện
await $page.waitForSelector('[data-test-subj="loginUsername"]', { timeout: 10000 });

// Nhập username và password
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

// Đợi thêm 15 giây để dashboard render xong dữ liệu
await new Promise(resolve => setTimeout(resolve, 15000));

// --- PHẦN CHỈNH SỬA QUAN TRỌNG ---

// Định nghĩa Selector cho panel bạn muốn chụp.
// Thay ID dưới đây bằng ID của biểu đồ khác nếu muốn (xem danh sách ở trên)
const panelSelector = '#panel-013259cb-f77a-4b04-af6f-d0f7d084e8fd';

// Đợi cho element cụ thể đó xuất hiện
await $page.waitForSelector(panelSelector, { timeout: 5000 });

// Chọn element đó
const element = await $page.$(panelSelector);

// Chụp ảnh CHỈ element đó
const screenshotBuffer = await element.screenshot({
  type: 'png'
});

// ----------------------------------

// Tạo timestamp cho tên file
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const filename = `elastic-panel-${timestamp}.png`;

// Trả về kết quả theo format của n8n
return [{
  json: {
    status: "success",
    filename: filename,
    timestamp: new Date().toISOString(),
    target_element: panelSelector
  },
  binary: {
    elastic_dashboard: {
      data: screenshotBuffer.toString('base64'),
      mimeType: 'image/png',
      fileName: filename
    }
  }
}];