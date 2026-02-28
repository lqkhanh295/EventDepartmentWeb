import React, { useState, useRef } from 'react';
import {
    Box,
    Card,
    CardHeader,
    CardContent,
    Typography,
    TextField,
    Slider,
    Switch,
    Grid,
    Button,
    ToggleButton,
    ToggleButtonGroup,
    InputAdornment
} from '@mui/material';
import { Download as DownloadIcon, Link as LinkIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';



const QRGeneratorPage = () => {
    // const { token } = theme.useToken(); // Unused
    const [text, setText] = useState('https://vote.cocsaigon.club');
    const [size, setSize] = useState(250);
    const [icon, setIcon] = useState('');
    const [iconSize, setIconSize] = useState(40);
    const [color, setColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#FFFFFF');
    const [bordered, setBordered] = useState(true);
    const [errorLevel, setErrorLevel] = useState('M');
    const [downloadName, setDownloadName] = useState('QRCode');

    const qrRef = useRef(null);

    // Download feature using react-qr-code
    const downloadQRCode = () => {
        const svg = qrRef.current;
        if (!svg) return;

        // Serialize the SVG to a string
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = size + (bordered ? 40 : 0);
            canvas.height = size + (bordered ? 40 : 0);

            // Draw background if bordered
            if (bordered) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 20, 20);
            } else {
                canvas.width = size;
                canvas.height = size;
                ctx.drawImage(img, 0, 0);
            }

            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `${downloadName || 'QRCode'}.png`;
            downloadLink.href = `${pngFile}`;
            downloadLink.click();
        };

        // Add XML declarative text and set src
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        QR Code Generator
                    </Typography>
                    <Typography sx={{ color: '#aaa', mt: 1 }}>
                        Tạo và tùy chỉnh mã QR (không quảng cáo ^^)
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} lg={7}>
                        <Card sx={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 2 }}>
                            <CardHeader
                                title={<Typography sx={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>Tùy chỉnh QR</Typography>}
                                sx={{ borderBottom: '1px solid #333' }}
                            />
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
                                <Box>
                                    <Typography sx={{ color: '#ccc', mb: 1, fontSize: '0.9rem' }}>Nội dung / Liên kết</Typography>
                                    <TextField
                                        fullWidth
                                        placeholder="Nhập liên kết hoặc văn bản..."
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        size="small"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LinkIcon sx={{ color: '#888' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                background: '#2a2a2a',
                                                color: '#fff',
                                                '& fieldset': { borderColor: '#444' },
                                                '&:hover fieldset': { borderColor: '#666' },
                                                '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                                            }
                                        }}
                                    />
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography sx={{ color: '#ccc', mb: 1, fontSize: '0.9rem' }}>Màu mã QR</Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <input
                                                type="color"
                                                value={color}
                                                onChange={(e) => setColor(e.target.value)}
                                                style={{ width: 40, height: 40, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                                            />
                                            <TextField
                                                size="small"
                                                value={color}
                                                onChange={(e) => setColor(e.target.value)}
                                                sx={{ flex: 1, '& .MuiOutlinedInput-root': { background: '#2a2a2a', color: '#fff', '& fieldset': { borderColor: '#444' } } }}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography sx={{ color: '#ccc', mb: 1, fontSize: '0.9rem' }}>Màu nền</Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <input
                                                type="color"
                                                value={bgColor}
                                                onChange={(e) => setBgColor(e.target.value)}
                                                style={{ width: 40, height: 40, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                                            />
                                            <TextField
                                                size="small"
                                                value={bgColor}
                                                onChange={(e) => setBgColor(e.target.value)}
                                                sx={{ flex: 1, '& .MuiOutlinedInput-root': { background: '#2a2a2a', color: '#fff', '& fieldset': { borderColor: '#444' } } }}
                                            />
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Box>
                                    <Typography sx={{ color: '#ccc', mb: 1, fontSize: '0.9rem' }}>Kích thước: {size}px</Typography>
                                    <Slider
                                        min={100}
                                        max={400}
                                        value={size}
                                        onChange={(_, v) => setSize(v)}
                                        valueLabelDisplay="auto"
                                        sx={{ color: '#FFD700' }}
                                    />
                                </Box>

                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Switch
                                                checked={bordered}
                                                onChange={(e) => setBordered(e.target.checked)}
                                                sx={{
                                                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#FFD700' },
                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#FFD700' }
                                                }}
                                            />
                                            <Typography sx={{ color: '#ccc', ml: 1 }}>Có viền trắng nền</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography sx={{ color: '#ccc', fontSize: '0.9rem' }}>Độ phức tạp:</Typography>
                                            <ToggleButtonGroup
                                                value={errorLevel}
                                                exclusive
                                                onChange={(_, v) => v && setErrorLevel(v)}
                                                size="small"
                                                sx={{
                                                    background: '#2a2a2a',
                                                    '& .MuiToggleButton-root': {
                                                        color: '#888',
                                                        borderColor: '#444',
                                                        px: 2,
                                                        py: 0.5
                                                    },
                                                    '& .MuiToggleButton-root.Mui-selected': {
                                                        color: '#fff',
                                                        background: 'rgba(255, 215, 0, 0.2)',
                                                        borderColor: '#FFD700'
                                                    }
                                                }}
                                            >
                                                <ToggleButton value="L">L</ToggleButton>
                                                <ToggleButton value="M">M</ToggleButton>
                                                <ToggleButton value="Q">Q</ToggleButton>
                                                <ToggleButton value="H">H</ToggleButton>
                                            </ToggleButtonGroup>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} lg={5}>
                        <Card
                            sx={{
                                background: '#1e1e1e',
                                border: '1px solid #333',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: 400,
                                borderRadius: 2
                            }}
                        >
                            <Box
                                sx={{
                                    padding: bordered ? '20px' : '0px',
                                    background: bordered ? bgColor : 'transparent',
                                    borderRadius: '16px',
                                    boxShadow: bordered ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
                                    marginBottom: '24px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                            >
                                <QRCode
                                    id="my-qrcode"
                                    ref={qrRef}
                                    value={text || '-'}
                                    size={size}
                                    fgColor={color}
                                    bgColor={bgColor}
                                    level={errorLevel}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 2 }}>
                                <TextField
                                    placeholder="Tên file (tùy chọn)"
                                    value={downloadName}
                                    onChange={(e) => setDownloadName(e.target.value)}
                                    size="small"
                                    sx={{
                                        width: '200px',
                                        '& .MuiOutlinedInput-root': {
                                            background: '#2a2a2a',
                                            color: '#fff',
                                            textAlign: 'center',
                                            '& fieldset': { borderColor: '#444' },
                                            '& input': { textAlign: 'center' }
                                        }
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<DownloadIcon />}
                                    onClick={downloadQRCode}
                                    sx={{
                                        background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                                        color: '#000',
                                        fontWeight: 'bold',
                                        width: '200px',
                                        height: '50px',
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        '&:hover': {
                                            background: 'linear-gradient(45deg, #FFE44D, #FFB732)',
                                        }
                                    }}
                                >
                                    Tải xuống PNG
                                </Button>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </motion.div>
        </Box>
    );
};

export default QRGeneratorPage;
