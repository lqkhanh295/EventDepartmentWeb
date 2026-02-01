import React, { useState } from 'react';
import { Button, Upload, Card, Typography, Space, message, Table, ConfigProvider, Slider, ColorPicker, Switch, Tooltip, Select } from 'antd';
import { FileExcelOutlined, FilePdfOutlined, SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/global.css';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const AgendaFormatterPage = () => {
    const [fileList, setFileList] = useState([]);
    const [previewData, setPreviewData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [allData, setAllData] = useState([]); // Store full parsed data
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({
        fontSize: 8,
        headerColor: '#f0f0f0',
        orientation: 'landscape',
        pageSize: 'a4',
        highlightSections: true,
        sectionColor: '#e6f4ff',
        autoDetectTime: true,
        cellPadding: 1.5,
        showGridLines: true
    });

    // Common keywords for intelligent header detection
    const HEADER_KEYWORDS = [
        'stt', 'no', '#', 'số thứ tự', 'order',
        'time', 'thời gian', 'giờ', 'hour', 'start', 'end', 'bắt đầu', 'kết thúc',
        'nội dung', 'content', 'item', 'activity', 'hoạt động', 'chương trình',
        'duration', 'thời lượng', 'phút', 'minute',
        'chi tiết', 'detail', 'note', 'ghi chú', 'remark',
        'pic', 'người phụ trách', 'responsible', 'in charge', 'mc', 'host',
        'script', 'kịch bản', 'lời dẫn',
        'âm thanh', 'audio', 'sound', 'music', 'nhạc',
        'ánh sáng', 'light', 'lighting',
        'hình ảnh', 'video', 'led', 'screen', 'màn hình',
        'backstage', 'hậu trường', 'stage', 'sân khấu',
        'props', 'đạo cụ', 'equipment', 'thiết bị',
        'location', 'địa điểm', 'venue', 'room', 'phòng'
    ];

    // Section header keywords (rows that should be highlighted)
    const SECTION_KEYWORDS = [
        'phần', 'part', 'section', 'session',
        'break', 'nghỉ giải lao', 'nghỉ trưa', 'lunch', 'tea break',
        'opening', 'closing', 'khai mạc', 'bế mạc',
        'ceremony', 'lễ', 'nghi thức'
    ];

    // Xử lý upload file
    const handleUpload = (file) => {
        const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel';
        if (!isExcel) {
            message.error('Chỉ chấp nhận file Excel!');
            return Upload.LIST_IGNORE;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Read data with all columns preserved
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '' // Default value for empty cells
            });

            if (jsonData.length > 0) {
                // Store full data for later processing
                setAllData(jsonData);

                // Find header row intelligently
                const headerRowIndex = findHeaderRow(jsonData);
                const headers = jsonData[headerRowIndex] || [];

                // Generate columns for preview (handle unlimited columns)
                const cols = headers.map((h, i) => ({
                    title: h || `Cột ${i + 1}`,
                    dataIndex: i,
                    key: i,
                    ellipsis: true,
                    width: calculateColumnWidth(h, jsonData.slice(headerRowIndex + 1), i)
                }));

                // Data for table preview (limit to 10 rows for performance)
                const rows = jsonData.slice(headerRowIndex + 1, headerRowIndex + 11).map((row, i) => {
                    const rowData = { key: i };
                    row.forEach((val, idx) => {
                        rowData[idx] = formatCellValue(val, headers[idx]);
                    });
                    return rowData;
                });

                setColumns(cols);
                setPreviewData(rows);
                setFileList([file]);
                message.success(`Đã tải file thành công! Nhận diện ${cols.length} cột, ${jsonData.length - headerRowIndex - 1} dòng dữ liệu.`);
            }
        };
        reader.readAsArrayBuffer(file);
        return false;
    };

    // Find header row by matching keywords
    const findHeaderRow = (data) => {
        for (let i = 0; i < Math.min(data.length, 20); i++) {
            const rowStr = (data[i] || []).join(' ').toLowerCase();
            let matchCount = 0;
            HEADER_KEYWORDS.forEach(kw => {
                if (rowStr.includes(kw)) matchCount++;
            });
            // If row has 2+ matches and reasonable column count, it's likely the header
            if (matchCount >= 2 && data[i].filter(cell => cell !== '' && cell !== null && cell !== undefined).length >= 2) {
                return i;
            }
        }
        return 0; // Default to first row
    };

    // Calculate optimal column width based on content
    const calculateColumnWidth = (header, bodyData, colIndex) => {
        const headerLen = String(header || '').length;
        let maxLen = headerLen;

        // Check first 20 rows for max content length
        bodyData.slice(0, 20).forEach(row => {
            const cellLen = String(row[colIndex] || '').length;
            maxLen = Math.max(maxLen, cellLen);
        });

        // Convert to approximate pixel width (min 60, max 300)
        return Math.min(300, Math.max(60, maxLen * 10));
    };

    // Format cell value (handle time, numbers, etc)
    const formatCellValue = (val, headerText) => {
        if (val === null || val === undefined) return '';

        const header = String(headerText || '').toLowerCase();

        // Check if this is likely a time column
        if (settings.autoDetectTime) {
            const isTimeColumn = ['time', 'thời', 'giờ', 'hour', 'duration', 'lượng', 'start', 'end', 'bắt đầu', 'kết thúc']
                .some(kw => header.includes(kw));

            if (isTimeColumn && typeof val === 'number') {
                return formatExcelTime(val);
            }

            // Also format any small decimal that looks like Excel time
            if (typeof val === 'number' && val > 0 && val < 1 && val.toString().includes('.')) {
                return formatExcelTime(val);
            }
        }

        return val;
    };

    // Convert Excel time fraction to HH:mm or HH:mm:ss
    const formatExcelTime = (val) => {
        if (typeof val === 'number' && val > 0 && val < 10) {
            const totalSeconds = Math.round(val * 86400);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            if (seconds === 0) {
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return val;
    };

    // Check if a row is a section header
    const isSectionRow = (row) => {
        if (!row || row.length === 0) return false;

        const rowText = row.join(' ').toLowerCase();
        const nonEmptyCells = row.filter(cell => cell !== '' && cell !== null && cell !== undefined);

        // Section rows typically have few filled cells and contain section keywords
        if (nonEmptyCells.length <= 2) {
            return SECTION_KEYWORDS.some(kw => rowText.includes(kw));
        }

        return false;
    };

    // Shorten long headers for PDF
    const shortenHeader = (header) => {
        if (!header) return '';
        const h = String(header).toLowerCase(); s
        const original = String(header);

        // Common abbreviations
        const abbreviations = {
            'thời lượng': 'T.LƯỢNG',
            'thời gian': 'TIME',
            'nội dung': 'NỘI DUNG',
            'người phụ trách': 'PIC',
            'chi tiết': 'CHI TIẾT',
            'ghi chú': 'GHI CHÚ',
            'âm thanh': 'ÂM THANH',
            'ánh sáng': 'ÁNH SÁNG',
            'hậu trường': 'H.TRƯỜNG'
        };

        for (const [full, short] of Object.entries(abbreviations)) {
            if (h.includes(full)) return short;
        }

        // If header is too long, truncate
        if (original.length > 15) {
            return original.substring(0, 12) + '...';
        }

        return original;
    };

    const processAndDownloadPDF = () => {
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

                    // 2. DYNAMIC COLUMN DETECTION - Only keep columns WITH HEADERS
                    const numCols = Math.max(
                        rawHeaders.length,
                        ...rawBody.map(r => (r || []).length)
                    );

                    const colsToKeep = [];

                    // Only keep columns that have a non-empty header
                    for (let col = 0; col < numCols; col++) {
                        const header = rawHeaders[col];
                        // Only include column if it has a valid header
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
                            return formatCellValue(val, headerText);
                        });
                    }).filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined));

                    // 4. SMART AUTO-CONFIGURATION based on column count
                    const numColumns = colsToKeep.length;

                    // Always use A4, only adjust font/padding/orientation
                    const effectivePageSize = 'a4'; // Always A4
                    let effectiveOrientation = settings.orientation;
                    let effectiveFontSize = settings.fontSize;
                    let effectiveCellPadding = settings.cellPadding;

                    // Auto-adjust font and padding for many columns (A4 only)
                    if (numColumns >= 12) {
                        // Very many columns: smallest font, minimal padding, landscape
                        effectiveOrientation = 'landscape';
                        effectiveFontSize = Math.min(effectiveFontSize, 5.5);
                        effectiveCellPadding = Math.min(effectiveCellPadding, 0.5);
                    } else if (numColumns >= 10) {
                        // Many columns: small font, tight padding, landscape
                        effectiveOrientation = 'landscape';
                        effectiveFontSize = Math.min(effectiveFontSize, 6);
                        effectiveCellPadding = Math.min(effectiveCellPadding, 0.7);
                    } else if (numColumns >= 8) {
                        // Medium-many columns: smaller font, landscape
                        effectiveOrientation = 'landscape';
                        effectiveFontSize = Math.min(effectiveFontSize, 6.5);
                        effectiveCellPadding = Math.min(effectiveCellPadding, 1);
                    } else if (numColumns >= 6) {
                        // Moderate columns: ensure landscape
                        effectiveOrientation = 'landscape';
                        effectiveFontSize = Math.min(effectiveFontSize, 7);
                    }

                    // Create PDF with optimized settings (always A4)
                    const doc = new jsPDF({
                        orientation: effectiveOrientation,
                        unit: 'mm',
                        format: effectivePageSize
                    });

                    // A4 dimensions
                    const pageDimensions = {
                        'a4': { portrait: { w: 210, h: 297 }, landscape: { w: 297, h: 210 } }
                    };
                    const pageDim = pageDimensions['a4'][effectiveOrientation];
                    const pageWidth = pageDim.w;
                    const margins = { left: 3, right: 3 }; // Smaller margins for more space
                    const availableWidth = pageWidth - margins.left - margins.right;

                    // Load custom fonts
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

                    // Title
                    doc.setFont("Roboto", "bold");
                    doc.setFontSize(14);
                    const titleLines = doc.splitTextToSize(extractedTitle, availableWidth - 20);
                    doc.text(titleLines, margins.left + 10, 15);

                    const nextY = 15 + (titleLines.length * 6);

                    doc.setFont("Roboto", "normal");
                    doc.setFontSize(8);
                    doc.text(`Được tạo tự động vào: ${new Date().toLocaleString('vi-VN')}`, margins.left + 10, nextY);

                    // 5. GOOGLE SHEETS STYLE - Let autoTable calculate widths automatically
                    // Only set alignment, NOT fixed widths - this ensures content fits the page
                    const columnStyles = {};

                    filteredHeaders.forEach((header, index) => {
                        const h = (header || '').toString().toLowerCase();
                        const originalHeader = (rawHeaders[colsToKeep[index]] || '').toString().toLowerCase();
                        const combinedHeader = h + ' ' + originalHeader;

                        // Determine alignment based on content type
                        const centerKeywords = ['stt', 'no', '#', 'time', 'thời gian', 't.lượng', 'giờ', 'phút', 'duration'];
                        const shouldCenter = centerKeywords.some(k => combinedHeader.includes(k));

                        columnStyles[index] = {
                            halign: shouldCenter ? 'center' : 'left',
                            valign: 'top'
                            // NO cellWidth - let autoTable calculate automatically like Google Sheets
                        };
                    });

                    // Convert hex color to RGB array
                    const hexToRgb = (hex) => {
                        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                        return result ? [
                            parseInt(result[1], 16),
                            parseInt(result[2], 16),
                            parseInt(result[3], 16)
                        ] : [240, 240, 240];
                    };

                    // Track section rows for highlighting
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
                        tableWidth: 'wrap', // Auto-fit to content like Google Sheets
                        margin: margins,
                        horizontalPageBreak: true, // Allow horizontal page breaks if needed
                        horizontalPageBreakRepeat: 0, // Repeat first column on new pages
                        didParseCell: (data) => {
                            // Highlight section rows
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

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <Title level={2} style={{ color: '#fff', margin: 0 }}>
                            Agenda Formatter
                        </Title>
                        <Paragraph style={{ color: '#aaa', fontSize: '16px' }}>
                            Tự động định dạng kịch bản từ Excel và xuất ra PDF chuẩn. Hỗ trợ không giới hạn số cột.
                        </Paragraph>
                    </div>
                    <Tooltip title="Cài đặt định dạng">
                        <Button
                            icon={<SettingOutlined />}
                            onClick={() => setShowSettings(!showSettings)}
                            style={{
                                background: showSettings ? '#1890ff' : '#333',
                                borderColor: '#555',
                                color: '#fff'
                            }}
                        >
                            Cài đặt
                        </Button>
                    </Tooltip>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card
                            style={{
                                background: '#1e1e1e',
                                borderColor: '#333',
                                marginTop: 16
                            }}
                            title={<span style={{ color: '#fff' }}><SettingOutlined /> Cài đặt định dạng PDF</span>}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                                <div>
                                    <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                                        Cỡ chữ: {settings.fontSize}pt
                                    </Text>
                                    <Slider
                                        min={6}
                                        max={14}
                                        value={settings.fontSize}
                                        onChange={(val) => setSettings({ ...settings, fontSize: val })}
                                    />
                                </div>

                                <div>
                                    <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                                        Padding ô: {settings.cellPadding}mm
                                    </Text>
                                    <Slider
                                        min={0.5}
                                        max={5}
                                        step={0.5}
                                        value={settings.cellPadding}
                                        onChange={(val) => setSettings({ ...settings, cellPadding: val })}
                                    />
                                </div>

                                <div>
                                    <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                                        Màu header
                                    </Text>
                                    <ColorPicker
                                        value={settings.headerColor}
                                        onChange={(color) => setSettings({ ...settings, headerColor: color.toHexString() })}
                                    />
                                </div>

                                <div>
                                    <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                                        Hướng giấy
                                    </Text>
                                    <Select
                                        value={settings.orientation}
                                        onChange={(val) => setSettings({ ...settings, orientation: val })}
                                        style={{ width: '100%' }}
                                        options={[
                                            { value: 'landscape', label: 'Ngang (Landscape)' },
                                            { value: 'portrait', label: 'Dọc (Portrait)' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                                        Khổ giấy
                                    </Text>
                                    <Select
                                        value={settings.pageSize}
                                        onChange={(val) => setSettings({ ...settings, pageSize: val })}
                                        style={{ width: '100%' }}
                                        options={[
                                            { value: 'a4', label: 'A4' },
                                            { value: 'a3', label: 'A3 (Lớn hơn)' },
                                            { value: 'letter', label: 'Letter' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                                        Tự động nhận diện thời gian
                                        <Tooltip title="Tự động chuyển đổi giá trị số Excel thành định dạng thời gian HH:mm">
                                            <InfoCircleOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                                        </Tooltip>
                                    </Text>
                                    <Switch
                                        checked={settings.autoDetectTime}
                                        onChange={(val) => setSettings({ ...settings, autoDetectTime: val })}
                                    />
                                </div>

                                <div>
                                    <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                                        Highlight section headers
                                        <Tooltip title="Tự động highlight các dòng như 'PHẦN I', 'BREAK TIME', etc.">
                                            <InfoCircleOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                                        </Tooltip>
                                    </Text>
                                    <Switch
                                        checked={settings.highlightSections}
                                        onChange={(val) => setSettings({ ...settings, highlightSections: val })}
                                    />
                                </div>

                                <div>
                                    <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                                        Màu section
                                    </Text>
                                    <ColorPicker
                                        value={settings.sectionColor}
                                        disabled={!settings.highlightSections}
                                        onChange={(color) => setSettings({ ...settings, sectionColor: color.toHexString() })}
                                    />
                                </div>

                                <div>
                                    <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                                        Hiển thị đường kẻ
                                    </Text>
                                    <Switch
                                        checked={settings.showGridLines}
                                        onChange={(val) => setSettings({ ...settings, showGridLines: val })}
                                    />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                <Card
                    style={{
                        background: '#1e1e1e',
                        borderColor: '#333',
                        marginTop: 24,
                        color: '#fff'
                    }}
                >
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>

                        <Dragger
                            accept=".xlsx, .xls"
                            beforeUpload={handleUpload}
                            showUploadList={false}
                            style={{
                                background: '#2a2a2a',
                                border: '1px dashed #444',
                                padding: '32px'
                            }}
                        >
                            <p className="ant-upload-drag-icon">
                                <FileExcelOutlined style={{ color: '#4caf50', fontSize: 48 }} />
                            </p>
                            <p className="ant-upload-text" style={{ color: '#fff' }}>
                                Kéo thả hoặc click để chọn file Excel kịch bản
                            </p>
                            <p className="ant-upload-hint" style={{ color: '#888' }}>
                                Hỗ trợ định dạng .xlsx, .xls - Không giới hạn số cột
                            </p>
                        </Dragger>

                        {fileList.length > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <Text style={{ color: '#4caf50', fontSize: 16 }}>
                                    File đã chọn: {fileList[0].name}
                                </Text>
                                <br />
                                <Text style={{ color: '#888', fontSize: 14 }}>
                                    {columns.length} cột • {previewData.length > 0 ? `${allData.length - 1} dòng dữ liệu` : ''}
                                </Text>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                            <Button
                                type="primary"
                                icon={<FilePdfOutlined />}
                                size="large"
                                onClick={processAndDownloadPDF}
                                loading={isProcessing}
                                disabled={fileList.length === 0}
                                style={{
                                    height: 50,
                                    paddingLeft: 32,
                                    paddingRight: 32,
                                    fontSize: 18,
                                    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    color: '#000'
                                }}
                            >
                                {isProcessing ? 'Đang xử lý...' : 'Định dạng & Tải PDF'}
                            </Button>
                        </div>

                    </Space>
                </Card>

                {previewData.length > 0 && (
                    <Card
                        title={
                            <span style={{ color: '#fff' }}>
                                Xem trước dữ liệu ({Math.min(10, previewData.length)} dòng đầu • {columns.length} cột)
                            </span>
                        }
                        style={{
                            background: '#1e1e1e',
                            borderColor: '#333',
                            marginTop: 24
                        }}
                    >
                        <ConfigProvider
                            theme={{
                                token: {
                                    colorText: '#fff',
                                    colorBgContainer: '#2a2a2a',
                                    colorBorderSecondary: '#444',
                                    colorSplit: '#444'
                                },
                                components: {
                                    Table: {
                                        headerBg: '#333',
                                        headerColor: '#fff',
                                        rowHoverBg: '#3a3a3a'
                                    }
                                }
                            }}
                        >
                            <Table
                                dataSource={previewData}
                                columns={columns}
                                pagination={false}
                                scroll={{ x: 'max-content' }}
                                size="small"
                                bordered
                            />
                        </ConfigProvider>
                    </Card>
                )}

            </motion.div>
        </Box>
    );
};

export default AgendaFormatterPage;
