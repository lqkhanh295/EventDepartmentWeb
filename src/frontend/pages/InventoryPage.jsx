// Inventory Page: display remaining items in event storage
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Alert,
  Snackbar
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { PageHeader } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FacebookIcon from '@mui/icons-material/Facebook';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import * as XLSX from 'xlsx';
import { listInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, bulkImport } from '../../backend/services/inventoryService';
import { formatBorrowMessage, openFacebookMessenger } from '../../backend/services/facebookMessengerService';

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

const InventoryPage = () => {
  const { isAdmin } = useAuth();
  const [fileName, setFileName] = useState('');
  const [rawRows, setRawRows] = useState([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [draftRow, setDraftRow] = useState(null);
  const [showAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setServerRows] = useState([]);
  
  // State cho tính năng mượn vật phẩm
  const [borrowItems, setBorrowItems] = useState({}); // {itemIndex: quantity}
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const items = await listInventory({ onlyRemaining: !showAll });
        setServerRows(items);
        // If no upload yet, reflect server into table
        if (!fileName) {
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
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showAll, fileName]);

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
    setFileName(file.name);
    const isExcel = /\.xlsx$/i.test(file.name);
    if (isExcel) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      // Normalize headers to match expected format
      const normalized = rows.map(r => ({
        Type: r.Type ?? r['type'] ?? r['Loại'] ?? '',
        Item: r.Item ?? r['item'] ?? r['Tên vật phẩm'] ?? '',
        'Current Quantity': r['Current Quantity'] ?? r['Current Qty'] ?? r['Qty Current'] ?? r['Qty'] ?? r['Số lượng tồn'] ?? '',
        'Total Quantity': r['Total Quantity'] ?? r['Total Qty'] ?? r['Tổng số lượng'] ?? r['total'] ?? r['Total'] ?? '',
        Unit: r.Unit ?? r['unit'] ?? r['Đơn vị'] ?? '',
        'Unit Price': r['Unit Price'] ?? r['unit price'] ?? r['UnitPrice'] ?? r['Giá đơn vị'] ?? '',
        'P.I.C': r['P.I.C'] ?? r['PIC'] ?? r['pic'] ?? r['Phụ trách'] ?? '',
        Note: r.Note ?? r['note'] ?? r['Ghi chú'] ?? ''
      }));
      setRawRows(normalized);
    } else {
      const text = await file.text();
      const { rows } = parseCSV(text);
      setRawRows(rows);
    }
  };

  const clearData = () => {
    setFileName('');
    setRawRows([]);
    setQuery('');
    setTypeFilter('');
  };

  // Admin-only CRUD helpers (local state only)
  const startEdit = (idx) => {
    setEditingIndex(idx);
    setDraftRow({ ...remainingRows[idx] });
  };

  const saveEdit = async () => {
    if (editingIndex == null || !draftRow) return;
    // Map remainingRows index to rawRows index by matching Item+Type
    const target = draftRow;
    const i = rawRows.findIndex(r => r['Item'] === target['Item'] && r['Type'] === target['Type']);
    if (i >= 0) {
      const next = [...rawRows];
      next[i] = { ...next[i], ...target };
      setRawRows(next);
      // Push to Firestore if document id exists, else create
      const id = next[i]._id;
      const payload = {
        Type: next[i]['Type'],
        Item: next[i]['Item'],
        'Current Quantity': next[i]['Current Quantity'],
        'Total Quantity': next[i]['Total Quantity'],
        Unit: next[i]['Unit'],
        'Unit Price': next[i]['Unit Price'],
        'P.I.C': next[i]['P.I.C'],
        Note: next[i]['Note']
      };
      if (isAdmin) {
        if (id) {
          await updateInventoryItem(id, payload);
        } else {
          const created = await addInventoryItem(payload);
          next[i]._id = created.id;
          setRawRows(next);
        }
      }
    }
    setEditingIndex(null);
    setDraftRow(null);
  };

  const removeRow = async (idx) => {
    const target = remainingRows[idx];
    const i = rawRows.findIndex(r => r['Item'] === target['Item'] && r['Type'] === target['Type']);
    if (i >= 0) {
      const next = [...rawRows];
      const id = next[i]._id;
      next.splice(i, 1);
      setRawRows(next);
      if (isAdmin && id) {
        await deleteInventoryItem(id);
      }
    }
  };

  const addRow = () => {
    const empty = {
      Type: 'Decor',
      Item: 'Vật phẩm mới',
      'Current Quantity': '1',
      'Total Quantity': '1',
      Unit: 'Cái',
      'Unit Price': '-',
      'P.I.C': '',
      Note: ''
    };
    setRawRows(prev => [empty, ...prev]);
    setEditingIndex(0);
    setDraftRow(empty);
  };

  const importToServer = async () => {
    if (!isAdmin || rawRows.length === 0) return;
    setLoading(true);
    try {
      await bulkImport(rawRows);
      // Reload from server
      const items = await listInventory({ onlyRemaining: !showAll });
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
    } finally {
      setLoading(false);
    }
  };

  // Xử lý mượn vật phẩm
  const handleBorrowToggle = (idx, checked) => {
    if (checked) {
      setBorrowItems(prev => ({ ...prev, [idx]: 1 }));
    } else {
      setBorrowItems(prev => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
    }
  };

  const handleBorrowQuantityChange = (idx, quantity) => {
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    setBorrowItems(prev => ({ ...prev, [idx]: qty }));
  };

  const handleOpenBorrowDialog = () => {
    const selectedCount = Object.keys(borrowItems).length;
    if (selectedCount === 0) {
      setSnackbar({
        open: true,
        message: 'Vui lòng chọn ít nhất một vật phẩm để mượn',
        severity: 'warning'
      });
      return;
    }
    setBorrowDialogOpen(true);
  };

  const handleCloseBorrowDialog = () => {
    setBorrowDialogOpen(false);
  };

  const handleCopyMessage = async () => {
    const message = formatBorrowMessage(selectedBorrowItems);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message);
        setSnackbar({
          open: true,
          message: 'Đã sao chép tin nhắn vào clipboard!',
          severity: 'success'
        });
      } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = message;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setSnackbar({
          open: true,
          message: 'Đã sao chép tin nhắn vào clipboard!',
          severity: 'success'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Không thể sao chép. Vui lòng copy thủ công.',
        severity: 'error'
      });
    }
  };

  const handleConfirmBorrow = async () => {
    const itemsToBorrow = Object.entries(borrowItems)
      .map(([idx, quantity]) => {
        const row = remainingRows[Number(idx)];
        if (!row) return null;
        const maxQty = Number(String(row['Current Quantity'] ?? '0').replace(/[^\d.-]/g, ''));
        return {
          item: row['Item'] || '',
          quantity: Math.min(quantity, maxQty),
          unit: row['Unit'] || 'cái',
          type: row['Type'] || ''
        };
      })
      .filter(Boolean);

    if (itemsToBorrow.length === 0) {
      setSnackbar({
        open: true,
        message: 'Không có vật phẩm hợp lệ để mượn',
        severity: 'error'
      });
      return;
    }

    const message = formatBorrowMessage(itemsToBorrow);
    
    try {
      const result = await openFacebookMessenger(message);

      if (result.success) {
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'success'
        });
        // Reset borrow items sau 2 giây để người dùng thấy thông báo
        setTimeout(() => {
          setBorrowItems({});
          setBorrowDialogOpen(false);
        }, 2000);
      } else {
        // Nếu không copy được, vẫn hiển thị message để người dùng copy thủ công
        setSnackbar({
          open: true,
          message: result.message || 'Có lỗi xảy ra. Vui lòng copy tin nhắn từ dialog và gửi thủ công.',
          severity: result.clipboardMessage ? 'warning' : 'error'
        });
      }
    } catch (error) {
      console.error('Error in handleConfirmBorrow:', error);
      setSnackbar({
        open: true,
        message: `Lỗi: ${error.message}. Vui lòng thử lại hoặc copy tin nhắn thủ công.`,
        severity: 'error'
      });
    }
  };

  const selectedBorrowItems = useMemo(() => {
    return Object.entries(borrowItems)
      .map(([idx, quantity]) => {
        const row = remainingRows[Number(idx)];
        if (!row) return null;
        return {
          item: row['Item'] || '',
          quantity: quantity,
          unit: row['Unit'] || 'cái',
          type: row['Type'] || ''
        };
      })
      .filter(Boolean);
  }, [borrowItems, remainingRows]);

  return (
    <Box sx={{ minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <PageHeader
        title="Kho vật phẩm"
        subtitle={`Hiển thị ${remainingRows.length} vật phẩm còn lại trong kho`}
      />

      {/* Thanh tìm kiếm và bộ lọc */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, background: '#1e1e1e', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm theo toio"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{ 
                startAdornment: <SearchIcon sx={{ color: '#888', mr: 1 }} /> 
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: '#252525',
                  borderRadius: 2,
                  '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,215,0,0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                },
                '& input': { color: '#fff', fontSize: '0.9rem' }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl 
              fullWidth 
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: '#252525',
                  color: '#fff',
                  borderRadius: 2,
                  '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,215,0,0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                },
                '& .MuiSelect-icon': { color: '#FFD700' }
              }}
            >
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                displayEmpty
                MenuProps={{
                  PaperProps: {
                    sx: {
                      background: '#252525',
                      border: '1px solid rgba(255,215,0,0.2)',
                      borderRadius: 2,
                      mt: 0.5,
                      '& .MuiMenuItem-root': {
                        color: '#fff',
                        fontSize: '0.9rem',
                        '&:hover': { background: 'rgba(255,215,0,0.1)' },
                        '&.Mui-selected': { background: 'rgba(255,215,0,0.2)' }
                      }
                    }
                  }
                }}
              >
                <MenuItem value="">
                  <em>Tất cả Type</em>
                </MenuItem>
                {types.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Button Mượn vật phẩm */}
              <Button 
                size="small" 
                variant="contained" 
                onClick={handleOpenBorrowDialog}
                startIcon={<ShoppingCartIcon />}
                disabled={Object.keys(borrowItems).length === 0}
                sx={{ 
                  background: '#FFD700', 
                  color: '#1a1a1a', 
                  fontWeight: 600, 
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2,
                  '&:hover': { background: '#FFE44D' },
                  '&.Mui-disabled': {
                    background: '#333',
                    color: '#666'
                  }
                }}
              >
                Mượn vật phẩm ({Object.keys(borrowItems).length})
              </Button>
              
              {isAdmin && (
                <>
                  <input type="file" accept=".csv,.xlsx" id="inventory-upload" style={{ display: 'none' }} onChange={handleFileUpload} />
                  <label htmlFor="inventory-upload">
                    <Button 
                      component="span" 
                      size="small" 
                      variant="outlined" 
                      startIcon={<UploadFileIcon />} 
                      sx={{ 
                        borderColor: 'rgba(255,215,0,0.3)', 
                        color: '#FFD700', 
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 2,
                        '&:hover': { 
                          borderColor: '#FFD700', 
                          background: 'rgba(255,215,0,0.1)' 
                        } 
                      }}
                    >
                      {fileName || 'Tải CSV/XLSX'}
                    </Button>
                  </label>
                  {fileName && (
                    <IconButton 
                      size="small" 
                      onClick={clearData} 
                      sx={{ 
                        color: '#f44336',
                        '&:hover': { background: 'rgba(244, 67, 54, 0.1)' }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                  <Button 
                    size="small" 
                    variant="contained" 
                    onClick={addRow} 
                    startIcon={<AddIcon />} 
                    sx={{ 
                      background: '#FFD700', 
                      color: '#1a1a1a', 
                      fontWeight: 600, 
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 2,
                      '&:hover': { background: '#FFE44D' } 
                    }}
                  >
                    Thêm
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={importToServer}
                    disabled={loading || rawRows.length === 0}
                    sx={{ 
                      borderColor: 'rgba(255,215,0,0.3)', 
                      color: '#FFD700', 
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 2,
                      '&:hover': { 
                        borderColor: '#FFD700',
                        background: 'rgba(255,215,0,0.1)'
                      },
                      '&.Mui-disabled': {
                        borderColor: 'rgba(255,215,0,0.1)',
                        color: 'rgba(255,215,0,0.3)'
                      }
                    }}
                  >
                    {loading ? 'Đang lưu...' : 'Lưu lên kho'}
                  </Button>
                </>
              )}
            </Box>
          </Grid>
        </Grid>
        {remainingRows.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,215,0,0.1)' }}>
            <Typography variant="caption" sx={{ color: '#888', fontSize: '0.85rem' }}>
              Hiển thị {remainingRows.length} / {rawRows.length} vật phẩm
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Danh sách vật phẩm */}
      <Paper sx={{ flex: 1, p: { xs: 2, sm: 3 }, background: '#1e1e1e', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#FFD700', fontSize: { xs: '1.1rem', sm: '1.25rem' }, fontWeight: 600 }}>
            Danh sách vật phẩm còn lại
          </Typography>
          {loading && (
            <CircularProgress size={20} sx={{ color: '#FFD700' }} />
          )}
        </Box>
        <TableContainer component={Box} sx={{ flex: 1, overflow: 'auto', width: '100%', borderRadius: 2 }}>
          <Table stickyHeader size="small" sx={{ minWidth: { xs: 600, sm: 800 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  color: '#FFD700', 
                  background: '#1a1a1a', 
                  borderBottom: '2px solid rgba(255,215,0,0.3)', 
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  fontWeight: 600,
                  py: 1.5,
                  width: 50
                }} align="center">Mượn</TableCell>
                <TableCell sx={{ 
                  color: '#FFD700', 
                  background: '#1a1a1a', 
                  borderBottom: '2px solid rgba(255,215,0,0.3)', 
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  fontWeight: 600,
                  py: 1.5
                }}>Type</TableCell>
                <TableCell sx={{ 
                  color: '#FFD700', 
                  background: '#1a1a1a', 
                  borderBottom: '2px solid rgba(255,215,0,0.3)', 
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  fontWeight: 600,
                  py: 1.5
                }}>Item</TableCell>
                <TableCell sx={{ 
                  color: '#FFD700', 
                  background: '#1a1a1a', 
                  borderBottom: '2px solid rgba(255,215,0,0.3)', 
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  fontWeight: 600,
                  py: 1.5
                }} align="right">Current Qty</TableCell>
                <TableCell sx={{ 
                  color: '#FFD700', 
                  background: '#1a1a1a', 
                  borderBottom: '2px solid rgba(255,215,0,0.3)', 
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  fontWeight: 600,
                  py: 1.5
                }} align="right">Total Qty</TableCell>
                <TableCell sx={{ 
                  color: '#FFD700', 
                  background: '#1a1a1a', 
                  borderBottom: '2px solid rgba(255,215,0,0.3)', 
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  fontWeight: 600,
                  py: 1.5
                }}>Unit</TableCell>
                <TableCell sx={{ 
                  color: '#FFD700', 
                  background: '#1a1a1a', 
                  borderBottom: '2px solid rgba(255,215,0,0.3)', 
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  fontWeight: 600,
                  py: 1.5
                }}>P.I.C</TableCell>
                <TableCell sx={{ 
                  color: '#FFD700', 
                  background: '#1a1a1a', 
                  borderBottom: '2px solid rgba(255,215,0,0.3)', 
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  fontWeight: 600,
                  py: 1.5
                }}>Note</TableCell>
                <TableCell sx={{ 
                  color: '#FFD700', 
                  background: '#1a1a1a', 
                  borderBottom: '2px solid rgba(255,215,0,0.3)', 
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  fontWeight: 600,
                  py: 1.5,
                  width: 100
                }} align="center">Số lượng</TableCell>
                {isAdmin && (
                  <TableCell sx={{ 
                    color: '#FFD700', 
                    background: '#1a1a1a', 
                    borderBottom: '2px solid rgba(255,215,0,0.3)', 
                    fontSize: { xs: '0.85rem', sm: '0.95rem' },
                    fontWeight: 600,
                    py: 1.5
                  }} align="center">Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
                  {remainingRows.map((r, idx) => {
                    const isEditing = isAdmin && editingIndex === idx;
                    // Màu cho các loại Type
                    const getTypeColor = (type) => {
                      const typeColors = {
                        'Decor': '#FF6B6B',
                        'Đồ dùng bếp': '#4ECDC4',
                        'Văn phòng phẩm': '#FFD93D',
                        'Vật phẩm thường': '#95E1D3',
                      };
                      return typeColors[type] || '#A0A0A0';
                    };
                    
                    const isSelected = borrowItems[idx] !== undefined;
                    const currentQty = Number(String(r['Current Quantity'] ?? '0').replace(/[^\d.-]/g, ''));
                    
                    return (
                      <TableRow 
                        key={idx} 
                        sx={{ 
                          '&:nth-of-type(odd)': { backgroundColor: '#1b1b1b' },
                          '&:hover': { backgroundColor: '#222' },
                          transition: 'background-color 0.2s',
                          ...(isSelected && {
                            backgroundColor: 'rgba(255, 215, 0, 0.1)',
                            borderLeft: '3px solid #FFD700'
                          })
                        }}
                      >
                        <TableCell sx={{ color: '#eee', py: 1.5 }} align="center">
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => handleBorrowToggle(idx, e.target.checked)}
                            sx={{
                              color: '#FFD700',
                              '&.Mui-checked': {
                                color: '#FFD700'
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#eee', py: 1.5 }}>
                          {isEditing ? (
                            <TextField 
                              size="small" 
                              value={draftRow?.['Type'] || ''} 
                              onChange={(e) => setDraftRow(prev => ({ ...prev, Type: e.target.value }))}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  background: '#252525',
                                  '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                                  '& input': { color: '#fff', fontSize: '0.85rem' }
                                }
                              }}
                            />
                          ) : (
                            <Chip 
                              label={r['Type']} 
                              size="small" 
                              sx={{ 
                                background: `${getTypeColor(r['Type'])}22`,
                                color: getTypeColor(r['Type']),
                                border: `1px solid ${getTypeColor(r['Type'])}44`,
                                fontWeight: 600,
                                fontSize: '0.8rem'
                              }} 
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ color: '#eee', py: 1.5, fontWeight: 500 }}>
                          {isEditing ? (
                            <TextField 
                              size="small" 
                              value={draftRow?.['Item'] || ''} 
                              onChange={(e) => setDraftRow(prev => ({ ...prev, Item: e.target.value }))}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  background: '#252525',
                                  '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                                  '& input': { color: '#fff', fontSize: '0.85rem' }
                                }
                              }}
                            />
                          ) : r['Item']}
                        </TableCell>
                        <TableCell sx={{ color: '#eee', py: 1.5 }} align="right">
                          {isEditing ? (
                            <TextField 
                              size="small" 
                              value={draftRow?.['Current Quantity'] || ''} 
                              onChange={(e) => setDraftRow(prev => ({ ...prev, 'Current Quantity': e.target.value }))}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  background: '#252525',
                                  '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                                  '& input': { color: '#fff', fontSize: '0.85rem' }
                                }
                              }}
                            />
                          ) : r['Current Quantity']}
                        </TableCell>
                        <TableCell sx={{ color: '#eee', py: 1.5 }} align="right">
                          {isEditing ? (
                            <TextField 
                              size="small" 
                              value={draftRow?.['Total Quantity'] || ''} 
                              onChange={(e) => setDraftRow(prev => ({ ...prev, 'Total Quantity': e.target.value }))}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  background: '#252525',
                                  '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                                  '& input': { color: '#fff', fontSize: '0.85rem' }
                                }
                              }}
                            />
                          ) : r['Total Quantity']}
                        </TableCell>
                        <TableCell sx={{ color: '#eee', py: 1.5 }}>
                          {isEditing ? (
                            <TextField 
                              size="small" 
                              value={draftRow?.['Unit'] || ''} 
                              onChange={(e) => setDraftRow(prev => ({ ...prev, Unit: e.target.value }))}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  background: '#252525',
                                  '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                                  '& input': { color: '#fff', fontSize: '0.85rem' }
                                }
                              }}
                            />
                          ) : r['Unit']}
                        </TableCell>
                        <TableCell sx={{ color: '#eee', py: 1.5 }}>
                          {isEditing ? (
                            <TextField 
                              size="small" 
                              value={draftRow?.['P.I.C'] || ''} 
                              onChange={(e) => setDraftRow(prev => ({ ...prev, 'P.I.C': e.target.value }))}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  background: '#252525',
                                  '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                                  '& input': { color: '#fff', fontSize: '0.85rem' }
                                }
                              }}
                            />
                          ) : r['P.I.C']}
                        </TableCell>
                        <TableCell sx={{ color: '#ccc', py: 1.5, fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {isEditing ? (
                            <TextField 
                              size="small" 
                              value={draftRow?.['Note'] || ''} 
                              onChange={(e) => setDraftRow(prev => ({ ...prev, Note: e.target.value }))}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  background: '#252525',
                                  '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                                  '& input': { color: '#fff', fontSize: '0.85rem' }
                                }
                              }}
                            />
                          ) : (r['Note'] || '-')}
                        </TableCell>
                        <TableCell sx={{ color: '#eee', py: 1.5 }} align="center">
                          {isSelected ? (
                            <TextField
                              type="number"
                              size="small"
                              value={borrowItems[idx] || 1}
                              onChange={(e) => handleBorrowQuantityChange(idx, e.target.value)}
                              inputProps={{ 
                                min: 1, 
                                max: currentQty,
                                style: { textAlign: 'center', color: '#fff' }
                              }}
                              sx={{
                                width: 80,
                                '& .MuiOutlinedInput-root': {
                                  background: '#252525',
                                  '& fieldset': { borderColor: '#FFD700' },
                                  '&:hover fieldset': { borderColor: '#FFE44D' },
                                  '&.Mui-focused fieldset': { borderColor: '#FFE44D' }
                                }
                              }}
                            />
                          ) : (
                            <Typography variant="body2" sx={{ color: '#666' }}>-</Typography>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              {isEditing ? (
                                <>
                                  <IconButton 
                                    onClick={saveEdit} 
                                    size="small"
                                    sx={{ 
                                      color: '#4CAF50',
                                      '&:hover': { background: 'rgba(76, 175, 80, 0.1)' }
                                    }} 
                                    title="Lưu"
                                  >
                                    <SaveIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    onClick={() => { setEditingIndex(null); setDraftRow(null); }} 
                                    size="small"
                                    sx={{ 
                                      color: '#f44336',
                                      '&:hover': { background: 'rgba(244, 67, 54, 0.1)' }
                                    }} 
                                    title="Hủy"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </>
                              ) : (
                                <>
                                  <IconButton 
                                    onClick={() => startEdit(idx)} 
                                    size="small"
                                    sx={{ 
                                      color: '#FFD700',
                                      '&:hover': { background: 'rgba(255, 215, 0, 0.1)' }
                                    }} 
                                    title="Sửa"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    onClick={() => removeRow(idx)} 
                                    size="small"
                                    sx={{ 
                                      color: '#f44336',
                                      '&:hover': { background: 'rgba(244, 67, 54, 0.1)' }
                                    }} 
                                    title="Xóa"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </>
                              )}
                            </Box>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                  {remainingRows.length === 0 && (
                    <TableRow>
                      <TableCell 
                        colSpan={isAdmin ? 9 : 8} 
                        sx={{ 
                          color: '#888', 
                          textAlign: 'center', 
                          py: 6,
                          fontSize: '0.95rem'
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            Không có dữ liệu hiển thị
                          </Typography>
                          {isAdmin && (
                            <Typography variant="caption" sx={{ color: '#555' }}>
                              Hãy tải CSV/XLSX tồn kho để bắt đầu
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

      {/* Dialog xác nhận mượn vật phẩm */}
      <Dialog
        open={borrowDialogOpen}
        onClose={handleCloseBorrowDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: '#1e1e1e',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ color: '#FFD700', borderBottom: '1px solid rgba(255, 215, 0, 0.2)', pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCartIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Xác nhận mượn vật phẩm
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3, background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', color: '#FFE44D' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Hướng dẫn:</strong> Sau khi click "Gửi qua Messenger", hệ thống sẽ:
            </Typography>
            <Typography variant="body2" component="div" sx={{ pl: 2 }}>
              1. Sao chép tin nhắn vào clipboard<br/>
              2. Mở Facebook Messenger<br/>
              3. Bạn chỉ cần dán (Ctrl+V) và gửi tin nhắn
            </Typography>
          </Alert>
          
          <Typography variant="subtitle2" sx={{ color: '#FFD700', mb: 2, fontWeight: 600 }}>
            Danh sách vật phẩm cần mượn:
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            {selectedBorrowItems.map((item, index) => (
              <Box 
                key={index}
                sx={{ 
                  p: 2, 
                  mb: 1.5, 
                  background: '#252525', 
                  borderRadius: 2,
                  border: '1px solid rgba(255, 215, 0, 0.2)'
                }}
              >
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500, mb: 0.5 }}>
                  {index + 1}. {item.item}
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>
                  Số lượng: <strong style={{ color: '#FFD700' }}>{item.quantity}</strong> {item.unit}
                  {item.type && ` • Loại: ${item.type}`}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ 
            p: 2, 
            background: '#0f172a', 
            borderRadius: 2,
            border: '1px solid rgba(255, 215, 0, 0.2)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                Nội dung tin nhắn sẽ gửi:
              </Typography>
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyMessage}
                sx={{
                  color: '#FFD700',
                  textTransform: 'none',
                  '&:hover': { background: 'rgba(255, 215, 0, 0.1)' }
                }}
              >
                Copy
              </Button>
            </Box>
            <Box sx={{ 
              p: 2, 
              background: '#1a1a1a', 
              borderRadius: 1,
              border: '1px solid rgba(255, 215, 0, 0.1)',
              maxHeight: 300,
              overflow: 'auto',
              position: 'relative'
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#ccc', 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  lineHeight: 1.6
                }}
              >
                {formatBorrowMessage(selectedBorrowItems)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 215, 0, 0.2)', flexDirection: 'column', gap: 2, alignItems: 'stretch' }}>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button 
              onClick={handleCloseBorrowDialog}
              sx={{ 
                color: '#888',
                '&:hover': { background: 'rgba(255,255,255,0.05)' }
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmBorrow}
              variant="contained"
              startIcon={<FacebookIcon />}
              sx={{
                background: '#FFD700',
                color: '#1a1a1a',
                fontWeight: 600,
                '&:hover': { background: '#FFE44D' }
              }}
            >
              Mở Messenger & Sao chép tin nhắn
            </Button>
          </Box>
          <Box sx={{ 
            p: 2, 
            background: 'rgba(255, 215, 0, 0.05)', 
            borderRadius: 2,
            border: '1px solid rgba(255, 215, 0, 0.2)'
          }}>
            <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 1 }}>
              Hoặc mở Messenger thủ công:
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<FacebookIcon />}
              onClick={() => window.open('https://m.me/lqkoi29', '_blank')}
              sx={{
                borderColor: 'rgba(255, 215, 0, 0.3)',
                color: '#FFD700',
                textTransform: 'none',
                '&:hover': { 
                  borderColor: '#FFD700',
                  background: 'rgba(255, 215, 0, 0.1)'
                }
              }}
            >
              Mở Messenger: m.me/lqkoi29
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Snackbar thông báo */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ 
            background: snackbar.severity === 'success' ? '#1e4620' : 
                       snackbar.severity === 'warning' ? '#5f3d00' : 
                       '#5f2120', 
            color: '#fff',
            '& .MuiAlert-icon': { color: '#fff' }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryPage;
