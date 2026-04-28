// ContractsPage - Trang tạo Hợp đồng & Biên bản nghiệm thu tự động
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, TextField, Grid, IconButton, Chip,
  LinearProgress, Tabs, Tab, Autocomplete,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  MenuItem, Select, FormControl, InputLabel, InputAdornment, Tooltip, Collapse,
  Alert, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ImageIcon from '@mui/icons-material/Image';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArticleIcon from '@mui/icons-material/Article';
import ListAltIcon from '@mui/icons-material/ListAlt';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

import { PageHeader } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../hooks/useSnackbar';
import { numberToVietnameseText } from '../../shared/utils/numberToText';
import { validateContractField } from '../../shared/utils/contractValidation';
import {
  getAllContractProfiles,
  saveContractProfile,
  updateContractProfile,
  deleteContractProfile,
  getContractTemplates,
  saveContractTemplate
} from '../../services/services/contractService';

import { GlassCard } from '../components';
// ─── DEFAULT FIELDS ────────────────────────────────────────────────────────────

const DEFAULT_FIELDS = [
  // Party B - Person
  { key: 'danh_xung', label: 'Ông/Bà', value: 'Ông', section: 'Party B', type: 'select', options: [{ label: 'Ông', value: 'Ông' }, { label: 'Bà', value: 'Bà' }] },
  { key: 'ho_ten', label: 'Họ tên', value: '', section: 'Party B', placeholder: 'Họ và tên đầy đủ (IN HOA)' },
  { key: 'ten_viet_tat', label: 'Tên viết tắt', value: '', section: 'Party B', placeholder: 'Tự động tạo (VD: PHA)' },
  { key: 'ngay_sinh', label: 'Ngày sinh', value: '', section: 'Party B', placeholder: 'DD/MM/YYYY', type: 'date' },
  { key: 'dia_chi', label: 'Địa chỉ', value: '', section: 'Party B', placeholder: 'Địa chỉ thường trú' },
  { key: 'dien_thoai', label: 'Điện thoại', value: '', section: 'Party B', placeholder: '09xxxxxxxx' },
  { key: 'email', label: 'Email', value: '', section: 'Party B', placeholder: 'email@example.com' },
  { key: 'mst', label: 'MST', value: '', section: 'Party B', placeholder: 'Mã số thuế cá nhân' },
  { key: 'cccd', label: 'CCCD', value: '', section: 'Party B', placeholder: '12 chữ số' },
  { key: 'ngay_cap', label: 'Ngày cấp', value: '', section: 'Party B', placeholder: 'DD/MM/YYYY', type: 'date' },
  { key: 'noi_cap', label: 'Nơi cấp', value: 'Cục Cảnh sát Quản lý hành chính về trật tự xã hội', section: 'Party B', type: 'select',
    options: [
      { label: 'Cục Cảnh sát Quản lý hành chính về trật tự xã hội', value: 'Cục Cảnh sát Quản lý hành chính về trật tự xã hội' },
      { label: 'Khác', value: '' }
    ]
  },
  { key: 'stk', label: 'STK', value: '', section: 'Party B', placeholder: 'Số tài khoản ngân hàng' },
  { key: 'ngan_hang', label: 'Ngân hàng', value: '', section: 'Party B', placeholder: 'Tên ngân hàng', type: 'bankSelect', options: [] },
  { key: 'chi_nhanh', label: 'Chi nhánh', value: '', section: 'Party B', placeholder: 'Chi nhánh ngân hàng' },

  // Time
  { key: 'ngay_bat_dau', label: 'Ngày bắt đầu', value: '', section: 'Time', placeholder: 'DD', type: 'number' },
  { key: 'thang_bat_dau', label: 'Tháng bắt đầu', value: '', section: 'Time', placeholder: 'MM', type: 'number' },
  { key: 'ngay_ket_thuc', label: 'Ngày kết thúc', value: '', section: 'Time', placeholder: 'DD', type: 'number' },
  { key: 'thang_ket_thuc', label: 'Tháng kết thúc', value: '', section: 'Time', placeholder: 'MM', type: 'number' },

  // Job
  { key: 'cong_viec', label: 'Công việc', value: '', section: 'Job', placeholder: 'Mô tả công việc chung' },
  { key: 'cong_viec_cu_the', label: 'Công việc cụ thể', value: '', section: 'Job', placeholder: 'Mô tả chi tiết nhiệm vụ' },
  { key: 'hinh_thuc', label: 'Hình thức', value: 'Online', section: 'Job', placeholder: 'Online / Offline' },
  { key: 'yeu_cau', label: 'Yêu cầu', value: '', section: 'Job', placeholder: 'Yêu cầu chi tiết' },

  // Financial
  { key: 'so_luong', label: 'Số lượng', value: '1', section: 'Financial', placeholder: 'SL', type: 'number' },
  { key: 'don_gia', label: 'Đơn giá', value: '', section: 'Financial', placeholder: 'Đơn giá (VD: 5.000.000)' },
  { key: 'thanh_tien', label: 'Thành tiền', value: '', section: 'Financial', placeholder: 'Tự động tính' },
  { key: 'bang_chu_thanh_tien', label: 'Bằng chữ (Thành tiền)', value: '', section: 'Financial', placeholder: 'Tự động tạo' },
  { key: 'thuc_nhan', label: 'Thực nhận (sau 10% thuế)', value: '', section: 'Financial', placeholder: 'Tự động tính' },
  { key: 'bang_chu_thuc_nhan', label: 'Bằng chữ (Thực nhận)', value: '', section: 'Financial', placeholder: 'Tự động tạo' },
];

const SECTION_CONFIG = {
  'Party B': { label: 'Thông tin Cá nhân (Bên B)', color: '#4ECDC4' },
  'Time': { label: 'Thời gian thực hiện', color: '#FFD700' },
  'Job': { label: 'Nội dung Công việc', color: '#FF6B6B' },
  'Financial': { label: 'Tài chính & Thanh toán', color: '#22c55e' },
  'Other': { label: 'Thông tin khác', color: '#888' },
};

