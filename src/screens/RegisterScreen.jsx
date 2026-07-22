import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Dimensions, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar, Image, Alert, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { registerUser } from "../services/authService";
import { createUserProfile } from "../services/userService";
import { apiUploadImage } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { LIGHT_THEME } from '../theme/colors';
import CustomAlertModal from '../components/CustomAlertModal';

const { width, height } = Dimensions.get('window');
const TOTAL_STEPS = 8;
const THEME = LIGHT_THEME;

// ─── Data ───────────────────────────────────────────────────────────────────
const HOBBIES = [
  'Photography', 'Travel', 'Music', 'Cooking', 'Gaming', 'Fitness',
  'Reading', 'Art', 'Dancing', 'Yoga', 'Hiking', 'Movies',
  'Fashion', 'Technology', 'Sports', 'Coffee', 'Writing', 'Cycling',
];
const RELATIONSHIP_TYPES = [
  { label: 'Long-term Relationship', icon: 'heart-outline', desc: 'Looking for something serious' },
  { label: 'Casual Dating',          icon: 'cafe-outline', desc: 'Going with the flow' },
  { label: 'Friendship',             icon: 'people-outline', desc: 'Making new friends' },
  { label: 'Open Relationship',      icon: 'options-outline', desc: 'Open to possibilities' },
  { label: 'Marriage-minded',        icon: 'ribbon-outline', desc: 'Ready to settle down' },
  { label: 'Short-term fun',         icon: 'sparkles-outline', desc: 'Keeping it light' },
];
const GENDERS = ['Man', 'Woman'];
const FACE_DIRECTIONS = [
  { key: 'center', label: 'Face Forward',      icon: 'happy-outline', hint: 'Look straight at the camera' },
  { key: 'left',   label: 'Turn Left',         icon: 'arrow-back-outline', hint: 'Gently turn your head left' },
  { key: 'right',  label: 'Turn Right',        icon: 'arrow-forward-outline', hint: 'Gently turn your head right' },
  { key: 'up',     label: 'Look Up',           icon: 'arrow-up-outline', hint: 'Tilt your head slightly up' },
  { key: 'smile',  label: 'Give a Big Smile',  icon: 'sparkles-outline', hint: 'Show us your beautiful smile!' },
];

// ─── Compact Reusable Input ─────────────────────────────────────────────────
function FloatingInput({ label, icon, value, onChangeText, keyboardType, secureTextEntry, multiline, style }) {
  const [focused, setFocused] = useState(false);
  const [showSec, setShowSec] = useState(false);
  return (
    <View style={[inputStyles.wrap, focused && inputStyles.wrapFocused, style]}>
      <Ionicons name={icon} size={16} color={focused ? '#FF007F' : THEME.textFaint} style={inputStyles.icon} />
      <TextInput
        style={[inputStyles.field, multiline && { height: 60, textAlignVertical: 'top' }]}
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
          <Ionicons name={showSec ? 'eye-outline' : 'eye-off-outline'} size={16} color={THEME.textFaint} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.07)', paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  wrapFocused: { borderColor: '#FF007F', backgroundColor: 'rgba(255,0,127,0.04)' },
  icon:        { marginRight: 8 },
  field:       { flex: 1, color: THEME.textPrimary, fontSize: 13.5 },
  eye:         { padding: 4 },
});

// ─── Step components ──────────────────────────────────────────────────────────

