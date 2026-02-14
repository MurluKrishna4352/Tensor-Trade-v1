import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import BrutalistButton from '../components/BrutalistButton';

export default function LandingScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>TENSOR</Text>
          <Text style={[styles.title, styles.highlight]}>TRADE</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.subtitle}>
          AI POWERED{'\n'}TRADING{'\n'}PLATFORM
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>$2.5B+</Text>
            <Text style={styles.statLabel}>ASSETS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>50K+</Text>
            <Text style={styles.statLabel}>USERS</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <BrutalistButton
            title="LOGIN"
            onPress={() => navigation.navigate('Auth')}
            variant="primary"
          />
          <BrutalistButton
            title="SIGN UP"
            onPress={() => navigation.navigate('Auth')}
            variant="secondary"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 56, // Slightly smaller to fit mobile screens better
    fontWeight: '900',
    color: '#000',
    lineHeight: 60,
    textTransform: 'uppercase',
  },
  highlight: {
    color: '#FF5722', // Orange
    textDecorationLine: 'underline',
  },
  divider: {
    height: 8,
    backgroundColor: '#000',
    width: '100%',
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000',
    marginBottom: 48,
    textTransform: 'uppercase',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 48,
    gap: 16,
  },
  statBox: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#000',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFF',
    // Brutalist shadow
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FF5722',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  actions: {
    gap: 8,
  },
});
