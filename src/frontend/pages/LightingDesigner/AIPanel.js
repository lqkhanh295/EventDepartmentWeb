// AIPanel — Gemini AI generation drawer
import React, { useState } from 'react';
import {
    Box,
    Drawer,
    Typography,
    TextField,
    Button,
    IconButton,
    Skeleton,
    Chip,
    Snackbar,
    Alert,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CheckIcon from '@mui/icons-material/Check';
import SaveIcon from '@mui/icons-material/Save';
import { FIXTURE_TYPES, GEMINI_SYSTEM_PROMPT } from './fixtureConfig';

const AIPanel = ({ open, onClose, onApplyLayout, onSaveScene }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [retryIn, setRetryIn] = useState(0);

    // Repair common JSON issues from Gemini (trailing commas, markdown fences, etc.)
    const repairJSON = (raw) => {
        let s = raw.trim();
        // Strip markdown code fences ```json ... ``` or ``` ... ```
        s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        // Remove trailing commas before } or ]
        s = s.replace(/,\s*([}\]])/g, '$1');
        // Remove single-line comments // ...
        s = s.replace(/\/\/[^\n]*/g, '');
        // Remove multi-line comments /* ... */
        s = s.replace(/\/\*[\s\S]*?\*\//g, '');
        return s;
    };

    const parseAIResponse = (text) => {
        // 1. Try direct parse
        try { return JSON.parse(text); } catch (_) {}
        // 2. Repair then parse
        try { return JSON.parse(repairJSON(text)); } catch (_) {}
        // 3. Extract first {...} block, then repair
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try { return JSON.parse(repairJSON(jsonMatch[0])); } catch (_) {}
        }
        throw new Error('AI response không chứa JSON hợp lệ');
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey) {
            setError('Chưa cấu hình REACT_APP_GEMINI_API_KEY trong file .env');
            return;
        }

        setLoading(true);
        setResult(null);
        setError('');

        try {
            const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: GEMINI_SYSTEM_PROMPT + '\n\nUser request: ' + prompt },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 8192,
                        responseMimeType: 'application/json',
                        thinkingConfig: {
                            thinkingBudget: 0,
                        },
                    },
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData.error?.message || `API error: ${response.status}`;

                // Handle rate limit — extract retry seconds from message
                const retryMatch = errMsg.match(/retry in ([\d.]+)s/i);
                if (retryMatch) {
                    const seconds = Math.ceil(parseFloat(retryMatch[1]));
                    setRetryIn(seconds);
                    const timer = setInterval(() => {
                        setRetryIn((prev) => {
                            if (prev <= 1) { clearInterval(timer); return 0; }
                            return prev - 1;
                        });
                    }, 1000);
                    throw new Error(`Rate limit — thử lại sau ${seconds} giây`);
                }
                throw new Error(errMsg);
            }

            const data = await response.json();
            console.log('[AIPanel] Raw Gemini response:', JSON.stringify(data, null, 2));

            // gemini-2.5-flash is a thinking model — parts[] may contain:
            //   [0] thinking content, [1] actual response
            // We want the LAST part that looks like JSON, or fallback to join all text parts
            const parts = data.candidates?.[0]?.content?.parts || [];
            const finishReason = data.candidates?.[0]?.finishReason;

            if (!parts.length) {
                throw new Error(`Gemini trả về response rỗng (finishReason: ${finishReason || 'unknown'})`);
            }

            // Find the last non-empty text part (skip thinking parts which start with <think> or similar)
            const textParts = parts
                .map((p) => (p.text || '').trim())
                .filter((t) => t.length > 0);

            console.log('[AIPanel] Text parts:', textParts);

            // Try each part from the end until we get valid JSON
            let parsed = null;
            let lastErr = null;
            for (let i = textParts.length - 1; i >= 0; i--) {
                try {
                    parsed = parseAIResponse(textParts[i]);
                    break;
                } catch (e) {
                    lastErr = e;
                }
            }

            if (!parsed) {
                throw new Error(lastErr?.message || 'AI response không chứa JSON hợp lệ');
            }

            if (!parsed.fixtures || !Array.isArray(parsed.fixtures)) {
                throw new Error('AI response thiếu fixtures array');
            }

            // Validate fixture types
            parsed.fixtures = parsed.fixtures.filter(
                (f) => FIXTURE_TYPES[f.type]
            );

            setResult(parsed);
        } catch (err) {
            console.error('AI generation error:', err);
            setError(err.message || 'Lỗi khi gọi Gemini API');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (result?.fixtures) {
            onApplyLayout(result.fixtures);
            onClose();
        }
    };

    const handleSave = () => {
        if (result) {
            onSaveScene(result.sceneName || 'AI Scene', result.fixtures, result.description || '');
        }
    };

    // Count fixtures by type in result
    const getFixtureSummary = () => {
        if (!result?.fixtures) return [];
        const counts = {};
        result.fixtures.forEach((f) => {
            const name = FIXTURE_TYPES[f.type]?.name || f.type;
            counts[name] = (counts[name] || 0) + 1;
        });
        return Object.entries(counts);
    };

    return (
        <>
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                PaperProps={{
                    sx: {
                        width: 400,
                        background: '#0f0f1e',
                        color: '#fff',
                        borderLeft: '1px solid rgba(255,255,255,0.1)',
                    },
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutoFixHighIcon sx={{ color: '#FF6B35' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            AI Lighting Designer
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small" sx={{ color: '#888' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Content */}
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                    {/* Prompt input */}
                    <TextField
                        multiline
                        rows={5}
                        fullWidth
                        placeholder="Ví dụ: 10 đèn katana, 20 beam, 30 parled sôi động cho sân khấu wedding..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        sx={{
                            '& .MuiInputBase-root': {
                                color: '#ddd',
                                fontSize: '0.9rem',
                                background: 'rgba(255,255,255,0.03)',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.1)',
                            },
                            '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.25)',
                            },
                        }}
                    />

                    {/* Quick suggestions */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {[
                            '10 katana + 20 beam cho concert',
                            '30 parled cho wedding ấm áp',
                            'Full setup DJ 50 đèn',
                        ].map((suggestion) => (
                            <Chip
                                key={suggestion}
                                label={suggestion}
                                size="small"
                                variant="outlined"
                                onClick={() => setPrompt(suggestion)}
                                sx={{
                                    color: '#999',
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    fontSize: '0.7rem',
                                    '&:hover': {
                                        borderColor: '#FF6B35',
                                        color: '#FF6B35',
                                    },
                                }}
                            />
                        ))}
                    </Box>

                    {/* Generate button */}
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim() || retryIn > 0}
                        startIcon={<AutoFixHighIcon />}
                        sx={{
                            background: '#FF6B35',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { background: '#e55a2b' },
                            '&:disabled': { background: '#333' },
                        }}
                    >
                        {loading ? 'Đang tạo...' : retryIn > 0 ? `Rate limit — thử lại sau ${retryIn}s` : 'Generate Layout'}
                    </Button>

                    {/* Loading skeleton */}
                    {loading && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Skeleton variant="text" width="60%" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                            <Skeleton variant="rectangular" height={80} sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }} />
                            <Skeleton variant="text" width="40%" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                        </Box>
                    )}

                    {/* Result preview */}
                    {result && !loading && (
                        <Box
                            sx={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 1,
                                p: 2,
                            }}
                        >
                            <Typography variant="subtitle2" sx={{ color: '#fff', mb: 0.5 }}>
                                {result.sceneName || 'Generated Scene'}
                            </Typography>
                            {result.description && (
                                <Typography variant="body2" sx={{ color: '#999', fontSize: '0.8rem', mb: 1.5 }}>
                                    {result.description}
                                </Typography>
                            )}

                            {/* Fixture count summary */}
                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem' }}>
                                Fixtures ({result.fixtures.length} total)
                            </Typography>
                            <List dense disablePadding sx={{ mt: 0.5 }}>
                                {getFixtureSummary().map(([name, count]) => (
                                    <ListItem key={name} disablePadding sx={{ py: 0.25 }}>
                                        <ListItemText
                                            primary={`${name}: ${count}`}
                                            primaryTypographyProps={{ color: '#bbb', fontSize: '0.8rem' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>

                            {/* Action buttons */}
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<CheckIcon />}
                                    onClick={handleApply}
                                    sx={{
                                        flex: 1,
                                        background: '#FF6B35',
                                        textTransform: 'none',
                                        fontSize: '0.8rem',
                                        '&:hover': { background: '#e55a2b' },
                                    }}
                                >
                                    Apply Layout
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<SaveIcon />}
                                    onClick={handleSave}
                                    sx={{
                                        flex: 1,
                                        textTransform: 'none',
                                        fontSize: '0.8rem',
                                        borderColor: 'rgba(255,255,255,0.2)',
                                        color: '#ddd',
                                        '&:hover': { borderColor: '#FF6B35' },
                                    }}
                                >
                                    Save Scene
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Drawer>

            {/* Error snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={5000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setError('')} variant="filled">
                    {error}
                </Alert>
            </Snackbar>
        </>
    );
};

export default AIPanel;
