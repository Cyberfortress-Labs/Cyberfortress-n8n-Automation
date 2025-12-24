/**
 * PANDOC WORKAROUND - Thay thế node @couleetech/n8n-nodes-pandoc bị lỗi
 * =====================================================================
 * 
 * Plugin gốc xử lý ALL stderr như errors → crash với warnings/info messages
 * 
 * GIẢI PHÁP: Sử dụng 3 nodes thay vì 1 Pandoc node
 * 
 * WORKFLOW MỚI:
 * ┌─────────────────────┐
 * │ Generate Markdown   │ ← Code node tạo markdown
 * └──────────┬──────────┘
 *            ▼
 * ┌─────────────────────┐
 * │ Write Binary File   │ ← Ghi markdown ra /files/temp_input.md
 * └──────────┬──────────┘
 *            ▼
 * ┌─────────────────────┐
 * │ Execute Command     │ ← Chạy pandoc command
 * └──────────┬──────────┘
 *            ▼
 * ┌─────────────────────┐
 * │ Read Binary File    │ ← Đọc output.docx
 * └─────────────────────┘
 * 
 * 
 * ===========================================
 * BƯỚC 1: Cấu hình node "Write Binary File"
 * ===========================================
 * 
 * - File Name: /files/temp_report.md
 * - Property Name: data (hoặc tên binary property)
 * 
 * Trước node này, cần convert markdown text thành binary:
 * Thêm node "Convert to File" hoặc dùng Code node:
 */

// CODE NODE: Convert markdown to binary for Write Binary File
const markdown = $input.first().json.markdown;
const caseId = $input.first().json.case_id || 'report';

// Convert string to binary
const binaryData = await this.helpers.prepareBinaryData(
    Buffer.from(markdown, 'utf8'),
    `report_${caseId}.md`,
    'text/markdown'
);

return [{
    json: { case_id: caseId },
    binary: { data: binaryData }
}];

/*
 * ===========================================
 * BƯỚC 2: Cấu hình node "Execute Command"
 * ===========================================
 *
 * Command:
 * pandoc /files/temp_report.md -f markdown -t docx --reference-doc=/files/style_reference.docx -o /files/output_report.docx 2>/dev/null && echo "Success"
 *
 * QUAN TRỌNG: thêm "2>/dev/null" để suppress stderr warnings
 *
 *
 * ===========================================
 * BƯỚC 3: Cấu hình node "Read Binary File"
 * ===========================================
 *
 * - File Path: /files/output_report.docx
 * - Property Name: data
 *
 *
 * ===========================================
 * HOẶC: SỬ DỤNG CODE NODE ĐƠN GIẢN HƠN
 * ===========================================
 *
 * Nếu markdown ngắn, có thể dùng Execute Command với stdin:
 */

// ALTERNATIVE: Execute Command with inline markdown
// Command: 
// cat << 'MARKDOWN_EOF' | pandoc -f markdown -t docx --reference-doc=/files/style_reference.docx -o /files/output.docx 2>/dev/null
// {{ $json.markdown }}
// MARKDOWN_EOF

/*
 * ===========================================
 * LƯU Ý QUAN TRỌNG
 * ===========================================
 * 
 * 1. "2>/dev/null" redirect stderr để ignore warnings
 * 2. File paths phải trong /files hoặc /tmp (theo N8N_RESTRICT_FILE_ACCESS_TO)
 * 3. style_reference.docx phải tồn tại trước
 * 4. Sau khi xong, cleanup temp files nếu cần
 */
