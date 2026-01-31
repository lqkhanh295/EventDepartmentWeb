import React, { useState } from 'react';
import { Button, Upload, Card, Typography, Space, message, Table, ConfigProvider } from 'antd';
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
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
    const [isProcessing, setIsProcessing] = useState(false);

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
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length > 0) {
                // Giả định dòng đầu tiên là header
                const headers = jsonData[0];
                const cols = headers.map((h, i) => ({
                    title: h,
                    dataIndex: i,
                    key: i,
                }));
                // Data cho bảng preview (giới hạn 5 dòng)
                const rows = jsonData.slice(1, 6).map((row, i) => {
                    const rowData = { key: i };
                    row.forEach((val, idx) => {
                        rowData[idx] = val;
                    });
                    return rowData;
                });

                setColumns(cols);
                setPreviewData(rows);
                setFileList([file]);
                message.success('Đã tải file thành công! Bạn có thể xem trước bên dưới.');
            }
        };
        reader.readAsArrayBuffer(file);
        return false; // Prevent auto upload
    };

    // Helper: Convert Excel time fraction to HH:mm:ss
    const formatExcelTime = (val) => {
        if (typeof val === 'number') {
            // Excel Time: fraction of day (0.041666667 ~= 1 hour)
            // Handle all positive decimal values
            if (val > 0 && val < 10) { // Likely a time value (< 10 days)
                const totalSeconds = Math.round(val * 86400); // 86400 seconds in a day
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                // If seconds is 0, show HH:mm format
                if (seconds === 0) {
                    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                }
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
        return val;
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
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData.length === 0) {
                        message.error('File rỗng!');
                        setIsProcessing(false);
                        return;
                    }

                    // 1. INTELLIGENT PARSING
                    let headerRowIndex = 0;
                    const keywords = ['stt', 'time', 'thời gian', 'nội dung', 'content', 'item', 'duration', 'thời lượng', 'chi tiết'];

                    for (let i = 0; i < Math.min(jsonData.length, 15); i++) {
                        const rowStr = (jsonData[i] || []).join(' ').toLowerCase();
                        let matchCount = 0;
                        keywords.forEach(kw => {
                            if (rowStr.includes(kw)) matchCount++;
                        });
                        if (matchCount >= 2) {
                            headerRowIndex = i;
                            break;
                        }
                    }

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

                    // 2. FILTER EMPTY COLUMNS
                    const numCols = rawHeaders.length > 0 ? rawHeaders.length : jsonData.reduce((max, r) => Math.max(max, r.length), 0);
                    const colsToKeep = [];

                    for (let col = 0; col < numCols; col++) {
                        let hasData = false;
                        for (let row = 0; row < rawBody.length; row++) {
                            const cell = rawBody[row] ? rawBody[row][col] : undefined;
                            if (cell !== undefined && cell !== '' && cell !== null) {
                                hasData = true;
                                break;
                            }
                        }
                        if (hasData || (rawHeaders[col] && rawHeaders[col].toString().trim() !== '')) {
                            colsToKeep.push(col);
                        }
                    }

                    // Reconstruct Data - also shorten long headers
                    let filteredHeaders = colsToKeep.map(i => {
                        let header = rawHeaders[i] || '';
                        const h = header.toString().toLowerCase();
                        // Shorten long headers to fit narrow columns
                        // Check various patterns for "THỜI LƯỢNG" (handle Unicode variations)
                        if (h.includes('lượng') && (h.includes('thời') || h.includes('thoi'))) return 'T.LƯỢNG';
                        if (h === 'thời lượng' || h.includes('thời lượng')) return 'T.LƯỢNG';
                        // Any header with 'lượng' that's too long
                        if (h.includes('lượng') && header.length > 8) return 'T.LƯỢNG';
                        return header;
                    });
                    let filteredBody = rawBody.map(row => {
                        if (!row) return [];
                        return colsToKeep.map(i => {
                            let val = row[i];
                            const headerText = (rawHeaders[i] || '').toString().toLowerCase();
                            // Enhanced check for Time/Level columns
                            if ((headerText.includes('time') || headerText.includes('thời') || headerText.includes('thoi') || headerText.includes('duration') || headerText.includes('lượng') || headerText.includes('luong')) && typeof val === 'number') {
                                return formatExcelTime(val);
                            }
                            // Also format any small decimal that looks like Excel time (0.0xxx)
                            if (typeof val === 'number' && val > 0 && val < 1 && val.toString().includes('.')) {
                                return formatExcelTime(val);
                            }
                            return val;
                        });
                    });

                    // 3. GENERATE PDF
                    const doc = new jsPDF({
                        orientation: 'landscape',
                        unit: 'mm',
                        format: 'a4'
                    });

                    // --- LOAD CUSTOM FONTS (Reg + Bold) ---
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
                    doc.setFontSize(16);
                    const titleLines = doc.splitTextToSize(extractedTitle, 270);
                    doc.text(titleLines, 14, 20);

                    const nextY = 20 + (titleLines.length * 8);

                    doc.setFont("Roboto", "normal");
                    doc.setFontSize(10);
                    doc.text(`Được tạo tự động vào: ${new Date().toLocaleString('vi-VN')}`, 14, nextY);

                    // ...

                    // 4. GOOGLE SHEETS STYLE - Auto-fit columns, minimal padding
                    // Only set alignment, let autoTable calculate widths automatically
                    const columnStyles = {};

                    filteredHeaders.forEach((header, index) => {
                        const h = (header || '').toString().toLowerCase();

                        // Center align these columns
                        if (['stt', 'no', '#', 'time', 'thời gian', 't.lượng'].some(k => h === k || h.includes(k))) {
                            columnStyles[index] = { halign: 'center' };
                        }
                        // Left align text-heavy columns
                        else {
                            columnStyles[index] = { halign: 'left' };
                        }
                    });

                    autoTable(doc, {
                        head: [filteredHeaders],
                        body: filteredBody,
                        startY: nextY + 5,
                        theme: 'grid',
                        styles: {
                            font: 'Roboto',
                            fontSize: 8,
                            cellPadding: 1.5,
                            valign: 'middle',
                            overflow: 'linebreak',
                            lineColor: [0, 0, 0],
                            lineWidth: 0.1,
                            textColor: [0, 0, 0]
                        },
                        headStyles: {
                            fillColor: [240, 240, 240],
                            textColor: [0, 0, 0],
                            font: 'Roboto',
                            fontStyle: 'bold',
                            fontSize: 8,
                            halign: 'center',
                            valign: 'middle',
                            lineWidth: 0.1,
                            lineColor: [0, 0, 0]
                        },
                        columnStyles: columnStyles,
                        tableWidth: 'auto', // Use full page width
                        margin: { left: 5, right: 5 },
                        didParseCell: (data) => {
                            // Custom styling per cell if needed
                        }
                    });

                    doc.save('Agenda_Formatted.pdf');
                    message.success('Đã xuất file PDF đúng chuẩn!');
                    setIsProcessing(false);
                };
                reader.readAsArrayBuffer(fileList[0]);
            } catch (error) {
                console.error(error);
                message.error('Có lỗi xảy ra khi xử lý file!');
                setIsProcessing(false);
            }
        }, 1000);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div>
                    <Title level={2} style={{ color: '#fff', margin: 0 }}>
                        Agenda Formatter
                    </Title>
                    <Paragraph style={{ color: '#aaa', fontSize: '16px' }}>
                        Tự động định dạng kịch bản từ Excel và xuất ra PDF chuẩn.
                    </Paragraph>
                </div>

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
                                Hỗ trợ định dạng .xlsx, .xls
                            </p>
                        </Dragger>

                        {fileList.length > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <Text style={{ color: '#4caf50', fontSize: 16 }}>
                                    File đã chọn: {fileList[0].name}
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
                                    background: 'linear-gradient(45deg, #FFD700, #FFA500)', // Gold/Orange gradient
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
                        title={<span style={{ color: '#fff' }}>Xem trước dữ liệu (5 dòng đầu)</span>}
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
                                    colorSplit: '#444' // border color for tables
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
                                scroll={{ x: true }}
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
