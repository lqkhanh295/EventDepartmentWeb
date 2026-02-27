import React from 'react';
import { Card, Table, ConfigProvider } from 'antd';

const PreviewTable = ({ previewData, columns }) => {
    if (previewData.length === 0) return null;

    return (
        <Card
            title={
                <span style={{ color: '#fff' }}>
                    Xem trước dữ liệu ({Math.min(10, previewData.length)} dòng đầu • {columns.length} cột)
                </span>
            }
            style={{
                background: '#1e1e1e',
                borderColor: '#333',
                marginTop: 24
            }}
        >
            <ConfigProvider
                theme={{
                    token: {
                        colorText: '#fff',
                        colorBgContainer: '#2a2a2a',
                        colorBorderSecondary: '#444',
                        colorSplit: '#444'
                    },
                    components: {
                        Table: {
                            headerBg: '#333',
                            headerColor: '#fff',
                            rowHoverBg: '#3a3a3a'
                        }
                    }
                }}
            >
                <Table
                    dataSource={previewData}
                    columns={columns}
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    size="small"
                    bordered
                />
            </ConfigProvider>
        </Card>
    );
};

export default PreviewTable;
