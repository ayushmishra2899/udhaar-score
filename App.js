import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  Alert, ActivityIndicator, FlatList, StatusBar, Dimensions, Animated
} from 'react-native';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; 
import { Plus, Users, Receipt, TrendingUp, Sparkles, ArrowLeft, CheckCircle2, Check } from 'lucide-react-native';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start();

    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tempData = [];
      querySnapshot.forEach((doc) => {
        tempData.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(tempData);
      setIsLoadingData(false);
    }, (error) => {
      console.error("Firebase Error: ", error);
      setIsLoadingData(false);
    });
    return () => unsubscribe();
  }, [activeTab]);

  // 🔥 UPDATE: Sirf wahi amount plus hoga jo abhi tak "pending" hai!
  const totalOutstanding = transactions
    .filter(item => item.status === 'pending')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const totalDebtors = new Set(
    transactions.filter(item => item.status === 'pending').map(item => item.customerName.toLowerCase().trim())
  ).size;

  // 🔥 NEW FUNCTION: Database mein status ko "settled" update karne ke liye
  const settleUdhaar = async (transactionId, name, amount) => {
    Alert.alert(
      "Settle Account? 🤝",
      `Kya ${name} ne ₹${amount} poore lauta diye hain?`,
      [
        { text: "Nahi", style: "cancel" },
        { 
          text: "Haan, Mil Gaye!", 
          onPress: async () => {
            try {
              const docRef = doc(db, "transactions", transactionId);
              await updateDoc(docRef, {
                status: "settled"
              });
            } catch (error) {
              console.error("Error updating status: ", error);
              Alert.alert("Error ❌", "Status update nahi ho paya.");
            }
          } 
        }
      ]
    );
  };

  const sendDataToFirebase = async () => {
    if (!customerName.trim() || !amount.trim()) {
      Alert.alert("Hold On ✨", "Bhai, naam aur amount dono toh daalo!");
      return;
    }

    setIsSending(true);
    try {
      await addDoc(collection(db, "transactions"), {
        customerName: customerName.trim(),
        amount: Number(amount),
        status: "pending", // Shuruat mein status hamesha pending rahega
        createdAt: new Date()
      });
      setCustomerName('');
      setAmount('');
      setActiveTab('dashboard');
    } catch (error) {
      Alert.alert("Error ❌", "Server tak data nahi pooncha.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#060814" />
      
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
        <View>
          <Text style={styles.greeting}>Hey Chief! 👋</Text>
          <Text style={styles.logoText}>Udhaar<Text style={styles.logoAccent}>Score.</Text></Text>
        </View>
        <View style={styles.sparkleBadge}>
          <Sparkles color="#A5B4FC" size={16} />
          <Text style={styles.sparkleText}>Pro v1.5</Text>
        </View>
      </Animated.View>

      {activeTab === 'dashboard' ? (
        <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
          <View style={styles.premiumCard}>
            <Text style={styles.cardLabel}>TOTAL OUTSTANDING ACCOUNT</Text>
            <Text style={styles.cardAmount}>₹{totalOutstanding.toLocaleString('en-IN')}</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: totalOutstanding > 0 ? '60%' : '0%' }]} />
              </View>
              <Text style={styles.progressText}>Risk Threshold Status: Stable</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={[styles.iconWrapper, { backgroundColor: '#1E1B4B' }]}>
                <Users color="#6366F1" size={20} />
              </View>
              <Text style={styles.statVal}>{totalDebtors}</Text>
              <Text style={styles.statLbl}>Active Debtors</Text>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.iconWrapper, { backgroundColor: '#14532D' }]}>
                <Receipt color="#22C55E" size={20} />
              </View>
              <Text style={styles.statVal}>{transactions.filter(t => t.status === 'pending').length}</Text>
              <Text style={styles.statLbl}>Pending Slips</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Live Ledgers Activity</Text>
          {isLoadingData ? (
            <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              renderItem={({ item }) => {
                const isPaid = item.status === 'settled';
                return (
                  <View style={[styles.ledgerCard, isPaid && styles.ledgerCardPaid]}>
                    <View style={styles.ledgerLeft}>
                      <View style={[styles.avatarCircle, isPaid && styles.avatarCirclePaid]}>
                        <Text style={[styles.avatarText, isPaid && styles.avatarTextPaid]}>
                          {item.customerName ? item.customerName.charAt(0).toUpperCase() : 'U'}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.ledgerName, isPaid && styles.ledgerNamePaid]}>{item.customerName}</Text>
                        <Text style={styles.ledgerDate}>
                          {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'Just now'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.ledgerRight}>
                      <Text style={[styles.ledgerAmount, isPaid && styles.ledgerAmountPaid]}>
                        {isPaid ? `+ ₹${item.amount}` : `- ₹${item.amount}`}
                      </Text>
                      
                      {/* Interactive Button Section */}
                      {isPaid ? (
                        <View style={styles.settledBadge}>
                          <Text style={styles.settledText}>SETTLED</Text>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          style={styles.settleButton} 
                          onPress={() => settleUdhaar(item.id, item.customerName, item.amount)}
                          activeOpacity={0.7}
                        >
                          <Check color="#6366F1" size={12} strokeWidth={3} />
                          <Text style={styles.settleButtonText}>Settle</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyIllustration}>
                  <CheckCircle2 color="#374151" size={56} strokeWidth={1.5} />
                  <Text style={styles.emptyHeadline}>No Debts Found! 😎</Text>
                  <Text style={styles.emptySubline}>Market bilkul clear aur profit mein hai.</Text>
                </View>
              }
            />
          )}

          <TouchableOpacity 
            style={styles.fabButton} 
            activeOpacity={0.85} 
            onPress={() => setActiveTab('add')}
          >
            <Plus color="#FFF" size={24} strokeWidth={2.5} />
            <Text style={styles.fabText}>New Tab</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View style={[styles.mainContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => setActiveTab('dashboard')}>
            <ArrowLeft color="#9CA3AF" size={20} />
            <Text style={styles.backText}>Cancel & Return</Text>
          </TouchableOpacity>

          <View style={styles.interactiveFormCard}>
            <Text style={styles.formTitle}>Initialize Credit Entry 💸</Text>
            <Text style={styles.formDesc}>Add detailed info to auto-sync inside cloud real-time ledgers.</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>CUSTOMER IDENTITY</Text>
              <TextInput 
                style={styles.premiumInput}
                placeholder="Enter Full Name"
                placeholderTextColor="#4B5563"
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>LOAN AMOUNT (INR)</Text>
              <TextInput 
                style={styles.premiumInput}
                placeholder="₹ 0.00"
                placeholderTextColor="#4B5563"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, isSending && styles.submitBtnDisabled]}
              onPress={sendDataToFirebase}
              disabled={isSending}
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Authorize Smart Credit</Text>
                  <TrendingUp color="#FFF" size={18} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060814', paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 55, marginBottom: 25 },
  greeting: { color: '#6B7280', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  logoText: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 2 },
  logoAccent: { color: '#6366F1' },
  sparkleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1B4B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#312E81' },
  sparkleText: { color: '#C7D2FE', fontSize: 11, fontWeight: '700', marginLeft: 6 },
  mainContent: { flex: 1 },
  premiumCard: { backgroundColor: '#0F1229', padding: 24, borderRadius: 28, borderWidth: 1, borderColor: '#1E234A' },
  cardLabel: { color: '#818CF8', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  cardAmount: { color: '#FFF', fontSize: 40, fontWeight: '900', letterSpacing: -0.5 },
  progressContainer: { marginTop: 20 },
  progressBarBg: { height: 6, backgroundColor: '#1E2243', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 3 },
  progressText: { color: '#4B5563', fontSize: 11, fontWeight: '600', marginTop: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 25 },
  statBox: { width: '48%', backgroundColor: '#0B0E21', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#161938' },
  iconWrapper: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statVal: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  statLbl: { color: '#6B7280', fontSize: 12, fontWeight: '500', marginTop: 2 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 14 },
  
  // Dynamic Ledger Row Item
  ledgerCard: { backgroundColor: '#0B0D19', padding: 14, borderRadius: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#121630' },
  ledgerCardPaid: { borderColor: '#064E3B', backgroundColor: '#041010' }, // Settled card color changes to deep emerald
  ledgerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#1A1D36', justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1, borderColor: '#2E3466' },
  avatarCirclePaid: { backgroundColor: '#064E3B', borderColor: '#10B981' },
  avatarText: { color: '#C7D2FE', fontSize: 16, fontWeight: '700' },
  avatarTextPaid: { color: '#10B981' },
  ledgerName: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  ledgerNamePaid: { color: '#9CA3AF', textDecorationLine: 'line-through' }, // Cross name after payment
  ledgerDate: { color: '#4B5563', fontSize: 12, marginTop: 4 },
  ledgerRight: { alignItems: 'flex-end' },
  ledgerAmount: { color: '#EF4444', fontSize: 16, fontWeight: '800' },
  ledgerAmountPaid: { color: '#10B981' },
  
  // Custom Settle Actions Buttons
  settleButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1D36', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginTop: 6, borderWidth: 1, borderColor: '#2E3466' },
  settleButtonText: { color: '#A5B4FC', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  settledBadge: { backgroundColor: '#064E3B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  settledText: { color: '#10B981', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  emptyIllustration: { alignItems: 'center', marginTop: 45, opacity: 0.7 },
  emptyHeadline: { color: '#9CA3AF', fontSize: 16, fontWeight: '700', marginTop: 14 },
  emptySubline: { color: '#4B5563', fontSize: 12, marginTop: 4, textAlign: 'center' },
  fabButton: { position: 'absolute', bottom: 30, right: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366F1', paddingHorizontal: 22, paddingVertical: 15, borderRadius: 30 },
  fabText: { color: '#FFF', fontSize: 15, fontWeight: '800', marginLeft: 8 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  interactiveFormCard: { backgroundColor: '#0B0D19', padding: 24, borderRadius: 28, borderWidth: 1, borderColor: '#161938' },
  formTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  formDesc: { color: '#4B5563', fontSize: 13, fontWeight: '500', marginBottom: 25 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { color: '#6366F1', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  premiumInput: { backgroundColor: '#060814', color: '#FFF', padding: 16, borderRadius: 16, fontSize: 16, fontWeight: '600', borderWidth: 1, borderColor: '#1F244C' },
  submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#6366F1', padding: 18, borderRadius: 18, marginTop: 10 },
  submitBtnDisabled: { backgroundColor: '#4338CA', opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', marginRight: 10 }
});