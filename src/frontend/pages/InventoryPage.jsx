// Inventory Page: display remaining items in event storage
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Snackbar,
  Alert,
  TablePagination,
  Tooltip,
  LinearProgress,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { PageHeader } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import InventoryIcon from '@mui/icons-material/Inventory2';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InfoIcon from '@mui/icons-material/Info';
import * as XLSX from 'xlsx';
import { listInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, bulkImport } from '../../backend/services/inventoryService';

// Expected CSV headers: Type,Item,Current Quantity,Total Quantity,Unit,Unit Price,P.I.C,Note
// Minimal CSV parser (no quoted commas support). Recommend exporting simple CSV from sheet.
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (cols[i] || '').trim(); });
    return obj;
  });
  return { headers, rows };
}

// const DEFAULT_HEADERS = ['Type','Item','Current Quantity','Total Quantity','Unit','Unit Price','P.I.C','Note'];

const InventoryPage = () => {
  const { isAdmin } = useAuth();
  const [fileName, setFileName] = useState('');
  const [rawRows, setRawRows] = useState([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [draftRow, setDraftRow] = useState(null);
  const totalLoaded = rawRows.length;
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  // const [serverRows, setServerRows] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Load data from Firebase on mount and when showAll changes
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const items = await listInventory({ onlyRemaining: !showAll });
        // setServerRows(items); // Removed unused state
        // Always load from Firebase, don't wait for file upload
          const mapped = items.map(i => ({
            Type: i.type || '',
            Item: i.item || '',
            'Current Quantity': String(i.currentQty ?? ''),
            'Total Quantity': String(i.totalQty ?? ''),
            Unit: i.unit || '',
            'Unit Price': String(i.unitPrice ?? ''),
            'P.I.C': i.pic || '',
            Note: i.note || '',
            _id: i.id
          }));
          setRawRows(mapped);
      } catch (error) {
        console.error('Error loading inventory:', error);
        // If collection doesn't exist yet, it's okay - it will be created on first add
        if (error.code !== 'permission-denied') {
          setSnackbar({ open: true, message: 'Lỗi khi tải dữ liệu từ kho', severity: 'error' });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showAll]);

  const remainingRows = useMemo(() => {
    return rawRows.filter(r => {
      // Accept multiple header variants for quantities
      const qtyStr = String(
        r['Current Quantity'] ?? r['Current Qty'] ?? r['Qty Current'] ?? r['Qty'] ?? r['Số lượng tồn'] ?? '0'
      );
      const qty = Number(qtyStr.replace(/[^\d.-]/g, ''));
      if (!showAll && (isNaN(qty) || qty <= 0)) return false;
      if (query) {
        const q = query.toLowerCase();
        const name = String(r['Item'] ?? r['Tên vật phẩm'] ?? '').toLowerCase();
        if (!name.includes(q)) return false;
      }
      if (typeFilter) {
        const t = String(r['Type'] ?? r['Loại'] ?? '').toLowerCase();
        if (t !== typeFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [rawRows, query, typeFilter, showAll]);

  // Pagination
  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return remainingRows.slice(start, start + rowsPerPage);
  }, [remainingRows, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const types = useMemo(() => {
    const s = new Set();
    rawRows.forEach(r => {
      const val = r['Type'] ?? r['Loại'];
      if (val) s.add(val);
    });
    return Array.from(s);
  }, [rawRows]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!isAdmin) {
      setSnackbar({ open: true, message: 'Chỉ admin mới có quyền import file', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
    setFileName(file.name);
      const isExcel = /\.(xlsx|xls)$/i.test(file.name);
      
    if (isExcel) {
      const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array', cellDates: false });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
        
        // Read as raw array first to see actual structure
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
        console.log('=== DEBUG: File Structure ===');
        console.log('Total rows:', rawData.length);
        console.log('First 10 rows:', rawData.slice(0, 10));
        
        // Find header row - check first 15 rows (skip title rows)
        let headerRowIndex = -1;
        let headerRow = null;
        let headerMap = {};
        
        // Expected header patterns
        const headerPatterns = {
          type: ['type', 'loại'],
          item: ['item', 'tên', 'vật phẩm'],
          currentQty: ['current quantity', 'current qty', 'qty', 'số lượng tồn'],
          totalQty: ['total quantity', 'total qty', 'tổng số lượng', 'total'],
          unit: ['unit', 'đơn vị'],
          unitPrice: ['unit price', 'unitprice', 'giá đơn vị'],
          pic: ['p.i.c', 'pic', 'phụ trách'],
          note: ['note', 'ghi chú']
        };
        
        for (let i = 0; i < Math.min(15, rawData.length); i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;
          
          // Convert row to lowercase strings for matching
          const rowValues = row.map(c => String(c || '').trim().toLowerCase());
          
          // Check if this row has distinct columns matching our expected headers
          // A valid header row should have "Item" in one column and "Type" or "Quantity" in another
          let foundItemCol = -1;
          let foundTypeCol = -1;
          let foundQtyCol = -1;
          
          rowValues.forEach((cell, idx) => {
            const cellLower = cell.toLowerCase().trim();
            // Check for Item column (must be distinct)
            if ((cellLower.includes('item') || cellLower === 'tên vật phẩm') && foundItemCol === -1) {
              foundItemCol = idx;
            }
            // Check for Type column
            if (cellLower.includes('type') || cellLower.includes('loại')) {
              foundTypeCol = idx;
            }
            // Check for Quantity column
            if (cellLower.includes('quantity') || cellLower.includes('qty') || cellLower.includes('số lượng')) {
              foundQtyCol = idx;
            }
          });
          
          // Valid header row: must have Item column AND (Type OR Quantity column) AND they must be in different columns
          if (foundItemCol >= 0 && (foundTypeCol >= 0 || foundQtyCol >= 0) && 
              foundItemCol !== foundTypeCol && foundItemCol !== foundQtyCol) {
            headerRowIndex = i;
            headerRow = row.map(c => String(c || '').trim());
            
            // Map column indices properly
            const currentHeaderMap = { ...headerMap };
            for (let idx = 0; idx < headerRow.length; idx++) {
              const header = headerRow[idx];
              const h = String(header).toLowerCase().trim();
              
              // Check each pattern
              if (headerPatterns.type.some(p => h.includes(p) || h === p)) currentHeaderMap.type = idx;
              if (headerPatterns.item.some(p => h.includes(p) || h === p)) currentHeaderMap.item = idx;
              if (headerPatterns.currentQty.some(p => h.includes(p) || h === p)) currentHeaderMap.currentQty = idx;
              if (headerPatterns.totalQty.some(p => h.includes(p) || h === p)) currentHeaderMap.totalQty = idx;
              if (headerPatterns.unit.some(p => h.includes(p) || h === p)) currentHeaderMap.unit = idx;
              if (headerPatterns.unitPrice.some(p => h.includes(p) || h === p)) currentHeaderMap.unitPrice = idx;
              if (headerPatterns.pic.some(p => h.includes(p) || h === p)) currentHeaderMap.pic = idx;
              if (headerPatterns.note.some(p => h.includes(p) || h === p)) currentHeaderMap.note = idx;
            }
            Object.assign(headerMap, currentHeaderMap);
            
            console.log('Found header row at index:', i);
            console.log('Header row:', headerRow);
            console.log('Header map:', headerMap);
            
            // Verify we found the Item column
            if (headerMap.item === undefined) {
              console.warn('Item column not found in header map, continuing search...');
              headerMap = {};
              headerRowIndex = -1;
              headerRow = null;
              continue;
            }
            
            break;
          }
        }
        
        if (headerRowIndex < 0 || !headerMap.item) {
          // Try reading with default headers
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
          console.log('Trying default header reading...');
          console.log('First row keys:', rows.length > 0 ? Object.keys(rows[0]) : 'No rows');
          console.log('First row sample:', rows.length > 0 ? rows[0] : 'No rows');
          
          if (rows.length > 0) {
            const normalizeKey = (obj, possibleKeys) => {
              const objKeys = Object.keys(obj);
              for (const key of possibleKeys) {
                if (obj[key] !== undefined) return obj[key];
                const found = objKeys.find(k => k.toLowerCase().trim() === key.toLowerCase().trim());
                if (found) return obj[found];
              }
              return '';
            };
            
            const normalized = rows.map(r => {
              const item = normalizeKey(r, ['Item', 'item', 'Tên vật phẩm', 'Tên Vật Phẩm', 'ITEM']);
              if (!item || String(item).trim() === '') return null;
              
              return {
                Type: normalizeKey(r, ['Type', 'type', 'Loại', 'TYPE']),
                Item: item,
                'Current Quantity': normalizeKey(r, ['Current Quantity', 'Current Qty', 'Qty', 'Số lượng tồn']),
                'Total Quantity': normalizeKey(r, ['Total Quantity', 'Total Qty', 'Tổng số lượng', 'Total']),
                Unit: normalizeKey(r, ['Unit', 'unit', 'Đơn vị']),
                'Unit Price': normalizeKey(r, ['Unit Price', 'unit price', 'UnitPrice', 'Giá đơn vị']),
                'P.I.C': normalizeKey(r, ['P.I.C', 'PIC', 'pic', 'Phụ trách']),
                Note: normalizeKey(r, ['Note', 'note', 'Ghi chú'])
              };
            }).filter(r => r !== null && r.Item && r.Item.trim() !== '');
            
            if (normalized.length > 0) {
              setRawRows(normalized);
              setSnackbar({ open: true, message: `Đã tải ${normalized.length} vật phẩm từ file. Nhấn "Lưu toàn bộ lên kho" để lưu vào Firebase.`, severity: 'info' });
              setLoading(false);
              e.target.value = '';
              return;
            }
          }
          
          setSnackbar({ 
            open: true, 
            message: `Không tìm thấy cột "Item" trong file. Vui lòng mở Console (F12) để xem chi tiết cấu trúc file.`, 
            severity: 'error' 
          });
          setLoading(false);
          e.target.value = '';
          return;
        }
        
        // Parse data using header map
        const normalized = rawData.slice(headerRowIndex + 1).map((row, idx) => {
          const item = headerMap.item !== undefined ? String(row[headerMap.item] || '').trim() : '';
          if (!item) return null;
          
          return {
            Type: headerMap.type !== undefined ? String(row[headerMap.type] || '').trim() : '',
            Item: item,
            'Current Quantity': headerMap.currentQty !== undefined ? String(row[headerMap.currentQty] || '') : '',
            'Total Quantity': headerMap.totalQty !== undefined ? String(row[headerMap.totalQty] || '') : '',
            Unit: headerMap.unit !== undefined ? String(row[headerMap.unit] || '').trim() : '',
            'Unit Price': headerMap.unitPrice !== undefined ? String(row[headerMap.unitPrice] || '') : '',
            'P.I.C': headerMap.pic !== undefined ? String(row[headerMap.pic] || '').trim() : '',
            Note: headerMap.note !== undefined ? String(row[headerMap.note] || '').trim() : ''
          };
        }).filter(r => r !== null && r.Item && r.Item.trim() !== '');
        
        if (normalized.length > 0) {
      setRawRows(normalized);
          setSnackbar({ open: true, message: `Đã tải ${normalized.length} vật phẩm từ file (header ở dòng ${headerRowIndex + 1}). Nhấn "Lưu toàn bộ lên kho" để lưu vào Firebase.`, severity: 'info' });
        } else {
          setSnackbar({ 
            open: true, 
            message: `Tìm thấy header nhưng không có dữ liệu hợp lệ. Vui lòng kiểm tra file hoặc mở Console (F12) để xem chi tiết.`, 
            severity: 'warning' 
          });
        }
    } else {
      const text = await file.text();
      const { rows } = parseCSV(text);
        const filtered = rows.filter(r => r.Item && r.Item.trim() !== '');
        setRawRows(filtered);
        setSnackbar({ open: true, message: `Đã tải ${filtered.length} vật phẩm từ file CSV. Nhấn "Lưu toàn bộ lên kho" để lưu vào Firebase.`, severity: 'info' });
      }
    } catch (error) {
      console.error('Error reading file:', error);
      setSnackbar({ open: true, message: 'Lỗi khi đọc file. Vui lòng kiểm tra định dạng file.', severity: 'error' });
    } finally {
      setLoading(false);
    }
    
    // Reset file input
    e.target.value = '';
  };

  const clearData = () => {
    setFileName('');
    setRawRows([]);
    setQuery('');
    setTypeFilter('');
  };

  // Admin-only CRUD helpers (local state only)
  const startEdit = (idx) => {
    // idx is the index in remainingRows (not paginated)
    setEditingIndex(idx);
    setDraftRow({ ...remainingRows[idx] });
  };

  const saveEdit = async () => {
    if (editingIndex == null || !draftRow) return;
    if (!isAdmin) {
      setSnackbar({ open: true, message: 'Chỉ admin mới có quyền chỉnh sửa', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      // Map remainingRows index to rawRows index by matching Item+Type or _id
    const target = draftRow;
      const i = rawRows.findIndex(r => 
        (r._id && target._id && r._id === target._id) || 
        (r['Item'] === target['Item'] && r['Type'] === target['Type'])
      );
      
    if (i >= 0) {
      const next = [...rawRows];
      next[i] = { ...next[i], ...target };
      setRawRows(next);
        
      // Push to Firestore if document id exists, else create
      const id = next[i]._id;
      const payload = {
          type: next[i]['Type'],
          item: next[i]['Item'],
          currentQty: parseFloat(next[i]['Current Quantity']) || 0,
          totalQty: parseFloat(next[i]['Total Quantity']) || 0,
          unit: next[i]['Unit'],
          unitPrice: next[i]['Unit Price'] ? parseFloat(next[i]['Unit Price']) : undefined,
          pic: next[i]['P.I.C'],
          note: next[i]['Note']
        };
        
        if (id) {
          await updateInventoryItem(id, payload);
          setSnackbar({ open: true, message: 'Đã cập nhật vật phẩm thành công', severity: 'success' });
        } else {
          const created = await addInventoryItem(payload);
          next[i]._id = created.id;
          setRawRows(next);
          setSnackbar({ open: true, message: 'Đã thêm vật phẩm mới thành công', severity: 'success' });
        }
      }
    } catch (error) {
      console.error('Error saving item:', error);
      setSnackbar({ open: true, message: 'Lỗi khi lưu vật phẩm', severity: 'error' });
    } finally {
      setLoading(false);
    setEditingIndex(null);
    setDraftRow(null);
    }
  };

  const removeRow = async (idx) => {
    if (!isAdmin) {
      setSnackbar({ open: true, message: 'Chỉ admin mới có quyền xóa', severity: 'error' });
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa vật phẩm này?')) {
      return;
    }

    setLoading(true);
    try {
    const target = remainingRows[idx];
      const i = rawRows.findIndex(r => 
        (r._id && target._id && r._id === target._id) || 
        (r['Item'] === target['Item'] && r['Type'] === target['Type'])
      );
      
    if (i >= 0) {
      const next = [...rawRows];
      const id = next[i]._id;
      next.splice(i, 1);
      setRawRows(next);
        
        if (id) {
        await deleteInventoryItem(id);
          setSnackbar({ open: true, message: 'Đã xóa vật phẩm thành công', severity: 'success' });
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      setSnackbar({ open: true, message: 'Lỗi khi xóa vật phẩm', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const addRow = () => {
    if (!isAdmin) {
      setSnackbar({ open: true, message: 'Chỉ admin mới có quyền thêm vật phẩm', severity: 'error' });
      return;
    }

    const empty = {
      Type: 'Decor',
      Item: 'Vật phẩm mới',
      'Current Quantity': '1',
      'Total Quantity': '1',
      Unit: 'Cái',
      'Unit Price': '',
      'P.I.C': '',
      Note: ''
    };
    setRawRows(prev => [empty, ...prev]);
    setEditingIndex(0);
    setDraftRow(empty);
  };

  const importToServer = async () => {
    if (!isAdmin) {
      setSnackbar({ open: true, message: 'Chỉ admin mới có quyền import', severity: 'error' });
      return;
    }

    if (rawRows.length === 0) {
      setSnackbar({ open: true, message: 'Không có dữ liệu để import', severity: 'warning' });
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn import ${rawRows.length} vật phẩm vào kho? Dữ liệu cũ sẽ được thay thế.`)) {
      return;
    }

    setLoading(true);
    try {
      console.log('Starting import of', rawRows.length, 'items...');
      const count = await bulkImport(rawRows);
      setSnackbar({ open: true, message: `Đã import thành công ${count} vật phẩm vào Firebase`, severity: 'success' });
      
      // Reload from server
      console.log('Reloading data from Firebase...');
      const items = await listInventory({ onlyRemaining: !showAll });
      console.log('Loaded', items.length, 'items from Firebase');
      const mapped = items.map(i => ({
        Type: i.type || '',
        Item: i.item || '',
        'Current Quantity': String(i.currentQty ?? ''),
        'Total Quantity': String(i.totalQty ?? ''),
        Unit: i.unit || '',
        'Unit Price': String(i.unitPrice ?? ''),
        'P.I.C': i.pic || '',
        Note: i.note || '',
        _id: i.id
      }));
      setRawRows(mapped);
      setFileName('');
    } catch (error) {
      console.error('Error importing to server:', error);
      const errorMessage = error.message || 'Lỗi khi import dữ liệu vào Firebase';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Kho vật phẩm"
        subtitle={isAdmin ? "Quản lý kho vật phẩm - Import XLSX, thêm, sửa, xóa" : "Xem danh sách vật phẩm trong kho"}
      />
      
      {loading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress 
            sx={{ 
              height: 4, 
              borderRadius: 2,
              background: '#333',
              '& .MuiLinearProgress-bar': { background: '#FFD700' }
            }} 
          />
          <Typography variant="caption" sx={{ color: '#888', mt: 0.5, display: 'block', textAlign: 'center' }}>
            Đang xử lý...
            </Typography>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Filter & Search Section - Top */}
      <Card sx={{ background: '#1e1e1e', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 2, mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 200 }}>
              <FilterListIcon sx={{ color: '#FFD700', fontSize: 20 }} />
              <TextField
                size="small"
                placeholder="Tìm theo tên vật phẩm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{ 
                  startAdornment: <SearchIcon sx={{ color: '#888', mr: 1 }} />,
                  sx: { color: '#eee' }
                }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    background: '#252525',
                    '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                    '&:hover fieldset': { borderColor: '#FFD700' },
                    '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                  }
                }}
              />
            </Box>
            
            <TextField
              size="small"
              placeholder="Lọc theo Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={{
                minWidth: 180,
                '& .MuiOutlinedInput-root': {
                  background: '#252525',
                  '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                  '&:hover fieldset': { borderColor: '#FFD700' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                }
              }}
            />
            
            <Button 
              size="small" 
              variant="outlined"
              onClick={() => setShowAll(v => !v)} 
              sx={{ 
                borderColor: 'rgba(255,215,0,0.3)',
                color: '#FFD700',
                '&:hover': { borderColor: '#FFD700', background: 'rgba(255,215,0,0.05)' }
              }}
            >
              {showAll ? 'Chỉ còn lại' : 'Tất cả'}
            </Button>
            
            {isAdmin && (
              <>
                <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,215,0,0.2)', mx: 1 }} />
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip 
                    label={`Tổng: ${totalLoaded}`} 
                    size="small" 
                    sx={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)' }} 
                  />
                  <Chip 
                    label={`Hiển thị: ${remainingRows.length}`} 
                    size="small" 
                    sx={{ background: 'rgba(76,175,80,0.1)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)' }} 
                  />
                </Box>
              </>
            )}
          </Box>
          
          {!!types.length && (
            <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#888', mr: 0.5 }}>Types:</Typography>
              {types.map((type, idx) => (
                <Chip
                  key={idx}
                  label={type}
                  size="small"
                  onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
                  sx={{
                    background: typeFilter === type ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.05)',
                    color: typeFilter === type ? '#FFD700' : '#888',
                    border: '1px solid rgba(255,215,0,0.2)',
                    cursor: 'pointer',
                    '&:hover': { background: 'rgba(255,215,0,0.15)' }
                  }}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Admin Actions Section */}
      {isAdmin && (
        <Card sx={{ background: '#1e1e1e', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 2, mb: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <InventoryIcon sx={{ color: '#FFD700', fontSize: 24 }} />
              <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 600 }}>
                Quản lý kho
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Typography variant="subtitle2" sx={{ color: '#888', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <InfoIcon sx={{ fontSize: 16 }} />
                  Import file XLSX/CSV
                </Typography>
                <Box sx={{ mb: 2 }}>
                      <input 
                        type="file" 
                        accept=".csv,.xlsx,.xls" 
                        id="inventory-upload" 
                        style={{ display: 'none' }} 
                        onChange={handleFileUpload}
                        disabled={loading}
                      />
                  <label htmlFor="inventory-upload">
                        <Button 
                          component="span" 
                          fullWidth 
                          variant="outlined" 
                          startIcon={<UploadFileIcon />} 
                          disabled={loading}
                          sx={{ 
                            borderColor: 'rgba(255,215,0,0.3)', 
                            color: '#FFD700', 
                            py: 1.5, 
                            justifyContent: 'flex-start',
                            textTransform: 'none',
                            '&:hover': { borderColor: '#FFD700', background: 'rgba(255,215,0,0.05)' } 
                          }}
                        >
                          {fileName || 'Chọn file XLSX/CSV'}
                    </Button>
                  </label>
                  {fileName && (
                        <Tooltip title="Xóa file đã chọn">
                          <IconButton 
                            size="small" 
                            onClick={clearData} 
                            disabled={loading}
                            sx={{ color: '#f44336', ml: 1, mt: 1 }} 
                          >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                        </Tooltip>
                  )}
                </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button 
                        variant="contained" 
                        onClick={addRow} 
                        startIcon={<AddIcon />} 
                        disabled={loading}
                        sx={{ 
                          background: '#FFD700', 
                          color: '#1a1a1a', 
                          fontWeight: 600,
                          textTransform: 'none',
                          '&:hover': { background: '#FFE44D' } 
                        }}
                      >
                        Thêm mới
                      </Button>
                      {fileName && (
                        <Button 
                          variant="contained" 
                          onClick={importToServer} 
                          disabled={loading}
                          startIcon={<CloudUploadIcon />}
                          sx={{ 
                            background: '#4CAF50', 
                            color: '#fff', 
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': { background: '#45a049' },
                            '&.Mui-disabled': { background: '#333', color: '#666' }
                          }}
                        >
                          Lưu lên Firebase
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

      {/* Main Table - Full Width */}
      <Card sx={{ background: '#1e1e1e', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 600, mb: 3 }}>
            Danh sách vật phẩm
          </Typography>
              
              <TableContainer 
                sx={{ 
                  maxHeight: 'calc(100vh - 400px)',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px'
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#1a1a1a'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#444',
                    borderRadius: '2px',
                    '&:hover': {
                      background: '#555'
                    }
                  }
                }}
              >
                <Table stickyHeader size="small" sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                      <TableCell sx={{ background: '#1e1e1e', color: '#FFD700', fontWeight: 600, borderBottom: '2px solid rgba(255,215,0,0.3)' }}>Type</TableCell>
                      <TableCell sx={{ background: '#1e1e1e', color: '#FFD700', fontWeight: 600, borderBottom: '2px solid rgba(255,215,0,0.3)' }}>Item</TableCell>
                      <TableCell align="right" sx={{ background: '#1e1e1e', color: '#FFD700', fontWeight: 600, borderBottom: '2px solid rgba(255,215,0,0.3)' }}>Current Qty</TableCell>
                      <TableCell align="right" sx={{ background: '#1e1e1e', color: '#FFD700', fontWeight: 600, borderBottom: '2px solid rgba(255,215,0,0.3)' }}>Total Qty</TableCell>
                      <TableCell sx={{ background: '#1e1e1e', color: '#FFD700', fontWeight: 600, borderBottom: '2px solid rgba(255,215,0,0.3)' }}>Unit</TableCell>
                      <TableCell sx={{ background: '#1e1e1e', color: '#FFD700', fontWeight: 600, borderBottom: '2px solid rgba(255,215,0,0.3)' }}>P.I.C</TableCell>
                      <TableCell sx={{ background: '#1e1e1e', color: '#FFD700', fontWeight: 600, borderBottom: '2px solid rgba(255,215,0,0.3)' }}>Note</TableCell>
                      {isAdmin && (
                        <TableCell align="right" sx={{ background: '#1e1e1e', color: '#FFD700', fontWeight: 600, borderBottom: '2px solid rgba(255,215,0,0.3)' }}>Actions</TableCell>
                      )}
                  </TableRow>
                </TableHead>
                <TableBody>
                    {paginatedRows.map((r, idx) => {
                      const actualIdx = page * rowsPerPage + idx;
                      // Find the index in remainingRows
                      const remainingIdx = remainingRows.findIndex(row => 
                        row['Item'] === r['Item'] && row['Type'] === r['Type']
                      );
                      const isEditing = isAdmin && editingIndex === remainingIdx;
                      const qty = Number(String(r['Current Quantity'] || '0').replace(/[^\d.-]/g, ''));
                      const isLowStock = !isNaN(qty) && qty > 0 && qty <= 5;
                      
                    return (
                        <TableRow 
                          key={actualIdx} 
                          sx={{ 
                            '&:nth-of-type(odd)': { backgroundColor: '#1b1b1b' },
                            '&:hover': { backgroundColor: '#252525' },
                            transition: 'background-color 0.2s'
                          }}
                        >
                        <TableCell sx={{ color: '#eee' }}>
                          {isEditing ? (
                              <TextField 
                                size="small" 
                                value={draftRow?.['Type'] || ''} 
                                onChange={(e) => setDraftRow(prev => ({ ...prev, Type: e.target.value }))}
                                sx={{ 
                                  '& .MuiOutlinedInput-root': { 
                                    background: '#252525',
                                    '& fieldset': { borderColor: 'rgba(255,215,0,0.3)' }
                                  }
                                }}
                              />
                            ) : (
                              <Chip 
                                label={r['Type'] || '-'} 
                                size="small" 
                                sx={{ 
                                  background: 'rgba(255,215,0,0.1)', 
                                  color: '#FFD700',
                                  border: '1px solid rgba(255,215,0,0.2)'
                                }} 
                              />
                            )}
                        </TableCell>
                          <TableCell sx={{ color: '#eee', fontWeight: 500 }}>
                          {isEditing ? (
                              <TextField 
                                size="small" 
                                fullWidth
                                value={draftRow?.['Item'] || ''} 
                                onChange={(e) => setDraftRow(prev => ({ ...prev, Item: e.target.value }))}
                                sx={{ 
                                  '& .MuiOutlinedInput-root': { 
                                    background: '#252525',
                                    '& fieldset': { borderColor: 'rgba(255,215,0,0.3)' }
                                  }
                                }}
                              />
                          ) : r['Item']}
                        </TableCell>
                          <TableCell align="right" sx={{ color: isLowStock ? '#ff9800' : '#eee', fontWeight: 600 }}>
                          {isEditing ? (
                              <TextField 
                                size="small" 
                                type="number"
                                value={draftRow?.['Current Quantity'] || ''} 
                                onChange={(e) => setDraftRow(prev => ({ ...prev, 'Current Quantity': e.target.value }))}
                                sx={{ 
                                  width: 80,
                                  '& .MuiOutlinedInput-root': { 
                                    background: '#252525',
                                    '& fieldset': { borderColor: 'rgba(255,215,0,0.3)' }
                                  }
                                }}
                              />
                            ) : r['Current Quantity'] || '0'}
                        </TableCell>
                          <TableCell align="right" sx={{ color: '#eee' }}>
                          {isEditing ? (
                              <TextField 
                                size="small" 
                                type="number"
                                value={draftRow?.['Total Quantity'] || ''} 
                                onChange={(e) => setDraftRow(prev => ({ ...prev, 'Total Quantity': e.target.value }))}
                                sx={{ 
                                  width: 80,
                                  '& .MuiOutlinedInput-root': { 
                                    background: '#252525',
                                    '& fieldset': { borderColor: 'rgba(255,215,0,0.3)' }
                                  }
                                }}
                              />
                            ) : r['Total Quantity'] || '0'}
                        </TableCell>
                          <TableCell sx={{ color: '#888' }}>
                          {isEditing ? (
                              <TextField 
                                size="small" 
                                value={draftRow?.['Unit'] || ''} 
                                onChange={(e) => setDraftRow(prev => ({ ...prev, Unit: e.target.value }))}
                                sx={{ 
                                  width: 100,
                                  '& .MuiOutlinedInput-root': { 
                                    background: '#252525',
                                    '& fieldset': { borderColor: 'rgba(255,215,0,0.3)' }
                                  }
                                }}
                              />
                            ) : (r['Unit'] && r['Unit'] !== '-') ? r['Unit'] : '-'}
                        </TableCell>
                          <TableCell sx={{ color: '#888' }}>
                          {isEditing ? (
                              <TextField 
                                size="small" 
                                value={draftRow?.['P.I.C'] || ''} 
                                onChange={(e) => setDraftRow(prev => ({ ...prev, 'P.I.C': e.target.value }))}
                                sx={{ 
                                  '& .MuiOutlinedInput-root': { 
                                    background: '#252525',
                                    '& fieldset': { borderColor: 'rgba(255,215,0,0.3)' }
                                  }
                                }}
                              />
                            ) : r['P.I.C'] || '-'}
                        </TableCell>
                          <TableCell sx={{ color: '#888', maxWidth: 200 }}>
                            {isEditing ? (
                              <TextField 
                                size="small" 
                                fullWidth
                                multiline
                                maxRows={2}
                                value={draftRow?.['Note'] || ''} 
                                onChange={(e) => setDraftRow(prev => ({ ...prev, Note: e.target.value }))}
                                sx={{ 
                                  '& .MuiOutlinedInput-root': { 
                                    background: '#252525',
                                    '& fieldset': { borderColor: 'rgba(255,215,0,0.3)' }
                                  }
                                }}
                              />
                            ) : (
                              <Tooltip title={r['Note'] || ''} arrow>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: '#888',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {r['Note'] || '-'}
                                </Typography>
                              </Tooltip>
                            )}
                          </TableCell>
                          {isAdmin && (
                            <TableCell align="right">
                              {isEditing ? (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Lưu">
                                    <IconButton 
                                      onClick={saveEdit} 
                                      disabled={loading}
                                      size="small"
                                      sx={{ color: '#4CAF50', '&:hover': { background: 'rgba(76,175,80,0.1)' } }} 
                                    >
                                      <SaveIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Hủy">
                                    <IconButton 
                                      onClick={() => { setEditingIndex(null); setDraftRow(null); }} 
                                      disabled={loading}
                                      size="small"
                                      sx={{ color: '#f44336', '&:hover': { background: 'rgba(244,67,54,0.1)' } }} 
                                    >
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Sửa">
                                    <IconButton 
                                      onClick={() => startEdit(remainingIdx >= 0 ? remainingIdx : actualIdx)} 
                                      disabled={loading}
                                      size="small"
                                      sx={{ color: '#FFD700', '&:hover': { background: 'rgba(255,215,0,0.1)' } }} 
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Xóa">
                                    <IconButton 
                                      onClick={() => removeRow(remainingIdx >= 0 ? remainingIdx : actualIdx)} 
                                      disabled={loading}
                                      size="small"
                                      sx={{ color: '#f44336', '&:hover': { background: 'rgba(244,67,54,0.1)' } }} 
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                    {paginatedRows.length === 0 && !loading && (
                    <TableRow>
                        <TableCell colSpan={isAdmin ? 8 : 7} sx={{ color: '#888', textAlign: 'center', py: 6 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <InventoryIcon sx={{ fontSize: 64, color: '#444' }} />
                            <Typography variant="body1" sx={{ color: '#888' }}>
                              {isAdmin ? 'Chưa có dữ liệu. Hãy import file XLSX hoặc thêm vật phẩm mới.' : 'Chưa có dữ liệu trong kho.'}
                            </Typography>
                          </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
              
              {remainingRows.length > 0 && (
                <TablePagination
                  component="div"
                  count={remainingRows.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  labelRowsPerPage="Số dòng mỗi trang:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`}
                  sx={{
                    color: '#888',
                    borderTop: '1px solid rgba(255,215,0,0.1)',
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                      color: '#888'
                    },
                    '& .MuiIconButton-root': {
                      color: '#FFD700',
                      '&:hover': {
                        background: 'rgba(255,215,0,0.1)'
                      },
                      '&.Mui-disabled': {
                        color: '#444'
                      }
                    },
                    '& .MuiSelect-root': {
                      color: '#888',
                      '&:before': {
                        borderColor: 'rgba(255,215,0,0.3)'
                      }
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>
    </Box>
  );
};

export default InventoryPage;