// Step 1: Basic Info
function StepBasicInfo({ data, onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(data.dob ? new Date(data.dob) : new Date(new Date().setFullYear(new Date().getFullYear() - 20)));

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      setTempDate(selectedDate);
      
      const today = new Date();
      let age = today.getFullYear() - selectedDate.getFullYear();
      const m = today.getMonth() - selectedDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < selectedDate.getDate())) {
        age--;
      }
      
      onChange('dob', selectedDate.toISOString());
      onChange('age', age.toString());
    }
  };

  const formattedDOB = data.dob 
    ? new Date(data.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <View>
      <StepHeader icon="person-outline" title="Let's get to know you" sub="Tell us about yourself" />
      <FloatingInput label="Full Name" icon="person-outline" value={data.name} onChangeText={v => onChange('name', v)} />
      <FloatingInput label="Email Address" icon="mail-outline" value={data.email} onChangeText={v => onChange('email', v)} keyboardType="email-address" />
      <FloatingInput label="Password" icon="lock-closed-outline" value={data.password} onChangeText={v => onChange('password', v)} secureTextEntry />
      
      {/* Date of Birth Selection Trigger */}
      <TouchableOpacity
        style={sty.dobTrigger}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="calendar-outline" size={16} color={data.dob ? '#FF007F' : THEME.textFaint} style={sty.dobIcon} />
        <View style={sty.dobTextContainer}>
          <Text style={[sty.dobValue, !data.dob && { color: THEME.textFaint }]}>
            {data.dob ? `${formattedDOB} (${data.age} years old)` : 'Date of Birth'}
          </Text>
        </View>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
          onChange={handleDateChange}
        />
      )}

      {showPicker && Platform.OS === 'ios' && (
        <TouchableOpacity style={sty.iosConfirmBtn} onPress={() => setShowPicker(false)}>
          <Text style={sty.iosConfirmText}>Confirm Date</Text>
        </TouchableOpacity>
      )}

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
      <StepHeader icon="call-outline" title="Verify Your Number" sub="We'll send a 6-digit OTP" />
      <View style={sty.phoneRow}>
        <View style={sty.countryCode}>
          <Text style={sty.countryCodeText}>+91</Text>
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
          <Text style={[sty.label, { marginTop: 20 }]}>Enter OTP sent to +91 {data.phone}</Text>
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
          <View style={sty.otpHintRow}>
            <Ionicons name="information-circle-outline" size={14} color={THEME.textFaint} />
            <Text style={sty.otpHint}>Use 1 2 3 4 5 6 for demo</Text>
          </View>
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
      <StepHeader icon="sparkles-outline" title="Your Interests" sub="Pick at least 3 hobbies you love" />
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
      <StepHeader icon="heart-outline" title="What are you looking for?" sub="Select the relationship type that fits you" />
      {RELATIONSHIP_TYPES.map(rt => {
        const active = data.relationshipType === rt.label;
        return (
          <TouchableOpacity
            key={rt.label}
            style={[sty.prefCard, active && sty.prefCardActive]}
            onPress={() => onChange('relationshipType', rt.label)}
          >
            <LinearGradient
              colors={active ? ['rgba(255,0,127,0.12)', 'rgba(181,23,158,0.05)'] : ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.01)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={sty.prefIconBox}>
              <Ionicons name={rt.icon} size={20} color={active ? "#FF007F" : THEME.textSec} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[sty.prefLabel, active && sty.prefLabelActive]}>{rt.label}</Text>
              <Text style={sty.prefDesc}>{rt.desc}</Text>
            </View>
            {active && <Ionicons name="checkmark-circle" size={20} color="#FF007F" />}
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
      <StepHeader icon="location-outline" title="Where are you located?" sub="Help us find connections nearby" />
      <FloatingInput label="City" icon="business-outline" value={data.city} onChangeText={v => onChange('city', v)} />
      <FloatingInput label="State" icon="map-outline" value={data.state} onChangeText={v => onChange('state', v)} />
      <FloatingInput label="Country" icon="earth-outline" value={data.country} onChangeText={v => onChange('country', v)} />
      
      <View style={sty.locationNote}>
        <Ionicons name="information-circle-outline" size={18} color={THEME.textSec} />
        <Text style={sty.locationNoteText}>
          Your location coordinates are processed privately to calculate match distances.
        </Text>
      </View>
    </View>
  );
}

// Step 6: Age Range Selection
function StepAgeRange({ data, onChange }) {
  const min = data.ageMin || 18;
  const max = data.ageMax || 35;
  const ages = Array.from({ length: 43 }, (_, i) => i + 18);

  const handleSelect = (val, type) => {
    if (type === 'min') {
      onChange('ageMin', val);
      if (val > max) onChange('ageMax', val);
    } else {
      if (val >= min) onChange('ageMax', val);
    }
  };

  return (
    <View>
      <StepHeader icon="options-outline" title="Ideal Match Age" sub="Select your preferred age range" />
      
      <View style={sty.ageDisplayRow}>
        <View style={sty.ageDisplay}>
          <LinearGradient colors={['#FF007F', '#B5179E']} style={sty.ageDisplayGrad}>
            <Text style={sty.ageDisplayNum}>{min}</Text>
            <Text style={sty.ageDisplayLbl}>MIN AGE</Text>
          </LinearGradient>
        </View>
        
        <Text style={sty.ageDash}>—</Text>

        <View style={sty.ageDisplay}>
          <LinearGradient colors={['#B5179E', '#7B2FBE']} style={sty.ageDisplayGrad}>
            <Text style={sty.ageDisplayNum}>{max}</Text>
            <Text style={sty.ageDisplayLbl}>MAX AGE</Text>
          </LinearGradient>
        </View>
      </View>

      <Text style={sty.label}>Minimum Age</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sty.ageScroll}>
        {ages.map(a => (
          <TouchableOpacity
            key={a}
            style={[sty.ageChip, min === a && sty.ageChipActive]}
            onPress={() => handleSelect(a, 'min')}
          >
            <Text style={[sty.ageChipText, min === a && sty.ageChipTextActive]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[sty.label, { marginTop: 14 }]}>Maximum Age</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sty.ageScroll}>
        {ages.map(a => (
          <TouchableOpacity
            key={a}
            style={[sty.ageChip, max === a && sty.ageChipActive]}
            onPress={() => handleSelect(a, 'max')}
          >
            <Text style={[sty.ageChipText, max === a && sty.ageChipTextActive]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={sty.ageRangePill}>
        <Text style={sty.ageRangeText}>Matching with: {min} - {max} years old</Text>
      </View>
    </View>
  );
}

// Step 7: Photos
function StepPhotos({ data, onChange }) {
  const images = data.images || [];

  const pickImage = async (idx) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0].uri) {
      const next = [...images];
      next[idx] = res.assets[0].uri;
      onChange('images', next);
    }
  };

  const removeImage = (idx) => {
    const next = images.filter((_, i) => i !== idx);
    onChange('images', next);
  };

  return (
    <View>
      <StepHeader icon="camera-outline" title="Show Your Best Self" sub="Add at least 3 photos to complete setup" />
      <View style={sty.photoGrid}>
        {Array(6).fill(null).map((_, i) => {
          const uri = images[i];
          return (
            <View key={i} style={sty.photoSlot}>
              {uri ? (
                <View style={{ flex: 1 }}>
                  <Image source={{ uri }} style={sty.photoImg} />
                  <TouchableOpacity onPress={() => removeImage(i)} style={sty.photoRemove}>
                    <Ionicons name="close-circle" size={22} color="#FF375F" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => pickImage(i)} style={sty.photoEmpty}>
                  <Ionicons name="image-outline" size={20} color="#FF4D94" />
                  <Text style={sty.photoSlotLabel}>Photo {i + 1}</Text>
                  {i < 3 && (
                    <View style={sty.photoRequired}>
                      <Text style={sty.photoRequiredText}>REQUIRED</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      <View style={sty.photoProgress}>
        <View style={[sty.photoProgressBar, { width: `${(Math.min(images.length, 3) / 3) * 100}%` }]} />
      </View>
      <Text style={sty.photoCount}>{images.length} of 3 minimum photos added</Text>
    </View>
  );
}

// Step 8: Face Verification
function StepFaceVerification({ data, onChange }) {
  const facePhotos = data.facePhotos || {};
  const [activeStep, setActiveStep] = useState(0);

  const capture = async () => {
    const res = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.Front,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0].uri) {
      const key = FACE_DIRECTIONS[activeStep].key;
      const next = { ...facePhotos, [key]: res.assets[0].uri };
      onChange('facePhotos', next);
      if (activeStep < 4) setActiveStep(p => p + 1);
    }
  };

  const isCompleted = FACE_DIRECTIONS.every(d => !!facePhotos[d.key]);
  const activeDir = FACE_DIRECTIONS[activeStep];

  return (
    <View>
      <StepHeader icon="shield-checkmark-outline" title="Liveness Verification" sub="Verify your identity in 5 quick angles" />
      
      {/* Target Dots */}
      <View style={sty.faceDotsRow}>
        {FACE_DIRECTIONS.map((fd, i) => {
          const done = !!facePhotos[fd.key];
          const act = i === activeStep;
          return (
            <View
              key={fd.key}
              style={[
                sty.faceDot,
                done ? sty.faceDotDone : act ? sty.faceDotActive : sty.faceDotInactive,
              ]}
            >
              {done ? (
                <Ionicons name="checkmark" size={10} color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{i + 1}</Text>
              )}
            </View>
          );
        })}
      </View>

      {!isCompleted ? (
        <View style={sty.faceCapture}>
          <View style={sty.faceFrame}>
            {facePhotos[activeDir.key] ? (
              <Image source={{ uri: facePhotos[activeDir.key] }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name={activeDir.icon} size={36} color="#FF007F" />
              </View>
            )}
            <View style={[sty.bracket, sty.bTL]} />
            <View style={[sty.bracket, sty.bTR]} />
            <View style={[sty.bracket, sty.bBL]} />
            <View style={[sty.bracket, sty.bBR]} />
          </View>

          <Text style={sty.faceDirectionLabel}>{activeDir.label}</Text>
          <Text style={sty.faceDirectionHint}>{activeDir.hint}</Text>

          <TouchableOpacity style={sty.captureBtn} onPress={capture}>
            <LinearGradient colors={['#FF007F', '#B5179E']} start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={sty.captureBtnGrad}>
              <Ionicons name="camera" size={18} color="#fff" />
              <Text style={sty.captureBtnText}>Capture Angle</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={sty.faceThumbs}>
            {FACE_DIRECTIONS.map((fd, i) => {
              const uri = facePhotos[fd.key];
              const act = i === activeStep;
              return (
                <TouchableOpacity
                  key={fd.key}
                  style={[sty.faceThumb, act && sty.faceThumbCurrent]}
                  onPress={() => setActiveStep(i)}
                >
                  {uri ? (
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Ionicons name={fd.icon} size={16} color={THEME.textFaint} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={sty.faceSuccess}>
          <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
          <Ionicons name="checkmark-circle" size={44} color="#30D158" />
          <Text style={sty.faceSuccessTitle}>Verification Complete!</Text>
          <Text style={sty.faceSuccessSub}>All 5 angles captured successfully. You are ready to log in.</Text>
          <View style={sty.faceThumbsRow}>
            {FACE_DIRECTIONS.map(fd => (
              <Image key={fd.key} source={{ uri: facePhotos[fd.key] }} style={sty.faceThumbDone} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// Sub-header helper
function StepHeader({ icon, title, sub }) {
  return (
    <View style={sty.stepHeader}>
      <View style={sty.stepIconWrap}>
        <Ionicons name={icon} size={24} color="#FF007F" />
      </View>
      <Text style={sty.stepTitle}>{title}</Text>
      <Text style={sty.stepSub}>{sub}</Text>
    </View>
  );
}

// ─── Main wizard ─────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const { login } = useAuth();
  const navigation = useNavigation();
  
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: '', email: '', password: '', dob: '', age: '', gender: 'Man',
    phone: '', otp: '', hobbies: [], relationshipType: '',
    city: '', state: '', country: '',
    ageMin: 18, ageMax: 35,
    images: [],
    facePhotos: {},
  });

  const slideAnim    = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;
  const scrollViewRef = useRef(null);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step + 1) / TOTAL_STEPS,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const onChange = (field, val) => {
    setData(p => ({ ...p, [field]: val }));
  };

  const validateStep = (s, d) => {
    if (s === 0) return d.name && d.email && d.password && d.dob && d.age;
    if (s === 1) return d.phone && d.phone.length >= 10 && d.otp === '123456';
    if (s === 2) return d.hobbies && d.hobbies.length >= 3;
    if (s === 3) return !!d.relationshipType;
    if (s === 4) return d.city && d.state && d.country;
    if (s === 5) return d.ageMin && d.ageMax && d.ageMin <= d.ageMax;
    if (s === 6) return d.images && d.images.filter(x => !!x).length >= 3;
    if (s === 7) return FACE_DIRECTIONS.every(fd => !!d.facePhotos[fd.key]);
    return false;
  };

  const [validationAlertMsg, setValidationAlertMsg] = useState('');
  const [validationAlertVisible, setValidationAlertVisible] = useState(false);

  const getValidationMessage = (s) => {
    switch (s) {
      case 0: return 'Please fill in your name, email, password, and date of birth.';
      case 1: return 'Please enter a valid 10-digit mobile number and demo OTP (123456).';
      case 2: return 'Please select at least 3 hobbies or interests.';
      case 3: return 'Please select your preferred relationship type.';
      case 4: return 'Please enter your city, state, and country.';
      case 5: return 'Please select a valid age range preference.';
      case 6: return 'Please upload at least 3 profile photos to continue.';
      case 7: return 'Please complete all 5 face verification angles.';
      default: return 'Please complete all required fields for this step.';
    }
  };

  const goNext = () => {
    if (!validateStep(step, data)) {
      setValidationAlertMsg(getValidationMessage(step));
      setValidationAlertVisible(true);
      return;
    }
    
    if (step < TOTAL_STEPS - 1) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
      }).start(() => {
        setStep(p => p + 1);
        slideAnim.setValue(width);
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true
        }).start(() => {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        });
      });
    } else {
      let dobString = '2000-01-01';
      if (data.dob) {
        try {
          dobString = typeof data.dob === 'string' 
            ? data.dob.split('T')[0] 
            : new Date(data.dob).toISOString().split('T')[0];
        } catch (e) {
          dobString = '2000-01-01';
        }
      }

      // Upload local images to backend server public storage
      const rawImages = (data.images || []).filter(x => !!x);
      Promise.all(rawImages.map(img => apiUploadImage(img)))
        .then((uploadedPhotos) => {
          const validPhotos = uploadedPhotos.filter(Boolean);
          const avatarUrl = validPhotos[0] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400';

          const registrationPayload = {
            name: data.name,
            email: data.email || `${data.name.toLowerCase().replace(/\s+/g, '')}@heartlink.com`,
            password: data.password || 'password123',
            age: parseInt(data.age) || 24,
            dob: dobString,
            gender: data.gender || 'Man',
            bio: `Loving life, seeking ${data.relationshipType?.toLowerCase() || 'relationship'}. Hobbies include ${(data.hobbies || []).slice(0, 3).join(', ')}.`,
            job: 'Member',
            avatar: avatarUrl,
            city: data.city || 'Chicago',
            state: data.state || 'IL',
            country: data.country || 'USA',
            relationship_type: data.relationshipType || 'Long-term',
            interests: data.hobbies || [],
            photos: validPhotos,
          };

          return registerUser(registrationPayload).then((res) => {
            login(res.user || registrationPayload, res.access_token || null);
          });
        })
        .catch((err) => {
          setValidationAlertMsg(err.message || 'Registration completed!');
          setValidationAlertVisible(true);
        });
    }
  };

  const goBack = () => {
    if (step > 0) {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 1, 0.4, 1),
      }).start(() => {
        setStep(p => p - 1);
        slideAnim.setValue(-width);
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true
        }).start(() => {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        });
      });
    } else {
      navigation.goBack();
    }
  };

  const isStepValid = validateStep(step, data);
  const isLastStep  = step === TOTAL_STEPS - 1;

  const STEP_TITLES = [
    'Basic Profile', 'Phone Verification', 'Interests',
    'Preferences', 'Location', 'Age Range',
    'Photos', 'Face Verification'
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Orbs */}
      <View style={styles.orbsClip} pointerEvents="none">
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={THEME.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerStep}>STEP {step + 1} OF {TOTAL_STEPS}</Text>
          <Text style={styles.headerLabel}>{STEP_TITLES[step]}</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Progress Track */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        >
          <LinearGradient colors={['#FF007F', '#B5179E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>

      {/* Step Dots */}
      <View style={styles.stepDots}>
        {Array(TOTAL_STEPS).fill(null).map((_, i) => {
          const isDone = i < step;
          const isCurr = i === step;
          return (
            <View
              key={i}
              style={[
                styles.stepDot,
                isDone && styles.stepDotDone,
                isCurr && styles.stepDotActive,
                !isDone && !isCurr && styles.stepDotInactive,
              ]}
            >
              {isDone && <Ionicons name="checkmark" size={10} color="#fff" />}
            </View>
          );
        })}
      </View>

      {/* Step Wizard Container */}
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.stepContent, { transform: [{ translateX: slideAnim }] }]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === 0 && <StepBasicInfo data={data} onChange={onChange} />}
            {step === 1 && <StepOTP data={data} onChange={onChange} />}
            {step === 2 && <StepHobbies data={data} onChange={onChange} />}
            {step === 3 && <StepPreferences data={data} onChange={onChange} />}
            {step === 4 && <StepLocation data={data} onChange={onChange} />}
            {step === 5 && <StepAgeRange data={data} onChange={onChange} />}
            {step === 6 && <StepPhotos data={data} onChange={onChange} />}
            {step === 7 && <StepFaceVerification data={data} onChange={onChange} />}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Next/Complete Button Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.nextBtnWrap, !isStepValid && styles.nextBtnDisabled]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isStepValid ? ['#FF007F', '#B5179E'] : ['#CCCCCC', '#AAAAAA']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.nextBtn}
          >
            <Text style={styles.nextBtnText}>
              {isLastStep ? 'Complete Profile' : 'Continue'}
            </Text>
            <Ionicons name={isLastStep ? "checkmark-circle" : "arrow-forward"} size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Custom Alert Modal for step validation */}
      <CustomAlertModal
        visible={validationAlertVisible}
        title="Incomplete Step"
        message={validationAlertMsg}
        icon="alert-circle-outline"
        iconColor="#FF007F"
        confirmText="Got it"
        onConfirm={() => setValidationAlertVisible(false)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:  { 
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: THEME.bg,
    overflow: 'hidden',
  },
  orbsClip: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  orb:   { position: 'absolute', borderRadius: 999 },
  orb1:  { width: 300, height: 300, top: -80, left: -80, backgroundColor: 'rgba(255,0,127,0.07)' },
  orb2:  { width: 260, height: 260, bottom: 0, right: -80, backgroundColor: 'rgba(94,92,230,0.05)' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 10,
    zIndex: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.04)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { alignItems: 'center' },
  headerStep:  { fontSize: 11, color: THEME.textFaint, fontWeight: '600', letterSpacing: 0.5 },
  headerLabel: { fontSize: 15, color: THEME.textPrimary, fontWeight: '800', marginTop: 1 },

  progressTrack: { height: 3.5, backgroundColor: 'rgba(0,0,0,0.05)', marginHorizontal: 16, borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 2, overflow: 'hidden' },

  stepDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10, marginBottom: 4 },
  stepDot:  { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stepDotActive:   { backgroundColor: '#FF007F', width: 20, height: 20, borderRadius: 10 },
  stepDotDone:     { backgroundColor: '#30D158' },
  stepDotInactive: { backgroundColor: 'rgba(0,0,0,0.08)' },

  keyboardView: { 
    flex: 1, 
    marginBottom: 90,
  },
  stepContent: { 
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    flexGrow: 1,
  },
  bottomPadding: {
    height: 30,
  },

  bottomBar:   { 
    position: 'absolute', 
    bottom: 0, left: 0, right: 0, 
    paddingHorizontal: 20, 
    paddingBottom: 28, 
    paddingTop: 16,
    zIndex: 20,
  },
  nextBtnWrap: { borderRadius: 18, overflow: 'hidden' },
  nextBtnDisabled: { opacity: 0.7 },
  nextBtn:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 14 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

// Step-specific styles
const sty = StyleSheet.create({
  stepHeader: { alignItems: 'center', marginBottom: 18, paddingTop: 2 },
  stepIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,0,127,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  stepTitle:  { fontSize: 21, fontWeight: '900', color: THEME.textPrimary, textAlign: 'center', letterSpacing: -0.3 },
  stepSub:    { fontSize: 13, color: THEME.textSec, textAlign: 'center', marginTop: 4 },

  label:      { fontSize: 12, fontWeight: '700', color: THEME.textFaint, letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },

  // Chips
  chipRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  chip:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.03)', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.08)' },
  chipActive: { backgroundColor: 'rgba(255,0,127,0.08)', borderColor: '#FF007F' },
  chipText:   { color: THEME.textSec, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#FF007F', fontWeight: '700' },

  dobTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  dobIcon: { marginRight: 8 },
  dobTextContainer: { flex: 1 },
  dobValue: { fontSize: 13.5, color: THEME.textPrimary, fontWeight: '500' },
  iosConfirmBtn: { backgroundColor: '#FF007F', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginBottom: 12 },
  iosConfirmText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  phoneRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  countryCode: { backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.07)', paddingHorizontal: 12, justifyContent: 'center' },
  countryCodeText: { color: THEME.textPrimary, fontWeight: '700', fontSize: 13.5 },
  sendOtpBtn: { borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  sendOtpGrad: { paddingVertical: 11, alignItems: 'center' },
  sendOtpText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  otpBox: { width: 44, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)', textAlign: 'center', fontSize: 18, fontWeight: '800', color: THEME.textPrimary, backgroundColor: 'rgba(0,0,0,0.02)' },
  otpBoxFilled: { borderColor: '#FF007F', backgroundColor: 'rgba(255,0,127,0.05)' },
  otpHintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'center' },
  otpHint: { fontSize: 12, color: THEME.textFaint },

  selectedCount: { fontSize: 12, fontWeight: '700', color: '#FF007F', marginBottom: 10, textAlign: 'right' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hobbyChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 7, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.03)', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.07)' },
  hobbyChipActive: { backgroundColor: 'rgba(255,0,127,0.08)', borderColor: '#FF007F' },
  hobbyText: { fontSize: 12.5, color: THEME.textSec, fontWeight: '600' },
  hobbyTextActive: { color: '#FF007F', fontWeight: '700' },

  prefCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.07)', marginBottom: 10, overflow: 'hidden' },
  prefCardActive: { borderColor: '#FF007F' },
  prefIconBox: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.04)', justifyContent: 'center', alignItems: 'center' },
  prefLabel: { fontSize: 14, fontWeight: '700', color: THEME.textPrimary },
  prefLabelActive: { color: '#FF007F' },
  prefDesc: { fontSize: 12, color: THEME.textSec, marginTop: 2 },

  locationNote: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 12, marginTop: 8 },
  locationNoteText: { flex: 1, fontSize: 12, color: THEME.textSec, lineHeight: 16 },

  ageDisplayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 14 },
  ageDisplay: { width: 90, borderRadius: 14, overflow: 'hidden' },
  ageDisplayGrad: { paddingVertical: 10, alignItems: 'center' },
  ageDisplayNum: { color: '#fff', fontSize: 20, fontWeight: '900' },
  ageDisplayLbl: { color: '#fff', fontSize: 9, fontWeight: '800', marginTop: 2, opacity: 0.9 },
  ageDash: { fontSize: 20, fontWeight: '800', color: THEME.textFaint },

  ageScroll: { marginBottom: 6 },
  ageChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', marginRight: 6 },
  ageChipActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  ageChipText: { fontSize: 13, fontWeight: '700', color: THEME.textSec },
  ageChipTextActive: { color: '#fff' },
  ageRangePill: { alignSelf: 'center', backgroundColor: 'rgba(255,0,127,0.08)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, marginTop: 12 },
  ageRangeText: { color: '#FF007F', fontSize: 12, fontWeight: '700' },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  photoSlot: { width: (width - 60) / 3, height: ((width - 60) / 3) * 1.25, borderRadius: 14, overflow: 'hidden' },
  photoImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoRemove: { position: 'absolute', top: 4, right: 4 },
  photoEmpty: { flex: 1, backgroundColor: 'rgba(0,0,0,0.03)', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.07)', borderStyle: 'dashed', borderRadius: 14, justifyContent: 'center', alignItems: 'center', padding: 6 },
  photoSlotLabel: { fontSize: 11, color: THEME.textFaint, fontWeight: '600', marginTop: 4 },
  photoRequired: { backgroundColor: 'rgba(255,0,127,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  photoRequiredText: { color: '#FF007F', fontSize: 8, fontWeight: '800' },
  photoProgress: { height: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  photoProgressBar: { height: '100%', backgroundColor: '#FF007F', borderRadius: 2 },
  photoCount: { fontSize: 12, color: THEME.textSec, textAlign: 'center', fontWeight: '600' },

  faceDotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  faceDot: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  faceDotDone: { backgroundColor: '#30D158' },
  faceDotActive: { backgroundColor: '#FF007F' },
  faceDotInactive: { backgroundColor: 'rgba(0,0,0,0.1)' },
  faceCapture: { alignItems: 'center' },
  faceFrame: { width: 180, height: 180, borderRadius: 90, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', borderWidth: 2, borderColor: '#FF007F', marginBottom: 12, position: 'relative' },
  faceDirectionLabel: { fontSize: 16, fontWeight: '800', color: THEME.textPrimary },
  faceDirectionHint: { fontSize: 12, color: THEME.textSec, marginTop: 2, marginBottom: 12 },
  captureBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  captureBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10 },
  captureBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  faceThumbs: { flexDirection: 'row', gap: 8 },
  faceThumb: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)' },
  faceThumbCurrent: { borderColor: '#FF007F', borderWidth: 2 },
  faceSuccess: { alignItems: 'center', padding: 24, borderRadius: 20, overflow: 'hidden' },
  faceSuccessTitle: { fontSize: 18, fontWeight: '800', color: THEME.textPrimary, marginTop: 10 },
  faceSuccessSub: { fontSize: 13, color: THEME.textSec, textAlign: 'center', marginTop: 4, marginBottom: 14 },
  faceThumbsRow: { flexDirection: 'row', gap: 6 },
  faceThumbDone: { width: 32, height: 32, borderRadius: 16 },

  bracket: { position: 'absolute', width: 14, height: 14, borderColor: '#FF007F' },
  bTL: { top: 10, left: 10, borderTopWidth: 2, borderLeftWidth: 2 },
  bTR: { top: 10, right: 10, borderTopWidth: 2, borderRightWidth: 2 },
  bBL: { bottom: 10, left: 10, borderBottomWidth: 2, borderLeftWidth: 2 },
  bBR: { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2 },
});