// Inventory Page: display remaining items in event storage
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab
} from '@mui/material';
import { PageHeader } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import AssignmentReturnedIcon from '@mui/icons-material/AssignmentReturned';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import {
  BorrowedItemsTable,
  InventoryToolbar,
  InventoryTable,
  BorrowDialog
} from '../components/Inventory';
import * as XLSX from 'xlsx';
import { listInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, bulkImport } from '../../services/services/inventoryService';
import { formatBorrowMessage, openFacebookMessenger } from '../../services/services/facebookMessengerService';
import { listBorrowedItems, addBorrowedItem, returnBorrowedItem } from '../../services/services/borrowedItemsService';

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
  const { isAdmin, user } = useAuth();
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

  // State cho danh sách vật phẩm đã mượn (chỉ admin)
  const [borrowedItemsList, setBorrowedItemsList] = useState([]);
  const [borrowedItemsLoading, setBorrowedItemsLoading] = useState(false);
  const [showBorrowedTab, setShowBorrowedTab] = useState(false);

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

  // Load danh sách vật phẩm đã mượn (chỉ admin)
  useEffect(() => {
    if (isAdmin && showBorrowedTab) {
      const loadBorrowed = async () => {
        setBorrowedItemsLoading(true);
        try {
          const items = await listBorrowedItems();
          setBorrowedItemsList(items);
        } catch (error) {
          console.error('Error loading borrowed items:', error);
          setSnackbar({
            open: true,
            message: 'Không thể tải danh sách vật phẩm đã mượn',
            severity: 'error'
          });
        } finally {
          setBorrowedItemsLoading(false);
        }
      };
      loadBorrowed();
    }
  }, [isAdmin, showBorrowedTab]);

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

  // Xử lý trả lại vật phẩm
  const handleReturnItem = async (borrowedItem) => {
    try {
      setBorrowedItemsLoading(true);
      await returnBorrowedItem(borrowedItem.id, borrowedItem.inventoryId, borrowedItem.quantity);

      // Reload danh sách mượn và inventory
      const items = await listBorrowedItems();
      setBorrowedItemsList(items);

      // Reload inventory
      const inventoryItems = await listInventory({ onlyRemaining: !showAll });
      const mapped = inventoryItems.map(i => ({
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

      setSnackbar({
        open: true,
        message: `Đã trả lại ${borrowedItem.quantity} ${borrowedItem.unit} ${borrowedItem.item} vào kho`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error returning item:', error);
      setSnackbar({
        open: true,
        message: `Lỗi khi trả lại vật phẩm: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setBorrowedItemsLoading(false);
    }
  };

  const handleConfirmBorrow = async () => {
    // Lấy thông tin đầy đủ của các vật phẩm cần mượn (bao gồm _id và row index)
    const itemsToBorrowWithIds = Object.entries(borrowItems)
      .map(([idx, quantity]) => {
        const row = remainingRows[Number(idx)];
        if (!row) return null;
        const maxQty = Number(String(row['Current Quantity'] ?? '0').replace(/[^\d.-]/g, ''));
        return {
          idx: Number(idx),
          rowIndex: rawRows.findIndex(r => r['Item'] === row['Item'] && r['Type'] === row['Type']),
          item: row['Item'] || '',
          quantity: Math.min(quantity, maxQty),
          unit: row['Unit'] || 'cái',
          type: row['Type'] || '',
          _id: row._id,
          currentQty: maxQty
        };
      })
      .filter(Boolean);

    if (itemsToBorrowWithIds.length === 0) {
      setSnackbar({
        open: true,
        message: 'Không có vật phẩm hợp lệ để mượn',
        severity: 'error'
      });
      return;
    }

    // Format message để gửi
    const itemsToBorrow = itemsToBorrowWithIds.map(({ item, quantity, unit, type }) => ({
      item,
      quantity,
      unit,
      type
    }));
    const message = formatBorrowMessage(itemsToBorrow);

    try {
      // Cập nhật số lượng trong state local và Firestore
      const updatedRows = [...rawRows];
      let hasUpdates = false;

      for (const borrowItem of itemsToBorrowWithIds) {
        const { rowIndex, quantity, _id } = borrowItem;

        if (rowIndex >= 0 && rowIndex < updatedRows.length) {
          const currentQtyNum = Number(String(updatedRows[rowIndex]['Current Quantity'] ?? '0').replace(/[^\d.-]/g, ''));
          const newQty = Math.max(0, currentQtyNum - quantity);
          updatedRows[rowIndex]['Current Quantity'] = String(newQty);
          hasUpdates = true;

          // Update lên Firestore nếu có _id
          if (_id) {
            try {
              const payload = {
                Type: updatedRows[rowIndex]['Type'],
                Item: updatedRows[rowIndex]['Item'],
                'Current Quantity': String(newQty),
                'Total Quantity': updatedRows[rowIndex]['Total Quantity'],
                Unit: updatedRows[rowIndex]['Unit'],
                'Unit Price': updatedRows[rowIndex]['Unit Price'],
                'P.I.C': updatedRows[rowIndex]['P.I.C'],
                Note: updatedRows[rowIndex]['Note']
              };
              await updateInventoryItem(_id, payload);

              // Lưu vào danh sách borrowed_items
              try {
                await addBorrowedItem({
                  inventoryId: _id,
                  item: borrowItem.item,
                  type: borrowItem.type,
                  quantity: quantity,
                  unit: borrowItem.unit,
                  borrowedBy: user?.displayName || user?.email || 'Unknown'
                });
              } catch (borrowError) {
                console.error(`Error adding to borrowed items:`, borrowError);
                // Không block flow nếu lỗi
              }
            } catch (updateError) {
              console.error(`Error updating item ${borrowItem.item}:`, updateError);
              // Vẫn tiếp tục với các item khác
            }
          }
        }
      }

      // Cập nhật state local
      if (hasUpdates) {
        setRawRows(updatedRows);
      }

      // Mở Messenger và copy tin nhắn
      const result = await openFacebookMessenger(message);

      if (result.success) {
        setSnackbar({
          open: true,
          message: `Đã cập nhật số lượng tồn kho. ${result.message}`,
          severity: 'success'
        });
        // Reset borrow items và đóng dialog
        setBorrowItems({});
        setBorrowDialogOpen(false);
      } else {
        // Nếu không copy được, vẫn hiển thị message để người dùng copy thủ công
        setSnackbar({
          open: true,
          message: `Đã cập nhật số lượng tồn kho. ${result.message || 'Vui lòng copy tin nhắn từ dialog và gửi thủ công.'}`,
          severity: result.clipboardMessage ? 'warning' : 'success'
        });
        // Vẫn reset và đóng dialog vì đã update số lượng
        setBorrowItems({});
        setBorrowDialogOpen(false);
      }
    } catch (error) {
      console.error('Error in handleConfirmBorrow:', error);
      setSnackbar({
        open: true,
        message: `Lỗi: ${error.message}. Vui lòng thử lại.`,
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
        subtitle={showBorrowedTab ? `Danh sách vật phẩm đã mượn` : `Hiển thị ${remainingRows.length} vật phẩm còn lại trong kho`}
      />

      {/* Tabs cho admin */}
      {isAdmin && (
        <Paper sx={{ background: '#1e1e1e', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 3 }}>
          <Tabs
            value={showBorrowedTab ? 1 : 0}
            onChange={(e, newValue) => setShowBorrowedTab(newValue === 1)}
            sx={{
              borderBottom: '1px solid rgba(255,215,0,0.2)',
              '& .MuiTab-root': {
                color: '#888',
                textTransform: 'none',
                fontWeight: 500,
                '&.Mui-selected': {
                  color: '#FFD700'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#FFD700'
              }
            }}
          >
            <Tab
              icon={<Inventory2Icon />}
              iconPosition="start"
              label="Kho vật phẩm"
            />
            <Tab
              icon={<AssignmentReturnedIcon />}
              iconPosition="start"
              label={`Vật phẩm đã mượn (${borrowedItemsList.length})`}
            />
          </Tabs>
        </Paper>
      )}

      {/* Nội dung chính */}
      {isAdmin && showBorrowedTab ? (
        <BorrowedItemsTable
          borrowedItemsList={borrowedItemsList}
          borrowedItemsLoading={borrowedItemsLoading}
          handleReturnItem={handleReturnItem}
        />
      ) : (
        <>
          <InventoryToolbar
            isAdmin={isAdmin}
            query={query} setQuery={setQuery}
            typeFilter={typeFilter} setTypeFilter={setTypeFilter}
            types={types} borrowItems={borrowItems}
            handleOpenBorrowDialog={handleOpenBorrowDialog}
            handleFileUpload={handleFileUpload} fileName={fileName}
            clearData={clearData} addRow={addRow}
            importToServer={importToServer} loading={loading}
            rawRows={rawRows} remainingRows={remainingRows}
          />
          <InventoryTable
            isAdmin={isAdmin} loading={loading}
            remainingRows={remainingRows} rawRows={rawRows}
            borrowItems={borrowItems} handleBorrowToggle={handleBorrowToggle}
            editingIndex={editingIndex} draftRow={draftRow} setDraftRow={setDraftRow}
            handleBorrowQuantityChange={handleBorrowQuantityChange}
            saveEdit={saveEdit} startEdit={startEdit}
            removeRow={removeRow} setEditingIndex={setEditingIndex}
          />
        </>
      )}

      {/* Dialog xác nhận mượn */}
      <BorrowDialog
        open={borrowDialogOpen}
        onClose={handleCloseBorrowDialog}
        selectedBorrowItems={selectedBorrowItems}
        formatBorrowMessage={formatBorrowMessage}
        handleCopyMessage={handleCopyMessage}
        handleConfirmBorrow={handleConfirmBorrow}
      />

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
