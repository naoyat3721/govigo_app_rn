import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppFooter from '../../components/AppFooter';
import AppHeader from '../../components/AppHeader';
import CustomButton from '../../components/CustomButton';

export default function MessageScreen() {
    const router = useRouter();
    
    return (
    <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Messages" />  
        <View style={styles.container}>
            <Text style={styles.title}>Tin nhắn</Text>
            <Text style={styles.message}>Chức năng tin nhắn đang được phát triển. Vui lòng quay lại sau!</Text>
            <CustomButton title="Quay lại trang chủ" onPress={() => router.push('/screens/HomeScreen')} />
        </View>
        <AppFooter />
    </SafeAreaView>);
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
    },
});