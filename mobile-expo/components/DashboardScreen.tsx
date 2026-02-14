import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Switch, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import Chart from './Chart';

// API Configuration
const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

const DEMO_DATA = {
    "asset": "AAPL",
    "persona_selected": "Coach",
    "market_metrics": {
        "vix": 18.5,
        "market_regime": "BULLISH VOLATILE",
        "risk_index": 65,
        "risk_level": "ELEVATED",
        "regime_color": "#ff0000"
    },
    "market_analysis": {
        "council_opinions": [
            "Macro Hawk (High): Fed pivot priced in, yield curve steepening favors growth.",
            "Micro Forensic (Moderate): Margins compressing but services revenue +12% YoY.",
            "Flow Detective (High): Massive call gamma squeeze at $180 strike.",
            "Tech Interpreter (Moderate): Bull flag breakout on 4H chart targeting $185.",
            "Skeptic (Low): Valuation stretched at 32x PE, watch for rug pull."
        ],
        "consensus": ["Bullish short-term", "High volatility expected"],
        "market_context": {
            "price": 178.45,
            "move_direction": "UP",
            "change_pct": "2.3",
            "volume": 85000000
        }
    },
    "narrative": {
        "styled_message": "Listen up. The market is handing you a gift with this volatility, but don't get greedy. Technicals scream breakout, but that risk index at 65 means chop is incoming. Stick to the plan or get wrecked.",
        "persona_selected": "Coach"
    },
    "behavioral_analysis": {
        "flags": [
            { "pattern": "FOMO", "message": "Chasing breakout candles" },
            { "pattern": "Overtrading", "message": "15 trades in 2 hours" }
        ]
    },
    "trade_history": {
        "total_trades": 42,
        "win_rate": 58.5,
        "total_pnl": 1250.50
    },
    "risk_analysis": {
        "metrics": { "var_95": 2.4, "max_drawdown": 15.2 },
        "qualitative": { "verdict": "HIGH", "reasoning": "Elevated VIX and gamma exposure." }
    },
    "sentiment_analysis": {
        "score": 0.6,
        "label": "BULLISH",
        "summary": "News sentiment is positive on earnings beat."
    }
};

