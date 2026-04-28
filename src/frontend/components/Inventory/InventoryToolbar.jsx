
import {
    Grid, TextField, FormControl, Select, MenuItem,
    Box, Button, Typography, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import { GlassCard } from '../../components';
const InventoryToolbar = ({
    isAdmin,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    types,
    borrowItems,
    handleOpenBorrowDialog,
    handleFileUpload,
    fileName,
    clearData,
    addRow,
    importToServer,
    loading,
    rawRows,
    remainingRows
}) => {
    return (
        <GlassCard tilt={false} sx={{ p: { xs: 2, sm: 3 }, background: '#1e1e1e', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Tìm theo tên vật phẩm"
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
        </GlassCard>
    );
};

export default InventoryToolbar;
