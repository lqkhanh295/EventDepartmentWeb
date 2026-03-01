import React from 'react';
import {
    Card,
    CardHeader,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Box
} from '@mui/material';

const PreviewTable = ({ previewData, columns }) => {
    if (previewData.length === 0) return null;

    return (
        <Card
            sx={{
                background: '#1e1e1e',
                border: '1px solid #333',
                mt: 3,
                borderRadius: 2
            }}
        >
            <CardHeader
                title={
                    <span style={{ color: '#fff', fontSize: '1.1rem' }}>
                        Xem trước dữ liệu ({Math.min(10, previewData.length)} dòng đầu • {columns.length} cột)
                    </span>
                }
            />
            <CardContent sx={{ p: '0 !important' }}>
                <TableContainer
                    component={Box}
                    sx={{
                        maxHeight: 400,
                        borderTop: '1px solid #333'
                    }}
                >
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                {columns.map((col, i) => (
                                    <TableCell
                                        key={col.key || col.dataIndex || i}
                                        sx={{
                                            background: '#333',
                                            color: '#fff',
                                            fontWeight: 600,
                                            borderBottom: '1px solid #444',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {col.title}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {previewData.map((row, rowIndex) => (
                                <TableRow
                                    key={row.key || rowIndex}
                                    sx={{
                                        '&:hover': { background: '#3a3a3a' },
                                        '&:last-child td, &:last-child th': { border: 0 }
                                    }}
                                >
                                    {columns.map((col, colIndex) => (
                                        <TableCell
                                            key={`${rowIndex}-${colIndex}`}
                                            sx={{
                                                color: '#e0e0e0',
                                                borderBottom: '1px solid #444',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {col.render ? col.render(row[col.dataIndex], row, rowIndex) : row[col.dataIndex]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

export default PreviewTable;
