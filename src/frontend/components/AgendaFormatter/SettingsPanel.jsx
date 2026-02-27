import React from 'react';
import { Card, Typography, Slider, ColorPicker, Select, Switch, Tooltip } from 'antd';
import { SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Text } = Typography;

const SettingsPanel = ({ showSettings, settings, setSettings }) => {
    if (!showSettings) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
        >
            <Card
                style={{
                    background: '#1e1e1e',
                    borderColor: '#333',
                    marginTop: 16
                }}
                title={<span style={{ color: '#fff' }}><SettingOutlined /> Cài đặt định dạng PDF</span>}
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                    <div>
                        <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                            Cỡ chữ: {settings.fontSize}pt
                        </Text>
                        <Slider
                            min={6}
                            max={14}
                            value={settings.fontSize}
                            onChange={(val) => setSettings({ ...settings, fontSize: val })}
                        />
                    </div>

                    <div>
                        <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                            Padding ô: {settings.cellPadding}mm
                        </Text>
                        <Slider
                            min={0.5}
                            max={5}
                            step={0.5}
                            value={settings.cellPadding}
                            onChange={(val) => setSettings({ ...settings, cellPadding: val })}
                        />
                    </div>

                    <div>
                        <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                            Màu header
                        </Text>
                        <ColorPicker
                            value={settings.headerColor}
                            onChange={(color) => setSettings({ ...settings, headerColor: color.toHexString() })}
                        />
                    </div>

                    <div>
                        <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                            Hướng giấy
                        </Text>
                        <Select
                            value={settings.orientation}
                            onChange={(val) => setSettings({ ...settings, orientation: val })}
                            style={{ width: '100%' }}
                            options={[
                                { value: 'landscape', label: 'Ngang (Landscape)' },
                                { value: 'portrait', label: 'Dọc (Portrait)' }
                            ]}
                        />
                    </div>

                    <div>
                        <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                            Khổ giấy
                        </Text>
                        <Select
                            value={settings.pageSize}
                            onChange={(val) => setSettings({ ...settings, pageSize: val })}
                            style={{ width: '100%' }}
                            options={[
                                { value: 'a4', label: 'A4' },
                                { value: 'a3', label: 'A3 (Lớn hơn)' },
                                { value: 'letter', label: 'Letter' }
                            ]}
                        />
                    </div>

                    <div>
                        <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                            Tự động nhận diện thời gian
                            <Tooltip title="Tự động chuyển đổi giá trị số Excel thành định dạng thời gian HH:mm">
                                <InfoCircleOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                            </Tooltip>
                        </Text>
                        <Switch
                            checked={settings.autoDetectTime}
                            onChange={(val) => setSettings({ ...settings, autoDetectTime: val })}
                        />
                    </div>

                    <div>
                        <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                            Highlight section headers
                            <Tooltip title="Tự động highlight các dòng như 'PHẦN I', 'BREAK TIME', etc.">
                                <InfoCircleOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                            </Tooltip>
                        </Text>
                        <Switch
                            checked={settings.highlightSections}
                            onChange={(val) => setSettings({ ...settings, highlightSections: val })}
                        />
                    </div>

                    <div>
                        <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                            Màu section
                        </Text>
                        <ColorPicker
                            value={settings.sectionColor}
                            disabled={!settings.highlightSections}
                            onChange={(color) => setSettings({ ...settings, sectionColor: color.toHexString() })}
                        />
                    </div>

                    <div>
                        <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
                            Hiển thị đường kẻ
                        </Text>
                        <Switch
                            checked={settings.showGridLines}
                            onChange={(val) => setSettings({ ...settings, showGridLines: val })}
                        />
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

export default SettingsPanel;
