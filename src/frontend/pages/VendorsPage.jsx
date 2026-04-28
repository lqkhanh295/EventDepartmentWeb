// VendorsPage - Trang quản lý Vendors (dạng bảng)
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  Select,
  Typography,
  Snackbar,
  Alert,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import { GlassCard } from '../components';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import StoreIcon from '@mui/icons-material/Store';
import { useSearchParams } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { PageHeader, Loading, EmptyState, VendorForm } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useVendors } from '../hooks/useVendors';
import { useSnackbar } from '../hooks/useSnackbar';
import { RemoveAccents } from '../../services/services/vendorService';


const VendorsPage = () => {
  const [searchParams] = useSearchParams();
  const { isAdminMode } = useAuth();

  const { loading, fetchVendors, addVendor: apiAddVendor, updateVendor: apiUpdateVendor, deleteVendor: apiDeleteVendor } = useVendors();
  const [vendors, setVendors] = useState([]);
  const [allVendors, setAllVendors] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, vendor: null });
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  // Table pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadVendors = useCallback(async () => {
    try {
      const data = await fetchVendors();
      const mergedData = mergeVendors(data);
      setAllVendors(mergedData);
      setVendors(mergedData);
      setEvents(extractEvents(mergedData));
    } catch (error) {
      console.error('Error loading vendors:', error);
      showSnackbar('Lỗi khi tải danh sách vendor', 'error');
    }
  }, [fetchVendors, showSnackbar]);

  useEffect(() => {
    loadVendors();

    if (searchParams.get('action') === 'add') {
      setFormOpen(true);
    }
  }, [searchParams, loadVendors]);

  const handleSearch = useCallback(() => {
    let filtered = [...allVendors];

    if (searchTerm) {
      const term = RemoveAccents(searchTerm).toLowerCase();
      filtered = filtered.filter(v =>
        (v.name || '').toLowerCase().includes(term) ||
        (v.category || '').toLowerCase().includes(term) ||
        (v.contact || '').toLowerCase().includes(term) ||
        (v.event || '').toLowerCase().includes(term) ||
        (v.events && v.events.some(e => e.toLowerCase().includes(term)))
      );
    }

    if (selectedEvent && selectedEvent !== 'all') {
      filtered = filtered.filter(v =>
        v.events && v.events.includes(selectedEvent)
      );
    }

    setVendors(filtered);
  }, [allVendors, searchTerm, selectedEvent]);

  useEffect(() => {
    if (allVendors.length === 0) return; // Chờ data load xong

    const delaySearch = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [allVendors, handleSearch]);

  // Gộp các vendor giống nhau (chỉ dựa trên tên + liên hệ + nội dung mua)
  const mergeVendors = (vendorList) => {
    const merged = {};

    vendorList.forEach(vendor => {
      // Tạo key chỉ từ tên và liên hệ (normalize để so sánh)
      const normalizedName = (vendor.name || '').toLowerCase().trim();
      const normalizedContact = (vendor.contact || '').toLowerCase().trim();
      const normalizedBuyDetail = (vendor.buyDetail || '').toLowerCase().trim();
      const key = `${normalizedName}_${normalizedContact}_${normalizedBuyDetail}`;

      if (merged[key]) {
        // Đã tồn tại, thêm event vào mảng
        if (vendor.event) {
          const eventExists = merged[key].events.some(
            e => e.toLowerCase() === vendor.event.toLowerCase()
          );
          if (!eventExists) {
            merged[key].events.push(vendor.event);
          }
        }
        // Gộp feedback nếu khác và chưa có
        if (vendor.feedback && !merged[key].feedback) {
          merged[key].feedback = vendor.feedback;
        }
        // Gộp VAT nếu chưa có
        if (vendor.vat && !merged[key].vat) {
          merged[key].vat = vendor.vat;
        }
      } else {
        // Chưa tồn tại, tạo mới
        merged[key] = {
          ...vendor,
          events: vendor.event ? [vendor.event] : [],
        };
      }
    });

    return Object.values(merged);
  };

  // Lấy danh sách events từ vendors
  const extractEvents = (vendorList) => {
    const eventSet = new Set();
    vendorList.forEach(v => {
      if (v.events && v.events.length > 0) {
        v.events.forEach(e => eventSet.add(e));
      }
    });
    return Array.from(eventSet).sort();
  };

  const handleAddVendor = async (vendorData) => {
    try {
      await apiAddVendor(vendorData);
      showSnackbar('Thêm vendor thành công!', 'success');
      loadVendors();
    } catch (error) {
      console.error('Error adding vendor:', error);
      showSnackbar('Lỗi khi thêm vendor', 'error');
    }
  };

  const handleUpdateVendor = async (vendorData) => {
    try {
      await apiUpdateVendor(editingVendor.id, vendorData);
      showSnackbar('Cập nhật vendor thành công!', 'success');
      loadVendors();
    } catch (error) {
      console.error('Error updating vendor:', error);
      showSnackbar('Lỗi khi cập nhật vendor', 'error');
    }
  };

  const handleDeleteVendor = async () => {
    try {
      await apiDeleteVendor(deleteDialog.vendor.id);
      showSnackbar('Xóa vendor thành công!', 'success');
      setDeleteDialog({ open: false, vendor: null });
      loadVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      showSnackbar('Lỗi khi xóa vendor', 'error');
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingVendor(null);
  };

  const handleFormSubmit = (data) => {
    if (editingVendor) {
      handleUpdateVendor(data);
    } else {
      handleAddVendor(data);
    }
  };

  const handleEditClick = (vendor) => {
    setEditingVendor(vendor);
    setFormOpen(true);
  };

  const handleDeleteClick = (vendor) => {
    setDeleteDialog({ open: true, vendor });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const displayedVendors = vendors.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <PageHeader
        title="Danh sách Vendor"
        subtitle={`${vendors.length} vendor trong hệ thống`}
        breadcrumbs={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Vendors', path: '/vendors' }
        ]}
        actionText="Thêm Vendor"
        actionIcon={AddIcon}
        onAction={() => setFormOpen(true)}
      />

      {/* Search & Filter */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3
        }}
      >
        <TextField
          fullWidth
          placeholder="Tìm kiếm vendor theo tên, nội dung mua..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#888' }} />
              </InputAdornment>
            )
          }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              background: '#1e1e1e',
              borderRadius: 10,
              '& fieldset': { borderColor: 'rgba(255, 215, 0, 0.2)' },
              '&:hover fieldset': { borderColor: '#FFD700' },
              '&.Mui-focused fieldset': { borderColor: '#FFD700' }
            }
          }}
        />

        <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
          <Select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            displayEmpty
            startAdornment={
              <InputAdornment position="start">
                <FilterListIcon sx={{ color: '#888', ml: 1 }} />
              </InputAdornment>
            }
            sx={{
              background: '#1e1e1e',
              borderRadius: 10,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 215, 0, 0.2)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FFD700' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FFD700' }
            }}
          >
            <MenuItem value="all">Sự kiện</MenuItem>
            {events.map((evt) => (
              <MenuItem key={evt} value={evt}>
                {evt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Vendor Table */}
      {loading ? (
        <Loading message="Đang tải danh sách vendor..." />
      ) : vendors.length === 0 ? (
        <EmptyState
          icon={StoreIcon}
          title="Chưa có vendor nào"
          description={
            searchTerm || selectedEvent !== 'all'
              ? 'Không tìm thấy vendor phù hợp với điều kiện tìm kiếm'
              : 'Hãy thêm vendor đầu tiên vào hệ thống'
          }
          actionText={!searchTerm && selectedEvent === 'all' ? 'Thêm Vendor' : undefined}
          onAction={!searchTerm && selectedEvent === 'all' ? () => setFormOpen(true) : undefined}
        />
      ) : (
        <GlassCard
          sx={{
            background: '#1e1e1e',
            border: '1px solid rgba(255, 215, 0, 0.1)',
            borderRadius: 10,
            overflow: 'hidden'
          }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ background: 'rgba(0,0,0,0.2)' }}>
                <TableRow>
                  <TableCell sx={{ color: '#B3B3B3', fontWeight: 600, width: 60, align: 'center' }}>STT</TableCell>
                  <TableCell sx={{ color: '#B3B3B3', fontWeight: 600, width: 240 }}>Tên cửa hàng/người bán</TableCell>
                  <TableCell sx={{ color: '#B3B3B3', fontWeight: 600, width: 160 }}>Nội dung mua</TableCell>
                  <TableCell sx={{ color: '#B3B3B3', fontWeight: 600, width: 120, align: 'center' }}>VAT</TableCell>
                  <TableCell sx={{ color: '#B3B3B3', fontWeight: 600, width: 220 }}>Đánh giá</TableCell>
                  {isAdminMode && <TableCell sx={{ color: '#B3B3B3', fontWeight: 600, width: 100, align: 'center' }}>Thao tác</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedVendors.map((record, index) => {
                  const actualIndex = page * rowsPerPage + index + 1;
                  const isNoVat = record.vat && record.vat.toLowerCase().includes('không');
                  const vatShortText = record.vat ? record.vat.replace('Không xuất VAT', 'Không VAT').replace('Xuất VAT', 'VAT') : '';

                  return (
                    <TableRow key={record.id || index} sx={{ '&:last-child td, &:last-child th': { border: 0 }, borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <TableCell align="center">
                        <Typography sx={{ color: '#FFD700', fontWeight: 700, fontSize: '0.9rem' }}>
                          {actualIndex}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', mb: 0.5 }}>
                            {record.name || '-'}
                          </Typography>
                          {record.events && record.events.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {record.events.map((evt, idx) => (
                                <Chip
                                  key={idx}
                                  label={evt}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    background: 'rgba(78, 205, 196, 0.15)',
                                    color: '#4ECDC4',
                                    border: '1px solid rgba(78, 205, 196, 0.3)'
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: '#e0e0e0',
                            fontSize: '0.9rem',
                            maxWidth: 150,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={record.buyDetail}
                        >
                          {record.buyDetail || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {!record.vat ? (
                          <Typography sx={{ color: '#666' }}>-</Typography>
                        ) : (
                          <Chip
                            label={vatShortText}
                            size="small"
                            sx={{
                              height: 24,
                              background: isNoVat ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 152, 0, 0.15)',
                              color: isNoVat ? '#4CAF50' : '#FF9800',
                              border: `1px solid ${isNoVat ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 152, 0, 0.3)'}`,
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            background: record.feedback ? 'rgba(255, 215, 0, 0.05)' : 'transparent',
                            borderLeft: record.feedback ? '2px solid rgba(255, 215, 0, 0.3)' : 'none',
                            padding: record.feedback ? '6px 10px' : '6px 0',
                            borderRadius: '0 2px 2px 0'
                          }}
                        >
                          <Typography
                            sx={{
                              color: record.feedback ? '#e0e0e0' : '#666',
                              fontSize: '0.85rem',
                              fontStyle: 'italic',
                              lineHeight: 1.5,
                              wordBreak: 'break-word'
                            }}
                          >
                            {record.feedback ? `"${record.feedback}"` : '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      {isAdminMode && (
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(record)}
                              sx={{ color: '#4ECDC4', '&:hover': { background: 'rgba(78, 205, 196, 0.1)' } }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(record)}
                              sx={{ color: '#f44336', '&:hover': { background: 'rgba(244, 67, 54, 0.1)' } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={vendors.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Số hàng:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count} vendor`}
            rowsPerPageOptions={[10, 20, 50]}
            sx={{
              color: '#B3B3B3',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              '.MuiTablePagination-selectLabel, .MuiTablePagination-select, .MuiTablePagination-displayedRows': {
                color: '#B3B3B3',
              },
              '.MuiTablePagination-actions button': {
                color: '#FFD700',
              }
            }}
          />
        </GlassCard>
      )}

      {/* Vendor Form Dialog */}
      <VendorForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={editingVendor}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, vendor: null })}
        PaperProps={{
          sx: { background: '#1e1e1e', border: '1px solid rgba(255, 215, 0, 0.2)' }
        }}
      >
        <DialogTitle sx={{ color: '#FFD700' }}>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#b3b3b3' }}>
            Bạn có chắc muốn xóa vendor "{deleteDialog.vendor?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, vendor: null })} sx={{ color: '#888' }}>
            Hủy
          </Button>
          <Button onClick={handleDeleteVendor} sx={{ color: '#f44336' }}>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={hideSnackbar}
          severity={snackbar.severity}
          sx={{
            background: snackbar.severity === 'success' ? '#1e4620' : '#5f2120',
            color: '#fff'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VendorsPage;
