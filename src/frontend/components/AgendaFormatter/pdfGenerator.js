import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { findHeaderRow, formatCellValue, isSectionRow, shortenHeader } from './agendaUtils';

export const processAndDownloadPDF = (fileList, settings, setIsProcessing, message) => {
    if (fileList.length === 0) {
        message.warning('Vui lòng chọn file Excel trước!');
        return;
    }

    setIsProcessing(true);
    setTimeout(() => {
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: ''
                });

                if (jsonData.length === 0) {
                    message.error('File rỗng!');
                    setIsProcessing(false);
                    return;
                }

                // 1. INTELLIGENT PARSING
                const headerRowIndex = findHeaderRow(jsonData);

                // Extract Title from rows ABOVE header
                let extractedTitle = "KỊCH BẢN CHƯƠNG TRÌNH";
                let extractedSubtitle = [];
                for (let i = 0; i < headerRowIndex; i++) {
                    const row = jsonData[i] || [];
                    const rowText = row.join(' ').trim();
                    if (rowText.length > 5) {
                        extractedSubtitle.push(rowText);
                    }
                }
                if (extractedSubtitle.length > 0) {
                    extractedTitle = extractedSubtitle.join('\n');
                }

                const rawHeaders = jsonData[headerRowIndex] || [];
                const rawBody = jsonData.slice(headerRowIndex + 1);

                // 2. DYNAMIC COLUMN DETECTION
                const numCols = Math.max(
                    rawHeaders.length,
                    ...rawBody.map(r => (r || []).length)
                );

                const colsToKeep = [];
                for (let col = 0; col < numCols; col++) {
                    const header = rawHeaders[col];
                    if (header !== undefined && header !== null && String(header).trim() !== '') {
                        colsToKeep.push(col);
                    }
                }

                // 3. Build filtered headers and body
                const filteredHeaders = colsToKeep.map(i => shortenHeader(rawHeaders[i]));

                const filteredBody = rawBody.map(row => {
                    if (!row) return colsToKeep.map(() => '');
                    return colsToKeep.map(i => {
                        let val = row[i];
                        const headerText = rawHeaders[i] || '';
                        return formatCellValue(val, headerText, settings.autoDetectTime);
                    });
                }).filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined));

                // 4. SMART AUTO-CONFIGURATION
                const numColumns = colsToKeep.length;
                const effectivePageSize = 'a4';
                let effectiveOrientation = settings.orientation;
                let effectiveFontSize = settings.fontSize;
                let effectiveCellPadding = settings.cellPadding;

                if (numColumns >= 12) {
                    effectiveOrientation = 'landscape';
                    effectiveFontSize = Math.min(effectiveFontSize, 5.5);
                    effectiveCellPadding = Math.min(effectiveCellPadding, 0.5);
                } else if (numColumns >= 10) {
                    effectiveOrientation = 'landscape';
                    effectiveFontSize = Math.min(effectiveFontSize, 6);
                    effectiveCellPadding = Math.min(effectiveCellPadding, 0.7);
                } else if (numColumns >= 8) {
                    effectiveOrientation = 'landscape';
                    effectiveFontSize = Math.min(effectiveFontSize, 6.5);
                    effectiveCellPadding = Math.min(effectiveCellPadding, 1);
                } else if (numColumns >= 6) {
                    effectiveOrientation = 'landscape';
                    effectiveFontSize = Math.min(effectiveFontSize, 7);
                }

                const doc = new jsPDF({
                    orientation: effectiveOrientation,
                    unit: 'mm',
                    format: effectivePageSize
                });

                const pageDimensions = {
                    'a4': { portrait: { w: 210, h: 297 }, landscape: { w: 297, h: 210 } }
                };
                const pageDim = pageDimensions['a4'][effectiveOrientation];
                const pageWidth = pageDim.w;
                const margins = { left: 3, right: 3 };
                const availableWidth = pageWidth - margins.left - margins.right;

                try {
                    const fontBaseUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/';

                    const addFont = async (fileName, fontName, style) => {
                        const response = await fetch(fontBaseUrl + fileName);
                        if (!response.ok) throw new Error("Font fetch failed");
                        const buffer = await response.arrayBuffer();
                        const bytes = new Uint8Array(buffer);
                        let binary = '';
                        for (let i = 0; i < bytes.byteLength; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        const base64 = window.btoa(binary);
                        doc.addFileToVFS(fileName, base64);
                        doc.addFont(fileName, fontName, style);
                    };

                    await Promise.all([
                        addFont('Roboto-Regular.ttf', 'Roboto', 'normal'),
                        addFont('Roboto-Medium.ttf', 'Roboto', 'bold')
                    ]);

                    doc.setFont("Roboto", "normal");
                } catch (fontErr) {
                    console.error("Font loading error:", fontErr);
                    message.warning("Không tải được trọn bộ font, có thể lỗi hiển thị đậm/nhạt.");
                }

                doc.setFont("Roboto", "bold");
                doc.setFontSize(14);
                const titleLines = doc.splitTextToSize(extractedTitle, availableWidth - 20);
                doc.text(titleLines, margins.left + 10, 15);

                const nextY = 15 + (titleLines.length * 6);

                doc.setFont("Roboto", "normal");
                doc.setFontSize(8);
                doc.text(`Được tạo tự động vào: ${new Date().toLocaleString('vi-VN')}`, margins.left + 10, nextY);

                const columnStyles = {};
                filteredHeaders.forEach((header, index) => {
                    const h = (header || '').toString().toLowerCase();
                    const originalHeader = (rawHeaders[colsToKeep[index]] || '').toString().toLowerCase();
                    const combinedHeader = h + ' ' + originalHeader;
                    const centerKeywords = ['stt', 'no', '#', 'time', 'thời gian', 't.lượng', 'giờ', 'phút', 'duration'];
                    const shouldCenter = centerKeywords.some(k => combinedHeader.includes(k));

                    columnStyles[index] = {
                        halign: shouldCenter ? 'center' : 'left',
                        valign: 'top'
                    };
                });

                const hexToRgb = (hex) => {
                    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? [
                        parseInt(result[1], 16),
                        parseInt(result[2], 16),
                        parseInt(result[3], 16)
                    ] : [240, 240, 240];
                };

                const sectionRowIndices = new Set();
                if (settings.highlightSections) {
                    filteredBody.forEach((row, idx) => {
                        const originalRow = rawBody[idx];
                        if (isSectionRow(originalRow)) {
                            sectionRowIndices.add(idx);
                        }
                    });
                }

                autoTable(doc, {
                    head: [filteredHeaders],
                    body: filteredBody,
                    startY: nextY + 4,
                    theme: settings.showGridLines ? 'grid' : 'plain',
                    styles: {
                        font: 'Roboto',
                        fontSize: effectiveFontSize,
                        cellPadding: effectiveCellPadding,
                        valign: 'top',
                        overflow: 'linebreak',
                        lineColor: [0, 0, 0],
                        lineWidth: settings.showGridLines ? 0.1 : 0,
                        textColor: [0, 0, 0],
                        minCellHeight: 4
                    },
                    headStyles: {
                        fillColor: hexToRgb(settings.headerColor),
                        textColor: [0, 0, 0],
                        font: 'Roboto',
                        fontStyle: 'bold',
                        fontSize: effectiveFontSize,
                        halign: 'center',
                        valign: 'middle',
                        lineWidth: 0.1,
                        lineColor: [0, 0, 0],
                        minCellHeight: 6
                    },
                    columnStyles: columnStyles,
                    tableWidth: 'wrap',
                    margin: margins,
                    horizontalPageBreak: true,
                    horizontalPageBreakRepeat: 0,
                    didParseCell: (data) => {
                        if (data.section === 'body' && sectionRowIndices.has(data.row.index)) {
                            data.cell.styles.fillColor = hexToRgb(settings.sectionColor);
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                });

                doc.save('Agenda_Formatted.pdf');
                message.success(`Đã xuất PDF với ${colsToKeep.length} cột, ${filteredBody.length} dòng!`);
                setIsProcessing(false);
            };
            reader.readAsArrayBuffer(fileList[0]);
        } catch (error) {
            console.error(error);
            message.error('Có lỗi xảy ra khi xử lý file!');
            setIsProcessing(false);
        }
    }, 500);
};