const AUTO_CALC_KEYS = new Set(['thanh_tien', 'bang_chu_thanh_tien', 'thuc_nhan', 'bang_chu_thuc_nhan', 'ten_viet_tat']);
const IGNORED_IMAGE_FIELDS = ['cccd_truoc', 'cccd_sau', 'cccd_mat_truoc', 'cccd_mat_sau', 'image', 'vneid'];

// ─── HELPERS ────────────────────────────────────────────────────────────────────

const formatCurrency = (num) => Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (e) => {
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 600;
      let { width, height } = img;
      if (width > MAX_WIDTH) { height = (height * MAX_WIDTH) / width; width = MAX_WIDTH; }
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = reject;
  };
  reader.onerror = reject;
});

const base64ToFile = async (base64, filename) => {
  const res = await fetch(base64);
  const buf = await res.arrayBuffer();
  return new File([buf], filename, { type: 'image/jpeg' });
};

const fileToArrayBuffer = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => resolve(e.target.result);
  reader.onerror = reject;
  reader.readAsArrayBuffer(file);
});

const extractKeysFromDocx = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const zip = new PizZip(e.target.result);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
        const text = doc.getFullText();
        const matches = text.match(/\{{1,2}([a-zA-Z0-9_]+)\}{1,2}/g);
        if (!matches) { resolve([]); return; }
        const keys = Array.from(new Set(matches.map(m => m.replace(/[{}]/g, ''))));
        resolve(keys);
      } catch { resolve([]); }
    };
    reader.onerror = () => resolve([]);
    reader.readAsArrayBuffer(file);
  });
};

// ─── FIELD INPUT COMPONENT ──────────────────────────────────────────────────────

