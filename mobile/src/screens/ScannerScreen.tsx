import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useColors } from '../theme/ThemeContext';

const ScannerScreen = ({ route, navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const { onScan } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const styles = React.useMemo(() => StyleSheet.create({
    // Camera container stays true black — scanner needs it
    container: { flex: 1, backgroundColor: '#000' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    centeredText: { color: colors.text, fontSize: 13 },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    unfocusedContainer: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' },
    middleContainer: { flexDirection: 'row', height: 250 },
    focusedContainer: { width: 250, height: 250, position: 'relative' },
    cornerTopLeft: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: colors.accent },
    cornerTopRight: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: colors.accent },
    cornerBottomLeft: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: colors.accent },
    cornerBottomRight: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: colors.accent },
    hint: { color: colors.primaryContent, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, marginTop: 20 },
    cancelBtn: { marginTop: 40, paddingHorizontal: 40, paddingVertical: 12, borderWidth: 1, borderColor: colors.primaryContent },
    cancelText: { color: colors.primaryContent, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 },
  }), [colors]);

  useEffect(() => {
    if (!permission || !permission.granted) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.type === 'HANDOVER' && parsedData.code) {
        onScan(parsedData.code);
        navigation.goBack();
      } else {
        Alert.alert('Invalid QR', 'This is not a valid QUADS handover code.', [
          { text: 'Try Again', onPress: () => setScanned(false) }
        ]);
      }
    } catch (e) {
      if (data.length === 6 && /^\d+$/.test(data)) {
        onScan(data);
        navigation.goBack();
      } else {
        Alert.alert('Invalid QR', 'Could not recognize handover code.', [
          { text: 'Try Again', onPress: () => setScanned(false) }
        ]);
      }
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredText}>Requesting for camera permission</Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredText}>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer} />
        <View style={styles.middleContainer}>
          <View style={styles.unfocusedContainer} />
          <View style={styles.focusedContainer}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>
          <View style={styles.unfocusedContainer} />
        </View>
        <View style={styles.unfocusedContainer}>
          <Text style={styles.hint}>Scan the seller's Handover QR Code</Text>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ScannerScreen;
