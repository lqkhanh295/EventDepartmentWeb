import React, { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,

    Snackbar,
    CircularProgress,
    Backdrop
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';
import { getEvents, addEvents, clearEvents } from '../../backend/services/analysisService';

// Nivo Charts
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';

// --- Theme & Configuration ---
const chartTheme = {
    textColor: '#333333',
    fontSize: 12,
    axis: {
        domain: {
            line: {
                stroke: '#777777',
                strokeWidth: 1
            }
        },
        legend: {
            text: {
                fontSize: 12,
                fill: '#333333'
            }
        },
        ticks: {
            line: {
                stroke: '#777777',
                strokeWidth: 1
            },
            text: {
                fontSize: 11,
                fill: '#333333'
            }
        }
    },
    grid: {
        line: {
            stroke: '#dddddd',
            strokeWidth: 1,
            strokeDasharray: '4 4'
        }
    },
    tooltip: {
        container: {
            background: '#ffffff',
            color: '#333333',
            fontSize: 13,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '12px'
        }
    }
};

const currencyFormatter = (value) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);


// --- Infographic Gradients ---
const infographicDefs = [
    {
        id: 'budgetGradient',
        type: 'linearGradient',
        colors: [
            { offset: 0, color: '#4facfe' }, // Light Blue
            { offset: 100, color: '#00f2fe' }, // Cyan
        ],
    },
    {
        id: 'actualGradient',
        type: 'linearGradient',
        colors: [
            { offset: 0, color: '#ff9a9e' }, // Pink
            { offset: 100, color: '#fecfef' }, // Light Pink
        ],
    },
    {
        id: 'lineGradient',
        type: 'linearGradient',
        colors: [
            { offset: 0, color: '#a18cd1' }, // Purple
            { offset: 100, color: '#fbc2eb' }, // Pink
        ],
    },
    {
        id: 'pieGradient1',
        type: 'linearGradient',
        colors: [
            { offset: 0, color: '#84fab0' },
            { offset: 100, color: '#8fd3f4' }
        ]
    }
];

