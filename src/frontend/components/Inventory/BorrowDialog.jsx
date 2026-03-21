import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
    Alert, Button
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FacebookIcon from '@mui/icons-material/Facebook';

const BorrowDialog = ({
    open,
    onClose,
    selectedBorrowItems,
    formatBorrowMessage,
    handleCopyMessage,
    handleConfirmBorrow
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
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
            <DialogContent sx={{ pt: 3, paddingTop: '1px' }}>
                <Alert severity="info" sx={{ mb: 3, background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', color: '#FFE44D', paddingTop: '10px', marginTop: '10px' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Hướng dẫn:</strong> Sau khi click "Gửi qua Messenger", hệ thống sẽ:
                    </Typography>
                    <Typography variant="body2" component="div" sx={{ pl: 2 }}>
                        1. Sao chép tin nhắn vào clipboard<br />
                        2. Mở Facebook Messenger<br />
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
                        onClick={onClose}
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
    );
};

export default BorrowDialog;
