import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppFooter from '../../components/AppFooter';
import AppHeader from '../../components/AppHeader';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('naoyat3721@gmail.com');
  const [password, setPassword] = useState('nassann13');
  const [localLoading, setLocalLoading] = useState(false);
  const router = useRouter();
  const { login, loading: authLoading, isAuthenticated } = useAuth();
  
  // Use either the local loading state or the auth context loading state
  const isLoading = localLoading || authLoading;
      console.log('localLoading:', localLoading, authLoading);
  
    // Check authentication status
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to login if not authenticated
      router.replace('/screens/HomeScreen');
    }
  }, [isAuthenticated, authLoading]);


  const submitLogin = async () => {
    if (!email || !password) {
      Alert.alert('Please enter', 'Email and password are required');
      return;
    }

    console.log('Attempting login with:', email, password, isLoading);

    try {
      setLocalLoading(true);
      console.log('Logging in...');
      
      const success = await login(email, password);
      setLocalLoading(false);
      
      if (success) {
        router.replace('/screens/HomeScreen');
      } else {
        Alert.alert('Login fail', 'Wrong email or password');
      }
    } catch (error) {
      setLocalLoading(false);
      Alert.alert('Login failed', error.message || 'Unable to connect to server');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Login" />
      <View style={styles.container}>
        <Text style={styles.title}>Đăng nhập</Text>
        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {isLoading ? (
          <ActivityIndicator size="large" color="#376439" style={{ marginTop: 20 }} />
        ) : (
          <CustomButton title="Login" onPress={submitLogin} />
        )}
      </View>
      <AppFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20 
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 30 
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
});