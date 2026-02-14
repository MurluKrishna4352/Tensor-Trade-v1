import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import BrutalistCard from '../components/BrutalistCard';

export default function DashboardScreen() {
  const portfolioStats = [
    { label: 'Total Value', value: '$125,430.50', change: '+12.5%' },
    { label: "Today's Gain", value: '+$2,340.20', change: '+1.9%' },
    { label: 'Investments', value: '$100K', change: '15 stocks' },
    { label: 'Total Return', value: '+$25K', change: '+25.4%' }
  ];

  const holdings = [
    { symbol: 'AAPL', name: 'Apple Inc.', value: '$8,771.50', change: '+2.3%', shariah: true },
    { symbol: 'MSFT', name: 'Microsoft', value: '$11,367.30', change: '+1.8%', shariah: true },
    { symbol: 'GOOGL', name: 'Alphabet', value: '$3,545.00', change: '-0.5%', shariah: false },
    { symbol: 'TSLA', name: 'Tesla Inc.', value: '$9,940.00', change: '+3.2%', shariah: true },
    { symbol: 'NVDA', name: 'NVIDIA', value: '$52,516.80', change: '+5.1%', shariah: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>DASHBOARD</Text>
          <View style={styles.statusIndicator}>
             <View style={styles.statusDot} />
             <Text style={styles.statusText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {portfolioStats.map((stat, index) => (
            <BrutalistCard key={index} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statChange}>{stat.change}</Text>
            </BrutalistCard>
          ))}
        </View>

        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>HOLDINGS</Text>
        </View>

        <BrutalistCard style={{ padding: 0 }}>
            {holdings.map((item, index) => (
                <View key={index} style={[
                    styles.holdingItem,
                    index !== holdings.length - 1 && styles.borderBottom
                ]}>
                    <View style={styles.row}>
                        <View>
                            <Text style={styles.holdingSymbol}>{item.symbol}</Text>
                            <Text style={styles.holdingName}>{item.name}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.holdingValue}>{item.value}</Text>
                            <Text style={styles.holdingChange}>{item.change}</Text>
                        </View>
                    </View>
                    <View style={styles.badgeContainer}>
                         <View style={[styles.badge, item.shariah ? styles.badgeBlack : styles.badgeOrange]}>
                             <Text style={[styles.badgeText, item.shariah ? styles.textWhite : styles.textBlack]}>
                                 {item.shariah ? 'SHARIAH COMPLIANT' : 'NON-COMPLIANT'}
                             </Text>
                         </View>
                    </View>
                </View>
            ))}
        </BrutalistCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 4,
    borderBottomColor: '#000',
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    textTransform: 'uppercase',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    backgroundColor: '#FF5722',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  sectionHeader: {
    marginBottom: 16,
    borderLeftWidth: 8,
    borderLeftColor: '#FF5722',
    paddingLeft: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  holdingItem: {
    padding: 16,
  },
  borderBottom: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  holdingSymbol: {
    fontSize: 16,
    fontWeight: '900',
  },
  holdingName: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  holdingValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  holdingChange: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  badgeContainer: {
      alignItems: 'flex-start',
  },
  badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderWidth: 2,
      borderColor: '#000',
  },
  badgeBlack: {
      backgroundColor: '#000',
  },
  badgeOrange: {
      backgroundColor: '#FFF',
      borderColor: '#FF5722',
  },
  badgeText: {
      fontSize: 10,
      fontWeight: 'bold',
  },
  textWhite: {
      color: '#FFF',
  },
  textBlack: {
      color: '#000',
  },
});