export default function DashboardScreen() {
    const [asset, setAsset] = useState('AAPL');
    const [userId, setUserId] = useState('mobile_user');
    const [isDemo, setIsDemo] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('READY');
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [councilOpinions, setCouncilOpinions] = useState<any[]>([]);

    const runAnalysis = async () => {
        if (isAnalyzing) return;
        if (!asset) {
            Alert.alert('Error', 'Please enter an asset symbol');
            return;
        }

        setIsAnalyzing(true);
        setStatusMessage('INITIALIZING...');
        setCouncilOpinions([]);
        setAnalysisData(null);

        if (isDemo) {
            setStatusMessage('DEMO: SIMULATING...');
            const steps = [
                "Fetching market data...",
                "Running Macro Hawk...",
                "Running Micro Forensic...",
                "Running Flow Detective...",
                "Running Tech Interpreter...",
                "Running Skeptic...",
                "Synthesizing Narrative..."
            ];

            for (const step of steps) {
                setStatusMessage(step.toUpperCase());
                await new Promise(r => setTimeout(r, 800));
            }

            const demoData = JSON.parse(JSON.stringify(DEMO_DATA));
            demoData.asset = asset;
            setAnalysisData(demoData);

            if (demoData.market_analysis && demoData.market_analysis.council_opinions) {
                const opinions = demoData.market_analysis.council_opinions.map((op: string, idx: number) => {
                     const agentNames = ['Macro Hawk', 'Micro Forensic', 'Flow Detective', 'Tech Interpreter', 'Skeptic'];
                     return {
                         agentName: agentNames[idx],
                         thesis: op.replace(/^[^\s]+\s/, ''),
                         confidence: 'HIGH'
                     };
                });
                setCouncilOpinions(opinions);
            }

            setStatusMessage('COMPLETE');
            setIsAnalyzing(false);
            return;
        }

        try {
            // Use non-streaming endpoint for simplicity on mobile
            // Or use streaming if possible. Let's try simplified first to ensure it works.
            setStatusMessage('REQUESTING ANALYSIS...');
            const response = await fetch(`${API_BASE_URL}/analyze-asset?asset=${encodeURIComponent(asset)}&user_id=${encodeURIComponent(userId)}`, {
                method: 'POST'
            });

            if (!response.ok) {
                 throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            setAnalysisData(data);
             if (data.market_analysis && data.market_analysis.council_opinions) {
                const opinions = data.market_analysis.council_opinions.map((op: string, idx: number) => {
                     const agentNames = ['Macro Hawk', 'Micro Forensic', 'Flow Detective', 'Tech Interpreter', 'Skeptic'];
                     return {
                         agentName: agentNames[idx] || 'Agent',
                         thesis: op.replace(/^[^\s]+\s/, ''),
                         confidence: 'HIGH'
                     };
                });
                setCouncilOpinions(opinions);
            }
            setStatusMessage('COMPLETE');

        } catch (error: any) {
            console.error('Analysis failed:', error);
            setStatusMessage('FAILED');
            Alert.alert('Analysis Failed', error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>TENSORTRADE</Text>
                <View style={styles.statusIndicator}>
                    <View style={[styles.statusDot, { backgroundColor: isAnalyzing ? '#ffcc00' : '#00ff00' }]} />
                    <Text style={styles.statusText}>{statusMessage}</Text>
                </View>
            </View>

            {/* Input Section */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>ASSISTANT</Text>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>ASSET</Text>
                    <TextInput
                        style={styles.input}
                        value={asset}
                        onChangeText={t => setAsset(t.toUpperCase())}
                        placeholder="AAPL"
                        placeholderTextColor="#999"
                    />
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>DEMO MODE</Text>
                    <Switch value={isDemo} onValueChange={setIsDemo} trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={isDemo ? "#f5dd4b" : "#f4f3f4"} />
                </View>
                <TouchableOpacity style={styles.button} onPress={runAnalysis} disabled={isAnalyzing}>
                    <Text style={styles.buttonText}>{isAnalyzing ? 'ANALYZING...' : 'GENERATE REPORT'}</Text>
                </TouchableOpacity>
            </View>

            {/* Analysis Data */}
            {analysisData && (
                <>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>MARKET METRICS</Text>
                        <View style={styles.row}>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricLabel}>REGIME</Text>
                                <Text style={[styles.metricValue, { color: analysisData.market_metrics.risk_index > 50 ? 'red' : 'black' }]}>
                                    {analysisData.market_metrics.market_regime}
                                </Text>
                            </View>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricLabel}>RISK</Text>
                                <Text style={styles.metricValue}>{analysisData.market_metrics.risk_index}/100</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>ASSET IMPACT MATRIX</Text>
                        <Chart />
                         {analysisData.market_analysis && analysisData.market_analysis.market_context && (
                             <Text style={styles.contextText}>
                                {analysisData.market_analysis.market_context.move_direction} {analysisData.market_analysis.market_context.change_pct}% | Vol: {analysisData.market_analysis.market_context.volume}
                             </Text>
                         )}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>COUNCIL OPINIONS</Text>
                        {councilOpinions.map((op, idx) => (
                            <View key={idx} style={styles.opinionItem}>
                                <Text style={styles.agentName}>{op.agentName}</Text>
                                <Text style={styles.thesis}>{op.thesis}</Text>
                            </View>
                        ))}
                    </View>

                     <View style={styles.card}>
                        <Text style={styles.cardTitle}>AI NARRATIVE</Text>
                        <Text style={styles.narrativeText}>
                            {analysisData.narrative?.styled_message || analysisData.narrative?.summary}
                        </Text>
                    </View>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#000',
        marginTop: Platform.OS === 'ios' ? 40 : 0,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#000',
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '700',
    },
    card: {
        backgroundColor: '#fff',
        margin: 15,
        marginBottom: 0,
        padding: 15,
        borderWidth: 1,
        borderColor: '#000',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
        color: '#000',
        letterSpacing: 1,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 5,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#000',
        padding: 10,
        fontSize: 16,
        color: '#000',
        backgroundColor: '#fff',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    button: {
        backgroundColor: '#000',
        padding: 15,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    metricBox: {
        flex: 1,
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 10,
        color: '#666',
        fontWeight: '700',
    },
    metricValue: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 5,
    },
    contextText: {
        fontSize: 12,
        marginTop: 5,
        textAlign: 'center',
        color: '#666',
    },
    opinionItem: {
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    agentName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#000',
        marginBottom: 2,
    },
    thesis: {
        fontSize: 12,
        color: '#333',
        lineHeight: 18,
    },
    narrativeText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#000',
    }
});
