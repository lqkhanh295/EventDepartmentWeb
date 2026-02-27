import React, { useState } from 'react';
import { Button, Upload, Card, Typography, Space, message, Tooltip } from 'antd';
import { FileExcelOutlined, FilePdfOutlined, SettingOutlined } from '@ant-design/icons';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import '../styles/global.css';

import {
    SettingsPanel,
    PreviewTable,
    findHeaderRow,
    calculateColumnWidth,
    formatCellValue,
    processAndDownloadPDF
} from '../components/AgendaFormatter';

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
                        rowData[idx] = formatCellValue(val, headers[idx], settings.autoDetectTime);
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

                {/* Settings Panel Component */}
                <SettingsPanel
                    showSettings={showSettings}
                    settings={settings}
                    setSettings={setSettings}
                />

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
                                onClick={() => processAndDownloadPDF(fileList, settings, setIsProcessing, message)}
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

                {/* Preview Table Component */}
                <PreviewTable
                    previewData={previewData}
                    columns={columns}
                />
            </motion.div>
        </Box>
    );
};

export default AgendaFormatterPage;
