/**
 * n8n Code Node: Generate IOC Report from Markdown Template
 * 
 * WORKFLOW SETUP:
 * [Retrieve template] → [Extract from File] → [Merge with IOC data] → [This Code Node]
 * 
 * Input requirements:
 * - Node "Extract from File" phải convert binary template thành text
 * - Input items phải chứa ioc objects với optional smartxdr_comment
 */

// --- BƯỚC 1: LẤY NỘI DUNG TEMPLATE ---
// Đọc từ node "Extract from File" đã convert binary sang text
const templateRaw = $('Extract from File').first().json.data;

if (!templateRaw || templateRaw.length === 0) {
    throw new Error("Không tìm thấy nội dung template. Kiểm tra node 'Extract from File' đã được cấu hình đúng.");
}

console.log('Template loaded, length:', templateRaw.length);

// --- BƯỚC 2: CHUẨN BỊ DỮ LIỆU ---
const allItems = items.map(item => item.json);
const caseId = allItems[0].case_id || "N/A";
const now = new Date().toISOString().split('T')[0];

// Trích xuất danh sách IOC
const iocList = allItems.map(item => item.ioc).filter(i => i !== undefined);

// Phân loại IOC
const iocsWithComment = iocList.filter(i => i.smartxdr_comment && i.smartxdr_comment.comment_text);
const iocsNoComment = iocList.filter(i => !i.smartxdr_comment || !i.smartxdr_comment.comment_text);

// --- BƯỚC 3: TẠO NỘI DUNG ĐỘNG ---

// 3.1. Tạo bảng Summary
const tableRows = iocList.map(i => {
    const hasAnalysis = i.smartxdr_comment ? "Yes" : "No";
    return `| ${i.ioc_type || 'N/A'} | ${i.ioc_value || 'N/A'} | ${hasAnalysis} |`;
}).join('\n');

// 3.2. Tạo phần chi tiết
const detailedSection = iocsWithComment.map(i => {
    let aiContent = i.smartxdr_comment.comment_text || "";

    // --- FIX HEADER LEVELS ---
    // 1. Xóa dòng "[SmartXDR AI Analysis]" thừa thãi
    aiContent = aiContent.replace('[SmartXDR AI Analysis]', '').trim();

    // 2. Hạ cấp Heading: Tìm các dòng bắt đầu bằng "## " và đổi thành "#### "
    aiContent = aiContent.replace(/^## /gm, '#### ');

    // 3. Hạ cấp tiếp "### " thành "##### "
    aiContent = aiContent.replace(/^### /gm, '##### ');

    return `### IOC: \`${i.ioc_value}\`
**Type:** ${i.ioc_type}  
**AI Analyst:** ${i.smartxdr_comment.comment_user || 'AI'}  
**Date:** ${i.smartxdr_comment.comment_date || now}

${aiContent}`;
}).join('\n\n---\n\n');

// 3.3. Tạo phần không có analysis
let noAnalysisSection = "All IOCs have been analyzed by SmartXDR.";
if (iocsNoComment.length > 0) {
    noAnalysisSection = iocsNoComment.map(i => `- **${i.ioc_type}** → ${i.ioc_value}`).join('\n');
}

// --- BƯỚC 4: THAY THẾ VÀO TEMPLATE ---
let finalMarkdown = templateRaw;

// Hàm replace an toàn
const safeReplace = (text, key, value) => text.split(key).join(value || '');

// Map các biến
finalMarkdown = safeReplace(finalMarkdown, '{{CASE_ID}}', caseId);
finalMarkdown = safeReplace(finalMarkdown, '{{DATE_NOW}}', now);
finalMarkdown = safeReplace(finalMarkdown, '{{TOTAL_IOCS}}', iocList.length.toString());
finalMarkdown = safeReplace(finalMarkdown, '{{COUNT_WITH_ANALYSIS}}', iocsWithComment.length.toString());
finalMarkdown = safeReplace(finalMarkdown, '{{COUNT_WITHOUT_ANALYSIS}}', iocsNoComment.length.toString());

finalMarkdown = safeReplace(finalMarkdown, '{{IOC_TABLE_ROWS}}', tableRows);
finalMarkdown = safeReplace(finalMarkdown, '{{DETAILED_ANALYSIS_SECTION}}', detailedSection);
finalMarkdown = safeReplace(finalMarkdown, '{{NO_ANALYSIS_SECTION}}', noAnalysisSection);

return [{
    json: {
        markdown: finalMarkdown,
        case_id: caseId
    }
}];
