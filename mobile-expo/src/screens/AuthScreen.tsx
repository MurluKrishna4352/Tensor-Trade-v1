import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import BrutalistButton from '../components/BrutalistButton';
import BrutalistInput from '../components/BrutalistInput';

export default function AuthScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Mock auth
    navigation.navigate('Dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Text style={styles.title}>AUTHENTICATION</Text>

        <View style={styles.form}>
          <BrutalistInput
            label="EMAIL"
            placeholder="ENTER EMAIL"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <BrutalistInput
            label="PASSWORD"
            placeholder="ENTER PASSWORD"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <BrutalistButton
            title="ACCESS TERMINAL"
            onPress={handleLogin}
            variant="primary"
            style={{ marginTop: 24 }}
          />
        </View>

        <BrutalistButton
            title="BACK"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={{ marginTop: 16 }}
          />
      </KeyboardAvoidingView>
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
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
    marginBottom: 48,
    textTransform: 'uppercase',
    textAlign: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#FF5722',
    paddingBottom: 16,
  },
  form: {
    width: '100%',
  },
});
