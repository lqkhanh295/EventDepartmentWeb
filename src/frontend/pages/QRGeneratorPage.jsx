import React, { useState } from 'react';
import { QRCode, ColorPicker, Input, Button, Card, Space, Typography, Slider, Switch, Segmented, Row, Col } from 'antd';
import { DownloadOutlined, LinkOutlined } from '@ant-design/icons';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

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

    // Ant Design's QRCode download feature
    const downloadQRCode = () => {
        const canvas = document.getElementById('my-qrcode')?.querySelector('canvas');
        if (canvas) {
            const url = canvas.toDataURL();
            const a = document.createElement('a');
            a.download = `${downloadName || 'QRCode'}.png`;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div style={{ marginBottom: 24 }}>
                    <Title level={2} style={{ color: '#fff', margin: 0 }}>
                        QR Code Generator
                    </Title>
                    <Text style={{ color: '#aaa', fontSize: '16px' }}>
                        Tạo và tùy chỉnh mã QR (không quảng cáo ^^)
                    </Text>
                </div>

                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={14}>
                        <Card
                            style={{ background: '#1e1e1e', borderColor: '#333' }}
                            title={<span style={{ color: '#fff' }}>Tùy chỉnh QR</span>}
                        >
                            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                <div>
                                    <Text style={{ color: '#ccc', display: 'block', marginBottom: 8 }}>Nội dung / Liên kết</Text>
                                    <Input
                                        prefix={<LinkOutlined />}
                                        placeholder="Nhập liên kết hoặc văn bản..."
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        size="large"
                                        maxLength={300}
                                        style={{ background: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
                                    />
                                </div>

                                <Row gutter={[16, 16]}>
                                    <Col span={12}>
                                        <Text style={{ color: '#ccc', display: 'block', marginBottom: 8 }}>Màu mã QR</Text>
                                        <ColorPicker
                                            value={color}
                                            onChange={(c) => setColor(c.toHexString())}
                                            showText
                                            style={{ width: '100%' }}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <Text style={{ color: '#ccc', display: 'block', marginBottom: 8 }}>Màu nền</Text>
                                        <ColorPicker
                                            value={bgColor}
                                            onChange={(c) => setBgColor(c.toHexString())}
                                            showText
                                            style={{ width: '100%' }}
                                        />
                                    </Col>
                                </Row>

                                <div>
                                    <Text style={{ color: '#ccc', display: 'block', marginBottom: 8 }}>Kích thước: {size}px</Text>
                                    <Slider
                                        min={100}
                                        max={400}
                                        value={size}
                                        onChange={setSize}
                                        tooltip={{ formatter: (value) => `${value}px` }}
                                    />
                                </div>

                                <div>
                                    <Text style={{ color: '#ccc', display: 'block', marginBottom: 8 }}>Logo URL (Tùy chọn)</Text>
                                    <Input
                                        placeholder="Paste link ảnh logo..."
                                        value={icon}
                                        onChange={(e) => setIcon(e.target.value)}
                                        style={{ background: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
                                    />
                                </div>

                                {icon && (
                                    <div>
                                        <Text style={{ color: '#ccc', display: 'block', marginBottom: 8 }}>Kích thước Logo: {iconSize}px</Text>
                                        <Slider
                                            min={10}
                                            max={size / 2}
                                            value={iconSize}
                                            onChange={setIconSize}
                                            tooltip={{ formatter: (value) => `${value}px` }}
                                        />
                                    </div>
                                )}

                                <Row gutter={[16, 16]} align="middle">
                                    <Col span={12}>
                                        <Space>
                                            <Switch checked={bordered} onChange={setBordered} />
                                            <Text style={{ color: '#ccc' }}>Có viền</Text>
                                        </Space>
                                    </Col>
                                    <Col span={12}>
                                        <Text style={{ color: '#ccc', marginRight: 8 }}>Độ phức tạp:</Text>
                                        <Segmented
                                            options={['L', 'M', 'Q', 'H']}
                                            value={errorLevel}
                                            onChange={setErrorLevel}
                                        />
                                    </Col>
                                </Row>
                            </Space>
                        </Card>
                    </Col>

                    <Col xs={24} lg={10}>
                        <Card
                            style={{
                                background: '#1e1e1e',
                                borderColor: '#333',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <div
                                id="my-qrcode"
                                style={{
                                    padding: '20px',
                                    background: '#fff',
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                    marginBottom: '24px'
                                }}
                            >
                                <QRCode
                                    errorLevel={errorLevel}
                                    value={text || '-'}
                                    color={color}
                                    bgColor={bgColor}
                                    size={size}
                                    icon={icon}
                                    iconSize={iconSize}
                                    bordered={bordered}
                                />
                            </div>

                            <Space direction="vertical" align="center" style={{ width: '100%' }}>
                                <Input
                                    placeholder="Tên file (tùy chọn)"
                                    value={downloadName}
                                    onChange={(e) => setDownloadName(e.target.value)}
                                    style={{
                                        background: '#2a2a2a',
                                        border: '1px solid #444',
                                        color: '#fff',
                                        width: '200px',
                                        marginBottom: '12px',
                                        textAlign: 'center'
                                    }}
                                />
                                <Button
                                    type="primary"
                                    icon={<DownloadOutlined />}
                                    onClick={downloadQRCode}
                                    size="large"
                                    style={{
                                        background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                                        borderColor: 'transparent',
                                        fontWeight: 'bold',
                                        color: '#000',
                                        width: '200px',
                                        height: '50px'
                                    }}
                                >
                                    Tải xuống PNG
                                </Button>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </motion.div>
        </Box>
    );
};

export default QRGeneratorPage;
