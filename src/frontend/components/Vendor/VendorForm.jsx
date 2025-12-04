// VendorForm Component - Form để thêm/sửa Vendor
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
  IconButton,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Events có thể nhập tự do hoặc chọn từ danh sách gợi ý

const vatOptions = [
  'Không xuất VAT',
  'Xuất VAT 8%',
  'Xuất VAT 10%',
  'Khác'
];

const VendorForm = ({ open, onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    buyDetail: '',
    vat: '',
    feedback: '',
    notes: '',
    event: ''
  });
  
  const [errors, setErrors] = useState({});
  const isEditMode = !!initialData;

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Populate form với data từ vendor đang edit
        setFormData({
          name: initialData.name || '',
          contact: initialData.contact || '',
          buyDetail: initialData.buyDetail || '',
          vat: initialData.vat || '',
          feedback: initialData.feedback || '',
          notes: initialData.notes || '',
          event: initialData.events?.join(', ') || initialData.event || ''
        });
      } else {
        // Reset form khi mở
        setFormData({
          name: '',
          contact: '',
          buyDetail: '',
          vat: '',
          feedback: '',
          notes: '',
          event: ''
        });
      }
      setErrors({});
    }
  }, [open, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Tên cửa hàng/người bán là bắt buộc';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      // Map to Firebase field names
      const submitData = {
        Name: formData.name,
        Contact: formData.contact,
        BuyDetail: formData.buyDetail,
        VAT: formData.vat,
        Feedback: formData.feedback,
        notes: formData.notes,
        Event: formData.event
      };
      onSubmit(submitData);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: '#1e1e1e',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
          pb: 2
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#FFD700'
          }}
        >
          {isEditMode ? 'Chỉnh sửa Vendor' : 'Thêm Vendor mới'}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: '#888' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 4 }}>
        <Grid container spacing={3}>
          {/* Tên cửa hàng/người bán */}
          <Grid item xs={12} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Tên cửa hàng/người bán *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              placeholder="VD: CÔNG TY TNHH SẢN XUẤT IN ẤN QUÀ TẶNG MINH HOÀNG"
            />
          </Grid>

          {/* Thông tin liên hệ */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Thông tin liên hệ"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="Facebook, Zalo, SĐT, Website..."
              helperText="VD: https://minhhoanggifts.com/ hoặc 0901234567"
            />
          </Grid>

          {/* Event */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Event"
              name="event"
              value={formData.event}
              onChange={handleChange}
              placeholder="VD: CSG's Day, Orientation Day..."
              helperText="Sự kiện đã hợp tác với vendor"
            />
          </Grid>

          {/* Nội dung mua */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Nội dung mua"
              name="buyDetail"
              value={formData.buyDetail}
              onChange={handleChange}
              placeholder="VD: Dây strap, móc khóa, sticker..."
            />
          </Grid>

          {/* VAT */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="VAT"
              name="vat"
              value={formData.vat}
              onChange={handleChange}
            >
              <MenuItem value="">-- Chọn loại VAT --</MenuItem>
              {vatOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Đánh giá */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Đánh giá"
              name="feedback"
              value={formData.feedback}
              onChange={handleChange}
              placeholder="VD: Giá cao nhưng tốt"
            />
          </Grid>

          {/* Ghi chú */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Ghi chú"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Ghi chú thêm về vendor..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 215, 0, 0.1)' }}>
        <Button onClick={onClose} sx={{ color: '#888' }}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            background: '#FFD700',
            color: '#1a1a1a',
            fontWeight: 600,
            px: 4,
            '&:hover': {
              background: '#FFE44D'
            }
          }}
        >
          {isEditMode ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VendorForm;
