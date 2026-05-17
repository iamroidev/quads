import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../theme';

const ScannerScreen = ({ route, navigation }: any) => {
  const { onScan } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

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
      // If it's just a 6 digit code
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
        <Text>Requesting for camera permission</Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      
      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer}></View>
        <View style={styles.middleContainer}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.focusedContainer}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>
          <View style={styles.unfocusedContainer}></View>
        </View>
        <View style={styles.unfocusedContainer}>
          <Text style={styles.hint}>Scan the seller's Handover QR Code</Text>
          <TouchableOpacity 
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  middleContainer: { flexDirection: 'row', height: 250 },
  focusedContainer: { width: 250, height: 250, position: 'relative' },
  cornerTopLeft: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#ff6b6b' },
  cornerTopRight: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#ff6b6b' },
  cornerBottomLeft: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#ff6b6b' },
  cornerBottomRight: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#ff6b6b' },
  hint: { color: '#fff', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, marginTop: 20 },
  cancelBtn: { marginTop: 40, paddingHorizontal: 40, paddingVertical: 12, borderWidth: 1, borderColor: '#fff' },
  cancelText: { color: '#fff', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 },
});

export default ScannerScreen;