const AnalysisPage = () => {
    const [events, setEvents] = useState([]);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [loading, setLoading] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getEvents();
                if (data && data.length > 0) {
                    setEvents(data);
                }
            } catch (error) {
                console.error('Failed to fetch analysis events:', error);
                setSnackbar({ open: true, message: 'Failed to load saved data.', severity: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Handle file upload
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;



        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

            processData(data);
        };
        reader.readAsBinaryString(file);
    };

    // Process imported data
    const processData = (data) => {
        if (data.length < 2) {
            setSnackbar({ open: true, message: 'File is empty or missing headers.', severity: 'error' });
            return;
        }


        let skippedCount = 0;
        const processedEvents = [];

        data.slice(1).forEach((row, index) => {
            // Helper to safely get value
            const getVal = (idx) => (row[idx] !== undefined ? row[idx].toString() : ''); // Ensure string for text fields
            const getNum = (idx) => {
                const val = row[idx];
                return typeof val === 'number' ? val : parseFloat(val) || 0;
            };

            // Date Parsing Helper
            const parseDate = (valWithoutParse) => {
                if (!valWithoutParse) return '';
                // Case 1: Excel Serial Date (Number)
                const val = row[1]; // Get raw original value from row
                if (typeof val === 'number') {
                    // Excel epoch starts 1900-01-01. JS handles this by adding days.
                    // Approximately: (val - 25569) * 86400 * 1000
                    const utc_days = Math.floor(val - 25569);
                    const utc_value = utc_days * 86400;
                    const date_info = new Date(utc_value * 1000);
                    return date_info.toISOString().split('T')[0];
                }

                // Case 2: String DD/MM/YYYY
                const strVal = valWithoutParse.toString().trim();
                const ddmmyyyy = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/;
                const match = strVal.match(ddmmyyyy);
                if (match) {
                    const day = match[1].padStart(2, '0');
                    const month = match[2].padStart(2, '0');
                    const year = match[3];
                    return `${year}-${month}-${day}`;
                }

                // Case 3: Already YYYY-MM-DD or other format
                return strVal;
            };

            // Helpers for validation
            const name = getVal(0);
            const date = parseDate(getVal(1));
            const type = getVal(2);
            const status = getVal(3);
            const budget = row[4];
            const actual = row[5];
            const rating = row[7];

            // Required check
            if (!name || !date || !type || !status || budget === undefined || actual === undefined || rating === undefined) {
                skippedCount++;
                return;
            }

            processedEvents.push({
                // id: index, // Let Firestore generate ID
                name: name,
                date: date,
                type: type,
                status: status,
                budgetPlanned: getNum(4),
                actualCost: getNum(5),
                attendees: getNum(6), // Optional
                rating: getNum(7)
            });
        });

        if (processedEvents.length === 0 && skippedCount > 0) {
            setSnackbar({ open: true, message: 'No valid events found. Please check required fields.', severity: 'error' });
        } else {
            // Append to Firestore
            setLoading(true);
            addEvents(processedEvents)
                .then(async () => {
                    // Refetch to get real IDs
                    const newData = await getEvents();
                    setEvents(newData);
                    setSnackbar({ open: true, message: 'Imported and appended successfully!', severity: 'success' });
                })
                .catch((err) => {
                    console.error(err);
                    setSnackbar({ open: true, message: 'Imported but failed to save to cloud.', severity: 'warning' });
                })
                .finally(() => setLoading(false));

            if (skippedCount > 0) {
                setSnackbar({ open: true, message: `Imported ${processedEvents.length} events. ${skippedCount} rows skipped.`, severity: 'warning' });
            }
        }
    };

    const handleDownloadTemplate = () => {
        const headers = [
            'Event Name', 'Date', 'Type', 'Status', 'Budget Planned', 'Actual Cost', 'Attendees', 'Rating'
        ];
        const sampleData = [
            {
                'Event Name': 'Event A', 'Date': '2025-01-01', 'Type': 'Workshop', 'Status': 'Completed',
                'Budget Planned': 10000000, 'Actual Cost': 9500000, 'Attendees': 50, 'Rating': 4.5
            }
        ];
        const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'Event_Analytics_Template.xlsx');
    };

    const handleClearData = async () => {
        if (!window.confirm('Are you sure you want to clear all analysis data?')) return;

        setLoading(true);
        try {
            await clearEvents();
            setEvents([]);
            setSnackbar({ open: true, message: 'Data cleared successfully.', severity: 'success' });
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Failed to clear data.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleLoadSample = () => {
        const sampleData = [
            {
                // id: 1, // Let Firestore generate ID
                name: 'Spring Gala',
                date: '2025-01-15',
                type: 'Gala',
                status: 'Completed',
                budgetPlanned: 50000000,
                actualCost: 48000000,
                attendees: 200,
                rating: 4.8
            },
            {
                name: 'Tech Workshop',
                date: '2025-02-10',
                type: 'Workshop',
                status: 'Completed',
                budgetPlanned: 15000000,
                actualCost: 16500000,
                attendees: 50,
                rating: 4.5
            },
            {
                name: 'Charity Run',
                date: '2025-03-20',
                type: 'Fundraiser',
                status: 'Planned',
                budgetPlanned: 30000000,
                actualCost: 0,
                attendees: 500,
                rating: 0
            }
        ];

        setLoading(true);
        addEvents(sampleData)
            .then(async () => {
                const newData = await getEvents();
                setEvents(newData);
                setSnackbar({ open: true, message: 'Sample data appended!', severity: 'success' });
            })
            .catch((err) => {
                console.error(err);
                setSnackbar({ open: true, message: 'Failed to load sample data.', severity: 'error' });
            })
            .finally(() => setLoading(false));
    };

    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    // --- Statistics ---
    const stats = useMemo(() => {
        const totalEvents = events.length;
        const totalBudget = events.reduce((acc, curr) => acc + curr.budgetPlanned, 0);
        const totalCost = events.reduce((acc, curr) => acc + curr.actualCost, 0);
        const totalAttendees = events.reduce((acc, curr) => acc + curr.attendees, 0);
        const avgRating = totalEvents > 0
            ? (events.reduce((acc, curr) => acc + curr.rating, 0) / totalEvents).toFixed(1)
            : 0;

        return { totalEvents, totalBudget, totalCost, totalAttendees, avgRating };
    }, [events]);

    // --- Nivo Data Prep ---
    // Pie Data
    const typeData = useMemo(() => {
        const counts = {};
        events.forEach(e => {
            const t = e.type || 'Other';
            counts[t] = (counts[t] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({
            id: key,
            label: key,
            value: counts[key]
        }));
    }, [events]);

    // Line Data
    const lineData = useMemo(() => {
        return [
            {
                id: "Attendees",
                data: events.map(e => ({
                    x: e.name, // Using name as X for now, ideally Date if sorted
                    y: e.attendees
                }))
            }
        ];
    }, [events]);

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                    Event Analytics (Nivo)
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate}>
                        Template
                    </Button>
                    <Button variant="outlined" onClick={handleLoadSample} sx={{ color: 'secondary.main', borderColor: 'secondary.main' }}>
                        Sample Data
                    </Button>


                    <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} sx={{ bgcolor: '#4CAF50' }}>
                        Import
                        <input type="file" hidden accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                    </Button>

                    {events.length > 0 && (
                        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleClearData}>
                            Clear
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <StatCard title="Total Events" value={stats.totalEvents} color="#2196F3" />
                <StatCard title="Total Spending" value={`${stats.totalCost.toLocaleString()} đ`} color="#F44336" />
                <StatCard title="Total Attendees" value={stats.totalAttendees.toLocaleString()} color="#9C27B0" />
                <StatCard title="Avg Rating" value={`${stats.avgRating} / 5.0`} color="#FF9800" />
            </Grid>

            {/* Error / Success Toast */}
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
            </Snackbar>

            {/* Loading Backdrop */}
            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
                <CircularProgress color="inherit" />
            </Backdrop>

            {events.length > 0 ? (
                <Grid container spacing={3}>
                    {/* Bar Chart: Budget vs Actual */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 3, height: 500, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>Budget Plan vs Actual Cost</Typography>
                            <Box sx={{ height: 400 }}>
                                <ResponsiveBar
                                    data={events}
                                    keys={['budgetPlanned', 'actualCost']}
                                    indexBy="name"
                                    margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                                    padding={0.4} // More spacing for pill look
                                    groupMode="grouped"
                                    valueScale={{ type: 'linear' }}
                                    indexScale={{ type: 'band', round: true }}
                                    colors={['#4facfe', '#ff9a9e']}
                                    defs={infographicDefs}
                                    fill={[
                                        { match: { id: 'budgetPlanned' }, id: 'budgetGradient' },
                                        { match: { id: 'actualCost' }, id: 'actualGradient' }
                                    ]}
                                    borderRadius={8} // Pill shape
                                    theme={chartTheme}
                                    borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                                    axisTop={null}
                                    axisRight={null}
                                    axisBottom={{
                                        tickSize: 0,
                                        tickPadding: 12,
                                        tickRotation: -15,
                                        legend: 'Event',
                                        legendPosition: 'middle',
                                        legendOffset: 40
                                    }}
                                    axisLeft={{
                                        tickSize: 0,
                                        tickPadding: 12,
                                        tickRotation: 0,
                                        legend: '', // Minimalist
                                        legendPosition: 'middle',
                                        legendOffset: -50,
                                        format: (value) => `${value / 1000000}M`
                                    }}
                                    enableGridY={false} // Clean look
                                    labelSkipWidth={12}
                                    labelSkipHeight={12}
                                    labelTextColor="#ffffff"
                                    tooltip={({ id, value, color, indexValue }) => (
                                        <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.95)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                            <strong style={{ color: '#333', fontSize: 14 }}>{indexValue}</strong>
                                            <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                                                <div style={{ width: 12, height: 12, background: color, marginRight: 8, borderRadius: '50%' }}></div>
                                                <span style={{ color: '#555' }}>
                                                    {id === 'budgetPlanned' ? 'Budget' : 'Actual'}: <strong style={{ color: '#000' }}>{currencyFormatter(value)}</strong>
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    legends={[
                                        {
                                            dataFrom: 'keys',
                                            anchor: 'bottom-right',
                                            direction: 'column',
                                            justify: false,
                                            translateX: 120,
                                            translateY: 0,
                                            itemsSpacing: 10,
                                            itemWidth: 100,
                                            itemHeight: 20,
                                            itemDirection: 'left-to-right',
                                            itemOpacity: 0.85,
                                            symbolSize: 12,
                                            symbolShape: 'circle',
                                            effects: [{ on: 'hover', style: { itemOpacity: 1 } }]
                                        }
                                    ]}
                                />
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Pie Chart: Types */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3, height: 500, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>Event Types</Typography>
                            <Box sx={{ height: 400 }}>
                                <ResponsivePie
                                    data={typeData}
                                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                                    innerRadius={0.75} // Slim Donut
                                    padAngle={2}
                                    cornerRadius={8}
                                    activeOuterRadiusOffset={8}
                                    colors={{ scheme: 'set2' }}
                                    borderWidth={0}
                                    enableArcLinkLabels={false} // Minimalist
                                    arcLabelsSkipAngle={10}
                                    arcLabelsTextColor="#333333"
                                    theme={chartTheme}
                                    defs={infographicDefs}
                                    // Optional: apply pattern or gradient to all if desired, staying simple for Pie to avoid chaos
                                    legends={[
                                        {
                                            anchor: 'bottom',
                                            direction: 'row',
                                            justify: false,
                                            translateX: 0,
                                            translateY: 56,
                                            itemsSpacing: 10,
                                            itemWidth: 100,
                                            itemHeight: 18,
                                            itemTextColor: '#999',
                                            itemDirection: 'left-to-right',
                                            itemOpacity: 1,
                                            symbolSize: 10,
                                            symbolShape: 'circle',
                                            effects: [{ on: 'hover', style: { itemTextColor: '#000' } }]
                                        }
                                    ]}
                                />
                                {/* Center Text for Donut */}
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center',
                                    pointerEvents: 'none'
                                }}>
                                    <Typography variant="caption" sx={{ color: '#999', letterSpacing: 1 }}>TOTAL</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: '900', color: '#333' }}>{events.length}</Typography>
                                </div>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Line Chart: Attendees */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, height: 450, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>Attendance Trend</Typography>
                            <Box sx={{ height: 350 }}>
                                <ResponsiveLine
                                    data={lineData}
                                    margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                                    xScale={{ type: 'point' }}
                                    yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: true, reverse: false }}
                                    yFormat=" >-.0f"
                                    curve="catmullRom" // Very smooth
                                    theme={chartTheme}
                                    defs={infographicDefs}
                                    axisTop={null}
                                    axisRight={null}
                                    axisBottom={{
                                        tickSize: 0,
                                        tickPadding: 15,
                                        tickRotation: 0,
                                        legend: '',
                                        legendOffset: 36,
                                        legendPosition: 'middle'
                                    }}
                                    axisLeft={null} // Very minimal
                                    lineWidth={4}
                                    pointSize={14}
                                    pointColor="#ffffff"
                                    pointBorderWidth={3}
                                    pointBorderColor={{ from: 'serieColor' }}
                                    pointLabelYOffset={-12}
                                    useMesh={true}
                                    enableArea={true}
                                    areaOpacity={0.4}
                                    colors={['#a18cd1']} // Purple Gradient Base key
                                    enableGridX={false}
                                    enableGridY={false} // No grid
                                    fill={[{ match: '*', id: 'lineGradient' }]}
                                    legends={[
                                        {
                                            anchor: 'bottom-right',
                                            direction: 'column',
                                            justify: false,
                                            translateX: 100,
                                            translateY: 0,
                                            itemsSpacing: 0,
                                            itemDirection: 'left-to-right',
                                            itemWidth: 80,
                                            itemHeight: 20,
                                            itemOpacity: 0.75,
                                            symbolSize: 12,
                                            symbolShape: 'circle',
                                            symbolBorderColor: 'rgba(0, 0, 0, .5)',
                                            effects: [
                                                {
                                                    on: 'hover',
                                                    style: {
                                                        itemBackground: 'rgba(0, 0, 0, .03)',
                                                        itemOpacity: 1
                                                    }
                                                }
                                            ]
                                        }
                                    ]}
                                />
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Table */}
                    <Grid item xs={12}>
                        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                                <Typography variant="h6">Recent Events Data</Typography>
                            </Box>
                            <TableContainer sx={{ maxHeight: 400 }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Event Name</TableCell>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell align="right">Budget</TableCell>
                                            <TableCell align="right">Actual</TableCell>
                                            <TableCell align="right">Attendees</TableCell>
                                            <TableCell align="center">Rating</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {events.map((row) => (
                                            <TableRow key={row.id} hover>
                                                <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>{row.name}</TableCell>
                                                <TableCell>{row.date}</TableCell>
                                                <TableCell><Chip label={row.type} size="small" variant="outlined" /></TableCell>
                                                <TableCell><StatusChip status={row.status} /></TableCell>
                                                <TableCell align="right">{row.budgetPlanned?.toLocaleString()}</TableCell>
                                                <TableCell align="right" sx={{ color: row.actualCost > row.budgetPlanned ? 'error.main' : 'success.main' }}>
                                                    {row.actualCost?.toLocaleString()}
                                                </TableCell>
                                                <TableCell align="right">{row.attendees}</TableCell>
                                                <TableCell align="center">
                                                    <Chip label={row.rating} size="small" color={row.rating >= 4 ? 'success' : 'warning'} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>

                </Grid>
            ) : (
                <Paper sx={{ p: 5, textAlign: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: 'grey.300', bgcolor: 'grey.50' }}>
                    <CloudUploadIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No data imported yet</Typography>
                    <Typography variant="body2" color="text.secondary">Upload an Excel or CSV file to start.</Typography>
                </Paper>
            )}
        </Box>
    );
};

// Helpers
const StatCard = ({ title, value, color }) => (
    <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
            <Box sx={{ position: 'absolute', top: -10, left: 20, width: 50, height: 4, bgcolor: color, borderRadius: 2 }} />
            <CardContent>
                <Typography color="text.secondary" gutterBottom variant="subtitle2">{title}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{value}</Typography>
            </CardContent>
        </Card>
    </Grid>
);

const StatusChip = ({ status }) => {
    let color = 'default';
    const s = status ? status.toLowerCase() : '';
    if (s.includes('complete') || s.includes('hoàn thành')) color = 'success';
    else if (s.includes('cancel') || s.includes('hủy')) color = 'error';
    else if (s.includes('plan') || s.includes('dự kiến')) color = 'primary';
    return <Chip label={status} color={color} size="small" />;
};

export default AnalysisPage;