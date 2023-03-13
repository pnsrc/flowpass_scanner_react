import React, { useState, useEffect } from 'react';
import { Text, View, Image, StyleSheet, Button, Alert, Modal } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [scannedCodes, setScannedCodes] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setScannedData(data);
    setScannedCodes([...scannedCodes, { type, data }]);
    // Store scanned codes in Expo's local storage
    AsyncStorage.setItem('scannedCodes', JSON.stringify(scannedCodes));
    // Make a POST request to the server with the scanned token, where token=data
    try {
      const response = await fetch('https://flowpass.ru/api/get.pass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'token='+data,
      });
      console.log('token='+data);
      const responseData = await response.json();
      console.log('POST response:', responseData);
      if (responseData.error) {
        setScanned(false);
        Alert.alert('Что-то пошло не так', responseData.error);

      } else {
        // сохраняем данные в scannedData
        setScannedData(responseData);

      }
    } catch (error) {
      console.error('POST error:', error);
    }
  };

  if (hasPermission === null) {
    return <Text>Что-то не так! Проверьте разрешение на использование камеры приложением</Text>;
  }
  if (hasPermission === false) {
    return <Text>Нет доступа к камере </Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && (
        <View style={styles.scanResult}>
          <Text>Пропуск отсканирован</Text>
          <Button title="Scan again" onPress={() => setScanned(false)} />
          <Modal

            title="Успешно"
            visible={true}
            footer={[
              {
                text: 'Ok',
                onPress: () => console.log('ok'),
              },
            ]}
          >
            <View style={styles.scanResult}>
            <Text style={styles.scanResultTitle}>Данные о пропуске</Text>
            <Text>ФИО {scannedData.fio}</Text>
            <Text>Дата рождения {scannedData.bday}</Text>
            <Text>Дата окончания пропуска {scannedData.date_expiration}</Text>
            <Text style={styles.passDataStatus}>
              Состояние пропуска:{' '}
              {scannedData.status === 'valid' ? (
                <Text style={styles.passDataStatusActive}>Активный</Text>
              ) : (
                <Text style={styles.passDataStatusInactive}>Не активный</Text>
              )}
            </Text>
            <Image
              style={{ width: 158, height: 216 }}
              source={{uri: 'https://flowpass.ru/'+scannedData.picture }}
            />
            <Button style={styles.buttondis} title="Отсканировать дальше" onPress={() => setScanned(false)} />
            </View>
          </Modal>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  buttondis: {
    backgroundColor: 'red',
  },
  scanResult: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  scanHistory: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  scanHistoryTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 10,
  },
  scanResultTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 10,
  },
  scanResult: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
});
