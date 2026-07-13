// src/screens/RegisterScreen.jsx
// Multi-step registration wizard for HeartLink
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Dimensions, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar, Image, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../hooks/useAuth';
import { THEME } from '../theme/colors';

const { width, height } = Dimensions.get('window');
const TOTAL_STEPS = 8;

// ─── Data ───────────────────────────────────────────────────────────────────
const HOBBIES = [
  'Photography', 'Travel', 'Music', 'Cooking', 'Gaming', 'Fitness',
  'Reading', 'Art', 'Dancing', 'Yoga', 'Hiking', 'Movies',
  'Fashion', 'Technology', 'Sports', 'Coffee', 'Writing', 'Cycling',
];
const RELATIONSHIP_TYPES = [
  { label: 'Long-term Relationship', icon: '💍', desc: 'Looking for something serious' },
  { label: 'Casual Dating',          icon: '🌹', desc: 'Going with the flow' },
  { label: 'Friendship',             icon: '🤝', desc: 'Making new friends' },
  { label: 'Open Relationship',      icon: '🌸', desc: 'Open to possibilities' },
  { label: 'Marriage-minded',        icon: '👑', desc: 'Ready to settle down' },
  { label: 'Short-term fun',         icon: '✨', desc: 'Keeping it light' },
];
const GENDERS = ['Man', 'Woman', 'Non-binary', 'Prefer not to say'];
const FACE_DIRECTIONS = [
  { key: 'center', label: 'Face Forward',      icon: '😊', hint: 'Look straight at the camera' },
  { key: 'left',   label: 'Turn Left',         icon: '👈', hint: 'Gently turn your head left' },
  { key: 'right',  label: 'Turn Right',        icon: '👉', hint: 'Gently turn your head right' },
  { key: 'up',     label: 'Look Up',           icon: '☝️', hint: 'Tilt your head slightly up' },
  { key: 'smile',  label: 'Give a Big Smile',  icon: '😁', hint: 'Show us your beautiful smile!' },
];

// ─── Reusable animated input ─────────────────────────────────────────────────
function FloatingInput({ label, icon, value, onChangeText, keyboardType, secureTextEntry, multiline, style }) {
  const [focused, setFocused] = useState(false);
  const [showSec, setShowSec] = useState(false);
  return (
    <View style={[inputStyles.wrap, focused && inputStyles.wrapFocused, style]}>
      <Ionicons name={icon} size={18} color={focused ? '#FF007F' : THEME.textFaint} style={inputStyles.icon} />
      <TextInput
        style={[inputStyles.field, multiline && { height: 80, textAlignVertical: 'top' }]}
        placeholder={label}
        placeholderTextColor={THEME.textFaint}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
        secureTextEntry={secureTextEntry && !showSec}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {secureTextEntry && (
        <TouchableOpacity onPress={() => setShowSec(v => !v)} style={inputStyles.eye}>
          <Ionicons name={showSec ? 'eye-outline' : 'eye-off-outline'} size={18} color={THEME.textFaint} />
        </TouchableOpacity>
      )}
    </View>
  );
}
const inputStyles = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 14, paddingVertical: 13, marginBottom: 14 },
  wrapFocused: { borderColor: '#FF007F', backgroundColor: 'rgba(255,0,127,0.06)' },
  icon:        { marginRight: 10 },
  field:       { flex: 1, color: '#fff', fontSize: 15 },
  eye:         { padding: 4 },
});

// ─── Step components ──────────────────────────────────────────────────────────

