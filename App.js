import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; 

export default function App() {
  // 1. User jo type karega, use save karne ke liye states
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);

  // 2. Data ko Firebase mein bhejne ka function
  const sendDataToFirebase = async () => {
    // Validation: Agar fields khaali hain toh rok do
    if (!customerName.trim() || !amount.trim()) {
      Alert.alert("Error ❌", "Bhai, naam aur amount dono daalo!");
      return;
    }

    setIsSending(true);
    try {
      // Firebase ke "transactions" collection mein real data bhej rahe hain
      await addDoc(collection(db, "transactions"), {
        customerName: customerName,
        amount: Number(amount), // String ko number mein badla
        status: "udhaar_given",
        createdAt: new Date() // Kab entry hui, uska time
      });

      Alert.alert("Success! 🎉", `${customerName} ka ₹${amount} database mein save ho gaya!`);
      
      // Form ko wapis khaali kar do
      setCustomerName('');
      setAmount('');
    } catch (error) {
      console.error("Error: ", error);
      Alert.alert("Error ❌", "Data nahi gaya. Terminal check karo.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Udhaar Score App 💰</Text>
      
      <Text style={styles.label}>Customer Name:</Text>
      <TextInput 
        style={styles.input}
        placeholder="e.g. Ramesh Kumar"
        value={customerName}
        onChangeText={(text) => setCustomerName(text)}
      />

      <Text style={styles.label}>Amount (₹):</Text>
      <TextInput 
        style={styles.input}
        placeholder="e.g. 500"
        keyboardType="numeric" // Sirf numbers type karne ke liye
        value={amount}
        onChangeText={(text) => setAmount(text)}
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={sendDataToFirebase}
        disabled={isSending}
      >
        {isSending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Add Transaction</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// Basic Styling taaki app sundar dikhe
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333'
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '600',
    color: '#555'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});