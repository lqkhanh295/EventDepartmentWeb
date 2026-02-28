import React, { useState, useRef } from 'react';
import {
    Button,
    Card,
    Typography,
    Box,
    Tooltip,
    Snackbar,
    Alert
} from '@mui/material';
import {
    InsertDriveFile as FileExcelIcon,
    PictureAsPdf as FilePdfIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
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



const AgendaFormatterPage = () => {
    const [fileList, setFileList] = useState([]);
    const [previewData, setPreviewData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [allData, setAllData] = useState([]); // Store full parsed data
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const fileInputRef = useRef(null);

    const showMessage = (msg, severity = 'success') => {
        setSnackbar({ open: true, message: msg, severity });
    };

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
        const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        if (!isExcel) {
            showMessage('Chỉ chấp nhận file Excel!', 'error');
            return;
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
                showMessage(`Đã tải file thành công! Nhận diện ${cols.length} cột, ${jsonData.length - headerRowIndex - 1} dòng dữ liệu.`);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    <Box>
                        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                            Agenda Formatter
                        </Typography>
                        <Typography sx={{ color: '#aaa', mt: 1 }}>
                            Tự động định dạng kịch bản từ Excel và xuất ra PDF chuẩn. Hỗ trợ không giới hạn số cột.
                        </Typography>
                    </Box>
                    <Tooltip title="Cài đặt định dạng">
                        <Button
                            variant="contained"
                            startIcon={<SettingsIcon />}
                            onClick={() => setShowSettings(!showSettings)}
                            sx={{
                                background: showSettings ? '#1890ff' : '#333',
                                color: '#fff',
                                textTransform: 'none',
                                '&:hover': { background: showSettings ? '#40a9ff' : '#444' }
                            }}
                        >
                            Cài đặt
                        </Button>
                    </Tooltip>
                </Box>

                {/* Settings Panel Component */}
                <SettingsPanel
                    showSettings={showSettings}
                    settings={settings}
                    setSettings={setSettings}
                />

                <Card
                    sx={{
                        background: '#1e1e1e',
                        border: '1px solid #333',
                        mt: 3,
                        color: '#fff',
                        borderRadius: 2,
                        p: 3
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                                background: '#2a2a2a',
                                border: '2px dashed #444',
                                borderRadius: 2,
                                p: 4,
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                '&:hover': { borderColor: '#4caf50', background: '#333' }
                            }}
                        >
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        handleUpload(e.target.files[0]);
                                    }
                                    e.target.value = null; // Reset input
                                }}
                            />
                            <FileExcelIcon sx={{ color: '#4caf50', fontSize: 64, mb: 2 }} />
                            <Typography sx={{ color: '#fff', fontSize: '1.1rem', mb: 1 }}>
                                Kéo thả hoặc click để chọn file Excel kịch bản
                            </Typography>
                            <Typography sx={{ color: '#888', fontSize: '0.9rem' }}>
                                Hỗ trợ định dạng .xlsx, .xls - Không giới hạn số cột
                            </Typography>
                        </Box>

                        {fileList.length > 0 && (
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography sx={{ color: '#4caf50', fontSize: '1rem', fontWeight: 500 }}>
                                    File đã chọn: {fileList[0].name}
                                </Typography>
                                <Typography sx={{ color: '#888', fontSize: '0.9rem', mt: 0.5 }}>
                                    {columns.length} cột • {previewData.length > 0 ? `${allData.length - 1} dòng dữ liệu` : ''}
                                </Typography>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<FilePdfIcon />}
                                size="large"
                                onClick={() => processAndDownloadPDF(fileList, settings, setIsProcessing, { success: (msg) => showMessage(msg), error: (msg) => showMessage(msg, 'error') })}
                                disabled={fileList.length === 0 || isProcessing}
                                sx={{
                                    height: 50,
                                    px: 4,
                                    fontSize: '1.1rem',
                                    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                                    color: '#000',
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    '&:hover': {
                                        background: 'linear-gradient(45deg, #FFE44D, #FFB732)',
                                    },
                                    '&.Mui-disabled': {
                                        background: '#555',
                                        color: '#888'
                                    }
                                }}
                            >
                                {isProcessing ? 'Đang xử lý...' : 'Định dạng & Tải PDF'}
                            </Button>
                        </Box>
                    </Box>
                </Card>

                {/* Preview Table Component */}
                <PreviewTable
                    previewData={previewData}
                    columns={columns}
                />
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </motion.div>
        </Box>
    );
};

export default AgendaFormatterPage;
