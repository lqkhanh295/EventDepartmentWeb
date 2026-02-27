export const HEADER_KEYWORDS = [
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

export const SECTION_KEYWORDS = [
    'phần', 'part', 'section', 'session',
    'break', 'nghỉ giải lao', 'nghỉ trưa', 'lunch', 'tea break',
    'opening', 'closing', 'khai mạc', 'bế mạc',
    'ceremony', 'lễ', 'nghi thức'
];

export const findHeaderRow = (data) => {
    for (let i = 0; i < Math.min(data.length, 20); i++) {
        const rowStr = (data[i] || []).join(' ').toLowerCase();
        let matchCount = 0;
        HEADER_KEYWORDS.forEach(kw => {
            if (rowStr.includes(kw)) matchCount++;
        });
        if (matchCount >= 2 && data[i].filter(cell => cell !== '' && cell !== null && cell !== undefined).length >= 2) {
            return i;
        }
    }
    return 0;
};

export const calculateColumnWidth = (header, bodyData, colIndex) => {
    const headerLen = String(header || '').length;
    let maxLen = headerLen;
    bodyData.slice(0, 20).forEach(row => {
        const cellLen = String(row[colIndex] || '').length;
        maxLen = Math.max(maxLen, cellLen);
    });
    return Math.min(300, Math.max(60, maxLen * 10));
};

export const formatExcelTime = (val) => {
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

export const formatCellValue = (val, headerText, autoDetectTime) => {
    if (val === null || val === undefined) return '';
    const header = String(headerText || '').toLowerCase();
    if (autoDetectTime) {
        const isTimeColumn = ['time', 'thời', 'giờ', 'hour', 'duration', 'lượng', 'start', 'end', 'bắt đầu', 'kết thúc']
            .some(kw => header.includes(kw));
        if (isTimeColumn && typeof val === 'number') {
            return formatExcelTime(val);
        }
        if (typeof val === 'number' && val > 0 && val < 1 && val.toString().includes('.')) {
            return formatExcelTime(val);
        }
    }
    return val;
};

export const isSectionRow = (row) => {
    if (!row || row.length === 0) return false;
    const rowText = row.join(' ').toLowerCase();
    const nonEmptyCells = row.filter(cell => cell !== '' && cell !== null && cell !== undefined);
    if (nonEmptyCells.length <= 2) {
        return SECTION_KEYWORDS.some(kw => rowText.includes(kw));
    }
    return false;
};

export const shortenHeader = (header) => {
    if (!header) return '';
    const h = String(header).toLowerCase();
    const original = String(header);
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
    if (original.length > 15) {
        return original.substring(0, 12) + '...';
    }
    return original;
};