const FieldInput = ({ field, onChange, banks, error }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!field.value) return;
    navigator.clipboard.writeText(field.value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  const handleDateChange = (e) => {
    if (!e.target.value) { onChange(field.key, ''); return; }
    const [y, m, d] = e.target.value.split('-');
    onChange(field.key, `${d}/${m}/${y}`);
  };

  const getDateValue = () => {
    if (!field.value || !field.value.includes('/')) return '';
    const parts = field.value.split('/');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      background: '#1a1a1a',
      '& fieldset': { borderColor: error ? '#ef4444' : 'rgba(255,255,255,0.12)' },
      '&:hover fieldset': { borderColor: error ? '#ef4444' : 'rgba(255,215,0,0.4)' },
      '&.Mui-focused fieldset': { borderColor: error ? '#ef4444' : '#FFD700' },
    },
    '& .MuiInputLabel-root': { color: '#888' },
    '& .MuiInputBase-input': { color: '#fff', fontSize: '0.88rem' },
  };

  const isAutoCalc = AUTO_CALC_KEYS.has(field.key);

  const copyBtn = field.value ? (
    <InputAdornment position="end">
      <IconButton size="small" onClick={handleCopy} sx={{ color: isCopied ? '#22c55e' : '#555' }}>
        {isCopied ? <CheckCircleIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
      </IconButton>
    </InputAdornment>
  ) : null;

  // Date
  if (field.type === 'date') {
    return (
      <TextField fullWidth label={field.label} type="date" value={getDateValue()} onChange={handleDateChange}
        InputLabelProps={{ shrink: true }} size="small" sx={inputSx}
        error={!!error} helperText={error} />
    );
  }

  // Select (Ông/Bà, Nơi cấp)
  if (field.type === 'select') {
    return (
      <FormControl fullWidth size="small" sx={inputSx}>
        <InputLabel>{field.label}</InputLabel>
        <Select value={field.value} onChange={(e) => onChange(field.key, e.target.value)} label={field.label}
          sx={{ color: '#fff', '& .MuiSvgIcon-root': { color: '#888' } }}>
          {field.options?.map(o => (
            <MenuItem key={o.value} value={o.value}>{o.label || o.value || '(để trống)'}</MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  // Bank select (with search)
  if (field.type === 'bankSelect') {
    const bankOptions = banks?.length > 0
      ? banks.map(b => ({ label: `${b.shortName} - ${b.name}`, value: `Ngân hàng ${b.name} (${b.shortName})` }))
      : [];
    return (
      <Autocomplete
        freeSolo
        options={bankOptions}
        value={field.value}
        onInputChange={(_, val) => onChange(field.key, val)}
        onChange={(_, opt) => onChange(field.key, typeof opt === 'string' ? opt : opt?.value || '')}
        renderInput={(params) => (
          <TextField {...params} label={field.label} size="small" sx={inputSx}
            error={!!error} helperText={error} placeholder={field.placeholder} />
        )}
      />
    );
  }

  // Auto-calculated (read-only styled)
  if (isAutoCalc) {
    return (
      <TextField fullWidth label={field.label} value={field.value} size="small" sx={{
        ...inputSx,
        '& .MuiOutlinedInput-root': { ...inputSx['& .MuiOutlinedInput-root'], background: '#0d0d0d' }
      }}
        InputProps={{ readOnly: true, endAdornment: copyBtn }}
        placeholder="Tự động tính..."
        inputProps={{ style: { color: '#22c55e', fontWeight: 600 } }}
      />
    );
  }

  // Default text/number
  return (
    <TextField fullWidth label={field.label} value={field.value}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder} size="small" sx={inputSx}
      error={!!error} helperText={error}
      type={field.type === 'number' ? 'text' : 'text'}
      InputProps={{ endAdornment: copyBtn }}
    />
  );
};

// ─── IMAGE UPLOAD COMPONENT ─────────────────────────────────────────────────────

const ImageUploadBox = ({ label, file, preview, onUpload, onRemove }) => {
  const inputRef = useRef();
  return (
    <Box sx={{ border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 1.5, p: 1.5, textAlign: 'center' }}>
      <Typography sx={{ fontSize: '0.75rem', color: '#888', mb: 1 }}>{label}</Typography>
      {preview ? (
        <Box sx={{ position: 'relative' }}>
          <img src={preview} alt={label} style={{ width: '100%', maxHeight: 100, objectFit: 'cover', borderRadius: 6 }} />
          <IconButton size="small" onClick={onRemove}
            sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.7)', color: '#ef4444', '&:hover': { bgcolor: '#ef4444', color: '#fff' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Box onClick={() => inputRef.current?.click()} sx={{ cursor: 'pointer', py: 1 }}>
          <ImageIcon sx={{ color: '#444', fontSize: 32 }} />
          <Typography sx={{ fontSize: '0.7rem', color: '#555', mt: 0.5 }}>Nhấn để chọn ảnh</Typography>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }} />
        </Box>
      )}
    </Box>
  );
};

// ─── PROFILE ROW COMPONENT ──────────────────────────────────────────────────────

const ProfileRow = ({ profile, onLoad, onDelete, index }) => {
  const data = profile.data || {};
  return (
    <TableRow sx={{ '&:hover': { bgcolor: 'rgba(255,215,0,0.03)' }, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <TableCell sx={{ color: '#FFD700', fontWeight: 700, width: 50 }}>{index + 1}</TableCell>
      <TableCell>
        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{profile.name}</Typography>
        <Typography sx={{ color: '#888', fontSize: '0.75rem' }}>{data.email || data.dien_thoai || ''}</Typography>
      </TableCell>
      <TableCell sx={{ color: '#ccc', fontSize: '0.85rem' }}>{data.cccd || '—'}</TableCell>
      <TableCell sx={{ color: '#ccc', fontSize: '0.85rem' }}>{data.stk || '—'}</TableCell>
      <TableCell sx={{ color: '#aaa', fontSize: '0.8rem' }}>
        {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : '—'}
      </TableCell>
      <TableCell align="right">
        <Tooltip title="Nạp vào form">
          <IconButton size="small" onClick={() => onLoad(profile)} sx={{ color: '#FFD700', mr: 0.5 }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Xóa hồ sơ">
          <IconButton size="small" onClick={() => onDelete(profile.id)} sx={{ color: '#ef4444' }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────────

const ContractsPage = () => {
  const { isAdminMode, user } = useAuth();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  // Tabs
  const [tab, setTab] = useState(0);

  // Templates
  const [contractFile, setContractFile] = useState(null);
  const [acceptanceFile, setAcceptanceFile] = useState(null);
  const [customContractFile, setCustomContractFile] = useState(null);
  const [customAcceptanceFile, setCustomAcceptanceFile] = useState(null);
  const [templateUploading, setTemplateUploading] = useState(false);

  // Fields
  const [fields, setFields] = useState(DEFAULT_FIELDS.map(f => ({ ...f })));
  const [validationErrors, setValidationErrors] = useState({});
  const [expandedSections, setExpandedSections] = useState({ 'Party B': true, Time: true, Job: true, Financial: true });

  // AI
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Images
  const [idCardFront, setIdCardFront] = useState(null);
  const [idCardFrontPreview, setIdCardFrontPreview] = useState(null);
  const [idCardBack, setIdCardBack] = useState(null);
  const [idCardBackPreview, setIdCardBackPreview] = useState(null);
  const [vneidImage, setVneidImage] = useState(null);
  const [vneidPreview, setVneidPreview] = useState(null);

  // Profiles
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [profileSearch, setProfileSearch] = useState('');
  const [profilePage, setProfilePage] = useState(0);
  const [rowsPerPage] = useState(10);

  // Banks
  const [banks, setBanks] = useState([]);

  // Computed files (custom overrides global)
  const effectiveContractFile = customContractFile || contractFile;
  const effectiveAcceptanceFile = customAcceptanceFile || acceptanceFile;

  // ── Load data on mount ──

  const loadProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    try {
      const data = await getAllContractProfiles();
      setProfiles(data);
    } catch (e) {
      showSnackbar('Lỗi khi tải danh sách hồ sơ', 'error');
    } finally {
      setLoadingProfiles(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    // Load banks
    fetch('https://api.vietqr.io/v2/banks')
      .then(r => r.json())
      .then(d => { if (d?.data) setBanks(d.data); })
      .catch(() => {});

    // Load profiles
    loadProfiles();

    // Load global templates
    getContractTemplates().then(templates => {
      const loaded = {};
      templates.forEach(t => {
        fetch(t.base64)
          .then(r => r.arrayBuffer())
          .then(buf => {
            const file = new File([buf], t.name, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            loaded[t.id] = file;
            if (t.id === 'contract') setContractFile(file);
            if (t.id === 'acceptance') setAcceptanceFile(file);
            // Parse extra keys from template
            extractKeysFromDocx(file).then(keys => addExtraFields(keys));
          })
          .catch(() => {});
      });
    }).catch(() => {});
  }, [loadProfiles]);

  // Update bank options in fields
  useEffect(() => {
    if (banks.length === 0) return;
    setFields(prev => prev.map(f => {
      if (f.key === 'ngan_hang') {
        return { ...f, options: banks.map(b => ({ label: `${b.shortName} - ${b.name}`, value: `Ngân hàng ${b.name} (${b.shortName})` })) };
      }
      return f;
    }));
  }, [banks]);

  // Auto-calculate financial fields
  useEffect(() => {
    const sl = fields.find(f => f.key === 'so_luong');
    const dg = fields.find(f => f.key === 'don_gia');
    if (!sl || !dg) return;

    const parseMoney = (v) => parseFloat(v.replace(/[.,\s]/g, ''));
    const slVal = parseMoney(sl.value || '0');
    const dgVal = parseMoney(dg.value || '0');
    if (isNaN(slVal) || isNaN(dgVal) || !dg.value.trim()) return;

    const thanhTien = slVal * dgVal;
    const thucNhan = thanhTien * 0.9;
    const ttStr = formatCurrency(thanhTien);
    const tnStr = formatCurrency(thucNhan);
    const ttText = numberToVietnameseText(Math.round(thanhTien));
    const tnText = numberToVietnameseText(Math.round(thucNhan));

    setFields(prev => {
      const cur = prev.find(f => f.key === 'thanh_tien')?.value;
      if (cur === ttStr) return prev;
      return prev.map(f => {
        if (f.key === 'thanh_tien') return { ...f, value: ttStr };
        if (f.key === 'thuc_nhan') return { ...f, value: tnStr };
        if (f.key === 'bang_chu_thanh_tien') return { ...f, value: ttText };
        if (f.key === 'bang_chu_thuc_nhan') return { ...f, value: tnText };
        return f;
      });
    });
  }, [fields.find(f => f.key === 'so_luong')?.value, fields.find(f => f.key === 'don_gia')?.value]); // eslint-disable-line

  const addExtraFields = (keys) => {
    setFields(prev => {
      const next = [...prev];
      keys.forEach(key => {
        if (IGNORED_IMAGE_FIELDS.includes(key)) return;
        if (next.find(f => f.key === key)) return;
        next.push({ key, label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: '', section: 'Other', type: 'text' });
      });
      return next;
    });
  };

  // ── Field handlers ──

  const updateField = useCallback((key, value) => {
    let finalValue = value;
    if (key === 'ho_ten') finalValue = value.toUpperCase();

    setFields(prev => prev.map(f => {
      if (f.key === key) return { ...f, value: finalValue };
      if (key === 'ho_ten' && f.key === 'ten_viet_tat') {
        const abbr = finalValue.trim().split(/\s+/).map(w => w.charAt(0)).join('');
        return { ...f, value: abbr };
      }
      return f;
    }));

    const err = validateContractField(key, finalValue);
    setValidationErrors(prev => ({ ...prev, [key]: err || '' }));
  }, []);

  const filledCount = useMemo(() => fields.filter(f => f.value.trim()).length, [fields]);
  const progress = Math.round((filledCount / fields.length) * 100);

  const groupedFields = useMemo(() => {
    const g = {};
    fields.forEach(f => {
      const s = f.section || 'Other';
      if (!g[s]) g[s] = [];
      g[s].push(f);
    });
    return g;
  }, [fields]);

  // ── Template handlers ──

  const handleFileUpload = async (file, type) => {
    if (type === 'contract') setCustomContractFile(file);
    else setCustomAcceptanceFile(file);
    const keys = await extractKeysFromDocx(file);
    addExtraFields(keys);
  };

  const handleSaveGlobalTemplate = async (file, type) => {
    if (!isAdminMode) return;
    setTemplateUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (e) => {
        const base64 = e.target.result;
        await saveContractTemplate(type, file.name, base64, user?.email || 'admin');
        if (type === 'contract') setContractFile(file);
        else setAcceptanceFile(file);
        showSnackbar(`Đã lưu mẫu ${type === 'contract' ? 'hợp đồng' : 'nghiệm thu'} toàn cục!`, 'success');
        setTemplateUploading(false);
      };
    } catch (e) {
      showSnackbar('Lỗi khi lưu mẫu toàn cục', 'error');
      setTemplateUploading(false);
    }
  };

  // ── Image handlers ──

  const handleIdFront = (file) => {
    setIdCardFront(file);
    setIdCardFrontPreview(URL.createObjectURL(file));
  };
  const handleIdBack = (file) => {
    setIdCardBack(file);
    setIdCardBackPreview(URL.createObjectURL(file));
  };
  const handleVneid = (file) => {
    setVneidImage(file);
    setVneidPreview(URL.createObjectURL(file));
  };

  // ── Clear form ──

  const handleClear = () => {
    if (!window.confirm('Xóa toàn bộ dữ liệu đang nhập để nhập mới?')) return;
    setFields(DEFAULT_FIELDS.map(f => ({ ...f })));
    setActiveProfileId(null);
    setIdCardFront(null); setIdCardFrontPreview(null);
    setIdCardBack(null); setIdCardBackPreview(null);
    setVneidImage(null); setVneidPreview(null);
    setValidationErrors({});
  };

  // ── Save profile ──

  const handleSaveProfile = async () => {
    const nameField = fields.find(f => f.key === 'ho_ten');
    if (!nameField?.value.trim()) {
      showSnackbar('Vui lòng nhập Họ tên trước khi lưu hồ sơ', 'warning');
      return;
    }

    let frontBase64 = null, backBase64 = null, vneidBase64 = null;
    try {
      if (idCardFront) frontBase64 = await fileToBase64(idCardFront);
      if (idCardBack) backBase64 = await fileToBase64(idCardBack);
      if (vneidImage) vneidBase64 = await fileToBase64(vneidImage);
    } catch { showSnackbar('Lỗi xử lý ảnh', 'error'); return; }

    const profileData = {};
    fields.filter(f => f.section === 'Party B').forEach(f => { profileData[f.key] = f.value; });

    const profile = {
      id: activeProfileId || Date.now().toString(),
      name: nameField.value,
      data: profileData,
      idCardFront: frontBase64,
      idCardBack: backBase64,
      vneidImage: vneidBase64,
      createdAt: activeProfileId
        ? (profiles.find(p => p.id === activeProfileId)?.createdAt || Date.now())
        : Date.now()
    };

    try {
      if (activeProfileId) {
        await updateContractProfile(profile);
        setProfiles(prev => prev.map(p => p.id === activeProfileId ? profile : p));
        showSnackbar('Đã cập nhật hồ sơ!', 'success');
      } else {
        await saveContractProfile(profile);
        setProfiles(prev => [profile, ...prev]);
        setActiveProfileId(profile.id);
        showSnackbar('Đã lưu hồ sơ mới!', 'success');
      }
    } catch (e) {
      showSnackbar('Lỗi khi lưu hồ sơ: ' + e.message, 'error');
    }
  };

  // ── Load profile ──

  const handleLoadProfile = async (profile) => {
    setActiveProfileId(profile.id);
    setFields(prev => prev.map(f => {
      if (profile.data?.[f.key] !== undefined) return { ...f, value: profile.data[f.key] };
      return f;
    }));

    if (profile.idCardFront) {
      base64ToFile(profile.idCardFront, 'CCCD_Mat_Truoc.jpg').then(f => { setIdCardFront(f); setIdCardFrontPreview(profile.idCardFront); }).catch(() => {});
    } else {
      setIdCardFront(null); setIdCardFrontPreview(null);
    }
    if (profile.idCardBack) {
      base64ToFile(profile.idCardBack, 'CCCD_Mat_Sau.jpg').then(f => { setIdCardBack(f); setIdCardBackPreview(profile.idCardBack); }).catch(() => {});
    } else {
      setIdCardBack(null); setIdCardBackPreview(null);
    }
    if (profile.vneidImage) {
      base64ToFile(profile.vneidImage, 'VNeID.jpg').then(f => { setVneidImage(f); setVneidPreview(profile.vneidImage); }).catch(() => {});
    } else {
      setVneidImage(null); setVneidPreview(null);
    }

    setTab(0);
    showSnackbar(`Đã nạp hồ sơ: ${profile.name}`, 'info');
  };

  // ── Delete profile ──

  const handleDeleteProfile = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa hồ sơ này?')) return;
    try {
      await deleteContractProfile(id);
      setProfiles(prev => prev.filter(p => p.id !== id));
      if (activeProfileId === id) handleClear();
      showSnackbar('Đã xóa hồ sơ', 'success');
    } catch (e) {
      showSnackbar('Lỗi khi xóa hồ sơ', 'error');
    }
  };

  // ── Generate document ──

  const handleGenerate = async (type) => {
    const file = type === 'contract' ? effectiveContractFile : effectiveAcceptanceFile;
    if (!file) { showSnackbar('Vui lòng tải lên file mẫu .docx trước', 'warning'); return; }
    if (!fields.some(f => f.value.trim())) { showSnackbar('Vui lòng nhập thông tin', 'warning'); return; }
    if (Object.values(validationErrors).some(e => e)) { showSnackbar('Vui lòng sửa các lỗi nhập liệu trước', 'error'); return; }

    const data = {};
    fields.forEach(f => { data[f.key] = f.value; });

    const images = {};
    if (idCardFront) images['cccd_truoc'] = await fileToArrayBuffer(idCardFront);
    if (idCardBack) images['cccd_sau'] = await fileToArrayBuffer(idCardBack);
    if (vneidImage) images['vneid'] = await fileToArrayBuffer(vneidImage);

    const fileName = type === 'contract'
      ? `HopDong_${data.ho_ten || 'Moi'}.docx`
      : `NghiemThu_${data.ho_ten || 'Moi'}.docx`;

    try {
      const arrBuf = await fileToArrayBuffer(file);
      const zip = new PizZip(arrBuf);
      const options = { paragraphLoop: true, linebreaks: true, nullGetter: () => '' };

      // Image module support (if loaded via CDN)
      if (Object.keys(images).length > 0 && window.ImageModule) {
        options.modules = [new window.ImageModule({
          centered: false,
          getImage: (_tag, tagName) => images[tagName] ? new Uint8Array(images[tagName]) : null,
          getSize: () => [500, 300],
        })];
        Object.keys(images).forEach(k => { data[k] = 'image_placeholder'; });
      }

      const doc = new Docxtemplater(zip, options);
      doc.render(data);

      const blob = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      saveAs(blob, fileName);
      showSnackbar(`Đã xuất file ${fileName}!`, 'success');
    } catch (e) {
      console.error(e);
      showSnackbar('Lỗi tạo file. Kiểm tra file mẫu .docx đúng định dạng.', 'error');
    }
  };

  // ── AI auto-fill (optional – requires REACT_APP_GEMINI_API_KEY) ──

  const handleAiAutoFill = async () => {
    if (!aiPrompt.trim()) return;
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey) {
      showSnackbar('Chưa cấu hình REACT_APP_GEMINI_API_KEY trong .env', 'warning');
      return;
    }
    setAiLoading(true);
    try {
      const fieldDescriptions = fields.map(f => `- ${f.key}: ${f.label}`).join('\n');
      const prompt = `Trích xuất thông tin hợp đồng từ văn bản dưới đây và trả về JSON với các key sau:\n${fieldDescriptions}\n\nVăn bản: "${aiPrompt}"\n\nChỉ trả về JSON thuần túy, không bọc trong markdown. Nếu thiếu thông tin, để chuỗi rỗng "".`;

      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error?.message || `HTTP ${resp.status}`);
      }
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawText.trim()) throw new Error('AI không trả về dữ liệu');
      // Strip markdown code fences, then try to extract JSON object/array
      let jsonText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const match = jsonText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (match) jsonText = match[1];
      const json = JSON.parse(jsonText);
      setFields(prev => prev.map(f => json[f.key] ? { ...f, value: json[f.key] } : f));
      setShowAI(false);
      showSnackbar('AI đã điền thông tin!', 'success');
    } catch (e) {
      showSnackbar('AI không thể trích xuất dữ liệu: ' + e.message, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Filtered profiles ──

  const filteredProfiles = useMemo(() => {
    if (!profileSearch.trim()) return profiles;
    const q = profileSearch.toLowerCase();
    return profiles.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.data?.email?.toLowerCase().includes(q) ||
      p.data?.dien_thoai?.includes(q) ||
      p.data?.cccd?.includes(q)
    );
  }, [profiles, profileSearch]);

  const displayedProfiles = filteredProfiles.slice(profilePage * rowsPerPage, profilePage * rowsPerPage + rowsPerPage);

  // ── Shared styles ──

  const cardSx = { background: '#1e1e1e', border: '1px solid rgba(255,215,0,0.1)', borderRadius: 2 };
  const sectionHeaderSx = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, px: 2, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.06)', '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } };

  // ── Template upload row ──

  const TemplateRow = ({ type, label, globalFile, customFile, onUploadCustom, onClearCustom }) => {
    const activeFile = customFile || globalFile;
    const inputRef = useRef();
    return (
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ color: '#888', fontSize: '0.75rem', fontWeight: 600, mb: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Typography>
        {activeFile ? (
          <Box sx={{ ...cardSx, p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <DescriptionIcon sx={{ color: '#4ECDC4', fontSize: 20 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeFile.name}
              </Typography>
              <Typography sx={{ color: '#888', fontSize: '0.7rem' }}>
                {globalFile && !customFile ? 'Mẫu toàn cục' : 'Mẫu tùy chỉnh'}
              </Typography>
            </Box>
            {customFile && (
              <Tooltip title="Xóa mẫu tùy chỉnh (dùng lại mẫu mặc định)">
                <IconButton size="small" onClick={onClearCustom} sx={{ color: '#888' }}><CloseIcon fontSize="small" /></IconButton>
              </Tooltip>
            )}
            <Tooltip title="Tải về để xem">
              <IconButton size="small" onClick={() => saveAs(activeFile, activeFile.name)} sx={{ color: '#FFD700' }}><DownloadIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box onClick={() => inputRef.current?.click()} sx={{ ...cardSx, p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: '#FFD700' }, transition: 'border-color 0.2s' }}>
            <UploadFileIcon sx={{ color: '#555', fontSize: 28 }} />
            <Typography sx={{ color: '#666', fontSize: '0.75rem', mt: 0.5 }}>Nhấn để tải lên file .docx</Typography>
          </Box>
        )}
        <input ref={inputRef} type="file" accept=".docx" hidden onChange={(e) => { if (e.target.files?.[0]) onUploadCustom(e.target.files[0]); }} />
        {!customFile && (
          <Button size="small" startIcon={<UploadFileIcon />} onClick={() => inputRef.current?.click()}
            sx={{ mt: 0.5, color: '#555', fontSize: '0.7rem', '&:hover': { color: '#FFD700' } }}>
            {activeFile ? 'Thay thế mẫu' : 'Tải lên'}
          </Button>
        )}
        {isAdminMode && activeFile && !customFile && (
          <Typography sx={{ fontSize: '0.65rem', color: '#555', mt: 0.5 }}>✓ Đây là mẫu toàn cục (admin đã upload)</Typography>
        )}
        {isAdminMode && customFile && (
          <Button size="small" startIcon={<CloudUploadIcon />} onClick={() => handleSaveGlobalTemplate(customFile, type)} disabled={templateUploading}
            sx={{ mt: 0.5, color: '#4ECDC4', fontSize: '0.7rem', '&:hover': { color: '#fff' } }}>
            {templateUploading ? 'Đang lưu...' : 'Lưu làm mẫu toàn cục'}
          </Button>
        )}
      </Box>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────────────────────

  return (
    <Box>
      <PageHeader
        title="Hợp Đồng"
        subtitle="Tạo hợp đồng & biên bản nghiệm thu tự động từ mẫu .docx"
        breadcrumbs={[{ label: 'Trang chủ', path: '/' }, { label: 'Hợp Đồng', path: '/contracts' }]}
        actionText={activeProfileId ? 'Cập nhật hồ sơ' : 'Lưu hồ sơ'}
        actionIcon={SaveIcon}
        onAction={handleSaveProfile}
      />

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
        mb: 3, borderBottom: '1px solid rgba(255,255,255,0.08)',
        '& .MuiTab-root': { color: '#888', minHeight: 48, textTransform: 'none', fontWeight: 600 },
        '& .Mui-selected': { color: '#FFD700' },
        '& .MuiTabs-indicator': { backgroundColor: '#FFD700' },
      }}>
        <Tab icon={<ArticleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Tạo Hợp Đồng" />
        <Tab icon={<ListAltIcon sx={{ fontSize: 18 }} />} iconPosition="start"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              Quản Lý Hồ Sơ
              {profiles.length > 0 && (
                <Chip label={profiles.length} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(255,215,0,0.15)', color: '#FFD700' }} />
              )}
            </Box>
          }
        />
      </Tabs>

      {/* ════ TAB 0: CREATE ════ */}
      {tab === 0 && (
        <Grid container spacing={3}>
          {/* LEFT COLUMN */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Templates */}
              <GlassCard tilt={false} sx={{ ...cardSx, p: 2.5 }}>
                <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ bgcolor: 'rgba(255,215,0,0.15)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#FFD700', fontWeight: 700 }}>1</Box>
                  File Mẫu (.docx)
                </Typography>

                <TemplateRow type="contract" label="Mẫu Hợp Đồng" globalFile={contractFile}
                  customFile={customContractFile}
                  onUploadCustom={(f) => handleFileUpload(f, 'contract')}
                  onClearCustom={() => setCustomContractFile(null)} />

                <TemplateRow type="acceptance" label="Mẫu Nghiệm Thu" globalFile={acceptanceFile}
                  customFile={customAcceptanceFile}
                  onUploadCustom={(f) => handleFileUpload(f, 'acceptance')}
                  onClearCustom={() => setCustomAcceptanceFile(null)} />
              </GlassCard>

              {/* Export */}
              <GlassCard tilt={false} sx={{ ...cardSx, p: 2.5 }}>
                <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ bgcolor: 'rgba(255,215,0,0.15)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#FFD700', fontWeight: 700 }}>3</Box>
                  Xuất Tài Liệu
                </Typography>

                {/* Progress */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ color: '#888', fontSize: '0.75rem' }}>Đã điền</Typography>
                    <Typography sx={{ color: '#FFD700', fontSize: '0.75rem', fontWeight: 700 }}>{filledCount}/{fields.length}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={progress} sx={{
                    height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.08)',
                    '& .MuiLinearProgress-bar': { bgcolor: progress >= 80 ? '#22c55e' : '#FFD700', borderRadius: 3 }
                  }} />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button fullWidth variant="contained" startIcon={<DownloadIcon />}
                    onClick={() => handleGenerate('contract')}
                    disabled={!effectiveContractFile}
                    sx={{ bgcolor: '#FFD700', color: '#000', fontWeight: 700, '&:hover': { bgcolor: '#FFC300' }, '&:disabled': { bgcolor: '#333', color: '#555' } }}>
                    Tải Hợp Đồng (.docx)
                  </Button>
                  <Button fullWidth variant="outlined" startIcon={<DownloadIcon />}
                    onClick={() => handleGenerate('acceptance')}
                    disabled={!effectiveAcceptanceFile}
                    sx={{ borderColor: 'rgba(255,215,0,0.3)', color: '#FFD700', '&:hover': { borderColor: '#FFD700', bgcolor: 'rgba(255,215,0,0.05)' }, '&:disabled': { borderColor: '#333', color: '#555' } }}>
                    Tải BB Nghiệm Thu (.docx)
                  </Button>
                </Box>
              </GlassCard>

              {/* ID Card Images */}
              <GlassCard tilt={false} sx={{ ...cardSx, p: 2.5 }}>
                <Typography sx={{ fontWeight: 700, color: '#fff', mb: 1.5, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageIcon sx={{ fontSize: 18, color: '#888' }} />
                  Ảnh CCCD / VNeID
                  <Tooltip title="Ảnh sẽ được nhúng vào file .docx nếu mẫu có placeholder {%cccd_truoc}, {%cccd_sau}, {%vneid}">
                    <HelpOutlineIcon sx={{ fontSize: 14, color: '#555', cursor: 'help' }} />
                  </Tooltip>
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <ImageUploadBox label="Mặt trước" file={idCardFront} preview={idCardFrontPreview}
                      onUpload={handleIdFront} onRemove={() => { setIdCardFront(null); setIdCardFrontPreview(null); }} />
                  </Grid>
                  <Grid item xs={4}>
                    <ImageUploadBox label="Mặt sau" file={idCardBack} preview={idCardBackPreview}
                      onUpload={handleIdBack} onRemove={() => { setIdCardBack(null); setIdCardBackPreview(null); }} />
                  </Grid>
                  <Grid item xs={4}>
                    <ImageUploadBox label="VNeID" file={vneidImage} preview={vneidPreview}
                      onUpload={handleVneid} onRemove={() => { setVneidImage(null); setVneidPreview(null); }} />
                  </Grid>
                </Grid>
              </GlassCard>

              {/* Active profile indicator */}
              {activeProfileId && (
                <Alert severity="info" sx={{ bgcolor: 'rgba(59,130,246,0.1)', color: '#93c5fd', '& .MuiAlert-icon': { color: '#93c5fd' }, border: '1px solid rgba(59,130,246,0.2)', borderRadius: 2 }}
                  action={<Button size="small" sx={{ color: '#93c5fd' }} onClick={handleClear}>Nhập mới</Button>}>
                  Đang sửa: <strong>{profiles.find(p => p.id === activeProfileId)?.name}</strong>
                </Alert>
              )}
            </Box>
          </Grid>

          {/* RIGHT COLUMN */}
          <Grid item xs={12} lg={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* AI Section */}
              <GlassCard tilt={false} sx={{ ...cardSx, p: 2.5, background: 'linear-gradient(135deg, rgba(99,50,240,0.05) 0%, rgba(78,205,196,0.05) 100%)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon sx={{ color: '#a78bfa', fontSize: 20 }} />
                    AI Tự Động Điền
                    <Chip label="Beta" size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: 'rgba(167,139,250,0.15)', color: '#a78bfa' }} />
                  </Typography>
                  <Button size="small" onClick={() => setShowAI(!showAI)}
                    sx={{ color: '#a78bfa', textTransform: 'none', fontWeight: 600 }}>
                    {showAI ? 'Ẩn' : 'Mở công cụ'}
                  </Button>
                </Box>
                <Collapse in={showAI}>
                  <Box sx={{ mt: 2 }}>
                    <TextField fullWidth multiline rows={3} value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Mô tả thông tin cá nhân, công việc, mức thù lao... AI sẽ tự điền vào các trường tương ứng."
                      sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { background: 'rgba(0,0,0,0.3)', '& fieldset': { borderColor: 'rgba(167,139,250,0.3)' }, '&:hover fieldset': { borderColor: '#a78bfa' }, '&.Mui-focused fieldset': { borderColor: '#a78bfa' } }, '& .MuiInputBase-input': { color: '#fff', fontSize: '0.88rem' } }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="contained" disabled={aiLoading || !aiPrompt.trim()} onClick={handleAiAutoFill}
                        startIcon={aiLoading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <AutoAwesomeIcon />}
                        sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, textTransform: 'none' }}>
                        {aiLoading ? 'Đang xử lý...' : 'Trích xuất dữ liệu'}
                      </Button>
                    </Box>
                  </Box>
                </Collapse>
              </GlassCard>

              {/* Fields */}
              <GlassCard tilt={false} sx={cardSx}>
                <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ bgcolor: 'rgba(255,215,0,0.15)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#FFD700', fontWeight: 700 }}>2</Box>
                    Nhập Thông Tin
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Profile quick-load (Party B section) */}
                    {profiles.length > 0 && (
                      <FormControl size="small" sx={{ minWidth: 180 }}>
                        <Select displayEmpty value="" onChange={(e) => { if (e.target.value) { const p = profiles.find(x => x.id === e.target.value); if (p) handleLoadProfile(p); } }}
                          sx={{ background: '#1a1a1a', color: '#888', fontSize: '0.8rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }, '& .Mui-selected': { color: '#FFD700' } }}>
                          <MenuItem value="" disabled>
                            <Typography sx={{ fontSize: '0.8rem', color: '#888' }}>Nạp hồ sơ...</Typography>
                          </MenuItem>
                          {profiles.map(p => (
                            <MenuItem key={p.id} value={p.id} sx={{ fontSize: '0.85rem' }}>{p.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    {filledCount > 0 && (
                      <Button size="small" onClick={handleClear} startIcon={<RefreshIcon />}
                        sx={{ color: '#ef4444', textTransform: 'none', fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}>
                        Xóa / Nhập mới
                      </Button>
                    )}
                    <Typography sx={{ color: '#FFD700', fontWeight: 700, fontSize: '0.8rem', minWidth: 60, textAlign: 'right' }}>
                      {filledCount}/{fields.length}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ p: 2.5 }}>
                  {Object.entries(groupedFields).map(([section, sectionFields]) => {
                    const config = SECTION_CONFIG[section] || SECTION_CONFIG['Other'];
                    const isExpanded = expandedSections[section] !== false;
                    return (
                      <Box key={section} sx={{ mb: 3 }}>
                        <Box sx={sectionHeaderSx} onClick={() => setExpandedSections(prev => ({ ...prev, [section]: !isExpanded }))}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 4, height: 16, borderRadius: 1, bgcolor: config.color }} />
                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#ccc', textTransform: 'uppercase', letterSpacing: 1 }}>
                              {config.label}
                            </Typography>
                            <Chip label={sectionFields.filter(f => f.value.trim()).length + '/' + sectionFields.length}
                              size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.05)', color: '#888' }} />
                          </Box>
                          {isExpanded ? <ExpandLessIcon sx={{ color: '#555', fontSize: 18 }} /> : <ExpandMoreIcon sx={{ color: '#555', fontSize: 18 }} />}
                        </Box>
                        <Collapse in={isExpanded}>
                          <Box sx={{ pt: 2 }}>
                            {section === 'Party B' && (
                              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1.5, border: '1px dashed rgba(255,255,255,0.06)' }}>
                                <Typography sx={{ color: '#555', fontSize: '0.72rem', mb: 1 }}>
                                  💡 Thông tin cá nhân (Họ tên, CCCD, STK...) sẽ được lưu vào hồ sơ để tái sử dụng.
                                </Typography>
                              </Box>
                            )}
                            <Grid container spacing={2}>
                              {sectionFields.map(f => (
                                <Grid item xs={12} sm={section === 'Time' || section === 'Financial' ? 6 : 12} md={section === 'Time' ? 3 : section === 'Financial' ? 6 : (f.key === 'cong_viec' || f.key === 'cong_viec_cu_the' || f.key === 'yeu_cau' ? 12 : 6)} key={f.key}>
                                  <FieldInput field={f} onChange={updateField} banks={banks} error={validationErrors[f.key]} />
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        </Collapse>
                      </Box>
                    );
                  })}
                </Box>
              </GlassCard>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* ════ TAB 1: PROFILES ════ */}
      {tab === 1 && (
        <Box>
          {/* Toolbar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField placeholder="Tìm kiếm hồ sơ (tên, email, CCCD...)" value={profileSearch}
              onChange={(e) => setProfileSearch(e.target.value)}
              size="small" sx={{ flex: 1, minWidth: 240,
                '& .MuiOutlinedInput-root': { background: '#1e1e1e', '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' }, '&:hover fieldset': { borderColor: '#FFD700' }, '&.Mui-focused fieldset': { borderColor: '#FFD700' } },
                '& .MuiInputBase-input': { color: '#fff' } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#888' }} /></InputAdornment> }}
            />
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadProfiles} disabled={loadingProfiles}
              sx={{ borderColor: 'rgba(255,215,0,0.3)', color: '#FFD700', '&:hover': { borderColor: '#FFD700' } }}>
              Làm mới
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setActiveProfileId(null); setTab(0); }}
              sx={{ bgcolor: '#FFD700', color: '#000', fontWeight: 700, '&:hover': { bgcolor: '#FFC300' } }}>
              Tạo hồ sơ mới
            </Button>
          </Box>

          {/* Table */}
          {loadingProfiles ? (
            <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: '#FFD700' }} /></Box>
          ) : filteredProfiles.length === 0 ? (
            <Box sx={{ ...cardSx, textAlign: 'center', py: 8 }}>
              <PersonIcon sx={{ fontSize: 48, color: '#333', mb: 1 }} />
              <Typography sx={{ color: '#555' }}>
                {profileSearch ? 'Không tìm thấy hồ sơ phù hợp' : 'Chưa có hồ sơ nào. Tạo hồ sơ đầu tiên!'}
              </Typography>
            </Box>
          ) : (
            <GlassCard tilt={false} sx={{ ...cardSx, overflow: 'hidden' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ background: 'rgba(0,0,0,0.2)' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#B3B3B3', fontWeight: 600, width: 50 }}>#</TableCell>
                      <TableCell sx={{ color: '#B3B3B3', fontWeight: 600 }}>Họ tên / Email</TableCell>
                      <TableCell sx={{ color: '#B3B3B3', fontWeight: 600, width: 140 }}>CCCD</TableCell>
                      <TableCell sx={{ color: '#B3B3B3', fontWeight: 600, width: 140 }}>STK</TableCell>
                      <TableCell sx={{ color: '#B3B3B3', fontWeight: 600, width: 110 }}>Ngày tạo</TableCell>
                      <TableCell sx={{ color: '#B3B3B3', fontWeight: 600, width: 100 }} align="right">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedProfiles.map((profile, idx) => (
                      <ProfileRow key={profile.id} profile={profile} index={profilePage * rowsPerPage + idx}
                        onLoad={handleLoadProfile} onDelete={handleDeleteProfile} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {filteredProfiles.length > rowsPerPage && (
                <TablePagination component="div" count={filteredProfiles.length} page={profilePage} rowsPerPage={rowsPerPage}
                  onPageChange={(_, p) => setProfilePage(p)}
                  rowsPerPageOptions={[10]}
                  sx={{ color: '#888', '& .MuiTablePagination-select': { color: '#888' }, '& .MuiSvgIcon-root': { color: '#888' } }}
                />
              )}
            </GlassCard>
          )}
        </Box>
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
          <Alert severity={snackbar.severity} onClose={hideSnackbar}
            sx={{ bgcolor: snackbar.severity === 'success' ? '#1a3a1a' : snackbar.severity === 'error' ? '#3a1a1a' : '#1a2a3a', color: '#fff', border: `1px solid ${snackbar.severity === 'success' ? '#22c55e33' : snackbar.severity === 'error' ? '#ef444433' : '#3b82f633'}` }}>
            {snackbar.message}
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default ContractsPage;
