import { useNavigation, useRoute } from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';

const AppFooter = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const currentScreen = route.name;

    return (
        <View style={styles.footer}>
            <Text style={styles.footerText}>© 2023 ベトナムゴルフ場予約サイト GOVIGO. All Rights Reserved.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    footer: {
        backgroundColor: '#42633e',
        height: 60,
        justifyContent: 'center',
    },
    footerText: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
    },
});

export default AppFooter;