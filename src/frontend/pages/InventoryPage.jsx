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
  CircularProgress
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { PageHeader } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
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
            {isAdmin && (
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
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
              </Box>
            )}
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
                    
                    return (
                      <TableRow 
                        key={idx} 
                        sx={{ 
                          '&:nth-of-type(odd)': { backgroundColor: '#1b1b1b' },
                          '&:hover': { backgroundColor: '#222' },
                          transition: 'background-color 0.2s'
                        }}
                      >
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
                        colSpan={isAdmin ? 8 : 7} 
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
    </Box>
  );
};

export default InventoryPage;
