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
  MenuItem
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

const DEFAULT_HEADERS = ['Type','Item','Current Quantity','Total Quantity','Unit','Unit Price','P.I.C','Note'];

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
  const [serverRows, setServerRows] = useState([]);

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
      // Normalize headers: ensure keys match DEFAULT_HEADERS
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
      const count = await bulkImport(rawRows);
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
    <Box>
      <PageHeader
        title="Kho vật phẩm"
        subtitle="Hiển thị các vật phẩm còn lại trong kho theo CSV"
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, mb: 3, background: '#1e1e1e', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 3 }}>
            <Typography variant="h6" sx={{ color: '#FFD700', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="1" size="small" sx={{ background: '#333', color: '#FFD700' }} />
              {isAdmin ? 'Tải CSV tồn kho' : 'Bộ lọc hiển thị'}
            </Typography>
            {isAdmin && (
              <>
                <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
                  Xuất file CSV từ bảng tồn kho (các cột: {DEFAULT_HEADERS.join(', ')}).
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <input type="file" accept=".csv,.xlsx" id="inventory-upload" style={{ display: 'none' }} onChange={handleFileUpload} />
                  <label htmlFor="inventory-upload">
                    <Button component="span" fullWidth variant="outlined" startIcon={<UploadFileIcon />} sx={{ borderColor: 'rgba(255,215,0,0.3)', color: '#FFD700', py: 1.5, justifyContent: 'flex-start', '&:hover': { borderColor: '#FFD700', background: 'rgba(255,215,0,0.05)' } }}>
                      {fileName || 'Chọn file CSV/XLSX'}
                    </Button>
                  </label>
                  {fileName && (
                    <IconButton size="small" onClick={clearData} sx={{ color: '#f44336', ml: 1 }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                  <Chip label={`Đã tải: ${totalLoaded}`} size="small" sx={{ background: '#333', color: '#FFD700' }} />
                  <Chip label={`Còn lại: ${remainingRows.length}`} size="small" sx={{ background: '#333', color: '#4CAF50' }} />
                </Box>
                <Button variant="contained" onClick={addRow} startIcon={<AddIcon />} sx={{ background: '#FFD700', color: '#1a1a1a', fontWeight: 600, '&:hover': { background: '#FFE44D' } }}>
                  Thêm vật phẩm
                </Button>
                <Button variant="outlined" onClick={importToServer} sx={{ ml: 1, borderColor: 'rgba(255,215,0,0.3)', color: '#FFD700', '&:hover': { borderColor: '#FFD700' } }}>
                  Lưu toàn bộ lên kho (Firebase)
                </Button>
              </>
            )}

            <Typography variant="h6" sx={{ color: '#FFD700', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="2" size="small" sx={{ background: '#333', color: '#FFD700' }} />
              Lọc & Tìm kiếm
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm theo tên vật phẩm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{ endAdornment: <SearchIcon sx={{ color: '#888' }} /> }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  background: '#252525',
                  '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                  '&:hover fieldset': { borderColor: '#FFD700' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                },
                '& .MuiInputLabel-root': { color: '#888' }
              }}
            />
            <TextField
              fullWidth
              size="small"
              placeholder="Lọc theo Type (ví dụ: Decor)"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: '#252525',
                  '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                  '&:hover fieldset': { borderColor: '#FFD700' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                }
              }}
            />
            <Box sx={{ mt: 1 }}>
              <Button size="small" variant="text" onClick={() => setShowAll(v => !v)} sx={{ color: '#FFD700' }}>
                {showAll ? 'Chỉ hiển thị còn lại (>0)' : 'Hiển thị tất cả hàng'}
              </Button>
            </Box>
            {!!types.length && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ color: '#888' }}>Types: {types.join(', ')}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, background: '#1e1e1e', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 3 }}>
            <Typography variant="h6" sx={{ color: '#FFD700', mb: 2 }}>Danh sách vật phẩm còn lại</Typography>
            <Box sx={{ mb: 1 }}>
              <Chip label={`Đã tải: ${totalLoaded}`} size="small" sx={{ background: '#333', color: '#FFD700', mr: 1 }} />
              <Chip label={`Hiển thị: ${remainingRows.length}`} size="small" sx={{ background: '#333', color: '#4CAF50' }} />
            </Box>
            <TableContainer component={Box}>
              <Table size="small" sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#bbb' }}>Type</TableCell>
                    <TableCell sx={{ color: '#bbb' }}>Item</TableCell>
                    <TableCell sx={{ color: '#bbb' }} align="right">Current Qty</TableCell>
                    <TableCell sx={{ color: '#bbb' }} align="right">Total Qty</TableCell>
                    <TableCell sx={{ color: '#bbb' }}>Unit</TableCell>
                    <TableCell sx={{ color: '#bbb' }}>P.I.C</TableCell>
                    <TableCell sx={{ color: '#bbb' }}>Note</TableCell>
                    {isAdmin && <TableCell sx={{ color: '#bbb' }} align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {remainingRows.map((r, idx) => {
                    const isEditing = isAdmin && editingIndex === idx;
                    return (
                      <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#1b1b1b' } }}>
                        <TableCell sx={{ color: '#eee' }}>
                          {isEditing ? (
                            <TextField size="small" value={draftRow?.['Type'] || ''} onChange={(e) => setDraftRow(prev => ({ ...prev, Type: e.target.value }))} />
                          ) : r['Type']}
                        </TableCell>
                        <TableCell sx={{ color: '#eee' }}>
                          {isEditing ? (
                            <TextField size="small" value={draftRow?.['Item'] || ''} onChange={(e) => setDraftRow(prev => ({ ...prev, Item: e.target.value }))} />
                          ) : r['Item']}
                        </TableCell>
                        <TableCell sx={{ color: '#eee' }} align="right">
                          {isEditing ? (
                            <TextField size="small" value={draftRow?.['Current Quantity'] || ''} onChange={(e) => setDraftRow(prev => ({ ...prev, ['Current Quantity']: e.target.value }))} />
                          ) : r['Current Quantity']}
                        </TableCell>
                        <TableCell sx={{ color: '#eee' }} align="right">
                          {isEditing ? (
                            <TextField size="small" value={draftRow?.['Total Quantity'] || ''} onChange={(e) => setDraftRow(prev => ({ ...prev, ['Total Quantity']: e.target.value }))} />
                          ) : r['Total Quantity']}
                        </TableCell>
                        <TableCell sx={{ color: '#eee' }}>
                          {isEditing ? (
                            <TextField size="small" value={draftRow?.['Unit'] || ''} onChange={(e) => setDraftRow(prev => ({ ...prev, Unit: e.target.value }))} />
                          ) : r['Unit']}
                        </TableCell>
                        <TableCell sx={{ color: '#eee' }}>
                          {isEditing ? (
                            <TextField size="small" value={draftRow?.['P.I.C'] || ''} onChange={(e) => setDraftRow(prev => ({ ...prev, ['P.I.C']: e.target.value }))} />
                          ) : r['P.I.C']}
                        </TableCell>
                        <TableCell sx={{ color: '#eee' }}>
                          {isEditing ? (
                            <TextField size="small" value={draftRow?.['Note'] || ''} onChange={(e) => setDraftRow(prev => ({ ...prev, Note: e.target.value }))} />
                          ) : r['Note']}
                        </TableCell>
                        {isAdmin && (
                          <TableCell align="right">
                            {isEditing ? (
                              <>
                                <IconButton onClick={saveEdit} sx={{ color: '#4CAF50' }} title="Lưu">
                                  <SaveIcon />
                                </IconButton>
                                <IconButton onClick={() => { setEditingIndex(null); setDraftRow(null); }} sx={{ color: '#f44336' }} title="Hủy">
                                  <DeleteIcon />
                                </IconButton>
                              </>
                            ) : (
                              <>
                                <IconButton onClick={() => startEdit(idx)} sx={{ color: '#FFD700' }} title="Sửa">
                                  <EditIcon />
                                </IconButton>
                                <IconButton onClick={() => removeRow(idx)} sx={{ color: '#f44336' }} title="Xóa">
                                  <DeleteIcon />
                                </IconButton>
                              </>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                  {remainingRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 8 : 7} sx={{ color: '#888', textAlign: 'center' }}>
                        Không có dữ liệu hiển thị.{isAdmin ? ' Hãy tải CSV tồn kho.' : ''}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryPage;
