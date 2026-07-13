// src/screens/MatchesScreen.jsx
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, SafeAreaView, StatusBar, Dimensions, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import ProfileDetail from '../components/discovery/ProfileDetail';

const { width } = Dimensions.get('window');

const MATCHES = [
  { id:'1', name:'Sophia Carter',   age:23, image:'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500', matchedAt:'Today',    compatibility:92, online:true  },
  { id:'2', name:'Mia Rodriguez',   age:25, image:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500', matchedAt:'Yesterday', compatibility:85, online:true  },
  { id:'3', name:'Zoe Martin',      age:21, image:'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500', matchedAt:'2d ago',    compatibility:82, online:false },
  { id:'4', name:'Lily Chen',       age:24, image:'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=500', matchedAt:'3d ago',    compatibility:91, online:false },
];

export default function MatchesScreen() {
  const navigation = useNavigation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch]         = useState('');
  const [matches, setMatches]       = useState(MATCHES);
  
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [detailVisible, setDetailVisible]     = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const filtered = matches.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const CARD_W = (width - 52) / 2;

  const openProfile = (profile) => {
    setSelectedProfile(profile);
    setDetailVisible(true);
  };

  const unmatch = (id) => {
    setMatches(p => p.filter(m => m.id !== id));
  };

  const startChat = (id) => {
    navigation.navigate('ChatDetail', { userId: id });
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { width: CARD_W }]}
      onPress={() => openProfile(item)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <LinearGradient colors={theme.gradientCard} style={styles.cardOverlay} />

      {/* Online dot */}
      {item.online && <View style={styles.onlineDot} />}

      {/* Compat badge */}
      <View style={styles.compatBadge}>
        <Ionicons name="heart" size={9} color={theme.accent} />
        <Text style={styles.compatText}>{item.compatibility}%</Text>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Text style={styles.cardName}>{item.name.split(' ')[0]}</Text>
            <Text style={styles.cardSub}>{item.age} · {item.matchedAt}</Text>
          </View>
          
          {/* Message button - just a round icon */}
          <TouchableOpacity
            style={styles.msgBtnRound}
            onPress={() => startChat(item.id)}
            activeOpacity={0.7}
          >
            <LinearGradient colors={theme.gradientAccent} style={styles.msgBtnGrad}>
              <Ionicons name="chatbubble" size={14} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={theme.bgGrad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.flex}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={styles.flex}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Matches</Text>
            <Text style={styles.sub}>{filtered.length} connections</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setSearchOpen(p => !p)}>
            <Ionicons name={searchOpen ? 'close' : 'search'} size={19} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        {searchOpen && (
          <View style={styles.searchWrap}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={15} color={theme.textFaint} />
              <TextInput
                autoFocus style={styles.searchInput}
                placeholder="Search matches…"
                placeholderTextColor={theme.textFaint}
                value={search} onChangeText={setSearch}
              />
            </View>
          </View>
        )}

        <FlatList
          data={filtered}
          renderItem={renderCard}
          keyExtractor={i => i.id}
          numColumns={2}
          columnWrapperStyle={styles.colWrapper}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>

      {/* Profile Modal */}
      <ProfileDetail
        visible={detailVisible}
        profile={selectedProfile}
        isMatch={true}
        onClose={() => {
          setDetailVisible(false);
          setSelectedProfile(null);
        }}
        onLike={startChat}
        onPass={unmatch}
      />
    </LinearGradient>
  );
}

const getStyles = (theme) => StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '900', color: theme.textPrimary, letterSpacing: -0.6 },
  sub:   { fontSize: 13, color: theme.textSec, marginTop: 3 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.glass, borderWidth: 1, borderColor: theme.border,
    justifyContent: 'center', alignItems: 'center',
  },
  searchWrap: { paddingHorizontal: 20, marginBottom: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.glass, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: theme.border,
  },
  searchInput: { flex: 1, color: theme.textPrimary, fontSize: 14, padding: 0 },
  list:       { paddingHorizontal: 16, paddingBottom: 110 },
  colWrapper: { gap: 12, marginBottom: 12 },

  card: {
    height: 280, borderRadius: 22, overflow: 'hidden',
    backgroundColor: theme.glass,
    borderWidth: 1, borderColor: theme.border,
  },
  cardImage:   { position: 'absolute', width: '100%', height: '100%', resizeMode: 'cover' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  onlineDot: {
    position: 'absolute', top: 10, left: 10,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: theme.accentGreen, borderWidth: 2, borderColor: theme.bg,
  },
  compatBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: theme.glassDark, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: theme.borderAccent,
  },
  compatText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  cardInfo:   { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  infoRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLeft:   { flex: 1, marginRight: 6 },
  cardName:   { fontSize: 16, fontWeight: '900', color: '#fff' },
  cardSub:    { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  
  msgBtnRound: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden' },
  msgBtnGrad:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