// Step 1: Basic Info
function StepBasicInfo({ data, onChange }) {
  return (
    <View>
      <StepHeader icon="👤" title="Let's get to know you" sub="Tell us about yourself" />
      <FloatingInput label="Full Name" icon="person-outline" value={data.name} onChangeText={v => onChange('name', v)} />
      <FloatingInput label="Email Address" icon="mail-outline" value={data.email} onChangeText={v => onChange('email', v)} keyboardType="email-address" />
      <FloatingInput label="Password" icon="lock-closed-outline" value={data.password} onChangeText={v => onChange('password', v)} secureTextEntry />
      <FloatingInput label="Age" icon="calendar-outline" value={data.age} onChangeText={v => onChange('age', v)} keyboardType="numeric" />
      <Text style={sty.label}>Gender</Text>
      <View style={sty.chipRow}>
        {GENDERS.map(g => (
          <TouchableOpacity
            key={g}
            style={[sty.chip, data.gender === g && sty.chipActive]}
            onPress={() => onChange('gender', g)}
          >
            <Text style={[sty.chipText, data.gender === g && sty.chipTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Step 2: OTP
function StepOTP({ data, onChange }) {
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const refs = Array(6).fill(null).map(() => useRef(null));

  const sendOTP = () => {
    if (!data.phone || data.phone.length < 10) return;
    setOtpSent(true);
    setCountdown(30);
    let t = 30;
    const interval = setInterval(() => {
      t--;
      setCountdown(t);
      if (t === 0) clearInterval(interval);
    }, 1000);
  };

  const handleOtpChange = (text, idx) => {
    const newOtp = [...otp];
    newOtp[idx] = text.slice(-1);
    setOtp(newOtp);
    onChange('otp', newOtp.join(''));
    if (text && idx < 5) refs[idx + 1].current?.focus();
  };

  return (
    <View>
      <StepHeader icon="📱" title="Verify Your Number" sub="We'll send a 6-digit OTP" />
      <View style={sty.phoneRow}>
        <View style={sty.countryCode}>
          <Text style={sty.countryCodeText}>🇮🇳 +91</Text>
        </View>
        <FloatingInput
          label="Mobile Number"
          icon="call-outline"
          value={data.phone}
          onChangeText={v => onChange('phone', v)}
          keyboardType="numeric"
          style={{ flex: 1, marginBottom: 0 }}
        />
      </View>

      <TouchableOpacity
        style={[sty.sendOtpBtn, (!data.phone || data.phone.length < 10) && sty.btnDisabled]}
        onPress={sendOTP}
        disabled={!data.phone || data.phone.length < 10 || countdown > 0}
      >
        <LinearGradient colors={['#FF007F', '#B5179E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={sty.sendOtpGrad}>
          <Text style={sty.sendOtpText}>
            {countdown > 0 ? `Resend in ${countdown}s` : otpSent ? 'Resend OTP' : 'Send OTP'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {otpSent && (
        <View>
          <Text style={[sty.label, { marginTop: 24 }]}>Enter OTP sent to +91 {data.phone}</Text>
          <View style={sty.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={refs[i]}
                style={[sty.otpBox, digit && sty.otpBoxFilled]}
                value={digit}
                onChangeText={t => handleOtpChange(t, i)}
                keyboardType="numeric"
                maxLength={1}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && !digit && i > 0) {
                    refs[i - 1].current?.focus();
                  }
                }}
              />
            ))}
          </View>
          <Text style={sty.otpHint}>💡 Use 1 2 3 4 5 6 for demo</Text>
        </View>
      )}
    </View>
  );
}

// Step 3: Hobbies
function StepHobbies({ data, onChange }) {
  const toggle = (h) => {
    const curr = data.hobbies || [];
    const next = curr.includes(h) ? curr.filter(x => x !== h) : [...curr, h];
    onChange('hobbies', next);
  };
  return (
    <View>
      <StepHeader icon="🎯" title="Your Interests" sub="Pick at least 3 hobbies you love" />
      <Text style={sty.selectedCount}>
        {(data.hobbies || []).length} selected
      </Text>
      <View style={sty.chipGrid}>
        {HOBBIES.map(h => {
          const active = (data.hobbies || []).includes(h);
          return (
            <TouchableOpacity
              key={h}
              style={[sty.hobbyChip, active && sty.hobbyChipActive]}
              onPress={() => toggle(h)}
            >
              <Text style={[sty.hobbyText, active && sty.hobbyTextActive]}>{h}</Text>
              {active && <Ionicons name="checkmark-circle" size={14} color="#FF007F" style={{ marginLeft: 4 }} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Step 4: Relationship Preferences
function StepPreferences({ data, onChange }) {
  return (
    <View>
      <StepHeader icon="💝" title="What are you looking for?" sub="Select the relationship type that fits you" />
      {RELATIONSHIP_TYPES.map(rt => {
        const active = data.relationshipType === rt.label;
        return (
          <TouchableOpacity
            key={rt.label}
            style={[sty.prefCard, active && sty.prefCardActive]}
            onPress={() => onChange('relationshipType', rt.label)}
          >
            <LinearGradient
              colors={active ? ['rgba(255,0,127,0.15)', 'rgba(181,23,158,0.08)'] : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={sty.prefIcon}>{rt.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[sty.prefLabel, active && sty.prefLabelActive]}>{rt.label}</Text>
              <Text style={sty.prefDesc}>{rt.desc}</Text>
            </View>
            {active && <Ionicons name="checkmark-circle" size={22} color="#FF007F" />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Step 5: Location
function StepLocation({ data, onChange }) {
  return (
    <View>
      <StepHeader icon="📍" title="Where are you located?" sub="Help us find people near you" />
      <FloatingInput label="City"    icon="business-outline"   value={data.city}    onChangeText={v => onChange('city', v)} />
      <FloatingInput label="State"   icon="map-outline"        value={data.state}   onChangeText={v => onChange('state', v)} />
      <FloatingInput label="Country" icon="globe-outline"      value={data.country} onChangeText={v => onChange('country', v)} />
      <View style={sty.locationNote}>
        <Ionicons name="information-circle-outline" size={16} color={THEME.textFaint} />
        <Text style={sty.locationNoteText}>Your exact location is never shared publicly</Text>
      </View>
    </View>
  );
}

// Step 6: Dating Age Range
function StepAgeRange({ data, onChange }) {
  const [minAge, setMinAge] = useState(data.ageMin || 18);
  const [maxAge, setMaxAge] = useState(data.ageMax || 35);

  const update = (field, val) => {
    const num = parseInt(val) || (field === 'min' ? 18 : 35);
    const clamped = Math.min(Math.max(num, 18), 60);
    if (field === 'min') {
      setMinAge(clamped);
      onChange('ageMin', clamped);
    } else {
      setMaxAge(clamped);
      onChange('ageMax', clamped);
    }
  };

  const ageOptions = Array.from({ length: 43 }, (_, i) => i + 18); // 18–60

  return (
    <View>
      <StepHeader icon="🎂" title="Age Preference" sub="Who do you want to connect with?" />

      <View style={sty.ageDisplayRow}>
        <View style={sty.ageDisplay}>
          <LinearGradient colors={['#FF007F', '#B5179E']} style={sty.ageDisplayGrad}>
            <Text style={sty.ageDisplayNum}>{minAge}</Text>
            <Text style={sty.ageDisplayLbl}>Min Age</Text>
          </LinearGradient>
        </View>
        <Text style={sty.ageDash}>—</Text>
        <View style={sty.ageDisplay}>
          <LinearGradient colors={['#B5179E', '#7B2FBE']} style={sty.ageDisplayGrad}>
            <Text style={sty.ageDisplayNum}>{maxAge}</Text>
            <Text style={sty.ageDisplayLbl}>Max Age</Text>
          </LinearGradient>
        </View>
      </View>

      <Text style={sty.label}>Minimum Age</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} overScrollMode="never" bounces={false} style={sty.ageScroll}>
        {ageOptions.filter(a => a <= maxAge).map(a => (
          <TouchableOpacity
            key={a}
            style={[sty.ageChip, minAge === a && sty.ageChipActive]}
            onPress={() => { setMinAge(a); onChange('ageMin', a); }}
          >
            <Text style={[sty.ageChipText, minAge === a && sty.ageChipTextActive]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[sty.label, { marginTop: 16 }]}>Maximum Age</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} overScrollMode="never" bounces={false} style={sty.ageScroll}>
        {ageOptions.filter(a => a >= minAge).map(a => (
          <TouchableOpacity
            key={a}
            style={[sty.ageChip, maxAge === a && sty.ageChipActive]}
            onPress={() => { setMaxAge(a); onChange('ageMax', a); }}
          >
            <Text style={[sty.ageChipText, maxAge === a && sty.ageChipTextActive]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={sty.ageRangePill}>
        <Text style={sty.ageRangeText}>
          You'll see profiles aged {minAge} – {maxAge}
        </Text>
      </View>
    </View>
  );
}

// Step 7: Photos
function StepPhotos({ data, onChange }) {
  const photos = data.photos || [];

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onChange('photos', [...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (idx) => {
    const next = photos.filter((_, i) => i !== idx);
    onChange('photos', next);
  };

  return (
    <View>
      <StepHeader icon="📸" title="Add Your Photos" sub="Add at least 3 photos to continue" />

      <View style={sty.photoGrid}>
        {Array(6).fill(null).map((_, i) => {
          const uri = photos[i];
          const isRequired = i < 3;
          return (
            <View key={i} style={sty.photoSlot}>
              {uri ? (
                <>
                  <Image source={{ uri }} style={sty.photoImg} />
                  <TouchableOpacity style={sty.photoRemove} onPress={() => removePhoto(i)}>
                    <Ionicons name="close-circle" size={22} color="#FF375F" />
                  </TouchableOpacity>
                  {i < 3 && (
                    <View style={sty.photoRequired}>
                      <Text style={sty.photoRequiredText}>Main</Text>
                    </View>
                  )}
                </>
              ) : (
                <TouchableOpacity style={sty.photoEmpty} onPress={pickPhoto}>
                  <LinearGradient
                    colors={isRequired ? ['rgba(255,0,127,0.12)', 'rgba(181,23,158,0.06)'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <Ionicons name="add-circle-outline" size={28} color={isRequired ? '#FF4D94' : THEME.textFaint} />
                  {isRequired && <Text style={sty.photoSlotLabel}>Required</Text>}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      <View style={sty.photoProgress}>
        <View style={[sty.photoProgressBar, { width: `${Math.min((photos.length / 3) * 100, 100)}%` }]} />
      </View>
      <Text style={sty.photoCount}>
        {photos.length < 3
          ? `${3 - photos.length} more photo${3 - photos.length !== 1 ? 's' : ''} required`
          : `✅ ${photos.length} photos added — looking great!`}
      </Text>
    </View>
  );
}

// Step 8: Face Verification
function StepFaceVerification({ data, onChange }) {
  const [currentDir, setCurrentDir] = useState(0);
  const faces = data.facePhotos || {};
  const dir = FACE_DIRECTIONS[currentDir];
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);

  const captureface = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera needed', 'Please allow camera access for face verification.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const updated = { ...faces, [dir.key]: result.assets[0].uri };
      onChange('facePhotos', updated);
      if (currentDir < FACE_DIRECTIONS.length - 1) {
        setTimeout(() => setCurrentDir(i => i + 1), 400);
      }
    }
  };

  const allDone = FACE_DIRECTIONS.every(d => faces[d.key]);

  return (
    <View>
      <StepHeader icon="🔍" title="Face Verification" sub="Help us keep HeartLink safe" />

      {/* Progress dots */}
      <View style={sty.faceDotsRow}>
        {FACE_DIRECTIONS.map((d, i) => (
          <View key={d.key} style={[sty.faceDot,
            faces[d.key] ? sty.faceDotDone : i === currentDir ? sty.faceDotActive : sty.faceDotInactive,
          ]}>
            {faces[d.key] && <Ionicons name="checkmark" size={10} color="#fff" />}
          </View>
        ))}
      </View>

      {!allDone ? (
        <View style={sty.faceCapture}>
          {/* Camera frame */}
          <View style={sty.faceFrame}>
            <LinearGradient
              colors={['rgba(255,0,127,0.15)', 'rgba(94,92,230,0.10)']}
              style={StyleSheet.absoluteFill}
            />
            {/* Corner brackets */}
            <View style={[sty.bracket, sty.bTL]} />
            <View style={[sty.bracket, sty.bTR]} />
            <View style={[sty.bracket, sty.bBL]} />
            <View style={[sty.bracket, sty.bBR]} />

            <Animated.Text style={[sty.faceEmoji, { transform: [{ scale: pulseAnim }] }]}>
              {dir.icon}
            </Animated.Text>
          </View>

          <Text style={sty.faceDirectionLabel}>{dir.label}</Text>
          <Text style={sty.faceDirectionHint}>{dir.hint}</Text>

          <TouchableOpacity style={sty.captureBtn} onPress={captureface}>
            <LinearGradient colors={['#FF007F', '#B5179E', '#7B2FBE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={sty.captureBtnGrad}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={sty.captureBtnText}>Take Photo ({currentDir + 1}/{FACE_DIRECTIONS.length})</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Thumbnails row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} overScrollMode="never" bounces={false} style={sty.faceThumbs}>
            {FACE_DIRECTIONS.map((d, i) => (
              <View key={d.key} style={sty.faceThumb}>
                {faces[d.key]
                  ? <Image source={{ uri: faces[d.key] }} style={sty.faceThumbImg} />
                  : <View style={[sty.faceThumbEmpty, i === currentDir && sty.faceThumbCurrent]}>
                      <Text style={{ fontSize: 16 }}>{d.icon}</Text>
                    </View>
                }
                <Text style={sty.faceThumbLabel}>{d.label.split(' ')[0]}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={sty.faceSuccess}>
          <LinearGradient colors={['rgba(48,209,88,0.15)', 'rgba(48,209,88,0.05)']} style={StyleSheet.absoluteFill} />
          <Text style={{ fontSize: 56 }}>✅</Text>
          <Text style={sty.faceSuccessTitle}>Verification Complete!</Text>
          <Text style={sty.faceSuccessSub}>Your identity has been verified. You're all set!</Text>
          <View style={sty.faceThumbsRow}>
            {FACE_DIRECTIONS.map(d => (
              <Image key={d.key} source={{ uri: faces[d.key] }} style={sty.faceThumbDone} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// Step header component
function StepHeader({ icon, title, sub }) {
  return (
    <View style={sty.stepHeader}>
      <Text style={sty.stepIcon}>{icon}</Text>
      <Text style={sty.stepTitle}>{title}</Text>
      <Text style={sty.stepSub}>{sub}</Text>
    </View>
  );
}

// ─── Validation ──────────────────────────────────────────────────────────────
function validateStep(step, data) {
  switch (step) {
    case 0: return data.name?.trim() && data.email?.trim() && data.password?.trim() && data.age && data.gender;
    case 1: return data.phone?.length >= 10 && data.otp?.length === 6;
    case 2: return (data.hobbies || []).length >= 3;
    case 3: return !!data.relationshipType;
    case 4: return data.city?.trim() && data.state?.trim() && data.country?.trim();
    case 5: return data.ageMin && data.ageMax && data.ageMax > data.ageMin;
    case 6: return (data.photos || []).length >= 3;
    case 7: return FACE_DIRECTIONS.every(d => data.facePhotos?.[d.key]);
    default: return false;
  }
}

// ─── Main RegisterScreen ──────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: '', email: '', password: '', age: '', gender: '',
    phone: '', otp: '',
    hobbies: [],
    relationshipType: '',
    city: '', state: '', country: '',
    ageMin: 18, ageMax: 35,
    photos: [],
    facePhotos: {},
  });

  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: (step + 1) / TOTAL_STEPS,
      useNativeDriver: false,
      tension: 50, friction: 9,
    }).start();
    
    // Scroll to top when step changes
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [step]);

  const onChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const goNext = () => {
    if (!validateStep(step, data)) {
      Alert.alert('Almost there!', getValidationMessage(step));
      return;
    }
    if (step === TOTAL_STEPS - 1) {
      login({ ...data });
      return;
    }
    const dir = 1;
    slideAnim.setValue(dir * width);
    setStep(s => s + 1);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 12 }).start();
  };

  const goBack = () => {
    if (step === 0) { navigation.goBack(); return; }
    const dir = -1;
    slideAnim.setValue(dir * width);
    setStep(s => s - 1);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 12 }).start();
  };

  const getValidationMessage = (s) => {
    const msgs = [
      'Please fill in your name, email, password, age and gender.',
      'Please enter your phone number and verify it with OTP.',
      'Please select at least 3 hobbies.',
      'Please select a relationship type.',
      'Please enter your city, state and country.',
      'Please select a valid age range.',
      'Please add at least 3 profile photos.',
      'Please complete all 5 face verification photos.',
    ];
    return msgs[s] || 'Please complete this step.';
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const isValid = validateStep(step, data);
  const isLastStep = step === TOTAL_STEPS - 1;

  const STEP_LABELS = [
    'Basic Info', 'Verify Phone', 'Hobbies', 'Relationship',
    'Location', 'Age Range', 'Photos', 'Face Verify',
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background */}
      <LinearGradient
        colors={['#0A0010', '#160825', '#0D0520', '#080010']}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Orbs — clipped wrapper prevents horizontal overflow */}
      <View style={styles.orbsClip} pointerEvents="none">
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerStep}>Step {step + 1} of {TOTAL_STEPS}</Text>
          <Text style={styles.headerLabel}>{STEP_LABELS[step]}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
          <LinearGradient colors={['#FF007F', '#B5179E', '#7B2FBE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>

      {/* Step dots */}
      <View style={styles.stepDots}>
        {Array(TOTAL_STEPS).fill(null).map((_, i) => (
          <View key={i} style={[styles.stepDot,
            i < step ? styles.stepDotDone : i === step ? styles.stepDotActive : styles.stepDotInactive,
          ]}>
            {i < step && <Ionicons name="checkmark" size={8} color="#fff" />}
          </View>
        ))}
      </View>

      {/* Step content */}
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <Animated.View style={[styles.stepContent, { transform: [{ translateX: slideAnim }] }]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={true}
            indicatorStyle="white"
            overScrollMode="always"
            bounces={true}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {step === 0 && <StepBasicInfo data={data} onChange={onChange} />}
            {step === 1 && <StepOTP data={data} onChange={onChange} />}
            {step === 2 && <StepHobbies data={data} onChange={onChange} />}
            {step === 3 && <StepPreferences data={data} onChange={onChange} />}
            {step === 4 && <StepLocation data={data} onChange={onChange} />}
            {step === 5 && <StepAgeRange data={data} onChange={onChange} />}
            {step === 6 && <StepPhotos data={data} onChange={onChange} />}
            {step === 7 && <StepFaceVerification data={data} onChange={onChange} />}
            
            {/* Extra padding at bottom to ensure content is fully visible */}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <LinearGradient
          colors={['transparent', 'rgba(8,0,16,0.97)']}
          style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity
          style={[styles.nextBtnWrap, !isValid && styles.nextBtnDisabled]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isValid ? ['#FF007F', '#B5179E', '#7B2FBE'] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.nextBtn}
          >
            <Text style={[styles.nextBtnText, !isValid && { color: THEME.textFaint }]}>
              {isLastStep ? '🎉 Complete Profile' : 'Continue'}
            </Text>
            {isValid && !isLastStep ? <Ionicons name="arrow-forward" size={20} color="#fff" /> : null}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:  { 
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#080010',
    overflow: 'hidden',
  },

  // Orbs — wrapper clips horizontal bleed only
  orbsClip: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  orb:   { position: 'absolute', borderRadius: 999 },
  orb1:  { width: 300, height: 300, top: -80, left: -80, backgroundColor: 'rgba(255,0,127,0.12)' },
  orb2:  { width: 260, height: 260, bottom: 0, right: -80, backgroundColor: 'rgba(94,92,230,0.10)' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    zIndex: 10,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.10)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { alignItems: 'center' },
  headerStep:  { fontSize: 12, color: THEME.textFaint, fontWeight: '600', letterSpacing: 0.5 },
  headerLabel: { fontSize: 16, color: '#fff', fontWeight: '800', marginTop: 2 },

  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 16, borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 2, overflow: 'hidden' },

  stepDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12, marginBottom: 4 },
  stepDot:  { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  stepDotActive:   { backgroundColor: '#FF007F', width: 22, height: 22, borderRadius: 11 },
  stepDotDone:     { backgroundColor: '#30D158' },
  stepDotInactive: { backgroundColor: 'rgba(255,255,255,0.12)' },

  keyboardView: { 
    flex: 1, 
    marginBottom: 120, // Space for bottom bar
  },
  stepContent: { 
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  bottomPadding: {
    height: 40, // Extra padding at bottom for better scroll experience
  },

  bottomBar:   { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    paddingHorizontal: 20, 
    paddingBottom: 36, 
    paddingTop: 24,
    zIndex: 20,
  },
  nextBtnWrap: { borderRadius: 20, overflow: 'hidden' },
  nextBtnDisabled: { opacity: 0.7 },
  nextBtn:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 17 },
  nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});

// Step-specific styles
const sty = StyleSheet.create({
  stepHeader: { alignItems: 'center', marginBottom: 28, paddingTop: 4 },
  stepIcon:   { fontSize: 44, marginBottom: 10 },
  stepTitle:  { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -0.3 },
  stepSub:    { fontSize: 14, color: THEME.textSec, textAlign: 'center', marginTop: 6 },

  label:      { fontSize: 13, fontWeight: '700', color: THEME.textFaint, letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' },

  // Chips
  chipRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  chip:       { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
  chipActive: { backgroundColor: 'rgba(255,0,127,0.15)', borderColor: '#FF007F' },
  chipText:   { color: THEME.textSec, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#FF007F', fontWeight: '700' },

  // Hobbies
  selectedCount: { fontSize: 13, color: '#FF4D94', fontWeight: '700', textAlign: 'right', marginBottom: 12 },
  chipGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hobbyChip:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)' },
  hobbyChipActive: { backgroundColor: 'rgba(255,0,127,0.14)', borderColor: '#FF007F' },
  hobbyText:  { color: THEME.textSec, fontSize: 14, fontWeight: '600' },
  hobbyTextActive: { color: '#FF007F', fontWeight: '700' },

  // OTP
  phoneRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  countryCode: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 14, paddingVertical: 14 },
  countryCodeText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sendOtpBtn:  { borderRadius: 16, overflow: 'hidden', marginBottom: 4 },
  sendOtpGrad: { paddingVertical: 14, alignItems: 'center' },
  sendOtpText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
  otpRow:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  otpBox:      { width: (width - 80) / 6, height: 56, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.07)', textAlign: 'center', color: '#fff', fontSize: 22, fontWeight: '900' },
  otpBoxFilled:{ borderColor: '#FF007F', backgroundColor: 'rgba(255,0,127,0.12)' },
  otpHint:     { color: THEME.textFaint, fontSize: 12, textAlign: 'center', marginTop: 12 },

  // Relationship
  prefCard:    { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)', padding: 16, marginBottom: 12, overflow: 'hidden', gap: 12 },
  prefCardActive: { borderColor: '#FF007F' },
  prefIcon:    { fontSize: 28 },
  prefLabel:   { fontSize: 16, fontWeight: '700', color: THEME.textSec },
  prefLabelActive: { color: '#fff' },
  prefDesc:    { fontSize: 12, color: THEME.textFaint, marginTop: 2 },

  // Location
  locationNote:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, marginTop: 4 },
  locationNoteText: { color: THEME.textFaint, fontSize: 13, flex: 1 },

  // Age range
  ageDisplayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 28 },
  ageDisplay:    { borderRadius: 20, overflow: 'hidden' },
  ageDisplayGrad:{ paddingHorizontal: 28, paddingVertical: 18, alignItems: 'center' },
  ageDisplayNum: { fontSize: 36, fontWeight: '900', color: '#fff' },
  ageDisplayLbl: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },
  ageDash:       { fontSize: 28, color: THEME.textFaint, fontWeight: '300' },
  ageScroll:     { marginBottom: 8 },
  ageChip:       { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  ageChipActive: { backgroundColor: 'rgba(255,0,127,0.18)', borderColor: '#FF007F' },
  ageChipText:   { color: THEME.textSec, fontSize: 14, fontWeight: '600' },
  ageChipTextActive: { color: '#FF007F', fontWeight: '800' },
  ageRangePill:  { backgroundColor: 'rgba(255,0,127,0.10)', borderRadius: 16, padding: 14, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: 'rgba(255,0,127,0.25)' },
  ageRangeText:  { color: '#FF4D94', fontSize: 15, fontWeight: '700' },

  // Photos
  photoGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  photoSlot:     { width: (width - 60) / 3, height: (width - 60) / 3 * 1.3, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  photoImg:      { width: '100%', height: '100%', resizeMode: 'cover' },
  photoEmpty:    { flex: 1, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 16, borderStyle: 'dashed', gap: 6, overflow: 'hidden' },
  photoRemove:   { position: 'absolute', top: 6, right: 6 },
  photoRequired: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,0,127,0.75)', paddingVertical: 4, alignItems: 'center' },
  photoRequiredText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  photoSlotLabel:    { color: '#FF4D94', fontSize: 10, fontWeight: '700' },
  photoProgress: { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  photoProgressBar: { height: '100%', backgroundColor: '#30D158', borderRadius: 3 },
  photoCount:    { color: THEME.textSec, fontSize: 13, textAlign: 'center', fontWeight: '600' },

  // Face verification
  faceDotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  faceDot:     { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  faceDotActive:   { backgroundColor: '#FF007F' },
  faceDotDone:     { backgroundColor: '#30D158' },
  faceDotInactive: { backgroundColor: 'rgba(255,255,255,0.12)' },

  faceCapture: { alignItems: 'center' },
  faceFrame:   {
    width: width * 0.62, height: width * 0.72,
    borderRadius: width * 0.35,
    borderWidth: 2, borderColor: 'rgba(255,0,127,0.5)',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20,
  },
  bracket:  { position: 'absolute', width: 28, height: 28, borderColor: '#FF007F', borderWidth: 3 },
  bTL: { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  bTR: { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  bBL: { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  bBR: { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  faceEmoji: { fontSize: 52 },

  faceDirectionLabel: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center' },
  faceDirectionHint:  { fontSize: 14, color: THEME.textSec, textAlign: 'center', marginTop: 6, marginBottom: 20 },

  captureBtn:     { width: '100%', borderRadius: 18, overflow: 'hidden', marginBottom: 20 },
  captureBtnGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 16 },
  captureBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  faceThumbs:      { flexDirection: 'row' },
  faceThumb:       { alignItems: 'center', marginRight: 12 },
  faceThumbImg:    { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#30D158' },
  faceThumbEmpty:  { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.07)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
  faceThumbCurrent:{ borderColor: '#FF007F', backgroundColor: 'rgba(255,0,127,0.12)' },
  faceThumbLabel:  { color: THEME.textFaint, fontSize: 9, marginTop: 4, fontWeight: '600' },

  faceSuccess:   { borderRadius: 24, padding: 28, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(48,209,88,0.25)', overflow: 'hidden' },
  faceSuccessTitle: { fontSize: 22, fontWeight: '900', color: '#30D158' },
  faceSuccessSub:   { fontSize: 14, color: THEME.textSec, textAlign: 'center' },
  faceThumbsRow:    { flexDirection: 'row', gap: 8, marginTop: 8 },
  faceThumbDone:    { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#30D158' },
});