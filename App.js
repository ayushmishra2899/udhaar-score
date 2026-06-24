import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig'; 

export default function App() {
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Naya State: Firebase se aane waale data ko save karne ke liye
  const [transactions, setTransactions] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 1. useEffect: App khulte hi Firebase se real-time data khinchne ke liye
  useEffect(() => {
    // Query bana rahe hain taaki naya data sabse upar dikhe (createdAt, descending)
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));

    // onSnapshot jadoo hai—yeh database mein har badlav par automatic trigger hota hai
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tempData = [];
      querySnapshot.forEach((doc) => {
        tempData.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(tempData); // State mein data save kiya
      setIsLoadingData(false);
    }, (error) => {
      console.error("Error fetching data: ", error);
      setIsLoadingData(false);
    });

    // Jab app band ho toh listener ko band karne ke liye
    return () => unsubscribe();
  }, []);

  // 2. Data Firebase mein bhejne ka function
  const sendDataToFirebase = async () => {
    if (!customerName.trim() || !amount.trim()) {
      Alert.alert("Error ❌", "Bhai, naam aur amount dono daalo!");
      return;
    }

    setIsSending(true);
    try {
      await addDoc(collection(db, "transactions"), {
        customerName: customerName,
        amount: Number(amount),
        status: "udhaar_given",
        createdAt: new Date()
      });

      Alert.alert("Success! 🎉", `${customerName} ka ₹${amount} save ho gaya!`);
      setCustomerName('');
      setAmount('');
    } catch (error) {
      console.error("Error: ", error);
      Alert.alert("Error ❌", "Data nahi gaya.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Udhaar Score App 💰</Text>
      
      {/* Input Form Section */}
      <View style={styles.formCard}>
        <TextInput 
          style={styles.input}
          placeholder="Customer Name"
          value={customerName}
          onChangeText={setCustomerName}
        />
        <TextInput 
          style={styles.input}
          placeholder="Amount (₹)"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TouchableOpacity style={styles.button} onPress={sendDataToFirebase} disabled={isSending}>
          {isSending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add Udhaar</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.subHeader}>Recent Transactions 👇</Text>

      {/* List Section: Data dikhane ke liye */}
      {isLoadingData ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.transactionCard}>
              <View>
                <Text style={styles.transName}>{item.customerName}</Text>
                <Text style={styles.transDate}>
                  {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                </Text>
              </View>
              <Text style={styles.transAmount}>₹{item.amount}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Koi udhaar nahi hai abhi tak! 😎</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 60 },
  header: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#111' },
  subHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#444', marginTop: 10 },
  formCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  input: { borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16, backgroundColor: '#fafafa' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  transactionCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderLeftWidth: 5, borderLeftColor: '#FF3B30' },
  transName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  transDate: { fontSize: 12, color: '#aaa', marginTop: 3 },
  transAmount: { fontSize: 18, fontWeight: 'bold', color: '#FF3B30' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20, fontSize: 16 }
});